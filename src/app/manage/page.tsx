"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Cpu, Layers, Image as ImageIcon, Plus, Wrench, Tag, FolderOpen, Users, Loader2 } from "lucide-react";

import {
  MANAGE_DASHBOARD_FLAGS,
  MANAGE_FUTURE_NAV_ITEMS,
  MANAGE_NAV_ITEMS,
  MANAGE_OVERVIEW_ROUTE,
  getLocalizedText,
} from "@/app/manage/config";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { getManageDashboardStats, type ManageDashboardStats } from "@/core/services/apps.service";
import { getManageMenus } from "@/core/services/menus.service";
import type { ManageMenuItem } from "@/core/interfaces/menus.interface";
import { OverviewHeader } from "./components/OverviewHeader";
import { OverviewStats } from "./components/OverviewStats";

export default function ManageOverviewPage() {
  const [menus, setMenus] = useState<ManageMenuItem[]>([]);
  const [stats, setStats] = useState<ManageDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const menusData = await getManageMenus();
        if (cancelled) return;

        const hasApps = menusData.some((m) => m.path === "/manage/apps");
        const hasModels = menusData.some((m) => m.path === "/manage/models");
        const hasBanners = menusData.some((m) => m.path === "/manage/banners");

        const statsData = await getManageDashboardStats({
          hasApps,
          hasModels,
          hasBanners,
        }).catch(() => null);

        if (cancelled) return;

        setMenus(menusData);
        setStats(statsData);
      } catch (err) {
        console.error("Failed to load overview data:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const allowedRoutes = useMemo(() => {
    return MANAGE_NAV_ITEMS.filter((item) => {
      if (item.href === MANAGE_OVERVIEW_ROUTE.href) return false;
      return menus.some((m) => {
        const resolvedPath = m.path === "/keys" ? "/manage/keys" : m.path;
        return item.href === resolvedPath || item.href.startsWith(resolvedPath + "/");
      });
    });
  }, [menus]);

  const hasAccessToApps = useMemo(() => menus.some((m) => m.path === "/manage/apps"), [menus]);
  const hasAccessToBanners = useMemo(() => menus.some((m) => m.path === "/manage/banners"), [menus]);
  const hasAccessToModels = useMemo(() => menus.some((m) => m.path === "/manage/models"), [menus]);

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-slate-400" />
        <p className="text-xs font-semibold text-slate-500 font-sans">Loading workspace overview...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* 1. Header Hero Banner */}
      <OverviewHeader />

      {/* 2. Stat Cards Grid */}
      <OverviewStats
        stats={stats}
        hasAccessToApps={hasAccessToApps}
        hasAccessToBanners={hasAccessToBanners}
        hasAccessToModels={hasAccessToModels}
      />

      {/* 3. Quick Action Shortcuts */}
      {(hasAccessToApps || hasAccessToBanners || hasAccessToModels) && (
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
            {hasAccessToApps && (
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
            )}

            {/* Quick Action: Create Banner */}
            {hasAccessToBanners && (
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
            )}

            {/* Quick Action: Create Model */}
            {hasAccessToModels && (
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
            )}
          </div>
        </section>
      )}

      {/* 4. Active Management Workspaces */}
      {allowedRoutes.length > 0 && (
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
            {allowedRoutes.map((item) => {
              const isApps = item.href.includes("apps");
              const isModels = item.href.includes("models");
              const isBanners = item.href.includes("banners");
              const isTools = item.href.includes("tools");
              const isTags = item.href.includes("tags");
              const isCategories = item.href.includes("categories");
              const isUsers = item.href.includes("users");

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
                    isUsers ? "border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/10 via-white to-white hover:border-l-blue-600 hover:border-r-slate-300 hover:border-y-slate-300" :
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
                            isUsers ? "bg-blue-100/50 text-blue-600 group-hover:bg-blue-100" :
                            "bg-slate-50 text-slate-600"
                          } transition`}>
                            {isApps && <Layers className="size-4" />}
                            {isModels && <Cpu className="size-4" />}
                            {isBanners && <ImageIcon className="size-4" />}
                            {isTools && <Wrench className="size-4" />}
                            {isTags && <Tag className="size-4" />}
                            {isCategories && <FolderOpen className="size-4" />}
                            {isUsers && <Users className="size-4" />}
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
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. Future Planned Modules */}
      {MANAGE_DASHBOARD_FLAGS.showComingSoon && (
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
                  <CardHeader className="p-4 flex flex-row items-center gap-3">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                      <Plus className="size-3.5" />
                    </span>
                    <div>
                      <h3 className="text-xs font-semibold text-slate-650">{label}</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider font-bold">Planned Phase</p>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
