import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Cpu,
  Image as ImageIcon,
  Layers,
  type LucideIcon,
} from "lucide-react";
import type { ManageDashboardStats } from "@/core/services/apps.service";

interface OverviewStatCardsProps {
  stats: ManageDashboardStats | null;
  hasAccessToApps: boolean;
  hasAccessToBanners: boolean;
  hasAccessToModels: boolean;
}

interface PctCard {
  label: string;
  pct: number;
  sub: string;
  icon: LucideIcon;
  gradient: string;
}

function pct(active: number, total: number) {
  return total > 0 ? Math.round((active / total) * 100) : 0;
}

export function OverviewStatCards({
  stats,
  hasAccessToApps,
  hasAccessToBanners,
  hasAccessToModels,
}: OverviewStatCardsProps) {
  const pool: PctCard[] = [];
  if (stats && hasAccessToApps) {
    pool.push({
      label: "Active Apps",
      pct: pct(stats.activeAppCount, stats.appCount),
      sub: `${stats.activeAppCount} of ${stats.appCount} live`,
      icon: Layers,
      gradient: "from-brand/15 via-rose-100 to-amber-50",
    });
  }
  if (stats && hasAccessToModels) {
    pool.push({
      label: "Active Models",
      pct: pct(stats.activeAiModelCount, stats.aiModelCount),
      sub: `${stats.activeAiModelCount} of ${stats.aiModelCount} live`,
      icon: Cpu,
      gradient: "from-sky-100 via-indigo-50 to-emerald-50",
    });
  }
  if (stats && hasAccessToBanners) {
    pool.push({
      label: "Active Banners",
      pct: pct(stats.activeBannerCount, stats.bannerCount),
      sub: `${stats.activeBannerCount} of ${stats.bannerCount} live`,
      icon: ImageIcon,
      gradient: "from-emerald-100 via-teal-50 to-sky-50",
    });
  }

  const cards = pool.slice(0, 2);
  const lastSync = stats?.lastUpdatedAt
    ? new Date(stats.lastUpdatedAt).toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="grid gap-5">
      {cards.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2">
          {cards.map(({ label, pct: value, sub, icon: Icon, gradient }) => (
            <div
              key={label}
              className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-6`}
            >
              <div className="flex items-start justify-between">
                <p className="max-w-[8rem] text-sm font-semibold leading-snug text-slate-800">
                  {label}
                </p>
                <span className="flex size-9 items-center justify-center rounded-xl bg-white/60 text-slate-700 backdrop-blur-sm">
                  <Icon className="size-4" />
                </span>
              </div>
              <p className="mt-8 text-3xl font-bold tracking-tight text-slate-900">
                {value}%
              </p>
              <p className="mt-1 text-xs font-medium text-slate-600">{sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* System status strip */}
      <Link
        href="/manage/models"
        className="group flex items-center justify-between gap-4 rounded-3xl bg-slate-100/80 px-6 py-5 transition hover:bg-slate-100"
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">System Status</p>
          <p className="truncate text-xs text-slate-500">
            {stats ? "Fully Online" : "Service offline"}
            {lastSync ? ` · Synced ${lastSync}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm sm:inline-flex">
            <span
              className={`size-2 rounded-full ${
                stats ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
            {stats?.defaultAiModelName ?? "No default LLM"}
          </span>
          <span className="flex size-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition group-hover:text-brand">
            <ArrowRight className="size-4" />
          </span>
        </div>
      </Link>
    </div>
  );
}
