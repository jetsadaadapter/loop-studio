"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { HeroBannerSlider } from "@/components/hero-banner-slider";
import { AppCategoryRanking } from "@/components/app-category-ranking";
import { TopbarSearch } from "@/components/topbar-search";
import { ProfileAvatarMenu } from "@/components/profile-avatar-menu";

type StoreApp = {
  id: string;
  name: string;
  category: string;
  rating: string;
  badge?: string;
  iconBg: string;
};

type AppSection = {
  id: string;
  title: string;
  apps: StoreApp[];
};

type MainTabKey = "mcp" | "platform" | "tool" | "marketplace-updates" | "admin";
type StatusFilterKey =
  | "all"
  | "production ready"
  | "in rollout"
  | "beta"
  | "planned"
  | "new";

const mainTabs: Array<{ key: MainTabKey; label: string }> = [
  { key: "mcp", label: "MCP" },
  { key: "platform", label: "Platform" },
  { key: "tool", label: "Tool" },
  { key: "marketplace-updates", label: "Marketplace Updates" },
  { key: "admin", label: "Admin" },
];

const statusFilters: Array<{ key: StatusFilterKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "production ready", label: "Production ready" },
  { key: "in rollout", label: "In rollout" },
  { key: "beta", label: "Beta" },
  { key: "planned", label: "Planned" },
  { key: "new", label: "New" },
];

const appSections: AppSection[] = [
  {
    id: "mcp",
    title: "MCP",
    apps: [
      {
        id: "apify-mcp",
        name: "APIFY MCP",
        category: "Data Connector",
        rating: "Production ready",
        iconBg: "bg-emerald-600",
      },
      {
        id: "adapter-media-mcp",
        name: "Adapter Media MCP",
        category: "Media Integration",
        rating: "Production ready",
        iconBg: "bg-blue-600",
      },
      {
        id: "hype-mcp",
        name: "HYPE MCP",
        category: "Campaign Automation",
        rating: "Planned",
        iconBg: "bg-slate-700",
      },
      {
        id: "audit-mcp",
        name: "Audit Stream MCP",
        category: "Observability",
        rating: "Beta",
        iconBg: "bg-orange-600",
      },
      {
        id: "policy-mcp",
        name: "Policy Guard MCP",
        category: "Governance",
        rating: "In rollout",
        iconBg: "bg-purple-700",
      },
      {
        id: "workflow-mcp",
        name: "Workflow Bridge MCP",
        category: "Automation",
        rating: "In rollout",
        iconBg: "bg-pink-600",
      },
    ],
  },
  {
    id: "platform",
    title: "Platform",
    apps: [
      {
        id: "adapter-campaign",
        name: "Adapter Campaign",
        category: "Campaign Platform",
        rating: "Production ready",
        iconBg: "bg-emerald-700",
      },
      {
        id: "adapter-workflow-hub",
        name: "Workflow Hub",
        category: "Orchestration",
        rating: "Beta",
        iconBg: "bg-indigo-700",
      },
      {
        id: "adapter-insight-center",
        name: "Insight Center",
        category: "Analytics",
        rating: "Beta",
        iconBg: "bg-cyan-700",
      },
      {
        id: "adapter-identity",
        name: "Identity Access",
        category: "Security",
        rating: "In rollout",
        iconBg: "bg-red-700",
      },
      {
        id: "adapter-admin-console",
        name: "Admin Console",
        category: "Operations",
        rating: "In rollout",
        iconBg: "bg-teal-700",
      },
      {
        id: "adapter-billing",
        name: "Billing Core",
        category: "Finance",
        rating: "Planned",
        iconBg: "bg-lime-700",
      },
    ],
  },
  {
    id: "tool",
    title: "Tool",
    apps: [
      {
        id: "comment-loader",
        name: "Comment Loader",
        category: "Data Tool",
        rating: "NEW",
        badge: "NEW",
        iconBg: "bg-emerald-700",
      },
      {
        id: "post-comment-analyzer",
        name: "Post Comment Analyzer",
        category: "Insight Tool",
        rating: "NEW",
        badge: "NEW",
        iconBg: "bg-red-700",
      },
      {
        id: "keyword-clustering",
        name: "Keyword Clustering",
        category: "Analysis Tool",
        rating: "Beta",
        iconBg: "bg-violet-700",
      },
      {
        id: "reply-assistant",
        name: "Reply Assistant",
        category: "Engagement Tool",
        rating: "Beta",
        iconBg: "bg-amber-700",
      },
      {
        id: "sentiment-monitor",
        name: "Sentiment Monitor",
        category: "Monitoring Tool",
        rating: "In rollout",
        iconBg: "bg-zinc-700",
      },
      {
        id: "campaign-qa",
        name: "Campaign QA",
        category: "Quality Tool",
        rating: "Planned",
        iconBg: "bg-indigo-700",
      },
    ],
  },
];

function statusBadgeClass(status: string) {
  const s = status.toLowerCase();
  if (s === "new") return "bg-red-100 text-red-700";
  if (s === "production ready") return "bg-emerald-100 text-emerald-700";
  if (s === "in rollout") return "bg-amber-100 text-amber-800";
  if (s === "beta") return "bg-sky-100 text-sky-800";
  return "bg-slate-100 text-slate-700";
}

function AppTile({ app }: { app: StoreApp }) {
  const initials = app.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  return (
    <article className="group w-36 shrink-0 rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-[#c20019]/40 hover:shadow-sm">
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-xl text-base font-bold text-white shadow-sm ${app.iconBg}`}
      >
        {initials}
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="line-clamp-1 text-sm font-medium text-slate-900">
          {app.name}
        </h3>
        <p className="line-clamp-1 text-xs text-slate-500">{app.category}</p>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass(app.rating)}`}
        >
          {app.rating}
        </span>
      </div>
    </article>
  );
}

