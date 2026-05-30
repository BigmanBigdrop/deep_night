import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase/admin'
import type { Ticket } from '@/lib/types'

export default async function PublicTicketPage({
  params,
}: {
  params: Promise<{ qr_code_slug: string }>
}) {
  const { qr_code_slug } = await params

  // Seuls les admins connectés peuvent voir cette page
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata?.role !== 'admin') {
    redirect('/admin/login')
  }

  const admin = createSupabaseAdmin()
  const { data } = await admin
    .from('tickets')
    .select('guest_first_name, guest_last_name, qr_code_slug, checked_in, checked_in_at, guest_photo_url')
    .eq('qr_code_slug', qr_code_slug)
    .maybeSingle()

  if (!data) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-red-400">QR code invalide.</p>
      </main>
    )
  }

  const ticket = data as Pick<
    Ticket,
    'guest_first_name' | 'guest_last_name' | 'checked_in' | 'checked_in_at' | 'qr_code_slug' | 'guest_photo_url'
  >

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center px-4 gap-4">
      <p className="text-brand/60 text-xs tracking-widest uppercase">Deep Night · 06.06.2026</p>
      {ticket.guest_photo_url && (
        <img src={ticket.guest_photo_url} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-brand/30" />
      )}
      <p className="text-white font-bold text-2xl">
        {ticket.guest_first_name} {ticket.guest_last_name}
      </p>
      {ticket.checked_in ? (
        <p className="text-green-400 text-sm">
          Entré à{' '}
          {ticket.checked_in_at
            ? new Date(ticket.checked_in_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            : '—'}
        </p>
      ) : (
        <p className="text-white/40 text-sm">Pas encore scanné</p>
      )}
    </main>
  )
}
