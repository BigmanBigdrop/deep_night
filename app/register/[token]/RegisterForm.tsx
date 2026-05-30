'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { registerGuest } from '@/app/actions'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { ActionResult } from '@/lib/types'
import Spinner from '@/components/Spinner'

const initialState: ActionResult = { success: false, error: '' }

const INPUT_CLASS =
  'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors'

export default function RegisterForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(registerGuest, initialState)
  const [signingIn, setSigningIn] = useState(false)
  const [photoName, setPhotoName] = useState<string | null>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const photoRef = useRef<HTMLInputElement>(null)

  // Quand la Server Action réussit, connexion client-side puis navigation HTTP complète.
  // window.location.href (et non router.push) force le navigateur mobile à relire
  // tous les cookies avant de charger /dashboard.
  useEffect(() => {
    if (!state.success) return

    const email = emailRef.current?.value ?? ''
    const password = passwordRef.current?.value ?? ''

    setSigningIn(true)
    const supabase = createSupabaseClient()

    supabase.auth.signInWithPassword({ email, password }).then(({ error }) => {
      window.location.href = error ? '/login?registered=1' : '/dashboard'
    })
  }, [state.success])

  if (signingIn) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="w-10 h-10 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-white/50 text-sm">Ouverture de ton espace...</p>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="token" value={token} />

      {/* Prénom + Nom */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="first_name" className="block text-sm text-white/60 mb-1.5">
            Prénom <span className="text-brand">*</span>
          </label>
          <input id="first_name" name="first_name" type="text" required
            className={INPUT_CLASS} placeholder="Prénom" />
        </div>
        <div>
          <label htmlFor="last_name" className="block text-sm text-white/60 mb-1.5">
            Nom <span className="text-brand">*</span>
          </label>
          <input id="last_name" name="last_name" type="text" required
            className={INPUT_CLASS} placeholder="Nom" />
        </div>
      </div>

      {/* Email + Âge */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <label htmlFor="email" className="block text-sm text-white/60 mb-1.5">
            Email <span className="text-brand">*</span>
          </label>
          <input ref={emailRef} id="email" name="email" type="email" required
            autoComplete="email" className={INPUT_CLASS} placeholder="ton@email.com" />
        </div>
        <div>
          <label htmlFor="age" className="block text-sm text-white/60 mb-1.5">
            Âge <span className="text-brand">*</span>
          </label>
          <input id="age" name="age" type="number" required min={18} max={99}
            className={INPUT_CLASS} placeholder="18" />
        </div>
      </div>

      {/* Téléphone */}
      <div>
        <label htmlFor="phone" className="block text-sm text-white/60 mb-1.5">
          Téléphone <span className="text-white/25 text-xs">(optionnel)</span>
        </label>
        <input id="phone" name="phone" type="tel"
          className={INPUT_CLASS} placeholder="+225 07 00 00 00 00" />
      </div>

      {/* Mot de passe */}
      <div>
        <label htmlFor="password" className="block text-sm text-white/60 mb-1.5">
          Mot de passe <span className="text-brand">*</span>
        </label>
        <input ref={passwordRef} id="password" name="password" type="password"
          required minLength={8} autoComplete="new-password"
          className={INPUT_CLASS} placeholder="Min. 8 caractères" />
        <p className="mt-2 text-xs px-1" style={{ color: '#e8bfb8cc' }}>
          Retiens bien ce mot de passe — il te servira à chaque connexion à ton espace Deep Night.
        </p>
      </div>

      {/* Confirmation */}
      <div>
        <label htmlFor="password_confirm" className="block text-sm text-white/60 mb-1.5">
          Confirme le mot de passe <span className="text-brand">*</span>
        </label>
        <input id="password_confirm" name="password_confirm" type="password"
          required minLength={8} autoComplete="new-password"
          className={INPUT_CLASS} placeholder="Répète ton mot de passe" />
      </div>

      {/* Photo */}
      <div>
        <label className="block text-sm text-white/60 mb-1.5">
          Photo <span className="text-white/25 text-xs">(optionnel)</span>
        </label>
        <div onClick={() => photoRef.current?.click()}
          className="w-full bg-white/3 border border-dashed border-white/10 hover:border-brand/40 rounded-xl px-4 py-4 text-center cursor-pointer transition-colors"
        >
          {photoName ? (
            <p className="text-brand text-sm">{photoName}</p>
          ) : (
            <>
              <p className="text-white/30 text-sm">Clique pour ajouter une photo</p>
              <p className="text-white/15 text-xs mt-1">JPG, PNG, WEBP · Max 5 Mo</p>
            </>
          )}
        </div>
        <input ref={photoRef} name="photo" type="file"
          accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
          onChange={(e) => setPhotoName(e.target.files?.[0]?.name ?? null)} />
      </div>

      {/* Erreur */}
      {!state.success && state.error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <p className="text-red-400 text-sm">{state.error}</p>
        </div>
      )}

      <button type="submit" disabled={pending}
        className="w-full bg-brand hover:bg-brand-light disabled:opacity-40 text-black font-bold rounded-xl px-4 py-4 transition-colors text-base"
      >
        {pending ? <><Spinner size="sm" className="mr-2" />Inscription en cours...</> : "Je m'inscris"}
      </button>

      <p className="text-white/20 text-xs text-center">
        En t&apos;inscrivant tu crées ton espace personnel Deep Night.
      </p>
    </form>
  )
}
