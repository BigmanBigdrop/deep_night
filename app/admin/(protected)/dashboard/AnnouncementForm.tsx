'use client'

import { useActionState, useState } from 'react'
import { createAnnouncement } from '@/app/actions'
import type { ActionResult } from '@/lib/types'

const initialState: ActionResult = { success: false, error: '' }

export default function AnnouncementForm() {
  const [state, action, pending] = useActionState(createAnnouncement, initialState)
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="text-brand hover:text-brand-light text-sm font-medium transition-colors"
      >
        {open ? '▲ Masquer le formulaire' : '+ Nouvelle annonce / localisation'}
      </button>

      {open && (
        <form action={action} className="mt-4 bg-white/3 border border-white/8 rounded-2xl p-5 space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Titre</label>
            <input
              name="title"
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/25 focus:outline-none focus:border-brand/50 transition-colors"
              placeholder="Ex: Localisation de la soirée"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Contenu</label>
            <textarea
              name="content"
              required
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/25 focus:outline-none focus:border-brand/50 transition-colors resize-none"
              placeholder="Le texte visible par les invités..."
            />
          </div>
          <div className="flex gap-4 flex-wrap">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Type</label>
              <select
                name="type"
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand/50"
              >
                <option value="info">Annonce générale</option>
                <option value="location">Localisation</option>
              </select>
            </div>
            <div className="flex items-end pb-0.5">
              <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_published"
                  value="true"
                  className="w-4 h-4 rounded accent-brand"
                />
                Publier immédiatement
              </label>
            </div>
          </div>

          {!state.success && state.error && (
            <p className="text-red-400 text-sm">{state.error}</p>
          )}
          {state.success && (
            <p className="text-green-400 text-sm">Annonce créée avec succès.</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="bg-brand hover:bg-brand-light disabled:opacity-50 text-black font-semibold rounded-xl px-5 py-2.5 transition-colors"
          >
            {pending ? 'Enregistrement...' : "Créer l'annonce"}
          </button>
        </form>
      )}
    </div>
  )
}
