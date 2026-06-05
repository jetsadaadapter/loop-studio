import Link from "next/link";
import { ArrowRight, Sparkles, Cpu, Layers, Image as ImageIcon, Plus, Wrench, Tag, FolderOpen } from "lucide-react";

import {
  MANAGE_DASHBOARD_FLAGS,
  MANAGE_FUTURE_NAV_ITEMS,
  MANAGE_NAV_ITEMS,
  MANAGE_OVERVIEW_ROUTE,
  getLocalizedText,
} from "@/app/manage/config";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getManageDashboardStats } from "@/core/services/apps.service";

export const dynamic = "force-dynamic";

const activeRoutes = MANAGE_NAV_ITEMS.filter(
  (item) => item.href !== MANAGE_OVERVIEW_ROUTE.href,
);

export default async function ManageOverviewPage() {
  const stats = await getManageDashboardStats().catch(() => null);
  const lastUpdatedLabel = stats?.lastUpdatedAt
    ? new Date(stats.lastUpdatedAt).toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* 1. Header Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-tr from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 shadow-md">
        <div className="absolute -right-20 -top-20 size-80 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 size-80 rounded-full bg-emerald-500/5 blur-3xl" />
        
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Badge className="bg-white/10 hover:bg-white/15 text-slate-200 border-none px-3 py-1 text-xs font-semibold backdrop-blur-md">
              Control Workspace
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-2">
              Management & Operations Console
            </h1>
            <p className="max-w-2xl text-sm text-slate-400">
              Operational control center to manage live application catalog entries, active banner promotions, AI model routing algorithms, and planned core services.
            </p>
          </div>
          <div className="inline-flex shrink-0 self-start md:self-center items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 backdrop-blur-md">
            <Sparkles className="size-3.5 text-indigo-400 animate-pulse" />
            Active Syncing Operations
          </div>
        </div>
      </section>

      {/* 2. Stat Cards Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Apps Stats */}
        <Card className="col-span-1 border-t-4 border-t-indigo-500 border-x border-b border-slate-200/80 bg-gradient-to-b from-indigo-50/20 to-white shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Apps</span>
              <Layers className="size-4 text-indigo-500" />
            </div>
            <CardTitle className="text-3xl font-bold text-slate-900 mt-2">
              {stats ? stats.appCount : "--"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">
              {stats ? `${stats.activeAppCount} active catalog items` : "Live catalog count"}
            </p>
          </CardContent>
        </Card>

        {/* AI Models Stats */}
        <Card className="col-span-1 border-t-4 border-t-violet-500 border-x border-b border-slate-200/80 bg-gradient-to-b from-violet-50/20 to-white shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">AI Models</span>
              <Cpu className="size-4 text-violet-500" />
            </div>
            <CardTitle className="text-3xl font-bold text-slate-900 mt-2">
              {stats ? stats.aiModelCount : "--"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">
              {stats ? `${stats.activeAiModelCount} active providers` : "LLM router count"}
            </p>
          </CardContent>
        </Card>

        {/* Banners Stats */}
        <Card className="col-span-1 border-t-4 border-t-emerald-500 border-x border-b border-slate-200/80 bg-gradient-to-b from-emerald-50/20 to-white shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Banners</span>
              <ImageIcon className="size-4 text-emerald-500" />
            </div>
            <CardTitle className="text-3xl font-bold text-slate-900 mt-2">
              {stats ? stats.bannerCount : "--"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">
              {stats ? `${stats.activeBannerCount} active banners running` : "Promotion slides"}
            </p>
          </CardContent>
        </Card>

        {/* Default AI Model */}
        <Card className="col-span-1 sm:col-span-2 lg:col-span-1 xl:col-span-2 border-t-4 border-t-amber-500 border-x border-b border-slate-200/80 bg-gradient-to-b from-amber-50/20 to-white shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Default LLM model</span>
            <CardTitle className="truncate text-xl font-bold text-slate-900 mt-2" title={stats?.defaultAiModelName ?? "Not configured"}>
              {stats?.defaultAiModelName ?? "Not configured"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">
              Assigned default model for parsing system operations
            </p>
          </CardContent>
        </Card>

        {/* Sync Status Card */}
        <Card className="col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-1 border-t-4 border-t-sky-500 border-x border-b border-slate-200/80 bg-gradient-to-b from-sky-50/20 to-white shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Service Status</span>
            <CardTitle className="text-base font-bold text-slate-950 mt-2 flex items-center gap-1.5">
              <div className={`size-2 rounded-full ${stats ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
              {stats ? "Fully Online" : "Service Offline"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 truncate">
              {lastUpdatedLabel ? `Synced: ${lastUpdatedLabel}` : "Direct upstream api integrations"}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* 3. Quick Action Shortcuts */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Quick Actions
          </h2>
          <p className="text-sm text-slate-500">
            Create new resources and configure live data immediately.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Quick Action: Create App */}
          <Link href="/manage/apps/create" className="group block outline-none">
            <Card className="h-full border border-slate-200/80 bg-gradient-to-r from-indigo-50/10 via-white to-white transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-indigo-100/30 hover:border-indigo-300 focus-visible:ring-2 focus-visible:ring-slate-400 duration-300 border-l-4 border-l-indigo-500">
              <CardHeader className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 transition group-hover:bg-indigo-100/80">
                      <Plus className="size-4 animate-spin-slow" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-900">Create App</CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Add a new app catalog item
                      </CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="size-4 text-slate-400 transition group-hover:text-slate-900 group-hover:translate-x-0.5" />
                </div>
              </CardHeader>
            </Card>
          </Link>

          {/* Quick Action: Create Banner */}
          <Link href="/manage/banners/create" className="group block outline-none">
            <Card className="h-full border border-slate-200/80 bg-gradient-to-r from-emerald-50/10 via-white to-white transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-emerald-100/30 hover:border-emerald-300 focus-visible:ring-2 focus-visible:ring-slate-400 duration-300 border-l-4 border-l-emerald-500">
              <CardHeader className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 transition group-hover:bg-emerald-100/80">
                      <Plus className="size-4 animate-spin-slow" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-900">Create Banner</CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Add a banner sliding promotion
                      </CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="size-4 text-slate-400 transition group-hover:text-slate-900 group-hover:translate-x-0.5" />
                </div>
              </CardHeader>
            </Card>
          </Link>

          {/* Quick Action: Create Model */}
          <Link href="/manage/models?action=create" className="group block outline-none">
            <Card className="h-full border border-slate-200/80 bg-gradient-to-r from-violet-50/10 via-white to-white transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-violet-100/30 hover:border-violet-300 focus-visible:ring-2 focus-visible:ring-slate-400 duration-300 border-l-4 border-l-violet-500">
              <CardHeader className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600 transition group-hover:bg-violet-100/80">
                      <Plus className="size-4 animate-spin-slow" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-900">Create AI Model</CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Add an LLM model provider
                      </CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="size-4 text-slate-400 transition group-hover:text-slate-900 group-hover:translate-x-0.5" />
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </section>

      {/* 4. Active Management Workspaces */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Available Workspaces
          </h2>
          <p className="text-sm text-slate-500">
            Full control screens to view, filter, edit, or delete live portal elements.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeRoutes.map((item) => {
            const isApps = item.href.includes("apps");
            const isModels = item.href.includes("models");
            const isBanners = item.href.includes("banners");
            const isTools = item.href.includes("tools");
            const isTags = item.href.includes("tags");
            const isCategories = item.href.includes("categories");

            return (
              <Link
                key={item.href}
                href={item.href}
                className="group block outline-none"
              >
                <Card className={`h-full border border-slate-200/80 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-slate-400 duration-300 ${
                  isApps ? "border-l-4 border-l-indigo-500 bg-gradient-to-r from-indigo-50/10 via-white to-white hover:border-l-indigo-600 hover:border-r-slate-300 hover:border-y-slate-300" :
                  isModels ? "border-l-4 border-l-violet-500 bg-gradient-to-r from-violet-50/10 via-white to-white hover:border-l-violet-600 hover:border-r-slate-300 hover:border-y-slate-300" :
                  isBanners ? "border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50/10 via-white to-white hover:border-l-emerald-600 hover:border-r-slate-300 hover:border-y-slate-300" :
                  isTools ? "border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50/10 via-white to-white hover:border-l-amber-600 hover:border-r-slate-300 hover:border-y-slate-300" :
                  isTags ? "border-l-4 border-l-rose-500 bg-gradient-to-r from-rose-50/10 via-white to-white hover:border-l-rose-600 hover:border-r-slate-300 hover:border-y-slate-300" :
                  isCategories ? "border-l-4 border-l-sky-500 bg-gradient-to-r from-sky-50/10 via-white to-white hover:border-l-sky-600 hover:border-r-slate-300 hover:border-y-slate-300" :
                  "border-l-4 border-l-slate-400 bg-white"
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`size-9 rounded-xl flex items-center justify-center ${
                          isApps ? "bg-indigo-100/50 text-indigo-600 group-hover:bg-indigo-100" :
                          isModels ? "bg-violet-100/50 text-violet-600 group-hover:bg-violet-100" :
                          isBanners ? "bg-emerald-100/50 text-emerald-600 group-hover:bg-emerald-100" :
                          isTools ? "bg-amber-100/50 text-amber-600 group-hover:bg-amber-100" :
                          isTags ? "bg-rose-100/50 text-rose-600 group-hover:bg-rose-100" :
                          isCategories ? "bg-sky-100/50 text-sky-600 group-hover:bg-sky-100" :
                          "bg-slate-50 text-slate-600"
                        } transition`}>
                          {isApps && <Layers className="size-4" />}
                          {isModels && <Cpu className="size-4" />}
                          {isBanners && <ImageIcon className="size-4" />}
                          {isTools && <Wrench className="size-4" />}
                          {isTags && <Tag className="size-4" />}
                          {isCategories && <FolderOpen className="size-4" />}
                        </div>
                        <div>
                          <CardTitle className="text-base font-bold text-slate-900">
                            {getLocalizedText(item.title)}
                          </CardTitle>
                          <CardDescription className="text-xs mt-0.5 line-clamp-1 text-slate-500">
                            {getLocalizedText(item.subtitle)}
                          </CardDescription>
                        </div>
                      </div>
                      <ArrowRight className="size-4 text-slate-400 transition group-hover:text-slate-900 group-hover:translate-x-0.5 mt-2" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Launch operational workspace for {getLocalizedText(item.crumb).toLowerCase()} management. Build, refine, structure, or hide records live on the client-facing store.
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 5. Future Planned Modules */}
      {MANAGE_DASHBOARD_FLAGS.showComingSoon ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Planned Modules
            </h2>
            <p className="text-sm text-slate-500">
              Reserved integration slots planned for the next expansion phase.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {MANAGE_FUTURE_NAV_ITEMS.map((item) => {
              const label = getLocalizedText(item.label);
              return (
                <Card
                  key={label}
                  className="border border-dashed border-slate-300 bg-slate-50/70"
                >
                  <CardHeader className="py-4 px-5">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-sm font-bold text-slate-700">{label}</CardTitle>
                      <Badge variant="outline" className="border-slate-300 text-slate-500 text-[10px] py-0 px-2 font-medium">
                        Coming soon
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
