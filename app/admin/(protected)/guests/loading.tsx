function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-white/5 rounded-xl animate-pulse ${className}`} />
}

export default function GuestsLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-48 rounded-full" />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5 space-y-4">
          <Skeleton className="h-3 w-12 rounded-full" />
          <div className="flex gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-9 w-12" />
                <Skeleton className="h-3 w-14 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5 space-y-3">
          <Skeleton className="h-3 w-32 rounded-full" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`h-1.5 rounded-full bg-white/5 animate-pulse ${['w-10','w-14','w-16','w-20'][i]}`} />
              <Skeleton className="h-3 flex-1 rounded-full" />
              <Skeleton className="h-3 w-6 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Guest cards skeleton */}
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
            <div className="flex items-start gap-4 p-5">
              <Skeleton className="w-12 h-12 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-32 rounded-full" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-48 rounded-full" />
                <Skeleton className="h-3 w-36 rounded-full" />
              </div>
            </div>
            <div className="border-t border-white/5 px-5 py-3 flex gap-2">
              {[...Array(3)].map((_, j) => (
                <Skeleton key={j} className="h-6 w-20 rounded-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
