'use client'

import { useActionState } from 'react'
import { submitDrinkSurvey } from '@/app/actions'
import { DRINK_OPTIONS } from '@/lib/types'
import type { ActionResult } from '@/lib/types'
import Spinner from '@/components/Spinner'

const initialState: ActionResult = { success: false, error: '' }

const CATEGORY_LABELS = {
  beers: 'Bières',
  cans: 'Canettes alcoolisées',
  spirits: 'Whisky / Gin / Vodka',
} as const

export default function DrinkSurveyForm() {
  const [state, action, pending] = useActionState(submitDrinkSurvey, initialState)

  if (pending) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <Spinner size="lg" />
        <p className="text-white/50 text-sm animate-pulse">Enregistrement de tes préférences...</p>
        <p className="text-white/20 text-xs">Ne ferme pas cette page.</p>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-6">
      <p className="text-white/40 text-sm">
        Sélectionne tes préférences. Nous préparons les boissons à l&apos;avance pour toi.
      </p>

      {(Object.entries(DRINK_OPTIONS) as [keyof typeof DRINK_OPTIONS, readonly string[]][]).map(
        ([category, options]) => (
          <div key={category}>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3">
              {CATEGORY_LABELS[category]}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {options.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2.5 bg-white/3 border border-white/8 rounded-xl px-3 py-2.5 cursor-pointer hover:border-brand/30 has-checked:border-brand/50 has-checked:bg-brand/5 transition-colors"
                >
                  <input
                    type="checkbox"
                    name={`drink_${category}`}
                    value={option}
                    className="accent-brand w-4 h-4 shrink-0"
                  />
                  <span className="text-white/70 text-sm">{option}</span>
                </label>
              ))}
            </div>
          </div>
        )
      )}

      {/* Shots — checkbox non-contrôlé pour compatibilité mobile */}
      <div>
        <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3">Shots</p>
        <label className="flex items-center gap-3 bg-white/3 border border-white/8 rounded-xl px-4 py-3.5 cursor-pointer has-checked:border-brand/40 has-checked:bg-brand/5 transition-colors">
          <input
            type="checkbox"
            name="drink_wants_shots"
            value="true"
            defaultChecked={false}
            className="w-5 h-5 shrink-0 rounded accent-brand"
          />
          <div>
            <p className="text-white font-medium text-sm">Je veux des shots</p>
            <p className="text-white/30 text-xs">On va s&apos;en occuper pour toi</p>
          </div>
        </label>
      </div>

      {!state.success && state.error && (
        <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        className="w-full bg-brand hover:bg-brand-light text-black font-bold rounded-xl px-4 py-4 transition-colors"
      >
        Valider mes préférences
      </button>
    </form>
  )
}
