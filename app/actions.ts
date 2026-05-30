'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createSupabaseAdmin } from '@/lib/supabase/admin'
import { createSupabaseServer } from '@/lib/supabase/server'
import type { ActionResult, Ticket } from '@/lib/types'

// ============================================================
// AUTH — Connexion admin
// ============================================================
export async function loginAdmin(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createSupabaseServer()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    return { success: false, error: 'Email ou mot de passe incorrect.' }
  }

  const role = data.user.app_metadata?.role
  if (role !== 'admin') {
    await supabase.auth.signOut()
    return { success: false, error: 'Acces refuse. Ce compte nest pas un compte admin.' }
  }

  redirect('/admin/dashboard')
}

// ============================================================
// AUTH — Deconnexion
// ============================================================
export async function logout() {
  const supabase = await createSupabaseServer()
  await supabase.auth.signOut()
  redirect('/admin/login')
}

export async function logoutGuest() {
  const supabase = await createSupabaseServer()
  await supabase.auth.signOut()
  redirect('/login')
}

// ============================================================
// AUTH — Connexion invité
// ============================================================
export async function loginGuest(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  const supabase = await createSupabaseServer()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    return { success: false, error: 'Email ou mot de passe incorrect.' }
  }

  if (data.user.app_metadata?.role === 'admin') {
    redirect('/admin/dashboard')
  }

  redirect('/dashboard')
}

// ============================================================
// ADMIN — Creer une invitation
// ============================================================
export async function createInvitation(
  _prev: ActionResult<{ link: string }>,
  formData: FormData
): Promise<ActionResult<{ link: string }>> {
  const guestName = (formData.get('guest_name') as string)?.trim()

  if (!guestName) {
    return { success: false, error: "Le nom de l'invite est requis." }
  }

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata?.role !== 'admin') {
    return { success: false, error: 'Non autorise.' }
  }

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('invitations')
    .insert({ guest_name: guestName, created_by: user.id })
    .select('token')
    .single()

  if (error || !data) {
    return { success: false, error: "Erreur lors de la creation de l'invitation." }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const link = `${appUrl}/register/${data.token}`

  revalidatePath('/admin/dashboard')
  return { success: true, data: { link } }
}

// ============================================================
// INVITE — Inscription via token
// ============================================================
export async function registerGuest(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const token = formData.get('token') as string
  const firstName = (formData.get('first_name') as string)?.trim()
  const lastName = (formData.get('last_name') as string)?.trim()
  const ageRaw = formData.get('age') as string
  const age = ageRaw ? parseInt(ageRaw, 10) : null
  const email = (formData.get('email') as string)?.trim()
  const phone = (formData.get('phone') as string)?.trim() || null
  const password = formData.get('password') as string
  const passwordConfirm = formData.get('password_confirm') as string
  const photoFile = formData.get('photo') as File | null

  if (!firstName || !lastName || !email || !password || !age) {
    return { success: false, error: 'Tous les champs obligatoires doivent etre remplis.' }
  }

  if (age < 18 || age > 99) {
    return { success: false, error: 'Tu dois avoir au moins 18 ans pour participer.' }
  }

  if (password !== passwordConfirm) {
    return { success: false, error: 'Les mots de passe ne correspondent pas.' }
  }

  if (password.length < 8) {
    return { success: false, error: 'Le mot de passe doit contenir au moins 8 caracteres.' }
  }

  const admin = createSupabaseAdmin()

  const { data: invitation } = await admin
    .from('invitations')
    .select('id')
    .eq('token', token)
    .eq('is_used', false)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!invitation) {
    return { success: false, error: "Ce lien d'invitation est invalide ou expire." }
  }

  // Upload photo si fournie
  let photoUrl: string | null = null
  if (photoFile && photoFile.size > 0) {
    const ext = photoFile.name.split('.').pop() ?? 'jpg'
    const fileName = `${crypto.randomUUID()}.${ext}`
    const buffer = await photoFile.arrayBuffer()
    const { data: uploadData, error: uploadError } = await admin.storage
      .from('guest-photos')
      .upload(fileName, buffer, { contentType: photoFile.type })

    if (!uploadError && uploadData) {
      const { data: urlData } = admin.storage.from('guest-photos').getPublicUrl(uploadData.path)
      photoUrl = urlData.publicUrl
    }
  }

  // Cree le compte Supabase Auth
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName },
    app_metadata: { role: 'guest' },
  })

  if (authError || !authData.user) {
    if (photoUrl) {
      const path = photoUrl.split('/guest-photos/')[1]
      if (path) await admin.storage.from('guest-photos').remove([path])
    }
    if (authError?.message?.includes('already registered')) {
      return { success: false, error: 'Cet email est deja associe a un compte.' }
    }
    return { success: false, error: 'Erreur lors de la creation du compte.' }
  }

  // Enregistrement atomique
  const { error: rpcError } = await admin.rpc('register_guest_atomically', {
    p_token: token,
    p_user_id: authData.user.id,
    p_first_name: firstName,
    p_last_name: lastName,
    p_age: age,
    p_email: email,
    p_phone: phone,
    p_photo_url: photoUrl,
  })

  if (rpcError) {
    await admin.auth.admin.deleteUser(authData.user.id)
    if (photoUrl) {
      const path = photoUrl.split('/guest-photos/')[1]
      if (path) await admin.storage.from('guest-photos').remove([path])
    }
    return { success: false, error: "Inscription impossible. Ce lien a peut-etre deja ete utilise." }
  }

  // Connecte l'invite immediatement
  const serverClient = await createSupabaseServer()
  await serverClient.auth.signInWithPassword({ email, password })

  redirect('/dashboard')
}

