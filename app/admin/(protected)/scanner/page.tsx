import QRScanner from '@/components/QRScanner'

export default function ScannerPage() {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">Scanner</h1>
        <p className="text-gray-400 text-sm mt-1">Scanne le QR code de l&apos;invité à l&apos;entrée</p>
      </div>
      <QRScanner />
    </div>
  )
}
