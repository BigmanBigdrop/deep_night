import Spinner from '@/components/Spinner'

export default function LoginLoading() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-5">
        <div className="w-20 h-20 bg-white/5 rounded-2xl animate-pulse" />
        <Spinner size="lg" />
      </div>
    </main>
  )
}
