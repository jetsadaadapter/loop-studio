function TabPillSkeleton({ width }: { width: string }) {
  return (
    <div className={`h-8 ${width} animate-pulse rounded-full bg-slate-200`} />
  );
}

function StatusPillSkeleton({ width }: { width: string }) {
  return (
    <div className={`h-6 ${width} animate-pulse rounded-full bg-slate-100`} />
  );
}

function AppTileSkeleton() {
  return (
    <div className="w-64 shrink-0 overflow-hidden rounded-3xl border border-slate-200 bg-white sm:w-68">
      <div className="relative aspect-4/3 animate-pulse bg-slate-100">
        <div className="absolute inset-x-0 bottom-0 h-14 bg-linear-to-t from-white via-white/85 to-transparent" />
      </div>
      <div className="px-3.5 pb-3.5 pt-0">
        <div className="-mt-10 h-14 w-14 animate-pulse rounded-2xl bg-slate-200 shadow-[0_10px_20px_-14px_rgba(15,23,42,0.45)]" />
        <div className="mt-3 space-y-1.5">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
          <div className="h-5 w-16 animate-pulse rounded-full bg-slate-100" />
        </div>
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
      <div className="-mx-1 flex gap-3 overflow-hidden pb-1 sm:gap-4">
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
      <section>
        <div className="flex h-8 items-center gap-2.5">
          <TabPillSkeleton width="w-24" />
          <TabPillSkeleton width="w-28" />
          <TabPillSkeleton width="w-20" />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusPillSkeleton width="w-32" />
          <StatusPillSkeleton width="w-24" />
          <StatusPillSkeleton width="w-16" />
          <StatusPillSkeleton width="w-20" />
        </div>
      </section>

      <div className="mt-6 h-104 animate-pulse rounded-3xl bg-slate-100" />
      <div className="mt-12 h-64 animate-pulse rounded-3xl bg-slate-100" />

      <section className="mt-12 space-y-10">
        <SectionSkeleton />
        <SectionSkeleton />
      </section>
    </div>
  );
}
