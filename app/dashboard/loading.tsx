import Spinner from '@/components/Spinner'

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-white/5 rounded-xl animate-pulse ${className}`} />
}

export default function DashboardLoading() {
  return (
    <main className="flex-1 px-4 py-8 max-w-lg mx-auto w-full space-y-6">
      {/* En-tête */}
      <div className="text-center py-4 space-y-2">
        <Skeleton className="h-3 w-24 mx-auto rounded-full" />
        <Skeleton className="h-7 w-36 mx-auto" />
        <Skeleton className="h-3 w-44 mx-auto rounded-full" />
      </div>

      {/* QR / Survey card */}
      <div className="bg-white/3 border border-white/8 rounded-3xl p-6 flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <Skeleton className="h-4 w-48 rounded-full" />
        <Skeleton className="h-3 w-36 rounded-full" />
      </div>

      {/* Location card */}
      <div className="bg-white/3 border border-white/8 rounded-3xl overflow-hidden">
        <Skeleton className="h-48 w-full rounded-none" />
        <div className="p-6 space-y-3">
          <Skeleton className="h-5 w-40 mx-auto" />
          <Skeleton className="h-3 w-28 mx-auto rounded-full" />
          <div className="grid grid-cols-4 gap-2 pt-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
          </div>
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
      </div>
    </main>
  )
}
