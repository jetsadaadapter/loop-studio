import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getApps } from "@/core/services/store.service";
import type { StoreAppApiItem } from "@/core/interfaces/store.interface";
import { getAppStatus, slugifyAppName } from "@/app/store/apps/data";
import { AppIcon } from "@/components/app-icon";

type Props = {
  params: Promise<{ slug: string }>;
};

const statusStyles: Record<string, string> = {
  "production ready": "bg-emerald-100 text-emerald-800",
  "in rollout": "bg-blue-100 text-blue-800",
  beta: "bg-amber-100 text-amber-800",
  planned: "bg-slate-100 text-slate-600",
  new: "bg-violet-100 text-violet-800",
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

  const appStatus = getAppStatus(app);
  const statusKey = appStatus.toLowerCase();
  const badgeClass = statusStyles[statusKey] ?? "bg-slate-100 text-slate-600";
  const detailSlug = slugifyAppName(app.name);
  const primaryCtaLabel = app.ctaLabel ?? "View Guide";
  const hasExternalCta = app.linkType === "external" && !!app.ctaLink;
  const hasInternalCta = app.linkType === "internal" && !!app.ctaLink;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Back button */}
      <Link
        href="/store/apps"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
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

      {/* App hero card */}
      <div className="mt-6 rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-sm">
        <div className="flex items-start gap-5">
          {/* App icon */}
          <AppIcon
            name={app.name}
            iconUrl={app.iconUrl}
            containerClassName="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-white/10 text-white shadow-md ring-1 ring-black/5"
            fallbackClassName="flex h-full w-full items-center justify-center bg-slate-700 text-white"
            initialsClassName="text-2xl font-bold tracking-tight"
            imageSizes="80px"
            imageOuterClassName="absolute inset-0 p-1.5"
            imageInnerClassName="relative size-full overflow-hidden rounded-lg"
            imageClassName="object-cover"
          />

          {/* App name + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 truncate">
                {app.name}
              </h1>
              {app.badgeLabel && (
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-800">
                  {app.badgeLabel}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">{app.category}</p>
            <span
              className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${badgeClass}`}
            >
              {appStatus}
            </span>
          </div>
        </div>

        {/* CTA row */}
        <div className="mt-6 flex flex-wrap gap-3">
          {hasExternalCta ? (
            <a
              href={app.ctaLink ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand/90 transition-colors"
            >
              {primaryCtaLabel}
            </a>
          ) : hasInternalCta ? (
            <Link
              href={app.ctaLink ?? "/store/apps"}
              className="inline-flex items-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand/90 transition-colors"
            >
              {primaryCtaLabel}
            </Link>
          ) : (
            <button
              type="button"
              className="inline-flex items-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand/90 transition-colors"
            >
              {primaryCtaLabel}
            </button>
          )}

          {app.instructions ? (
            <details className="group w-full rounded-2xl border border-slate-200 bg-white p-0">
              <summary className="flex cursor-pointer list-none items-center rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                View Instructions
              </summary>
              <div className="border-t border-slate-200 px-5 py-4">
                <p className="text-sm text-slate-700">{app.instructions}</p>
              </div>
            </details>
          ) : null}
        </div>
      </div>

      {/* Info grid */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: "App ID", value: app.appId },
          { label: "Slug", value: detailSlug },
          { label: "Category", value: app.category },
          { label: "Status", value: appStatus },
          { label: "Link Type", value: app.linkType },
          { label: "Updated", value: formatDate(app.updatedAt) },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
          >
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              {label}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-800 truncate">
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Description placeholder */}
      <div className="mt-6 rounded-3xl border border-slate-200 bg-white px-6 py-6">
        <h2 className="text-sm font-semibold text-slate-900">About</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {app.description ||
            `${app.name} is a ${app.category.toLowerCase()} integration available on the Adapter App Store.`}
        </p>

        {app.instructions ? (
          <p className="mt-4 text-xs text-slate-500">
            Use the View Instructions control above to expand setup steps.
          </p>
        ) : null}
      </div>
    </div>
  );
}
