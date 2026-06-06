export function RunConsoleSkeleton() {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden animate-pulse">
      {/* Workspace Header */}
      <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-40 rounded-full bg-slate-200" />
            <div className="h-3 w-20 rounded-full bg-slate-100" />
          </div>
          <div className="h-2.5 w-56 rounded-full bg-slate-100" />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-8 w-24 rounded-md bg-slate-100" />
          <div className="h-8 w-20 rounded-md bg-slate-200" />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 px-4 pt-3 pb-2 border-b border-slate-100 shrink-0">
        {[80, 56, 68, 84].map((w, i) => (
          <div
            key={i}
            style={{ width: `${w}px` }}
            className={`h-7 rounded-lg ${i === 0 ? "bg-slate-200" : "bg-slate-100"}`}
          />
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4 space-y-3 overflow-hidden">
        {/* Toolbar row */}
        <div className="flex items-center justify-between">
          <div className="h-3 w-28 rounded-full bg-slate-200" />
          <div className="h-5 w-14 rounded-full bg-slate-100" />
        </div>

        {/* Output item cards */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-full border-b border-slate-100 last:border-b-0 pb-2 space-y-1"
          >
            {/* Primary Comment Skeleton */}
            <div className="flex gap-2.5 py-2">
              <div className="size-8 rounded-full bg-slate-200 shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-28 rounded bg-slate-200" />
                  <div className="h-2.5 w-16 rounded bg-slate-100" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-3 w-full rounded bg-slate-100" />
                  <div className="h-3 w-4/5 rounded bg-slate-100" />
                </div>
                <div className="flex items-center gap-3.5 pt-1">
                  <div className="h-3.5 w-8 rounded bg-slate-100" />
                  <div className="h-3.5 w-8 rounded bg-slate-100" />
                  <div className="h-3.5 w-10 rounded bg-slate-100" />
                </div>
              </div>
            </div>

            {/* Nested Reply Skeleton */}
            {i === 1 && (
              <div className="relative pl-[42px] mt-1 space-y-1 pb-1">
                <div className="absolute left-[16px] top-0 bottom-6 w-0.5 bg-slate-150 rounded-full" />
                <div className="absolute -left-[26px] top-5 w-[26px] h-0.5 bg-slate-150" />
                
                <div className="flex gap-2.5 py-1.5">
                  <div className="size-7 rounded-full bg-slate-200 shrink-0" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-20 rounded bg-slate-200" />
                      <div className="h-2.5 w-12 rounded bg-slate-100" />
                    </div>
                    <div className="h-3 w-3/4 rounded bg-slate-100" />
                    <div className="flex items-center gap-3.5 pt-1">
                      <div className="h-3.5 w-8 rounded bg-slate-100" />
                      <div className="h-3.5 w-8 rounded bg-slate-100" />
                      <div className="h-3.5 w-10 rounded bg-slate-100" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
