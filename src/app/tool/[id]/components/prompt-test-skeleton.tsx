"use client";

export function PromptTestSkeleton() {
  return (
    <div className="w-full px-6 py-4 rounded-2xl bg-linear-to-r from-emerald-50/70 to-teal-50/70 border border-emerald-200/60 animate-pulse">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-emerald-100/80" />
          <div className="space-y-2">
            <div className="h-3.5 w-44 bg-emerald-200/80 rounded-md" />
            <div className="h-3 w-60 max-w-[70vw] bg-emerald-100/80 rounded-md" />
          </div>
        </div>
        <div className="size-5 rounded bg-emerald-100/80 shrink-0" />
      </div>
    </div>
  );
}
