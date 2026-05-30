'use client'

import { useActionState, useState } from 'react'
import { createInvitation } from '@/app/actions'
import type { ActionResult } from '@/lib/types'

const initialState: ActionResult<{ link: string }> = { success: false, error: '' }

export default function InvitationForm() {
  const [state, action, pending] = useActionState(createInvitation, initialState)
  const [copied, setCopied] = useState(false)

  const link = state.success ? state.data?.link : null

  async function copyLink() {
    if (!link) return
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl p-5 space-y-4">
      <form action={action} className="flex gap-3">
        <input
          name="guest_name"
          type="text"
          required
          placeholder="Prénom et nom de l'invité"
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/25 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/50 transition-colors"
        />
        <button
          type="submit"
          disabled={pending}
          className="bg-brand hover:bg-brand-light disabled:opacity-50 text-black font-semibold rounded-xl px-5 py-2.5 transition-colors whitespace-nowrap"
        >
          {pending ? '...' : 'Générer'}
        </button>
      </form>

      {!state.success && state.error && (
        <p className="text-red-400 text-sm">{state.error}</p>
      )}

      {link && (
        <div className="flex items-center gap-3 bg-brand/10 border border-brand/20 rounded-xl px-4 py-3">
          <span className="text-white/70 text-sm truncate flex-1 font-mono">{link}</span>
          <button
            onClick={copyLink}
            className="text-brand hover:text-brand-light text-sm font-medium transition-colors whitespace-nowrap"
          >
            {copied ? 'Copié ✓' : 'Copier'}
          </button>
        </div>
      )}
    </div>
  )
}
