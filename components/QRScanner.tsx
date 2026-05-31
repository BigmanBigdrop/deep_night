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

    // Html5Qrcode (API bas niveau) — permet de forcer la caméra arrière
    // sans afficher de sélecteur de caméra
    const { Html5Qrcode } = await import('html5-qrcode')
    const qr = new Html5Qrcode('qr-reader')
    scannerRef.current = qr

    try {
      await qr.start(
        { facingMode: 'environment' }, // caméra arrière, pas de sélecteur
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText: string) => {
          if (processingRef.current) return
          processingRef.current = true

          setScanState({ status: 'loading' })
          qr.pause()

          const slug = decodedText.split('/ticket/').pop() ?? decodedText
          const result = await validateCheckIn(slug)

          if (!result.success) {
            setScanState({ status: 'error', message: result.error })
          } else {
            const ticket = result.data!
            const wasAlreadyChecked =
              ticket.checked_in &&
              !!ticket.checked_in_at &&
              new Date(ticket.checked_in_at).getTime() < Date.now() - 5000
            setScanState({ status: 'success', ticket, alreadyChecked: wasAlreadyChecked })
          }
        },
        () => {} // erreurs de scan ignorées (pas de QR dans le cadre)
      )
    } catch {
      // Si la caméra arrière n'est pas disponible, essaie avec n'importe quelle caméra
      try {
        await qr.start(
          { facingMode: 'user' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText: string) => {
            if (processingRef.current) return
            processingRef.current = true
            setScanState({ status: 'loading' })
            qr.pause()
            const slug = decodedText.split('/ticket/').pop() ?? decodedText
            const result = await validateCheckIn(slug)
            if (!result.success) {
              setScanState({ status: 'error', message: result.error })
            } else {
              const ticket = result.data!
              const wasAlreadyChecked =
                ticket.checked_in && !!ticket.checked_in_at &&
                new Date(ticket.checked_in_at).getTime() < Date.now() - 5000
              setScanState({ status: 'success', ticket, alreadyChecked: wasAlreadyChecked })
            }
          },
          () => {}
        )
      } catch {
        setScanState({ status: 'error', message: "Impossible d'acceder a la camera." })
      }
    }
  }

  async function reset() {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop()
      }
      scannerRef.current = null
    } catch {
      scannerRef.current = null
    }
    processingRef.current = false
    setScanState({ status: 'idle' })
  }

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [])

  if (scanState.status === 'idle') {
    return (
      <div className="flex flex-col items-center gap-0">
        <div className="relative w-full aspect-square max-w-sm bg-black rounded-3xl overflow-hidden border border-white/10 flex items-center justify-center">
          {[
            'top-4 left-4 border-t-2 border-l-2',
            'top-4 right-4 border-t-2 border-r-2',
            'bottom-4 left-4 border-b-2 border-l-2',
            'bottom-4 right-4 border-b-2 border-r-2',
          ].map((cls, i) => (
            <span key={i} className={`absolute w-8 h-8 border-brand rounded-sm ${cls}`} />
          ))}

          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-brand/10 animate-ping" />
              <div className="relative w-20 h-20 rounded-full bg-white/5 border border-white/15 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-9 h-9 text-white/60">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                </svg>
              </div>
            </div>
            <p className="text-white/30 text-xs text-center px-6">
              Caméra arrière activée automatiquement
            </p>
          </div>

          <div
            className="absolute left-8 right-8 h-px bg-linear-to-r from-transparent via-brand to-transparent opacity-40"
            style={{ animation: 'scanline 2.5s ease-in-out infinite', top: '40%' }}
          />
        </div>

        <div className="w-full px-2 -mt-5 relative z-10">
          <button
            onClick={startScanner}
            className="w-full bg-brand hover:bg-brand-light active:scale-95 text-black font-bold rounded-2xl py-5 text-lg transition-all shadow-xl shadow-brand/20 flex items-center justify-center gap-3"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M2 4.25A2.25 2.25 0 0 1 4.25 2h4.5A2.25 2.25 0 0 1 11 4.25v4.5A2.25 2.25 0 0 1 8.75 11h-4.5A2.25 2.25 0 0 1 2 8.75v-4.5Zm2.25-.75a.75.75 0 0 0-.75.75v4.5c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-4.5a.75.75 0 0 0-.75-.75h-4.5ZM13 4.25A2.25 2.25 0 0 1 15.25 2h4.5A2.25 2.25 0 0 1 22 4.25v4.5A2.25 2.25 0 0 1 19.75 11h-4.5A2.25 2.25 0 0 1 13 8.75v-4.5Zm2.25-.75a.75.75 0 0 0-.75.75v4.5c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-4.5a.75.75 0 0 0-.75-.75h-4.5ZM2 15.25A2.25 2.25 0 0 1 4.25 13h4.5A2.25 2.25 0 0 1 11 15.25v4.5A2.25 2.25 0 0 1 8.75 22h-4.5A2.25 2.25 0 0 1 2 19.75v-4.5Zm2.25-.75a.75.75 0 0 0-.75.75v4.5c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-4.5a.75.75 0 0 0-.75-.75h-4.5Z" clipRule="evenodd" />
            </svg>
            Scanner un QR code
          </button>
          <p className="text-center text-white/20 text-xs mt-3">
            L&apos;accès à la caméra sera demandé
          </p>
        </div>

        <style>{`
          @keyframes scanline {
            0%, 100% { top: 30%; opacity: 0; }
            20% { opacity: 0.5; }
            50% { top: 70%; opacity: 0.5; }
            80% { opacity: 0.5; }
          }
        `}</style>
      </div>
    )
  }

  if (scanState.status === 'scanning' || scanState.status === 'loading') {
    return (
      <div className="space-y-3">
        <div id="qr-reader" className="rounded-2xl overflow-hidden" />
        {scanState.status === 'loading' && (
          <div className="text-center text-brand animate-pulse py-3 font-medium">
            Vérification en cours…
          </div>
        )}
        <button
          onClick={reset}
          className="w-full text-white/30 hover:text-white/60 text-sm py-2 transition-colors"
        >
          Annuler
        </button>
      </div>
    )
  }

  if (scanState.status === 'error') {
    return (
      <div className="rounded-2xl bg-red-500 p-8 text-center space-y-4">
        <p className="text-5xl">❌</p>
        <p className="text-white font-bold text-xl">Code invalide</p>
        <p className="text-red-100 text-sm">{scanState.message}</p>
        <button onClick={reset} className="mt-2 bg-white text-red-600 font-bold rounded-xl px-6 py-3">
          Scanner à nouveau
        </button>
      </div>
    )
  }

  const { ticket, alreadyChecked } = scanState

  if (alreadyChecked) {
    const time = ticket.checked_in_at
      ? new Date(ticket.checked_in_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : '?'
    return (
      <div className="rounded-2xl bg-orange-500 p-8 text-center space-y-4">
        <p className="text-5xl">⚠️</p>
        <p className="text-white font-bold text-xl">{ticket.guest_first_name} {ticket.guest_last_name}</p>
        <p className="text-orange-100">Déjà scanné à {time}</p>
        <button onClick={reset} className="mt-2 bg-white text-orange-600 font-bold rounded-xl px-6 py-3">
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
      <button onClick={reset} className="mt-2 bg-white text-green-600 font-bold rounded-xl px-6 py-3">
        Scanner suivant
      </button>
    </div>
  )
}
