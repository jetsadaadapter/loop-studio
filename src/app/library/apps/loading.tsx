function PillSkeleton() {
  return <div className="h-8 w-22 animate-pulse rounded-full bg-slate-200" />;
}

function AppTileSkeleton() {
  return (
    <div className="w-36 shrink-0 rounded-2xl border border-slate-200 bg-white p-3">
      <div className="h-16 w-16 animate-pulse rounded-xl bg-slate-200" />
      <div className="mt-3 space-y-2">
        <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
        <div className="h-2.5 w-18 animate-pulse rounded bg-slate-100" />
        <div className="h-5 w-16 animate-pulse rounded-full bg-slate-100" />
      </div>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-linear-to-b from-slate-50 to-white px-4 py-5 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-14 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="-mx-1 flex gap-2 overflow-hidden pb-1">
        {Array.from({ length: 6 }).map((_, index) => (
          <AppTileSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="w-full animate-in fade-in duration-500">
      <section className="border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <PillSkeleton key={`tab-${index}`} />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <PillSkeleton key={`status-${index}`} />
          ))}
        </div>
      </section>

      <div className="mt-6 h-[26rem] animate-pulse rounded-3xl bg-slate-100" />
      <div className="mt-12 h-64 animate-pulse rounded-3xl bg-slate-100" />

      <section className="mt-12 space-y-10">
        <SectionSkeleton />
        <SectionSkeleton />
      </section>
    </div>
  );
}
