import React from "react";
import { Cpu, Layers, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ManageDashboardStats } from "@/core/services/apps.service";

interface OverviewStatsProps {
  stats: ManageDashboardStats | null;
  hasAccessToApps: boolean;
  hasAccessToBanners: boolean;
  hasAccessToModels: boolean;
}

export function OverviewStats({
  stats,
  hasAccessToApps,
  hasAccessToBanners,
  hasAccessToModels,
}: OverviewStatsProps) {
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
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {/* Apps Stats */}
      {hasAccessToApps && (
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
      )}

      {/* AI Models Stats */}
      {hasAccessToModels && (
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
      )}

      {/* Banners Stats */}
      {hasAccessToBanners && (
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
      )}

      {/* Default AI Model */}
      {hasAccessToModels && (
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
      )}

      {/* Service Status */}
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
  );
}
