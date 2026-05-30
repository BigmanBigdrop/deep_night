'use client'

import { useActionState, useRef, useState } from 'react'
import { registerGuest } from '@/app/actions'
import type { ActionResult } from '@/lib/types'

const initialState: ActionResult = { success: false, error: '' }

const INPUT_CLASS =
  'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors'

export default function RegisterForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(registerGuest, initialState)
  const photoRef = useRef<HTMLInputElement>(null)
  const [photoName, setPhotoName] = useState<string | null>(null)

  return (
    <form action={action} className="space-y-5" encType="multipart/form-data">
      <input type="hidden" name="token" value={token} />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="first_name" className="block text-sm text-white/60 mb-1.5">
            Prénom <span className="text-brand">*</span>
          </label>
          <input id="first_name" name="first_name" type="text" required className={INPUT_CLASS} placeholder="Prénom" />
        </div>
        <div>
          <label htmlFor="last_name" className="block text-sm text-white/60 mb-1.5">
            Nom <span className="text-brand">*</span>
          </label>
          <input id="last_name" name="last_name" type="text" required className={INPUT_CLASS} placeholder="Nom" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <label htmlFor="email" className="block text-sm text-white/60 mb-1.5">
            Email <span className="text-brand">*</span>
          </label>
          <input
            id="email" name="email" type="email" required autoComplete="email"
            className={INPUT_CLASS} placeholder="ton@email.com"
          />
        </div>
        <div>
          <label htmlFor="age" className="block text-sm text-white/60 mb-1.5">
            Âge <span className="text-brand">*</span>
          </label>
          <input
            id="age" name="age" type="number" required min={18} max={99}
            className={INPUT_CLASS} placeholder="18"
          />
        </div>
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm text-white/60 mb-1.5">
          Téléphone <span className="text-white/25 text-xs">(optionnel)</span>
        </label>
        <input
          id="phone" name="phone" type="tel"
          className={INPUT_CLASS} placeholder="+33 6 00 00 00 00"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm text-white/60 mb-1.5">
          Mot de passe <span className="text-brand">*</span>
        </label>
        <input
          id="password" name="password" type="password" required minLength={8}
          autoComplete="new-password" className={INPUT_CLASS} placeholder="Min. 8 caractères"
        />
      </div>

      <div>
        <label htmlFor="password_confirm" className="block text-sm text-white/60 mb-1.5">
          Confirme le mot de passe <span className="text-brand">*</span>
        </label>
        <input
          id="password_confirm" name="password_confirm" type="password" required minLength={8}
          autoComplete="new-password" className={INPUT_CLASS} placeholder="Répète ton mot de passe"
        />
      </div>

      <div>
        <label className="block text-sm text-white/60 mb-1.5">
          Photo <span className="text-white/25 text-xs">(optionnel)</span>
        </label>
        <div
          onClick={() => photoRef.current?.click()}
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
        <input
          ref={photoRef}
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => setPhotoName(e.target.files?.[0]?.name ?? null)}
        />
      </div>

      {!state.success && state.error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <p className="text-red-400 text-sm">{state.error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-brand hover:bg-brand-light disabled:opacity-40 text-black font-bold rounded-xl px-4 py-4 transition-colors text-base"
      >
        {pending ? 'Inscription en cours...' : "Je m'inscris"}
      </button>

      <p className="text-white/20 text-xs text-center">
        En t&apos;inscrivant tu crées ton espace personnel Deep Night.
        <br />Tu pourras y retrouver ton QR code et les infos de la soirée.
      </p>
    </form>
  )
}
