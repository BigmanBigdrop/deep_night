import { redirect } from 'next/navigation'
import Image from 'next/image'
import { createSupabaseServer } from '@/lib/supabase/server'
import { logoutGuest } from '@/app/actions'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')
  if (user.app_metadata?.role === 'admin') redirect('/admin/dashboard')

  const firstName = user.user_metadata?.first_name ?? 'Invité'

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <header className="border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <Image src="/logo.jpeg" alt="Deep Night" width={36} height={36} className="rounded-lg" />
        <div className="flex items-center gap-4">
          <span className="text-white/40 text-sm hidden sm:block">
            Bonjour, <span className="text-white">{firstName}</span>
          </span>
          <form action={logoutGuest}>
            <button type="submit" className="text-white/25 hover:text-red-400 text-sm transition-colors">
              Déconnexion
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  )
}
