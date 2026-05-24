// ── Tool row skeleton — mirrors the exact layout of ToolRow ───────────────────

export function ToolRowSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="relative flex items-start gap-4 px-5 py-4">
        {/* Left icon placeholder */}
        <div className="mt-0.5 size-9 shrink-0 rounded-xl bg-slate-100" />

        {/* Main content */}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-40 rounded-md bg-slate-100" />
            <div className="h-4 w-16 rounded-full bg-slate-100" />
          </div>
          <div className="h-3 w-3/5 rounded bg-slate-100" />
          <div className="flex gap-2 pt-1">
            <div className="h-5 w-20 rounded-full bg-slate-100" />
            <div className="h-5 w-20 rounded-full bg-slate-100" />
          </div>
        </div>

        {/* Right meta */}
        <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
          <div className="h-3.5 w-20 rounded bg-slate-100" />
          <div className="h-3.5 w-14 rounded bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

export function ToolListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-xs">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`skel-${i}`}
          className={i < count - 1 ? "border-b border-slate-100" : undefined}
        >
          <ToolRowSkeleton />
        </div>
      ))}
    </div>
  );
}
