import Spinner from '@/components/Spinner'

export default function ScannerLoading() {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="h-8 w-24 bg-white/5 rounded-xl animate-pulse mx-auto" />
        <div className="h-3 w-56 bg-white/5 rounded-full animate-pulse mx-auto" />
      </div>
      <div className="flex flex-col items-center gap-6 py-16">
        <Spinner size="lg" />
        <p className="text-white/30 text-sm animate-pulse">Chargement du scanner...</p>
      </div>
    </div>
  )
}
