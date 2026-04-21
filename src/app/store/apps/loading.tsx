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
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex h-16 w-full items-center gap-3 px-4 md:px-6">
          <div className="h-7 w-30 animate-pulse rounded bg-slate-200" />
          <div className="ml-auto h-10 w-10 animate-pulse rounded-full bg-slate-200" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-5 md:px-6">
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

        <div className="mt-6 h-72 animate-pulse rounded-2xl bg-slate-100" />
        <div className="mt-8 h-120 animate-pulse rounded-3xl bg-slate-100" />
        <div className="mt-10 h-80 animate-pulse rounded-3xl bg-slate-100" />

        <section className="mt-8 space-y-6">
          <SectionSkeleton />
          <SectionSkeleton />
        </section>
      </main>
    </div>
  );
}
