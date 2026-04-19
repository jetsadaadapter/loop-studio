import Image from "next/image";
import { Search } from "lucide-react";
import { HeroBannerSlider } from "@/components/hero-banner-slider";
import { AppCategoryRanking } from "@/components/app-category-ranking";

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

const mainTabs = ["Games", "Apps", "Books", "Kids"];
const deviceTabs = ["Phone", "Tablet", "TV", "Chromebook", "Watch", "Car"];

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
  if (s === "production ready") return "bg-emerald-100 text-emerald-800";
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
    <article className="group w-36 shrink-0 rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-emerald-200 hover:shadow-sm">
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
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 md:px-6">
          <Image
            src="/images/logo/logo-black-110x30.png"
            alt="Adapter Digital Group"
            width={120}
            height={36}
            className="h-7 w-auto"
            unoptimized
            priority
          />
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              placeholder="Search for apps & games"
              className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
            />
          </div>
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-full border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Sign in
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-5 md:px-6">
        <section className="border-b border-slate-200 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            {mainTabs.map((tab, index) => (
              <button
                key={tab}
                type="button"
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  index === 1
                    ? "bg-emerald-100 text-emerald-800"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {deviceTabs.map((device, index) => (
              <button
                key={device}
                type="button"
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  index === 0
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {device}
              </button>
            ))}
          </div>
        </section>

        <HeroBannerSlider />
        <AppCategoryRanking />

        <section className="mt-8 space-y-6">
          {appSections.map((section) => (
            <div
              key={section.id}
              className="rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white px-4 py-5 sm:px-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">
                  {section.title}
                </h2>
                <button
                  type="button"
                  className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
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
        </section>
      </main>
    </div>
  );
}
