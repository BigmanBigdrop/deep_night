import { createSupabaseAdmin } from '@/lib/supabase/admin'
import type { Ticket } from '@/lib/types'

export default async function PublicTicketPage({
  params,
}: {
  params: Promise<{ qr_code_slug: string }>
}) {
  const { qr_code_slug } = await params
  const admin = createSupabaseAdmin()

  const { data } = await admin
    .from('tickets')
    .select('guest_first_name, guest_last_name, qr_code_slug, checked_in, checked_in_at')
    .eq('qr_code_slug', qr_code_slug)
    .maybeSingle()

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-red-400">QR code invalide.</p>
      </main>
    )
  }

  const ticket = data as Pick<Ticket, 'guest_first_name' | 'guest_last_name' | 'checked_in' | 'checked_in_at' | 'qr_code_slug'>

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <p className="text-amber-400 text-xs tracking-widest uppercase mb-6">Deep Night · 06.06.2026</p>
      <p className="text-white font-bold text-2xl">
        {ticket.guest_first_name} {ticket.guest_last_name}
      </p>
      {ticket.checked_in && (
        <p className="mt-3 text-green-400 text-sm">
          Entrée validée à{' '}
          {ticket.checked_in_at
            ? new Date(ticket.checked_in_at).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '—'}
        </p>
      )}
    </main>
  )
}
