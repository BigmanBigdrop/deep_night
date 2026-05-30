'use client'

import { useState, useTransition } from 'react'
import { deleteInvitation, deleteGuest } from '@/app/actions'

type Props = {
  invitationId: string
  guestName: string
  isUsed: boolean
  ticketId?: string
}

export default function DeleteInvitationButton({ invitationId, guestName, isUsed, ticketId }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const result = isUsed && ticketId
        ? await deleteGuest(ticketId)
        : await deleteInvitation(invitationId)

      if (!result.success) {
        setError(result.error)
        setConfirming(false)
      }
    })
  }

  if (error) {
    return (
      <span className="text-red-400 text-xs">{error}</span>
    )
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 justify-end">
        <span className="text-white/30 text-xs hidden sm:inline">Supprimer ?</span>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {isPending ? '...' : 'Confirmer'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={isPending}
          className="text-white/25 hover:text-white/50 text-xs transition-colors"
        >
          Non
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-white/15 hover:text-red-400 transition-colors p-1 rounded-lg"
      title={isUsed ? `Supprimer ${guestName} et son compte` : `Annuler l'invitation de ${guestName}`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      </svg>
    </button>
  )
}
