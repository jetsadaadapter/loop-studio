"use client";

export function JobDetailSkeleton() {
  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Header Skeleton */}
      <div className="p-4 md:p-5 bg-gradient-to-r from-slate-50/50 via-white to-slate-50/30 border-b border-slate-200 shrink-0 relative pr-16">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-slate-200/50 border border-slate-200/20 rounded-xl shrink-0 shadow-xs w-8 h-8 animate-pulse" />
          <div className="space-y-2 flex-1 min-w-0 animate-pulse">
            <div className="flex items-center gap-2">
              <div className="h-3.5 bg-slate-200 rounded-full w-24" />
              <div className="h-4.5 bg-slate-200/80 rounded-full w-16" />
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full w-40" />
          </div>
        </div>
      </div>

      {/* Scrollable Content Skeleton */}
      <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
        {/* Tab switcher skeleton */}
        <div className="flex bg-slate-200/50 p-1 rounded-xl w-48 h-9 animate-pulse" />

        {/* Social Card Skeleton Container */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-4 md:p-6 space-y-4 overflow-hidden relative">
          {/* Card Header */}
          <div className="flex items-center gap-3 animate-pulse">
            <div className="size-10 bg-slate-200 rounded-full shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="h-4 bg-slate-200 rounded-full w-1/3" />
              <div className="h-3 bg-slate-100 rounded-full w-1/4" />
            </div>
          </div>

          {/* Caption skeleton */}
          <div className="space-y-2 animate-pulse py-1">
            <div className="h-3.5 bg-slate-200 rounded-full w-11/12" />
            <div className="h-3.5 bg-slate-200 rounded-full w-10/12" />
            <div className="h-3 bg-slate-100 rounded-full w-2/3" />
          </div>

          {/* Edge-to-Edge Media Block */}
          <div className="-mx-6 bg-slate-200 h-[220px] animate-pulse relative" />

          {/* Flat social stats */}
          <div className="flex items-center gap-4 py-2 border-b border-slate-100 animate-pulse">
            <div className="h-5 bg-slate-100 rounded-full w-12" />
            <div className="h-5 bg-slate-100 rounded-full w-12" />
            <div className="h-5 bg-slate-100 rounded-full w-12" />
            <div className="h-5 bg-slate-100 rounded-full w-12" />
          </div>

          {/* Unified Premium AI Digest Card Skeleton */}
          <div className="bg-gradient-to-br from-slate-50/50 via-white to-slate-50/20 border border-slate-150 rounded-xl p-3.5 space-y-3.5 shadow-xs animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-slate-200 rounded-lg size-7" />
                <div className="h-4 bg-slate-200 rounded-full w-28" />
              </div>
              <div className="h-5 bg-slate-100 rounded-full w-16" />
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-slate-150 rounded-full w-full" />
              <div className="h-3 bg-slate-150 rounded-full w-5/6" />
              <div className="h-3 bg-slate-100 rounded-full w-4/5" />
            </div>

            {/* Progress Ratio Bars Skeleton */}
            <div className="space-y-2.5 pt-3 border-t border-slate-100/60">
              <div className="flex justify-between items-center">
                <div className="h-3 bg-slate-150 rounded-full w-20" />
                <div className="h-3 bg-slate-100 rounded-full w-12" />
              </div>
              <div className="h-3.5 bg-slate-200 rounded-full w-full" />
            </div>
          </div>
        </div>

        {/* Double Accordion Inspection Panels Skeletons */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden animate-pulse">
          <div className="h-11 bg-slate-50/50 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-3.5 bg-slate-200 rounded-md" />
              <div className="h-3 bg-slate-200 rounded-full w-32" />
            </div>
            <div className="size-3.5 bg-slate-200 rounded-full" />
          </div>
          <div className="h-11 bg-slate-50/50 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-3.5 bg-slate-200 rounded-md" />
              <div className="h-3 bg-slate-200 rounded-full w-32" />
            </div>
            <div className="size-3.5 bg-slate-200 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
