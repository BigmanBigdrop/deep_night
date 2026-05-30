function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-white/5 rounded-xl animate-pulse ${className}`} />
}

export default function AdminDashboardLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <Skeleton className="h-8 w-32" />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/3 border border-white/8 rounded-2xl p-4 space-y-2">
            <Skeleton className="h-9 w-12" />
            <Skeleton className="h-3 w-28 rounded-full" />
          </div>
        ))}
      </div>

      {/* Invitation form skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-44 rounded-full" />
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
          <div className="flex gap-3">
            <Skeleton className="h-11 flex-1 rounded-xl" />
            <Skeleton className="h-11 w-24 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Liste invitations skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-36 rounded-full" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white/3 border border-white/8 rounded-xl px-4 py-3 flex justify-between items-center gap-3">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32 rounded-full" />
              <Skeleton className="h-3 w-48 rounded-full" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
