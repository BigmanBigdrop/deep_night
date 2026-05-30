import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase/admin'
import QRCodeDisplay from '@/components/QRCodeDisplay'
import DrinkSurveyForm from '@/components/DrinkSurveyForm'
import LocationCard from '@/components/LocationCard'
import type { Ticket, Announcement } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function GuestDashboardPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const admin = createSupabaseAdmin()

  const [{ data: ticketData }, { data: announcements }] = await Promise.all([
    supabase.from('tickets').select('*').eq('user_id', user.id).maybeSingle(),
    admin.from('announcements').select('*').eq('is_published', true).order('created_at', { ascending: false }),
  ])

  const ticket = ticketData as Ticket | null
  const locationPost = (announcements ?? []).find((a) => a.type === 'location') as Announcement | undefined
  const infoAnnouncements = (announcements ?? []).filter((a) => a.type === 'info') as Announcement[]

  const eventDate = new Date('2026-06-06T20:00:00')
  const diffDays = Math.max(0, Math.floor((eventDate.getTime() - Date.now()) / 86400000))

  if (!ticket) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <p className="text-white/40 text-sm">Ticket introuvable. Contacte l&apos;organisateur.</p>
      </main>
    )
  }

  return (
    <main className="flex-1 px-4 py-8 max-w-lg mx-auto w-full space-y-6">

      {/* En-tête soirée */}
      <div className="text-center py-4">
        <p className="text-brand text-xs tracking-widest uppercase mb-2">Édition Pilote</p>
        <h1 className="text-2xl font-bold text-white">Deep Night</h1>
        <p className="text-white/40 text-sm mt-1">Samedi 06 Juin 2026</p>
        {diffDays > 0 && (
          <p className="mt-3 text-white/30 text-sm">
            Dans <span className="text-brand font-semibold">{diffDays} jour{diffDays > 1 ? 's' : ''}</span>
          </p>
        )}
      </div>

      {/* QR Code ou survey */}
      <div className="bg-white/3 border border-white/8 rounded-3xl p-6">
        {ticket.has_completed_survey ? (
          <div className="space-y-5">
            <div className="text-center">
              <p className="text-white font-semibold text-lg">
                {ticket.guest_first_name} {ticket.guest_last_name}
              </p>
              <p className="text-white/30 text-xs mt-1">Garde cet écran ouvert à l&apos;entrée</p>
            </div>
            <QRCodeDisplay slug={ticket.qr_code_slug} />
          </div>
        ) : (
          <div>
            <div className="mb-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand/10 mb-4">
                <span className="text-2xl">🍹</span>
              </div>
              <h2 className="text-white font-semibold text-lg">Tes préférences boissons</h2>
              <p className="text-white/40 text-sm mt-1">
                Complète cette étape pour révéler ton QR code
              </p>
            </div>
            <DrinkSurveyForm />
          </div>
        )}
      </div>

      {/* Localisation — toujours visible */}
      <LocationCard
        title={locationPost?.title ?? 'Lieu de la soirée'}
        content={locationPost?.content}
      />

      {/* Annonces */}
      {infoAnnouncements.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-white/30 font-medium text-xs tracking-widest uppercase">Annonces</h2>
          {infoAnnouncements.map((a) => (
            <div key={a.id} className="bg-white/3 border border-white/8 rounded-2xl p-4">
              <p className="text-white font-medium text-sm">{a.title}</p>
              <p className="text-white/40 text-sm mt-1 whitespace-pre-wrap">{a.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Profil invité */}
      {(ticket.guest_photo_url || ticket.guest_email) && (
        <div className="flex items-center gap-4 bg-white/3 border border-white/8 rounded-2xl p-4">
          {ticket.guest_photo_url && (
            <img
              src={ticket.guest_photo_url}
              alt="Photo"
              className="w-12 h-12 rounded-full object-cover border border-brand/30"
            />
          )}
          <div>
            <p className="text-white font-medium text-sm">
              {ticket.guest_first_name} {ticket.guest_last_name}
            </p>
            {ticket.guest_email && (
              <p className="text-white/30 text-xs">{ticket.guest_email}</p>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
