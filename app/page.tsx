import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect(user.app_metadata?.role === 'admin' ? '/admin/dashboard' : '/dashboard')
  }

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center px-4 text-center">
      <Image
        src="/logo.jpeg"
        alt="Deep Night"
        width={140}
        height={140}
        className="rounded-3xl mb-8 shadow-2xl"
        priority
      />
      <h1 className="text-3xl font-bold text-white mb-2">Soirée Privée</h1>
      <p className="text-white/40 text-sm">06 Juin 2026</p>

      <Link
        href="/login"
        className="mt-10 bg-brand hover:bg-brand-light text-black font-bold rounded-xl px-8 py-3.5 transition-colors text-sm"
      >
        Accéder à mon espace
      </Link>

      <p className="mt-6 text-white/20 text-xs max-w-xs">
        Première fois ici ? Ouvre le lien d&apos;invitation que tu as reçu par message.
      </p>
    </main>
  )
}
