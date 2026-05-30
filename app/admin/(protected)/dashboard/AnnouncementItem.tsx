'use client'

import { useActionState, useState, useTransition } from 'react'
import { updateAnnouncement, deleteAnnouncement } from '@/app/actions'
import type { ActionResult, Announcement } from '@/lib/types'

const initialState: ActionResult = { success: false, error: '' }

export default function AnnouncementItem({ a }: { a: Announcement }) {
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleting, startDelete] = useTransition()
  const [state, action, saving] = useActionState(updateAnnouncement, initialState)

  function handleDelete() {
    startDelete(async () => {
      const result = await deleteAnnouncement(a.id)
      if (!result.success) alert(result.error)
    })
  }

  if (editing) {
    return (
      <form
        action={action}
        onSubmit={() => { if (state.success) setEditing(false) }}
        className="bg-white/3 border border-brand/20 rounded-xl p-4 space-y-3"
      >
        <input type="hidden" name="id" value={a.id} />

        <input
          name="title"
          defaultValue={a.title}
          required
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand/50"
        />

        <textarea
          name="content"
          defaultValue={a.content}
          required
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand/50 resize-none"
        />

        <div className="flex items-center gap-4 flex-wrap">
          <select
            name="type"
            defaultValue={a.type}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none"
          >
            <option value="info">Annonce générale</option>
            <option value="location">Localisation</option>
          </select>

          <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
            <input
              type="checkbox"
              name="is_published"
              value="true"
              defaultChecked={a.is_published}
              className="accent-brand w-4 h-4"
            />
            Publié
          </label>
        </div>

        {!state.success && state.error && (
          <p className="text-red-400 text-xs">{state.error}</p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-brand hover:bg-brand-light text-black text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-white/30 hover:text-white/60 text-sm px-3 py-1.5 transition-colors"
          >
            Annuler
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="bg-white/3 border border-white/8 rounded-xl px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full border ${
              a.type === 'location'
                ? 'bg-brand/10 text-brand border-brand/20'
                : 'bg-white/5 text-white/40 border-white/10'
            }`}>
              {a.type === 'location' ? '📍 Localisation' : 'Info'}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${
              a.is_published
                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                : 'bg-white/5 text-white/30 border-white/10'
            }`}>
              {a.is_published ? 'Publié' : 'Brouillon'}
            </span>
          </div>
          <p className="text-white font-medium text-sm">{a.title}</p>
          <p className="text-white/40 text-xs mt-1 line-clamp-2">{a.content}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Modifier */}
          <button
            onClick={() => setEditing(true)}
            className="text-white/20 hover:text-brand transition-colors p-1.5 rounded-lg hover:bg-brand/5"
            title="Modifier"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>

          {/* Supprimer */}
          {confirming ? (
            <div className="flex items-center gap-1.5 ml-1">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? '...' : 'Oui, supprimer'}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="text-white/25 hover:text-white/50 text-xs transition-colors"
              >
                Non
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="text-white/20 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/5"
              title="Supprimer"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
