'use client'

import { QRCodeSVG } from 'qrcode.react'

type Props = {
  slug: string
}

export default function QRCodeDisplay({ slug }: Props) {
  // Le QR code encode uniquement le slug UUID — pas d'URL publique.
  // Seul le scanner admin sait l'interpréter via validateCheckIn(slug).
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white p-4 rounded-2xl shadow-lg shadow-brand/10">
        <QRCodeSVG value={slug} size={220} level="H" marginSize={0} />
      </div>
      <div className="text-center">
        <p className="text-white/40 text-xs">Présente ce QR code à l&apos;entrée</p>
        <p className="text-brand/50 text-xs font-mono mt-1 tracking-wider uppercase">
          {slug.slice(0, 8)}…
        </p>
      </div>
    </div>
  )
}
