import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getApps } from "@/core/services/store.service";
import type { StoreAppApiItem } from "@/core/interfaces/store.interface";
import { slugifyAppName } from "@/app/store/apps/data";
import { AppIcon } from "@/components/app-icon";

type Props = {
  params: Promise<{ slug: string }>;
};

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(parsed);
}

async function fetchAppsForDetail(): Promise<StoreAppApiItem[]> {
  const cookieStore = await cookies();
  const ztToken = cookieStore.get("zt_token")?.value;
  const response = await getApps(
    { page: 1, limit: 100 },
    {
      next: { revalidate: 60 },
      headers: ztToken ? { Authorization: `Bearer ${ztToken}` } : undefined,
    },
  );

  return response.data.flatMap((groupBlock) => groupBlock.items);
}

export default async function AppDetailPage({ params }: Props) {
  const { slug } = await params;

  let allApps: StoreAppApiItem[] = [];
  try {
    allApps = await fetchAppsForDetail();
  } catch (error) {
    console.error("Failed to fetch app detail from /store/apps", error);
  }

  const app = allApps.find((item) => slugifyAppName(item.name) === slug);

  if (!app) notFound();

  const primaryCtaLabel = app.ctaLabel ?? "View Guide";
  const hasExternalCta = app.linkType === "external" && !!app.ctaLink;
  const hasInternalCta = app.linkType === "internal" && !!app.ctaLink;
  const relatedApps = allApps
    .filter(
      (item) => item.appId !== app.appId && item.category === app.category,
    )
    .slice(0, 3);
  const screenshotUrls = [app.imageUrl].filter((value): value is string =>
    Boolean(value),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 sm:px-6 lg:pb-10">
      <div className="-mt-5 space-y-6">
        <section className="motion-hero-enter relative left-1/2 right-1/2 w-screen -translate-x-1/2 overflow-hidden bg-[#1d2028] text-white shadow-[0_30px_72px_-44px_rgba(2,6,23,0.92)]">
          <div className="absolute inset-0">
            {app.imageUrl ? (
              <div className="absolute right-[-22%] top-1/2 w-[168%] -translate-y-1/2 sm:right-[-14%] sm:w-[132%] lg:right-[-6%] lg:w-[94%]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={app.imageUrl}
                  alt={`${app.name} preview`}
                  className="aspect-video w-full object-cover object-center"
                />
              </div>
            ) : null}
            <div className="absolute inset-0 bg-linear-to-b from-[#0a0d14]/82 via-[#111827]/62 to-[#111827]/24" />
            <div className="absolute inset-0 bg-linear-to-r from-[#090d16]/98 via-[#111a2a]/80 via-45% to-[#0f172a]/30" />
            <div className="absolute inset-0 bg-radial-[at_10%_50%] from-black/62 via-black/28 to-transparent" />
            <div className="absolute inset-0 bg-radial-[at_75%_30%] from-black/28 via-transparent to-transparent" />
            <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.03)_0px,rgba(255,255,255,0.03)_1px,transparent_1px,transparent_3px)]" />
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-size-[4px_4px]" />
          </div>

          {/* Back button overlay */}
          <div className="absolute left-5 top-5 z-20 sm:left-8 sm:top-8">
            <Link
              href="/store/apps"
              className="inline-flex items-center gap-1.5 rounded-full bg-black/50 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-black/70"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-4"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
                  clipRule="evenodd"
                />
              </svg>
              Back to Store
            </Link>
          </div>

          <div className="relative z-10 flex min-h-80 flex-col justify-end p-5 pt-20 sm:min-h-104 sm:p-8 sm:pt-24 lg:min-h-124 lg:p-10 lg:pt-28">
            <div className="max-w-3xl">
              <div className="flex items-end gap-4">
                <AppIcon
                  name={app.name}
                  iconUrl={app.iconUrl}
                  containerClassName="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-slate-700 shadow-lg ring-1 ring-white/10"
                  fallbackClassName="flex h-full w-full items-center justify-center bg-slate-700 text-white"
                  initialsClassName="text-lg font-bold tracking-tight"
                  imageSizes="64px"
                  imageOuterClassName="absolute inset-0 p-1"
                  imageInnerClassName="relative size-full overflow-hidden rounded-xl"
                  imageClassName="object-cover"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {app.badgeLabel ? (
                      <span className="rounded-full bg-[#75e68f]/20 px-2.5 py-0.5 text-xs font-semibold text-[#84e6a0] ring-1 ring-[#75e68f]/30">
                        {app.badgeLabel}
                      </span>
                    ) : null}
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-slate-300 ring-1 ring-white/10">
                      {app.category}
                    </span>
                  </div>
                  <h1 className="page-hero-title mt-1 text-white">
                    {app.name}
                  </h1>
                </div>
              </div>

              {app.tags.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {app.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag.tagId}
                      className="rounded-full bg-white/8 px-3 py-1 text-xs font-medium text-slate-300 ring-1 ring-white/10"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
                {hasExternalCta ? (
                  <a
                    href={app.ctaLink ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-w-44 items-center justify-center rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand/90 sm:text-base"
                  >
                    {primaryCtaLabel}
                  </a>
                ) : hasInternalCta ? (
                  <Link
                    href={app.ctaLink ?? "/store/apps"}
                    className="inline-flex min-w-44 items-center justify-center rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand/90 sm:text-base"
                  >
                    {primaryCtaLabel}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="inline-flex min-w-44 items-center justify-center rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand/90 sm:text-base"
                  >
                    {primaryCtaLabel}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-x-10 gap-y-0 pt-2 sm:pt-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
          {/* ── Main content ─────────────────────────────────────── */}
          <div className="min-w-0">
            {/* Screenshots */}
            <div className="motion-enter-1 -mx-4 sm:-mx-6 lg:mx-0">
              <div className="flex gap-3 overflow-x-auto px-4 pb-4 sm:px-6 lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {(screenshotUrls.length > 0 ? screenshotUrls : [""]).map(
                  (src, index) => (
                    <div
                      key={`${src}-${index}`}
                      className="w-64 shrink-0 overflow-hidden rounded-2xl bg-slate-100 sm:w-72"
                    >
                      {src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={src}
                          alt={`${app.name} screenshot ${index + 1}`}
                          className="aspect-video w-full object-cover"
                        />
                      ) : (
                        <div className="flex aspect-video items-center justify-center text-sm text-slate-400">
                          No screenshot
                        </div>
                      )}
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* About */}
            <section className="motion-enter-2 border-t border-slate-200 py-7">
              <h2 className="page-section-title flex items-center gap-2 text-slate-900">
                About this app
              </h2>

              <p className="page-body-copy mt-4 text-slate-700">
                {app.description ||
                  `${app.name} is a ${app.category.toLowerCase()} integration available on the Adapter App Store.`}
              </p>

              <div className="mt-6">
                <p className="text-sm font-semibold text-slate-900">
                  Updated on
                </p>
                <p className="mt-0.5 text-sm text-slate-600">
                  {formatDate(app.updatedAt)}
                </p>
              </div>

              {app.tags.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {app.tags.map((tag) => (
                    <span
                      key={tag.tagId}
                      className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-400"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              ) : null}
            </section>

            {/* Instructions */}
            {app.instructions ? (
              <section className="motion-enter-3 border-t border-slate-200 py-7">
                <h2 className="page-section-title text-slate-900">
                  Instructions
                </h2>
                <p className="page-body-copy mt-4 text-slate-700">
                  {app.instructions}
                </p>
              </section>
            ) : null}
          </div>

          {/* ── Sidebar ──────────────────────────────────────────── */}
          <aside className="motion-enter-3 min-w-0 lg:sticky lg:top-24 lg:self-start">
            {/* Metadata */}
            <div className="py-7 lg:pt-0">
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="font-semibold text-slate-900">Category</dt>
                  <dd className="mt-0.5 text-slate-600">{app.category}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-900">Updated</dt>
                  <dd className="mt-0.5 text-slate-600">
                    {formatDate(app.updatedAt)}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-900">App ID</dt>
                  <dd className="mt-0.5 truncate text-xs text-slate-500">
                    {app.appId}
                  </dd>
                </div>
              </dl>
            </div>

            {relatedApps.length > 0 ? (
              <section className="border-t border-slate-200 py-7">
                <h3 className="text-base font-semibold text-slate-900">
                  Related apps
                </h3>
                <div className="mt-3 space-y-3">
                  {relatedApps.map((relatedApp) => (
                    <Link
                      key={relatedApp.appId}
                      href={`/store/apps/${slugifyAppName(relatedApp.name)}`}
                      className="flex items-start gap-3 rounded-2xl p-1.5 transition hover:bg-slate-100/80"
                    >
                      <AppIcon
                        name={relatedApp.name}
                        iconUrl={relatedApp.iconUrl}
                        containerClassName="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/10 shadow-md ring-1 ring-white/25"
                        fallbackClassName="flex h-full w-full items-center justify-center bg-white/25 text-sm font-semibold tracking-wide text-white"
                        initialsClassName="text-sm font-semibold tracking-wide"
                        imageSizes="56px"
                        imageOuterClassName="absolute inset-0 p-1.5"
                        imageInnerClassName="relative size-full overflow-hidden rounded-lg"
                        imageClassName="object-cover"
                      />
                      <div className="min-w-0 pt-1">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {relatedApp.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {relatedApp.category}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
