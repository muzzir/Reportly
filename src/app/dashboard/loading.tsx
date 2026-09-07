export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-96 rounded bg-slate-200 dark:bg-slate-800" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800 mb-4" />
            <div className="h-8 w-16 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        ))}
      </div>

      {/* Activity Grid Skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-64 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950" />
        <div className="h-64 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950" />
      </div>
    </div>
  );
}
