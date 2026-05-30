import { createSupabaseAdmin } from '@/lib/supabase/admin'
import InvitationForm from './InvitationForm'
import AnnouncementForm from './AnnouncementForm'
import AnnouncementItem from './AnnouncementItem'
import DeleteInvitationButton from './DeleteInvitationButton'
import type { Invitation, Ticket } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const admin = createSupabaseAdmin()

  const [
    { data: invitations },
    { data: tickets },
    { data: announcements },
  ] = await Promise.all([
    admin.from('invitations').select('*').order('created_at', { ascending: false }),
    admin.from('tickets').select('*'),
    admin.from('announcements').select('*').order('created_at', { ascending: false }),
  ])

  const inv = (invitations ?? []) as Invitation[]
  const tix = (tickets ?? []) as Ticket[]

  const stats = {
    invited: inv.length,
    registered: tix.length,
    surveyDone: tix.filter((t) => t.has_completed_survey).length,
    checkedIn: tix.filter((t) => t.checked_in).length,
  }

  const drinkCount: Record<string, number> = {}
  let shotsCount = 0
  tix.forEach((t) => {
    ;[...t.drink_beers, ...t.drink_cans, ...t.drink_spirits].forEach((d) => {
      drinkCount[d] = (drinkCount[d] ?? 0) + 1
    })
    if (t.drink_wants_shots) shotsCount++
  })
  const drinkStats = Object.entries(drinkCount).sort((a, b) => b[1] - a[1])

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Invitations créées', value: stats.invited },
          { label: 'Inscrits', value: stats.registered },
          { label: 'Préférences remplies', value: stats.surveyDone },
          { label: 'Entrées validées', value: stats.checkedIn },
        ].map((s) => (
          <div key={s.label} className="bg-white/3 border border-white/8 rounded-2xl p-4">
            <p className="text-3xl font-bold text-brand">{s.value}</p>
            <p className="text-white/50 text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Créer une invitation */}
      <section>
        <h2 className="text-base font-semibold text-white/80 uppercase tracking-widest mb-4">
          Créer une invitation
        </h2>
        <InvitationForm />
      </section>

      {/* Liste des invitations */}
      <section>
        <h2 className="text-base font-semibold text-white/80 uppercase tracking-widest mb-4">
          Invitations ({inv.length})
        </h2>
        <div className="space-y-2">
          {inv.length === 0 && (
            <p className="text-white/30 text-sm">Aucune invitation créée.</p>
          )}
          {inv.map((invitation) => {
            const ticket = tix.find((t) => t.invitation_id === invitation.id)
            return (
              <div
                key={invitation.id}
                className="flex items-center justify-between bg-white/3 border border-white/8 rounded-xl px-4 py-3 gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{invitation.guest_name}</p>
                  <p className="text-white/30 text-xs mt-0.5">
                    Créée le {new Date(invitation.created_at).toLocaleDateString('fr-FR')}
                    {' · '}
                    Expire le {new Date(invitation.expires_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
                  {invitation.is_used ? (
                    <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-1 rounded-full">
                      Inscrit
                    </span>
                  ) : (
                    <span className="text-xs bg-white/5 text-white/40 border border-white/10 px-2.5 py-1 rounded-full">
                      En attente
                    </span>
                  )}
                  {ticket?.checked_in && (
                    <span className="text-xs bg-brand/10 text-brand border border-brand/20 px-2.5 py-1 rounded-full">
                      Entré ✓
                    </span>
                  )}
                  <DeleteInvitationButton
                    invitationId={invitation.id}
                    guestName={invitation.guest_name}
                    isUsed={invitation.is_used}
                    ticketId={ticket?.id}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Stats boissons */}
      {drinkStats.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-white/80 uppercase tracking-widest mb-4">
            Préférences boissons
          </h2>
          <div className="bg-white/3 border border-white/8 rounded-2xl p-5 space-y-3">
            {drinkStats.map(([name, count]) => (
              <div key={name} className="flex items-center gap-3">
                <div
                  className="h-1.5 bg-brand rounded-full shrink-0"
                  style={{ width: `${Math.max((count / Math.max(tix.length, 1)) * 200, 8)}px` }}
                />
                <span className="text-white/70 text-sm flex-1">{name}</span>
                <span className="text-brand font-medium text-sm">{count}</span>
              </div>
            ))}
            {shotsCount > 0 && (
              <div className="flex items-center gap-3">
                <div
                  className="h-1.5 bg-white/40 rounded-full shrink-0"
                  style={{ width: `${Math.max((shotsCount / Math.max(tix.length, 1)) * 200, 8)}px` }}
                />
                <span className="text-white/70 text-sm flex-1">Shots</span>
                <span className="text-white/60 font-medium text-sm">{shotsCount}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Annonces */}
      <section>
        <h2 className="text-base font-semibold text-white/80 uppercase tracking-widest mb-4">
          Annonces &amp; Localisation
        </h2>
        <AnnouncementForm />
        <div className="mt-4 space-y-2">
          {(announcements ?? []).length === 0 && (
            <p className="text-white/20 text-sm">Aucune annonce créée.</p>
          )}
          {(announcements ?? []).map((a) => (
            <AnnouncementItem key={a.id} a={a} />
          ))}
        </div>
      </section>
    </div>
  )
}
