import { Skeleton } from "@/components/ui/skeleton";

export default function ManageOverviewLoading() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-8 w-full max-w-xl" />
          <Skeleton className="h-4 w-full max-w-3xl" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`stat-skeleton-${index}`}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="space-y-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={`workspace-skeleton-${index}`}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="space-y-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
