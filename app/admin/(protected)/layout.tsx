import { redirect } from 'next/navigation'
import Image from 'next/image'
import { createSupabaseServer } from '@/lib/supabase/server'
import { logout } from '@/app/actions'

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata?.role !== 'admin') {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <header className="border-b border-white/5 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo.jpeg" alt="Deep Night" width={36} height={36} className="rounded-lg" />
          <span className="text-white/30 text-xs tracking-widest uppercase">Admin</span>
        </div>
        <nav className="flex items-center gap-6 text-sm">
          <a href="/admin/dashboard" className="text-white/60 hover:text-white transition-colors">
            Dashboard
          </a>
          <a href="/admin/guests" className="text-white/60 hover:text-white transition-colors">
            Invités
          </a>
          <a href="/admin/scanner" className="text-white/60 hover:text-white transition-colors">
            Scanner
          </a>
          <form action={logout}>
            <button type="submit" className="text-white/30 hover:text-red-400 transition-colors">
              Deconnexion
            </button>
          </form>
        </nav>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
