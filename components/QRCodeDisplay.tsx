'use client'

import { QRCodeSVG } from 'qrcode.react'

type Props = {
  slug: string
}

export default function QRCodeDisplay({ slug }: Props) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const value = `${appUrl}/ticket/${slug}`

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white p-4 rounded-2xl shadow-lg shadow-brand/10">
        <QRCodeSVG value={value} size={220} level="H" marginSize={0} />
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
