'use client'

import { useState, useTransition } from 'react'
import { deleteGuest } from '@/app/actions'

type Props = {
  ticketId: string
  guestName: string
}

export default function DeleteGuestButton({ ticketId, guestName }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteGuest(ticketId)
      if (!result.success) {
        alert(result.error)
      }
      setConfirming(false)
    })
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-white/40 text-xs">Supprimer {guestName} ?</span>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
        >
          {isPending ? '...' : 'Confirmer'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={isPending}
          className="text-xs text-white/25 hover:text-white/50 transition-colors"
        >
          Annuler
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-white/15 hover:text-red-400 transition-colors"
      title="Supprimer cet invité"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      </svg>
    </button>
  )
}
