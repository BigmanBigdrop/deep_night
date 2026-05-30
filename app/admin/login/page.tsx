'use client'

import { useActionState } from 'react'
import Image from 'next/image'
import { loginAdmin } from '@/app/actions'
import type { ActionResult } from '@/lib/types'
import Spinner from '@/components/Spinner'

const initialState: ActionResult = { success: false, error: '' }

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(loginAdmin, initialState)

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <Image
            src="/logo.jpeg"
            alt="Deep Night"
            width={100}
            height={100}
            className="rounded-2xl mb-4"
            priority
          />
          <p className="text-white/40 text-xs tracking-widest uppercase">Espace Admin</p>
        </div>

        <form action={action} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-white/60 mb-1.5">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-white/60 mb-1.5">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
              placeholder="••••••••"
            />
          </div>

          {!state.success && state.error && (
            <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-brand hover:bg-brand-light disabled:opacity-50 text-black font-semibold rounded-xl px-4 py-3.5 transition-colors"
          >
            {pending ? <><Spinner size="sm" className="mr-2" />Connexion...</> : 'Se connecter'}
          </button>
        </form>
      </div>
    </main>
  )
}
