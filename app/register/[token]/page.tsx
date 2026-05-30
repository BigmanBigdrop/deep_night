import { redirect } from 'next/navigation'
import Image from 'next/image'
import { createSupabaseAdmin } from '@/lib/supabase/admin'
import RegisterForm from './RegisterForm'

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const admin = createSupabaseAdmin()

  const { data: invitation } = await admin
    .from('invitations')
    .select('id, guest_name, is_used, expires_at')
    .eq('token', token)
    .maybeSingle()

  if (!invitation) redirect('/error?message=INVITATION_INVALID')
  if (invitation.is_used) redirect('/error?message=Ce+lien+a+deja+ete+utilise.')
  if (new Date(invitation.expires_at) < new Date()) redirect('/error?message=Ce+lien+a+expire.')

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <Image
            src="/logo.jpeg"
            alt="Deep Night"
            width={90}
            height={90}
            className="rounded-2xl mb-5 shadow-xl"
            priority
          />
          <h1 className="text-2xl font-bold text-white mb-1">Tu es invité(e) !</h1>
          <p className="text-white/50 text-sm">
            Invitation pour{' '}
            <span className="text-brand font-medium">{invitation.guest_name}</span>
          </p>
          <p className="text-white/25 text-xs mt-1">Soirée Privée · 06 Juin 2026</p>
        </div>

        <RegisterForm token={token} />
      </div>
    </main>
  )
}