// ============================================================
// INVITE — Soumettre les preferences boissons
// ============================================================
export async function submitDrinkSurvey(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non authentifie.' }
  }

  const beers = formData.getAll('drink_beers') as string[]
  const cans = formData.getAll('drink_cans') as string[]
  const spirits = formData.getAll('drink_spirits') as string[]
  const wantsShots = formData.get('drink_wants_shots') === 'true'

  if (beers.length === 0 && cans.length === 0 && spirits.length === 0 && !wantsShots) {
    return { success: false, error: 'Selectionne au moins une preference de boisson.' }
  }

  const { error } = await supabase
    .from('tickets')
    .update({
      drink_beers: beers,
      drink_cans: cans,
      drink_spirits: spirits,
      drink_wants_shots: wantsShots,
      has_completed_survey: true,
    })
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: 'Erreur lors de la sauvegarde de tes preferences.' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

// ============================================================
// ADMIN — Valider un scan a la porte
// ============================================================
export async function validateCheckIn(slug: string): Promise<ActionResult<Ticket>> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata?.role !== 'admin') {
    return { success: false, error: 'Non autorise.' }
  }

  const admin = createSupabaseAdmin()

  const { data: ticket } = await admin
    .from('tickets')
    .select('*')
    .eq('qr_code_slug', slug)
    .maybeSingle()

  if (!ticket) {
    return { success: false, error: 'QR code invalide.' }
  }

  if (ticket.checked_in) {
    return { success: true, data: ticket as Ticket }
  }

  const { data: updated, error } = await admin
    .from('tickets')
    .update({ checked_in: true, checked_in_at: new Date().toISOString() })
    .eq('qr_code_slug', slug)
    .select('*')
    .single()

  if (error || !updated) {
    return { success: false, error: 'Erreur lors du check-in.' }
  }

  revalidatePath('/admin/dashboard')
  return { success: true, data: updated as Ticket }
}

// ============================================================
// ADMIN — Supprimer une invitation non utilisée
// ============================================================
export async function deleteInvitation(invitationId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata?.role !== 'admin') {
    return { success: false, error: 'Non autorise.' }
  }

  const admin = createSupabaseAdmin()

  // Vérifie que l'invitation n'est pas utilisée avant de supprimer
  const { data: inv } = await admin
    .from('invitations')
    .select('is_used')
    .eq('id', invitationId)
    .maybeSingle()

  if (!inv) return { success: false, error: 'Invitation introuvable.' }
  if (inv.is_used) return { success: false, error: 'Cette invitation a déjà été utilisée. Supprime l\'inscrit depuis la liste des invités.' }

  await admin.from('invitations').delete().eq('id', invitationId)

  revalidatePath('/admin/dashboard')
  return { success: true }
}

