'use client'

import { useActionState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { loginGuest } from '@/app/actions'
import type { ActionResult } from '@/lib/types'

const initialState: ActionResult = { success: false, error: '' }

const INPUT_CLASS =
  'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors'

export default function GuestLoginPage() {
  const [state, action, pending] = useActionState(loginGuest, initialState)

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <Image
            src="/logo.jpeg"
            alt="Deep Night"
            width={90}
            height={90}
            className="rounded-2xl mb-5 shadow-xl"
            priority
          />
          <h1 className="text-2xl font-bold text-white mb-1">Content de te revoir</h1>
          <p className="text-white/40 text-sm">Connecte-toi pour accéder à ton espace</p>
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
              className={INPUT_CLASS}
              placeholder="ton@email.com"
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
              className={INPUT_CLASS}
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
            className="w-full bg-brand hover:bg-brand-light disabled:opacity-40 text-black font-bold rounded-xl px-4 py-4 transition-colors"
          >
            {pending ? 'Connexion...' : 'Accéder à mon espace'}
          </button>
        </form>

        <p className="mt-8 text-center text-white/20 text-xs">
          Première fois ici ?{' '}
          <span className="text-white/40">
            Ouvre le lien d&apos;invitation que tu as reçu.
          </span>
        </p>

        <div className="mt-6 text-center">
          <Link
            href="/admin/login"
            className="text-white/15 hover:text-white/30 text-xs transition-colors"
          >
            Accès organisateurs
          </Link>
        </div>
      </div>
    </main>
  )
}
