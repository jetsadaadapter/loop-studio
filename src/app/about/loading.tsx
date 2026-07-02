export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl animate-in fade-in px-4 pb-24 duration-500 sm:px-6">
      {/* Language toggle placeholder */}
      <div className="flex justify-end pt-6">
        <div className="h-8 w-20 animate-pulse rounded-full bg-slate-200" />
      </div>

      {/* Hero skeleton */}
      <div className="pt-14 pb-16 sm:pt-20 sm:pb-20">
        <div className="mb-3 h-3 w-28 animate-pulse rounded bg-slate-200" />
        <div className="h-10 w-3/4 animate-pulse rounded-lg bg-slate-200 sm:h-12" />
        <div className="mt-5 space-y-2">
          <div className="h-4 w-full max-w-md animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-64 animate-pulse rounded bg-slate-100" />
        </div>
      </div>

      {/* Section skeletons */}
      <div className="space-y-20">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-t border-slate-100 pt-10">
            <div className="mb-3 h-3 w-24 animate-pulse rounded bg-slate-200" />
            <div className="mb-6 h-7 w-2/3 animate-pulse rounded-lg bg-slate-200" />
            <div className="space-y-3">
              <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-11/12 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>

      {/* CTA skeleton */}
      <div className="mt-24 border-t border-slate-100 pt-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="h-11 w-48 animate-pulse rounded-full bg-slate-200" />
          <div className="h-5 w-56 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
