import { createSupabaseAdmin } from '@/lib/supabase/admin'
import type { Ticket } from '@/lib/types'
import { DRINK_OPTIONS } from '@/lib/types'
import DeleteGuestButton from './DeleteGuestButton'

export const dynamic = 'force-dynamic'

export default async function GuestsPage() {
  const admin = createSupabaseAdmin()

  const { data } = await admin
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false })

  const tickets = (data ?? []) as Ticket[]

  const registered = tickets.length
  const surveyDone = tickets.filter((t) => t.has_completed_survey).length
  const checkedIn = tickets.filter((t) => t.checked_in).length

  // Stats âge
  const ages = tickets.map((t) => t.guest_age).filter((a): a is number => a !== null)
  const avgAge = ages.length ? Math.round(ages.reduce((s, a) => s + a, 0) / ages.length) : null
  const minAge = ages.length ? Math.min(...ages) : null
  const maxAge = ages.length ? Math.max(...ages) : null

  // Stats boissons globales
  const drinkTotals: Record<string, number> = {}
  let shotsTotal = 0
  tickets.forEach((t) => {
    ;[...t.drink_beers, ...t.drink_cans, ...t.drink_spirits].forEach((d) => {
      drinkTotals[d] = (drinkTotals[d] ?? 0) + 1
    })
    if (t.drink_wants_shots) shotsTotal++
  })

  const withSurvey = tickets.filter((t) => t.has_completed_survey).length || 1

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Entete */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Invités</h1>
        <p className="text-white/30 text-sm">
          {registered} inscrit{registered > 1 ? 's' : ''}
          {' · '}{surveyDone} préférences
          {' · '}{checkedIn} entrée{checkedIn > 1 ? 's' : ''}
        </p>
      </div>

      {/* Stats générales */}
      {tickets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* Stats âge */}
          {avgAge && (
            <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
              <h2 className="text-white/40 text-xs uppercase tracking-widest mb-4">Âges</h2>
              <div className="flex gap-6">
                <div>
                  <p className="text-3xl font-bold text-brand">{avgAge}</p>
                  <p className="text-white/30 text-xs mt-1">Moyenne</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-white/60">{minAge}</p>
                  <p className="text-white/30 text-xs mt-1">Min</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-white/60">{maxAge}</p>
                  <p className="text-white/30 text-xs mt-1">Max</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats boissons par catégorie */}
          {surveyDone > 0 && (
            <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
              <h2 className="text-white/40 text-xs uppercase tracking-widest mb-4">
                Boissons — sur {surveyDone} réponse{surveyDone > 1 ? 's' : ''}
              </h2>
              <div className="space-y-4">

                {/* Bieres */}
                <DrinkCategoryStats
                  label="Bières"
                  drinks={DRINK_OPTIONS.beers}
                  totals={drinkTotals}
                  total={withSurvey}
                  color="blue"
                />

                {/* Canettes */}
                <DrinkCategoryStats
                  label="Canettes"
                  drinks={DRINK_OPTIONS.cans}
                  totals={drinkTotals}
                  total={withSurvey}
                  color="purple"
                />

                {/* Spirits */}
                <DrinkCategoryStats
                  label="Spirits"
                  drinks={DRINK_OPTIONS.spirits}
                  totals={drinkTotals}
                  total={withSurvey}
                  color="amber"
                />

                {/* Shots */}
                {shotsTotal > 0 && (
                  <div>
                    <p className="text-white/25 text-xs uppercase tracking-wider mb-2">Shots</p>
                    <div className="flex items-center gap-3">
                      <div
                        className="h-1.5 bg-brand rounded-full shrink-0"
                        style={{ width: `${Math.round((shotsTotal / withSurvey) * 100)}%`, minWidth: '6px', maxWidth: '120px' }}
                      />
                      <span className="text-white/60 text-sm font-medium">{shotsTotal}</span>
                      <span className="text-white/25 text-xs">
                        ({Math.round((shotsTotal / withSurvey) * 100)}%)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Liste des invités */}
      {tickets.length === 0 ? (
        <div className="bg-white/3 border border-white/8 rounded-2xl p-12 text-center">
          <p className="text-white/30">Aucun invité inscrit pour l&apos;instant.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <GuestCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  )
}

// ---- Composants ----

function DrinkCategoryStats({
  label, drinks, totals, total, color,
}: {
  label: string
  drinks: readonly string[]
  totals: Record<string, number>
  total: number
  color: 'blue' | 'purple' | 'amber'
}) {
  const barColor = {
    blue: 'bg-blue-400',
    purple: 'bg-purple-400',
    amber: 'bg-amber-400',
  }[color]

  const relevant = drinks.filter((d) => totals[d])
  if (relevant.length === 0) return null

  return (
    <div>
      <p className="text-white/25 text-xs uppercase tracking-wider mb-2">{label}</p>
      <div className="space-y-1.5">
        {drinks.map((drink) => {
          const count = totals[drink] ?? 0
          const pct = Math.round((count / total) * 100)
          return (
            <div key={drink} className="flex items-center gap-3">
              <div
                className={`h-1.5 rounded-full shrink-0 ${barColor} ${count === 0 ? 'opacity-10' : ''}`}
                style={{ width: `${Math.max(pct, 2)}%`, maxWidth: '120px', minWidth: '6px' }}
              />
              <span className={`text-sm flex-1 ${count === 0 ? 'text-white/20' : 'text-white/70'}`}>
                {drink}
              </span>
              <span className={`text-sm font-medium tabular-nums ${count === 0 ? 'text-white/15' : 'text-white/60'}`}>
                {count}
              </span>
              {count > 0 && (
                <span className="text-white/25 text-xs w-8 text-right">{pct}%</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function GuestCard({ ticket }: { ticket: Ticket }) {
  const allSelections = [
    ...ticket.drink_beers.map((d) => ({ name: d, color: 'blue' as const })),
    ...ticket.drink_cans.map((d) => ({ name: d, color: 'purple' as const })),
    ...ticket.drink_spirits.map((d) => ({ name: d, color: 'amber' as const })),
    ...(ticket.drink_wants_shots ? [{ name: 'Shots', color: 'brand' as const }] : []),
  ]

  const checkinTime = ticket.checked_in_at
    ? new Date(ticket.checked_in_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
      <div className="flex items-start gap-4 p-5">

        {/* Avatar */}
        <div className="shrink-0">
          {ticket.guest_photo_url ? (
            <img
              src={ticket.guest_photo_url}
              alt={ticket.guest_first_name}
              className="w-12 h-12 rounded-full object-cover border border-brand/20"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <span className="text-white/40 text-sm font-bold">
                {ticket.guest_first_name[0]}{ticket.guest_last_name[0]}
              </span>
            </div>
          )}
        </div>

        {/* Identité */}
        <div className="flex-1 min-w-0">
          {/* Ligne nom + bouton supprimer */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-white font-semibold">
                {ticket.guest_first_name} {ticket.guest_last_name}
              </h2>
              {ticket.guest_age && (
                <span className="text-xs text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                  {ticket.guest_age} ans
                </span>
              )}
              {ticket.checked_in ? (
                <span className="text-xs bg-brand/10 text-brand border border-brand/20 px-2.5 py-0.5 rounded-full">
                  ✓ Entré {checkinTime && `à ${checkinTime}`}
                </span>
              ) : ticket.has_completed_survey ? (
                <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-0.5 rounded-full">
                  QR actif
                </span>
              ) : (
                <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2.5 py-0.5 rounded-full">
                  Sans préférences
                </span>
              )}
            </div>
            <DeleteGuestButton
              ticketId={ticket.id}
              guestName={`${ticket.guest_first_name} ${ticket.guest_last_name}`}
            />
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5">
            {ticket.guest_email && (
              <p className="text-white/35 text-xs">{ticket.guest_email}</p>
            )}
            {ticket.guest_phone && (
              <p className="text-white/35 text-xs">{ticket.guest_phone}</p>
            )}
            <p className="text-white/20 text-xs">
              Inscrit le {new Date(ticket.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Boissons */}
      <div className="border-t border-white/5 px-5 py-3">
        {ticket.has_completed_survey ? (
          allSelections.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {allSelections.map((d) => {
                const styles = {
                  blue:   'bg-blue-500/10 text-blue-300 border-blue-500/20',
                  purple: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
                  amber:  'bg-amber-500/10 text-amber-300 border-amber-500/20',
                  brand:  'bg-brand/10 text-brand border-brand/20',
                }[d.color]
                return (
                  <span key={d.name} className={`text-xs border px-2.5 py-1 rounded-full ${styles}`}>
                    {d.name}
                  </span>
                )
              })}
            </div>
          ) : (
            <p className="text-white/20 text-xs">Aucune boisson sélectionnée.</p>
          )
        ) : (
          <p className="text-white/20 text-xs italic">Préférences non remplies.</p>
        )}
      </div>
    </div>
  )
}
