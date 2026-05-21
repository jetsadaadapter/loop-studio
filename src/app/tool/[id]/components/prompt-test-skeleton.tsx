"use client";

export function PromptTestSkeleton() {
  return (
    <div className="mt-6 p-6 rounded-2xl bg-white border border-slate-200/60 shadow-xs space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
        <div className="size-4.5 rounded-lg bg-slate-200" />
        <div className="h-4 w-36 bg-slate-200 rounded-md" />
      </div>

      <div className="space-y-5">
        {/* URLs Section Skeleton */}
        <div className="space-y-2">
          <div className="h-3 w-20 bg-slate-200 rounded-md" />
          <div className="space-y-1.5 pl-4 border-l-2 border-slate-100">
            <div className="h-3 w-3/4 bg-slate-100 rounded-md" />
            <div className="h-3 w-1/2 bg-slate-100 rounded-md" />
          </div>
        </div>

        {/* Goal Section Skeleton */}
        <div className="space-y-2">
          <div className="h-3 w-14 bg-slate-200 rounded-md" />
          <div className="h-3.5 w-full bg-slate-100 rounded-md" />
          <div className="h-3.5 w-5/6 bg-slate-100 rounded-md" />
        </div>

        {/* System Prompt Section Skeleton */}
        <div className="space-y-2">
          <div className="h-3 w-28 bg-slate-200 rounded-md" />
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="h-3 w-full bg-slate-200/60 rounded-md" />
            <div className="h-3 w-11/12 bg-slate-200/60 rounded-md" />
            <div className="h-3 w-4/5 bg-slate-200/60 rounded-md" />
          </div>
        </div>

        {/* Expected Output Schema Section Skeleton */}
        <div className="space-y-2">
          <div className="h-3 w-36 bg-slate-200 rounded-md" />
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="h-3 w-1/3 bg-slate-200/60 rounded-md" />
            <div className="h-3 w-1/2 bg-slate-200/60 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
