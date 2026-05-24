// ── Tool row skeleton — mirrors the exact card layout of ToolRow ───────────────

export function ToolRowSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-md shadow-xs p-5 flex flex-col justify-between h-[230px] overflow-hidden">
      <div>
        {/* Header - icon on the left, text column on the right */}
        <div className="flex items-start gap-3">
          <div className="size-11 rounded-xl bg-slate-100 border border-slate-200/50 shrink-0" />
          <div className="min-w-0 flex-1 space-y-2 pr-8">
            <div className="h-4.5 w-32 rounded bg-slate-200" />
            <div className="h-3 w-24 rounded bg-slate-100" />
          </div>
        </div>

        {/* Description */}
        <div className="mt-4 space-y-1.5">
          <div className="h-3 w-full rounded bg-slate-200/80" />
          <div className="h-3 w-4/5 rounded bg-slate-200/80" />
        </div>
      </div>

      {/* Footer - mirrors parameters and pipelines placeholder */}
      <div className="pt-4 border-t border-slate-100 space-y-2">
        <div className="space-y-1.5">
          <div className="h-2 w-14 rounded bg-slate-150" />
          <div className="flex gap-1.5">
            <div className="h-5 w-16 rounded-full bg-slate-100/60 border border-slate-200/80" />
            <div className="h-5 w-20 rounded-full bg-slate-100/60 border border-slate-200/80" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ToolListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <ToolRowSkeleton key={`skel-${i}`} />
      ))}
    </div>
  );
}
