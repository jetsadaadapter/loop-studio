export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-0 pb-8 sm:px-0 lg:pb-10 animate-in fade-in duration-500">
      <div className="space-y-6">
        {/* Cover Banner Skeleton */}
        <div className="relative w-full overflow-hidden rounded-3xl bg-slate-900 min-h-64 sm:min-h-80 lg:min-h-96 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/40 to-slate-950/20" />
          
          {/* Top Row: Back Button */}
          <div className="relative z-10">
            <div className="h-9 w-36 animate-pulse rounded-full bg-slate-800" />
          </div>

          {/* Bottom Row: App Main Info */}
          <div className="relative z-10 max-w-3xl mt-12 sm:mt-16 lg:mt-24">
            <div className="flex items-end gap-4">
              {/* App Icon */}
              <div className="size-16 shrink-0 animate-pulse rounded-2xl bg-slate-800" />
              
              {/* Title & Badge */}
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="h-5 w-16 animate-pulse rounded-full bg-slate-800" />
                  <div className="h-5 w-24 animate-pulse rounded-full bg-slate-800" />
                </div>
                <div className="h-8 w-48 sm:w-64 animate-pulse rounded-lg bg-slate-800" />
              </div>
            </div>

            {/* Tags under title */}
            <div className="mt-4 flex flex-wrap gap-2">
              <div className="h-6 w-16 animate-pulse rounded-full bg-slate-800" />
              <div className="h-6 w-20 animate-pulse rounded-full bg-slate-800" />
              <div className="h-6 w-14 animate-pulse rounded-full bg-slate-800" />
            </div>

            {/* Primary CTA */}
            <div className="mt-7">
              <div className="h-10 w-32 animate-pulse rounded-full bg-slate-800" />
            </div>
          </div>
        </div>

        {/* Column Grid Layout */}
        <div className="grid gap-x-10 gap-y-0 pt-2 sm:pt-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
          {/* ── Main Content Column ─────────────────────────── */}
          <div className="min-w-0 space-y-7">
            {/* Screenshots */}
            <div className="overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex gap-3">
                <div className="w-64 sm:w-72 shrink-0 aspect-video animate-pulse rounded-2xl bg-slate-200" />
                <div className="w-64 sm:w-72 shrink-0 aspect-video animate-pulse rounded-2xl bg-slate-200" />
                <div className="w-64 sm:w-72 shrink-0 aspect-video animate-pulse rounded-2xl bg-slate-200" />
              </div>
            </div>

            {/* About Section */}
            <section className="border-t border-slate-200 py-7 space-y-4">
              <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />
              
              <div className="space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-[95%] animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-[88%] animate-pulse rounded bg-slate-200" />
              </div>

              {/* Tags */}
              <div className="mt-5 flex flex-wrap gap-2 pt-2">
                <div className="h-7 w-16 animate-pulse rounded-full bg-slate-200" />
                <div className="h-7 w-24 animate-pulse rounded-full bg-slate-200" />
                <div className="h-7 w-20 animate-pulse rounded-full bg-slate-200" />
              </div>
            </section>

            {/* Instructions Section */}
            <section className="border-t border-slate-200 py-7 space-y-4">
              <div className="h-6 w-36 animate-pulse rounded bg-slate-200" />
              
              <div className="space-y-3">
                <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-[92%] animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-[96%] animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-[75%] animate-pulse rounded bg-slate-200" />
              </div>
            </section>
          </div>

          {/* ── Sidebar Column ──────────────────────────────── */}
          <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start space-y-7">
            {/* Metadata items */}
            <div className="py-7 lg:pt-0 border-b border-slate-200 lg:border-none space-y-4">
              <div className="flex justify-between text-sm py-2">
                <div className="h-4 w-16 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
              </div>
              <div className="flex justify-between text-sm py-2">
                <div className="h-4 w-16 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
              </div>
            </div>

            {/* Related Apps */}
            <section className="border-t border-slate-200 py-7 space-y-3">
              <div className="h-5 w-28 animate-pulse rounded bg-slate-200" />
              
              <div className="space-y-3">
                {/* Related Item 1 */}
                <div className="flex items-center gap-3 py-2">
                  <div className="size-12 shrink-0 animate-pulse rounded-xl bg-slate-200" />
                  <div className="min-w-0 space-y-1.5 flex-1">
                    <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
                    <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
                {/* Related Item 2 */}
                <div className="flex items-center gap-3 py-2">
                  <div className="size-12 shrink-0 animate-pulse rounded-xl bg-slate-200" />
                  <div className="min-w-0 space-y-1.5 flex-1">
                    <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                    <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
