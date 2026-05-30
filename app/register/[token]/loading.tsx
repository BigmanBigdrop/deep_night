import Spinner from '@/components/Spinner'

export default function RegisterLoading() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <div className="w-20 h-20 bg-white/5 rounded-2xl animate-pulse" />
        <Spinner size="lg" />
        <p className="text-white/30 text-sm animate-pulse">Vérification de l&apos;invitation...</p>
      </div>
    </main>
  )
}
