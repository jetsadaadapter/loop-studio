import Link from "next/link";
import { notFound } from "next/navigation";
import { storeAppsResponse } from "@/app/store/apps/data";

type Props = {
  params: Promise<{ slug: string }>;
};

// Pre-build all known slugs at build time
export function generateStaticParams() {
  return storeAppsResponse.sections
    .flatMap((s) => s.items)
    .map((app) => ({ slug: app.slug }));
}

const statusStyles: Record<string, string> = {
  "production ready": "bg-emerald-100 text-emerald-800",
  "in rollout": "bg-blue-100 text-blue-800",
  beta: "bg-amber-100 text-amber-800",
  planned: "bg-slate-100 text-slate-600",
  new: "bg-violet-100 text-violet-800",
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function AppDetailPage({ params }: Props) {
  const { slug } = await params;

  const allApps = storeAppsResponse.sections.flatMap((s) => s.items);
  const app = allApps.find((a) => a.slug === slug);

  if (!app) notFound();

  const statusKey = app.status.toLowerCase();
  const badgeClass = statusStyles[statusKey] ?? "bg-slate-100 text-slate-600";

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
          <div
            className={`flex size-20 shrink-0 items-center justify-center rounded-2xl text-white shadow-md ring-1 ring-black/5 ${app.iconBg}`}
          >
            <span className="text-2xl font-bold tracking-tight">
              {getInitials(app.name)}
            </span>
          </div>

          {/* App name + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 truncate">
                {app.name}
              </h1>
              {app.badge && (
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-800">
                  {app.badge}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">{app.category}</p>
            <span
              className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${badgeClass}`}
            >
              {app.status}
            </span>
          </div>
        </div>

        {/* CTA row */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            className="inline-flex items-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand/90 transition-colors"
          >
            Install
          </button>
          <button
            type="button"
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            View Docs
          </button>
        </div>
      </div>

      {/* Info grid */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: "App ID", value: app.id },
          { label: "Slug", value: app.slug },
          { label: "Category", value: app.category },
          { label: "Status", value: app.status },
          { label: "Version", value: "1.0.0" },
          { label: "Updated", value: "Apr 2026" },
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
          {app.name} is a {app.category.toLowerCase()} integration available on
          the Adapter App Store. Connect it to your workspace to unlock
          automation, data flows, and team collaboration features.
        </p>
      </div>
    </div>
  );
}