export default function StoreAppsPage() {
  const [selectedMainTab, setSelectedMainTab] = useState<MainTabKey>("tool");
  const [selectedStatus, setSelectedStatus] =
    useState<StatusFilterKey>("production ready");

  const baseSections = useMemo(() => {
    if (selectedMainTab === "marketplace-updates") {
      return appSections;
    }

    if (selectedMainTab === "admin") {
      return appSections.filter((section) => section.id === "platform");
    }

    return appSections.filter((section) => section.id === selectedMainTab);
  }, [selectedMainTab]);

  const statusCounts = useMemo(() => {
    const allApps = baseSections.flatMap((section) => section.apps);

    return statusFilters.reduce<Record<StatusFilterKey, number>>(
      (accumulator, filter) => {
        if (filter.key === "all") {
          accumulator[filter.key] = allApps.length;
          return accumulator;
        }

        accumulator[filter.key] = allApps.filter(
          (app) => app.rating.toLowerCase() === filter.key,
        ).length;
        return accumulator;
      },
      {
        all: 0,
        "production ready": 0,
        "in rollout": 0,
        beta: 0,
        planned: 0,
        new: 0,
      },
    );
  }, [baseSections]);

  const visibleStatusFilters = useMemo(
    () =>
      statusFilters.filter(
        (filter) => filter.key === "all" || statusCounts[filter.key] > 0,
      ),
    [statusCounts],
  );

  const effectiveStatus: StatusFilterKey = visibleStatusFilters.some(
    (filter) => filter.key === selectedStatus,
  )
    ? selectedStatus
    : "all";

  const filteredSections = useMemo(() => {
    if (effectiveStatus === "all") {
      return baseSections;
    }

    return baseSections
      .map((section) => ({
        ...section,
        apps: section.apps.filter(
          (app) => app.rating.toLowerCase() === effectiveStatus,
        ),
      }))
      .filter((section) => section.apps.length > 0);
  }, [baseSections, effectiveStatus]);

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex h-16 w-full items-center gap-3 px-4 md:px-6">
          <Image
            src="/images/logo/logo-black-110x30.png"
            alt="Adapter Digital Group"
            width={120}
            height={36}
            className="h-7 w-auto"
            unoptimized
            priority
          />
          <div className="ml-auto flex items-center gap-2">
            <TopbarSearch />
            <ProfileAvatarMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-5 md:px-6">
        <section className="border-b border-slate-200 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            {mainTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setSelectedMainTab(tab.key);
                  setSelectedStatus("all");
                }}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  selectedMainTab === tab.key
                    ? "bg-[#c20019]/10 text-[#c20019]"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {visibleStatusFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setSelectedStatus(filter.key)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  effectiveStatus === filter.key
                    ? "border-[#c20019]/30 bg-[#c20019]/10 text-[#c20019]"
                    : "border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {filter.label} ({statusCounts[filter.key]})
              </button>
            ))}
          </div>
        </section>

        <HeroBannerSlider />
        <AppCategoryRanking />

        <section className="mt-8 space-y-6">
          {filteredSections.map((section) => (
            <div
              key={section.id}
              className="rounded-3xl border border-slate-200 bg-linear-to-b from-slate-50 to-white px-4 py-5 sm:px-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">
                  {section.title}
                </h2>
                <button
                  type="button"
                  className="text-xs font-medium text-[#c20019] hover:text-[#c20019]"
                >
                  See more
                </button>
              </div>

              <div className="-mx-1 flex snap-x gap-2 overflow-x-auto pb-1">
                {section.apps.map((app) => (
                  <div key={app.id} className="snap-start">
                    <AppTile app={app} />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filteredSections.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center sm:px-6">
              <p className="text-sm font-medium text-slate-700">
                No apps match this filter.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Try switching status or category.
              </p>
            </div>
          ) : null}
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-1">
              <Image
                src="/images/logo/logo-black-110x30.png"
                alt="Adapter Digital Group"
                width={110}
                height={30}
                className="h-6 w-auto"
                unoptimized
              />
              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                The app marketplace for Adapter&apos;s ecosystem — MCPs,
                Platforms &amp; Tools built for modern marketing teams.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-900">
                Marketplace
              </h4>
              <ul className="mt-3 space-y-2 text-xs text-slate-500">
                {["MCP", "Platform", "Tool", "New Releases", "Top Charts"].map(
                  (item) => (
                    <li key={item}>
                      <a href="#" className="transition hover:text-slate-900">
                        {item}
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-900">
                Developers
              </h4>
              <ul className="mt-3 space-y-2 text-xs text-slate-500">
                {[
                  "Submit an App",
                  "Developer Docs",
                  "API Reference",
                  "Changelog",
                ].map((item) => (
                  <li key={item}>
                    <a href="#" className="transition hover:text-slate-900">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-900">
                Company
              </h4>
              <ul className="mt-3 space-y-2 text-xs text-slate-500">
                {["About", "Blog", "Careers", "Privacy Policy", "Terms"].map(
                  (item) => (
                    <li key={item}>
                      <a href="#" className="transition hover:text-slate-900">
                        {item}
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center">
            <p className="text-xs text-slate-400">
              &copy; {new Date().getFullYear()} Adapter Digital Group. All
              rights reserved.
            </p>
            <div className="flex items-center gap-1">
              <span className="inline-block size-2 rounded-full bg-[#c20019]" />
              <span className="text-xs font-medium text-slate-500">
                Adapter App Store
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