// ============================================================
// ADMIN — Supprimer un invité (compte + ticket + invitation + photo)
// ============================================================
export async function deleteGuest(ticketId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata?.role !== 'admin') {
    return { success: false, error: 'Non autorise.' }
  }

  const admin = createSupabaseAdmin()

  // Récupère les données du ticket pour pouvoir tout nettoyer
  const { data: ticket } = await admin
    .from('tickets')
    .select('user_id, guest_photo_url, invitation_id')
    .eq('id', ticketId)
    .maybeSingle()

  if (!ticket) {
    return { success: false, error: 'Invité introuvable.' }
  }

  // 1. Supprime le compte Supabase Auth
  if (ticket.user_id) {
    await admin.auth.admin.deleteUser(ticket.user_id)
  }

  // 2. Supprime la photo du Storage
  if (ticket.guest_photo_url) {
    const path = ticket.guest_photo_url.split('/guest-photos/')[1]
    if (path) await admin.storage.from('guest-photos').remove([path])
  }

  // 3. Supprime l'invitation (cascade → supprime le ticket automatiquement)
  if (ticket.invitation_id) {
    await admin.from('invitations').delete().eq('id', ticket.invitation_id)
  } else {
    // Fallback : supprime le ticket directement
    await admin.from('tickets').delete().eq('id', ticketId)
  }

  revalidatePath('/admin/guests')
  revalidatePath('/admin/dashboard')
  return { success: true }
}

// ============================================================
// ADMIN — Creer une annonce
// ============================================================
export async function createAnnouncement(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata?.role !== 'admin') {
    return { success: false, error: 'Non autorise.' }
  }

  const title = (formData.get('title') as string)?.trim()
  const content = (formData.get('content') as string)?.trim()
  const type = formData.get('type') as 'info' | 'location'
  const isPublished = formData.get('is_published') === 'true'

  if (!title || !content) {
    return { success: false, error: 'Le titre et le contenu sont requis.' }
  }

  const admin = createSupabaseAdmin()
  const { error } = await admin
    .from('announcements')
    .insert({ title, content, type: type ?? 'info', is_published: isPublished, created_by: user.id })

  if (error) {
    return { success: false, error: "Erreur lors de la creation de l'annonce." }
  }

  revalidatePath('/admin/dashboard')
  revalidatePath('/dashboard')
  return { success: true }
}

// ============================================================
// ADMIN — Modifier une annonce
// ============================================================
export async function updateAnnouncement(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata?.role !== 'admin') {
    return { success: false, error: 'Non autorise.' }
  }

  const id = formData.get('id') as string
  const title = (formData.get('title') as string)?.trim()
  const content = (formData.get('content') as string)?.trim()
  const type = formData.get('type') as 'info' | 'location'
  const isPublished = formData.get('is_published') === 'true'

  if (!title || !content) {
    return { success: false, error: 'Le titre et le contenu sont requis.' }
  }

  const admin = createSupabaseAdmin()
  const { error } = await admin
    .from('announcements')
    .update({ title, content, type, is_published: isPublished })
    .eq('id', id)

  if (error) {
    return { success: false, error: "Erreur lors de la modification." }
  }

  revalidatePath('/admin/dashboard')
  revalidatePath('/dashboard')
  return { success: true }
}

// ============================================================
// ADMIN — Supprimer une annonce
// ============================================================
export async function deleteAnnouncement(id: string): Promise<ActionResult> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata?.role !== 'admin') {
    return { success: false, error: 'Non autorise.' }
  }

  const admin = createSupabaseAdmin()
  const { error } = await admin.from('announcements').delete().eq('id', id)

  if (error) {
    return { success: false, error: "Erreur lors de la suppression." }
  }

  revalidatePath('/admin/dashboard')
  revalidatePath('/dashboard')
  return { success: true }
}
