"use client";

import { useMemo, useState } from "react";

type CategoryKey = "mcp" | "platform" | "tool";

type RankedApp = {
  id: string;
  rank: number;
  name: string;
  category: string;
  meta: string;
  iconText: string;
  iconClassName: string;
};

const categoryTabs: Array<{ key: CategoryKey; label: string }> = [
  { key: "mcp", label: "MCP" },
  { key: "platform", label: "Platform" },
  { key: "tool", label: "Tool" },
];

const rankingData: Record<CategoryKey, RankedApp[]> = {
  mcp: [
    {
      id: "apify-mcp",
      rank: 1,
      name: "APIFY MCP",
      category: "Data Connector",
      meta: "Production ready",
      iconText: "AP",
      iconClassName: "bg-emerald-600",
    },
    {
      id: "adapter-media-mcp",
      rank: 2,
      name: "Adapter Media MCP",
      category: "Media Integration",
      meta: "Production ready",
      iconText: "AM",
      iconClassName: "bg-blue-600",
    },
    {
      id: "hype-mcp",
      rank: 3,
      name: "HYPE MCP",
      category: "Campaign Automation",
      meta: "Planned",
      iconText: "HY",
      iconClassName: "bg-slate-700",
    },
    {
      id: "audit-mcp",
      rank: 4,
      name: "Audit Stream MCP",
      category: "Observability",
      meta: "Beta",
      iconText: "AS",
      iconClassName: "bg-orange-600",
    },
    {
      id: "policy-mcp",
      rank: 5,
      name: "Policy Guard MCP",
      category: "Governance",
      meta: "In rollout",
      iconText: "PG",
      iconClassName: "bg-purple-700",
    },
    {
      id: "workflow-mcp",
      rank: 6,
      name: "Workflow Bridge MCP",
      category: "Automation",
      meta: "In rollout",
      iconText: "WB",
      iconClassName: "bg-pink-600",
    },
  ],
  platform: [
    {
      id: "adapter-campaign",
      rank: 1,
      name: "Adapter Campaign",
      category: "Campaign Platform",
      meta: "Production ready",
      iconText: "AC",
      iconClassName: "bg-emerald-700",
    },
    {
      id: "adapter-workflow-hub",
      rank: 2,
      name: "Workflow Hub",
      category: "Orchestration",
      meta: "Beta",
      iconText: "WH",
      iconClassName: "bg-indigo-700",
    },
    {
      id: "adapter-insight-center",
      rank: 3,
      name: "Insight Center",
      category: "Analytics",
      meta: "Beta",
      iconText: "IC",
      iconClassName: "bg-cyan-700",
    },
    {
      id: "adapter-identity",
      rank: 4,
      name: "Identity Access",
      category: "Security",
      meta: "In rollout",
      iconText: "IA",
      iconClassName: "bg-red-700",
    },
    {
      id: "adapter-admin-console",
      rank: 5,
      name: "Admin Console",
      category: "Operations",
      meta: "In rollout",
      iconText: "AD",
      iconClassName: "bg-teal-700",
    },
    {
      id: "adapter-billing",
      rank: 6,
      name: "Billing Core",
      category: "Finance",
      meta: "Planned",
      iconText: "BC",
      iconClassName: "bg-lime-700",
    },
  ],
  tool: [
    {
      id: "comment-loader",
      rank: 1,
      name: "Comment Loader",
      category: "Data Tool",
      meta: "NEW",
      iconText: "CL",
      iconClassName: "bg-emerald-700",
    },
    {
      id: "post-comment-analyzer",
      rank: 2,
      name: "Post Comment Analyzer",
      category: "Insight Tool",
      meta: "NEW",
      iconText: "PA",
      iconClassName: "bg-red-700",
    },
    {
      id: "keyword-clustering",
      rank: 3,
      name: "Keyword Clustering",
      category: "Analysis Tool",
      meta: "Beta",
      iconText: "KC",
      iconClassName: "bg-violet-700",
    },
    {
      id: "reply-assistant",
      rank: 4,
      name: "Reply Assistant",
      category: "Engagement Tool",
      meta: "Beta",
      iconText: "RA",
      iconClassName: "bg-amber-700",
    },
    {
      id: "sentiment-monitor",
      rank: 5,
      name: "Sentiment Monitor",
      category: "Monitoring Tool",
      meta: "In rollout",
      iconText: "SM",
      iconClassName: "bg-zinc-700",
    },
    {
      id: "campaign-qa",
      rank: 6,
      name: "Campaign QA",
      category: "Quality Tool",
      meta: "Planned",
      iconText: "QA",
      iconClassName: "bg-indigo-700",
    },
  ],
};

