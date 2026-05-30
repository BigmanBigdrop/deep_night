'use client'

import { useEffect, useRef, useState } from 'react'
import { validateCheckIn } from '@/app/actions'
import type { Ticket } from '@/lib/types'

type ScanState =
  | { status: 'idle' }
  | { status: 'scanning' }
  | { status: 'loading' }
  | { status: 'success'; ticket: Ticket; alreadyChecked: boolean }
  | { status: 'error'; message: string }

export default function QRScanner() {
  const [scanState, setScanState] = useState<ScanState>({ status: 'idle' })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null)
  const processingRef = useRef(false)

  async function startScanner() {
    setScanState({ status: 'scanning' })
    const { Html5QrcodeScanner } = await import('html5-qrcode')

    scannerRef.current = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
      false
    )

    scannerRef.current.render(
      async (decodedText: string) => {
        if (processingRef.current) return
        processingRef.current = true

        setScanState({ status: 'loading' })
        scannerRef.current?.pause()

        const slug = decodedText.split('/ticket/').pop() ?? decodedText
        const result = await validateCheckIn(slug)

        if (!result.success) {
          setScanState({ status: 'error', message: result.error })
        } else {
          const ticket = result.data!
          const wasAlreadyChecked = ticket.checked_in && !!ticket.checked_in_at
          setScanState({
            status: 'success',
            ticket,
            alreadyChecked: wasAlreadyChecked && new Date(ticket.checked_in_at!).getTime() < Date.now() - 5000,
          })
        }
      },
      () => {}
    )
  }

  function reset() {
    scannerRef.current?.clear().catch(() => {})
    scannerRef.current = null
    processingRef.current = false
    setScanState({ status: 'scanning' })
    requestAnimationFrame(startScanner)
  }

  useEffect(() => {
    return () => {
      scannerRef.current?.clear().catch(() => {})
    }
  }, [])

  if (scanState.status === 'idle') {
    return (
      <div className="flex flex-col items-center gap-6 py-12">
        <div className="w-20 h-20 border-2 border-dashed border-gray-600 rounded-2xl flex items-center justify-center">
          <span className="text-4xl">📷</span>
        </div>
        <button
          onClick={startScanner}
          className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold rounded-xl px-8 py-4 transition-colors text-lg"
        >
          Démarrer le scanner
        </button>
      </div>
    )
  }

  if (scanState.status === 'scanning' || scanState.status === 'loading') {
    return (
      <div className="space-y-4">
        <div id="qr-reader" className="rounded-xl overflow-hidden" />
        {scanState.status === 'loading' && (
          <div className="text-center text-amber-400 animate-pulse py-4">Vérification…</div>
        )}
      </div>
    )
  }

  if (scanState.status === 'error') {
    return (
      <div className="rounded-2xl bg-red-500 p-8 text-center space-y-4">
        <p className="text-5xl">❌</p>
        <p className="text-white font-bold text-xl">Code invalide</p>
        <p className="text-red-100 text-sm">{scanState.message}</p>
        <button
          onClick={reset}
          className="mt-2 bg-white text-red-600 font-bold rounded-xl px-6 py-3"
        >
          Scanner à nouveau
        </button>
      </div>
    )
  }

  const { ticket, alreadyChecked } = scanState

  if (alreadyChecked) {
    const time = ticket.checked_in_at
      ? new Date(ticket.checked_in_at).toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '?'

    return (
      <div className="rounded-2xl bg-orange-500 p-8 text-center space-y-4">
        <p className="text-5xl">⚠️</p>
        <p className="text-white font-bold text-xl">
          {ticket.guest_first_name} {ticket.guest_last_name}
        </p>
        <p className="text-orange-100">Déjà scanné à {time}</p>
        <button
          onClick={reset}
          className="mt-2 bg-white text-orange-600 font-bold rounded-xl px-6 py-3"
        >
          Scanner à nouveau
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-green-500 p-8 text-center space-y-4">
      <p className="text-5xl">✅</p>
      <p className="text-white font-bold text-2xl">
        Bienvenue {ticket.guest_first_name} {ticket.guest_last_name}
      </p>
      <p className="text-green-100 text-sm">Entrée validée</p>
      <button
        onClick={reset}
        className="mt-2 bg-white text-green-600 font-bold rounded-xl px-6 py-3"
      >
        Scanner suivant
      </button>
    </div>
  )
}
