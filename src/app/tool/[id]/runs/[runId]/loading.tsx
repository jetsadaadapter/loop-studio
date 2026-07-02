export default function RunPageLoading() {
  return (
    <div className="pb-10">
      {/* ── Hero / AppCover Skeleton ───────────────────── */}
      <div className="mb-6 rounded-2xl overflow-hidden bg-[#1d2028] relative min-h-64 shadow-[0_30px_72px_-44px_rgba(2,6,23,0.92)] select-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0d14] via-[#3c1518]/30 via-45% to-[#69140e]/15 animate-pulse" />
        <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.03)_0px,rgba(255,255,255,0.03)_1px,transparent_1px,transparent_3px)] animate-pulse" />
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-size-[4px_4px]" />

        <div className="relative z-10 px-6 pt-5 pb-8 sm:px-8 sm:pt-8 sm:pb-10 lg:pb-12 space-y-4">
          {/* Back-button badges */}
          <div className="flex gap-3 pt-1">
            <div className="h-7 w-28 rounded-full bg-white/10 border border-white/10 animate-pulse" />
            <div className="h-7 w-20 rounded-full bg-white/5 border border-white/5 animate-pulse" />
          </div>

          {/* Breadcrumb badges */}
          <div className="flex items-center gap-2 pt-4">
            <div className="h-5 w-36 rounded-full bg-linear-to-r from-red-500/10 to-brand/20 border border-brand/40 animate-pulse" />
            <div className="h-5 w-24 rounded-full bg-white/5 border border-white/10 animate-pulse" />
          </div>

          {/* Title row */}
          <div className="flex items-center gap-3 mt-2">
            <div className="size-12 rounded-2xl bg-linear-to-br from-brand/50 via-brand-strong/40 to-rose-700/30 border border-white/20 shadow-lg shadow-brand/10 shrink-0 animate-pulse" />
            <div className="h-8 w-64 rounded-xl bg-white/10 animate-pulse" />
          </div>

          {/* Sub-description */}
          <div className="space-y-2 pt-1 max-w-xl">
            <div className="h-3 w-full rounded-full bg-white/10 animate-pulse" />
            <div className="h-3 w-4/5 rounded-full bg-white/5 animate-pulse" />
          </div>
        </div>
      </div>

      {/* ── Split Pane Grid ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: Pipeline summary panel */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs space-y-4">
          {/* Panel header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="size-4 rounded bg-slate-200 animate-pulse" />
              <div className="h-3 w-24 rounded-full bg-slate-200 animate-pulse" />
            </div>
            <div className="h-5 w-16 rounded-full bg-slate-100 animate-pulse" />
          </div>

          {/* Run ID label */}
          <div className="flex items-center gap-2 -mt-1">
            <div className="h-2.5 w-24 rounded-full bg-slate-100 animate-pulse" />
            <div className="h-4 w-14 rounded-md bg-slate-100 animate-pulse" />
          </div>

          {/* Job step cards */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-full p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between animate-pulse"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="size-3.5 rounded bg-slate-200" />
                  <div className="h-3 w-28 rounded-full bg-slate-200" />
                  <div className="h-3 w-10 rounded-md bg-slate-100" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-14 rounded-full bg-slate-100" />
                  <div className="h-2.5 w-16 rounded-full bg-slate-100" />
                </div>
              </div>
              <div className="size-3.5 rounded-full bg-slate-200 ml-2 shrink-0" />
            </div>
          ))}
        </div>

        {/* Right: Workspace panel */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden flex flex-col min-h-[500px]">
          {/* Workspace header */}
          <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <div className="space-y-1.5 animate-pulse">
              <div className="flex items-center gap-2">
                <div className="h-3.5 w-36 rounded-full bg-slate-200" />
                <div className="h-3 w-20 rounded-full bg-slate-100" />
              </div>
              <div className="h-2.5 w-52 rounded-full bg-slate-100" />
            </div>
            <div className="flex items-center gap-2 shrink-0 animate-pulse">
              <div className="h-8 w-24 rounded-md bg-slate-100" />
              <div className="h-8 w-20 rounded-md bg-slate-200" />
            </div>
          </div>

          {/* Tab navigation skeleton */}
          <div className="flex gap-1 px-4 pt-3 pb-2 border-b border-slate-100 animate-pulse">
            {[80, 56, 64, 80].map((w, i) => (
              <div
                key={i}
                style={{ width: `${w}px` }}
                className="h-7 rounded-lg bg-slate-100"
              />
            ))}
          </div>

          {/* Content area skeleton */}
          <div className="flex-1 p-4 space-y-3 animate-pulse">
            {/* Count badge */}
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 rounded-full bg-slate-200" />
              <div className="h-5 w-16 rounded-full bg-slate-100" />
            </div>

            {/* Output card rows */}
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-2.5"
              >
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-full bg-slate-200" />
                  <div className="h-3.5 w-1/3 rounded-full bg-slate-200" />
                  <div className="h-3 w-10 rounded-md bg-slate-100 ml-auto" />
                </div>
                <div className="space-y-1.5 pl-8">
                  <div className="h-3 w-full rounded-full bg-slate-100" />
                  <div className="h-3 w-4/5 rounded-full bg-slate-100" />
                  <div className="h-3 w-3/5 rounded-full bg-slate-100" />
                </div>
                {/* Image block placeholder */}
                {i === 1 && (
                  <div className="h-32 rounded-lg bg-slate-200 -mx-1 mt-1" />
                )}
                {/* Stats row */}
                <div className="flex items-center gap-4 pt-1 border-t border-slate-100">
                  <div className="h-3 w-10 rounded-full bg-slate-100" />
                  <div className="h-3 w-10 rounded-full bg-slate-100" />
                  <div className="h-3 w-10 rounded-full bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
