// ── Tool row skeleton — mirrors the exact card layout of ToolRow ───────────────

export function ToolRowSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-5.5 flex flex-col justify-between h-[230px] overflow-hidden">
      <div>
        {/* Header - icon on the left, text column on the right */}
        <div className="flex items-start gap-3">
          <div className="size-12 rounded-xl bg-slate-100 border border-slate-200/30 shrink-0" />
          <div className="min-w-0 flex-1 space-y-1.5 pr-8">
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="h-4.5 w-12 rounded-full bg-slate-100" />
            </div>
            <div className="h-2.5 w-24 rounded bg-slate-100" />
          </div>
        </div>

        {/* Description */}
        <div className="mt-3.5 space-y-1.5">
          <div className="h-3.5 w-full rounded bg-slate-150/70" />
          <div className="h-3.5 w-4/5 rounded bg-slate-150/70" />
        </div>
      </div>

      {/* Footer - mirrors parameters and pipelines placeholders */}
      <div className="mt-5 pt-4 border-t border-slate-100/85 space-y-3">
        {/* Parameters Section */}
        <div className="space-y-1.5">
          <div className="h-2 w-14 rounded bg-slate-100/80" />
          <div className="flex gap-1.5">
            <div className="h-5 w-16 rounded-full bg-slate-100 border border-slate-200/30" />
            <div className="h-5 w-20 rounded-full bg-slate-100 border border-slate-200/30" />
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