function splitColumns(apps: RankedApp[]) {
  const size = Math.ceil(apps.length / 3);
  return [
    apps.slice(0, size),
    apps.slice(size, size * 2),
    apps.slice(size * 2),
  ];
}

function metaBadgeClass(meta: string) {
  const normalized = meta.toLowerCase();

  if (normalized === "new") {
    return "bg-red-100 text-red-700";
  }

  if (normalized === "production ready") {
    return "bg-emerald-100 text-emerald-800";
  }

  if (normalized === "in rollout") {
    return "bg-amber-100 text-amber-800";
  }

  if (normalized === "beta") {
    return "bg-sky-100 text-sky-800";
  }

  return "bg-slate-100 text-slate-700";
}

export function AppCategoryRanking() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("tool");

  const activeApps = useMemo(
    () => rankingData[selectedCategory],
    [selectedCategory],
  );
  const columns = useMemo(() => splitColumns(activeApps), [activeApps]);
  const sectionTitle = categoryTabs.find(
    (tab) => tab.key === selectedCategory,
  )?.label;
  const sectionDescription: Record<CategoryKey, string> = {
    mcp: "Model Context Protocol services",
    platform: "Core platform systems",
    tool: "Operational tools and utilities",
  };

  return (
    <section
      className="mt-8 rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 sm:p-6"
      aria-label="App categories"
    >
      <header className="ranking-header">
        <div className="ranking-title-group flex flex-col gap-1">
          <span className="text-xl font-semibold text-slate-900">
            {sectionTitle}
          </span>
          <p className="text-xs text-slate-500">
            {sectionDescription[selectedCategory]}
          </p>
        </div>
      </header>

      <div className="mt-5">
        <div className="tab-container">
          <div
            className="tab-list flex flex-wrap gap-2"
            role="tablist"
            aria-label="App category filters"
          >
            {categoryTabs.map((tab) => {
              const isActive = tab.key === selectedCategory;

              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-label={tab.label}
                  onClick={() => setSelectedCategory(tab.key)}
                  className={`tab-button rounded-full border px-4 py-1.5 text-sm font-medium shadow-sm transition ${
                    isActive
                      ? "border-emerald-200 bg-emerald-100 text-emerald-900"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="apps-content mt-5">
          <div className="apps-inner">
            <div className="apps-grid-wrapper">
              <div
                className="apps-grid grid gap-4 lg:grid-cols-3 lg:gap-5"
                role="list"
                aria-label="Apps grouped by category"
              >
                {columns.map((group, groupIndex) => (
                  <div
                    key={groupIndex}
                    role="listitem"
                    className="app-column space-y-3"
                  >
                    {group.map((app) => (
                      <article
                        key={app.id}
                        className="app-card flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-emerald-200 hover:shadow-sm"
                      >
                        <div
                          className="rank-badge inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500"
                          aria-label={`Rank ${app.rank}`}
                        >
                          {app.rank}
                        </div>

                        <div className="app-info flex min-w-0 items-center gap-3">
                          <div
                            className={`app-icon flex size-12 shrink-0 items-center justify-center rounded-xl text-xs font-semibold tracking-wide text-white shadow-sm ${app.iconClassName}`}
                          >
                            {app.iconText}
                          </div>

                          <div className="app-text min-w-0">
                            <div className="app-name-row">
                              <h3 className="line-clamp-1 text-sm font-medium text-slate-900">
                                {app.name}
                              </h3>
                            </div>
                            <div className="app-category-row">
                              <p className="line-clamp-1 text-xs text-slate-500">
                                {app.category}
                              </p>
                            </div>
                            <div className="app-meta-row mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${metaBadgeClass(
                                  app.meta,
                                )}`}
                              >
                                {app.meta}
                              </span>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
