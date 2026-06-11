/**
 * FUSION NEURAL — Page Loading Skeleton
 * Shimmer loading placeholder for lazy-loaded pages.
 */

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-48 bg-slate-200 rounded-lg mb-2" />
          <div className="h-4 w-72 bg-slate-100 rounded-lg" />
        </div>
        <div className="h-9 w-32 bg-slate-100 rounded-xl" />
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100">
            <div className="h-8 w-8 bg-slate-100 rounded-lg mb-3" />
            <div className="h-3 w-24 bg-slate-100 rounded mb-2" />
            <div className="h-6 w-32 bg-slate-200 rounded" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="h-5 w-40 bg-slate-100 rounded" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-slate-50 last:border-0">
            <div className="h-10 w-10 bg-slate-100 rounded-xl" />
            <div className="flex-1">
              <div className="h-4 w-48 bg-slate-100 rounded mb-2" />
              <div className="h-3 w-32 bg-slate-50 rounded" />
            </div>
            <div className="h-6 w-20 bg-slate-100 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 animate-pulse">
      <div className="h-8 w-8 bg-slate-100 rounded-lg mb-3" />
      <div className="h-3 w-24 bg-slate-100 rounded mb-2" />
      <div className="h-6 w-32 bg-slate-200 rounded" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
      <div className="p-4 border-b border-slate-100">
        <div className="h-5 w-40 bg-slate-100 rounded" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border-b border-slate-50 last:border-0">
          <div className="h-10 w-10 bg-slate-100 rounded-xl" />
          <div className="flex-1">
            <div className="h-4 w-48 bg-slate-100 rounded mb-2" />
            <div className="h-3 w-32 bg-slate-50 rounded" />
          </div>
          <div className="h-6 w-20 bg-slate-100 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
