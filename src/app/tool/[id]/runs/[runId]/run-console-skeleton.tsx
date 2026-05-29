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
            className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-2.5"
          >
            {/* Card header row */}
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-full bg-slate-200 shrink-0" />
              <div className="h-3.5 w-1/3 rounded-full bg-slate-200" />
              <div className="h-3 w-10 rounded-md bg-slate-100 ml-auto" />
            </div>

            {/* Text lines */}
            <div className="space-y-1.5 pl-8">
              <div className="h-3 w-full rounded-full bg-slate-100" />
              <div className="h-3 w-5/6 rounded-full bg-slate-100" />
              <div className="h-3 w-3/5 rounded-full bg-slate-100" />
            </div>

            {/* Media block for first card */}
            {i === 1 && (
              <div className="h-28 rounded-lg bg-slate-200 -mx-0.5 mt-1" />
            )}

            {/* Stats row */}
            <div className="flex items-center gap-4 pt-2 border-t border-slate-100/80">
              <div className="h-2.5 w-10 rounded-full bg-slate-100" />
              <div className="h-2.5 w-10 rounded-full bg-slate-100" />
              <div className="h-2.5 w-10 rounded-full bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
