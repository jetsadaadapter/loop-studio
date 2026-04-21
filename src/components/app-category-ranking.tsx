"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import { statusBadgeClass } from "@/lib/utils";

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

export function AppCategoryRanking() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("tool");
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const sectionDescription: Record<CategoryKey, string> = {
    mcp: "Model Context Protocol services",
    platform: "Core platform systems",
    tool: "Operational tools and utilities",
  };

  const currentIndex = categoryTabs.findIndex(
    (tab) => tab.key === selectedCategory,
  );
  const canScrollPrev = currentIndex > 0;
  const canScrollNext = currentIndex < categoryTabs.length - 1;

  function scrollToCategory(nextCategory: CategoryKey) {
    const slider = sliderRef.current;
    const nextIndex = categoryTabs.findIndex((tab) => tab.key === nextCategory);

    setSelectedCategory(nextCategory);

    if (!slider || nextIndex < 0) {
      return;
    }

    slider.scrollTo({
      left: slider.clientWidth * nextIndex,
      behavior: "smooth",
    });
  }

  function handleArrow(direction: "previous" | "next") {
    const nextIndex =
      direction === "next"
        ? Math.min(currentIndex + 1, categoryTabs.length - 1)
        : Math.max(currentIndex - 1, 0);

    scrollToCategory(categoryTabs[nextIndex].key);
  }

  function handleSliderScroll() {
    const slider = sliderRef.current;

    if (!slider) {
      return;
    }

    const nextIndex = Math.round(slider.scrollLeft / slider.clientWidth);
    const nextCategory = categoryTabs[nextIndex]?.key;

    if (nextCategory && nextCategory !== selectedCategory) {
      setSelectedCategory(nextCategory);
    }
  }

  return (
    <section
      className="mt-8 rounded-3xl border border-slate-200 bg-linear-to-b from-slate-50 to-white p-4 sm:p-6"
      aria-label="App categories"
    >
      <header className="ranking-header">
        <div className="ranking-title-group flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-slate-900">Top charts</h2>
          <p className="text-xs text-slate-500">
            Browse ranked Adapter apps by category.
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
                  onClick={() => scrollToCategory(tab.key)}
                  className={`tab-button rounded-full border px-4 py-1.5 text-sm font-medium shadow-sm transition ${
                    isActive
                      ? "border-brand/30 bg-brand/10 text-brand"
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
          <div className="apps-inner group/ranking-slider relative rounded-[28px] border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
            <div
              ref={sliderRef}
              onScroll={handleSliderScroll}
              className="slider-track flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-live="polite"
            >
              {categoryTabs.map((tab) => {
                const groupedApps = splitColumns(rankingData[tab.key]);

                return (
                  <div
                    key={tab.key}
                    className="slide-panel min-w-full snap-start"
                    role="group"
                    aria-label={`${tab.label} rankings`}
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">
                          {tab.label}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {sectionDescription[tab.key]}
                        </p>
                      </div>
                    </div>

                    <div
                      className="apps-grid grid gap-x-5 gap-y-3 lg:grid-cols-3"
                      role="list"
                      aria-label={`${tab.label} apps`}
                    >
                      {groupedApps.map((group, groupIndex) => (
                        <div
                          key={`${tab.key}-${groupIndex}`}
                          role="listitem"
                          className="app-column space-y-2"
                        >
                          {group.map((app) => (
                            <article
                              key={app.id}
                              className="app-card flex items-center gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-slate-50"
                            >
                              <div
                                className="rank-badge inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500"
                                aria-label={`Rank ${app.rank}`}
                              >
                                {app.rank}
                              </div>

                              <div className="app-info flex min-w-0 items-center gap-3">
                                <div
                                  className={`app-icon flex size-14 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold tracking-wide text-white shadow-sm ${app.iconClassName}`}
                                >
                                  {app.iconText}
                                </div>

                                <div className="app-text min-w-0">
                                  <div className="app-name-row">
                                    <h3 className="line-clamp-1 text-sm font-medium text-slate-900 sm:text-base">
                                      {app.name}
                                    </h3>
                                  </div>
                                  <div className="app-category-row">
                                    <p className="line-clamp-1 text-sm text-slate-500">
                                      {app.category}
                                    </p>
                                  </div>
                                  <div className="app-meta-row mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                                    <span
                                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusBadgeClass(
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
                );
              })}
            </div>

            {canScrollPrev ? (
              <button
                type="button"
                onClick={() => handleArrow("previous")}
                className="absolute top-1/2 left-0 z-10 hidden size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 opacity-0 shadow-sm transition-opacity duration-200 hover:border-brand/30 hover:text-brand group-hover/ranking-slider:opacity-100 group-focus-within/ranking-slider:opacity-100 lg:inline-flex"
                aria-label="Previous category"
              >
                <ChevronLeft className="size-5" />
              </button>
            ) : null}

            {canScrollNext ? (
              <button
                type="button"
                onClick={() => handleArrow("next")}
                className="absolute top-1/2 right-0 z-10 hidden size-11 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 opacity-0 shadow-sm transition-opacity duration-200 hover:border-brand/30 hover:text-brand group-hover/ranking-slider:opacity-100 group-focus-within/ranking-slider:opacity-100 lg:inline-flex"
                aria-label="Next category"
              >
                <ChevronRight className="size-5" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
