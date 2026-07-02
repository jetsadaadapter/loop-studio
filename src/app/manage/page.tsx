"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Coins,
  Cpu,
  Image as ImageIcon,
  Layers,
  Loader2,
} from "lucide-react";

import {
  MANAGE_NAV_ITEMS,
  MANAGE_OVERVIEW_ROUTE,
  getLocalizedText,
} from "@/app/manage/config";
import {
  getManageDashboardStats,
  type ManageDashboardStats,
} from "@/core/services/apps.service";
import { getManageMenus } from "@/core/services/menus.service";
import type { ManageMenuItem } from "@/core/interfaces/menus.interface";
import type { UserRole } from "@/core/interfaces/auth.interface";
import { useProfileData } from "@/components/profile-avatar-menu/profile-utils";

import {
  OverviewProfileCard,
  type ProfilePill,
} from "./components/OverviewProfileCard";
import { OverviewStatCards } from "./components/OverviewStatCards";
import { OverviewQuickActions } from "./components/OverviewQuickActions";
import {
  OverviewWorkspaces,
  type WorkspaceItem,
} from "./components/OverviewWorkspaces";
import { OverviewUserLinks } from "./components/OverviewUserLinks";

function SectionHeading({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      <p className="text-xs text-slate-500">{desc}</p>
    </div>
  );
}

function resolveRoleLabel(roles?: UserRole[]): string {
  if (!roles?.length) return "Member";
  if (roles.includes("system-admin")) return "System Admin";
  if (roles.includes("admin")) return "Administrator";
  if (roles.includes("developer")) return "Developer";
  if (roles.includes("viewer")) return "Viewer";
  return "Member";
}

export default function ManageOverviewPage() {
  const [menus, setMenus] = useState<ManageMenuItem[]>([]);
  const [stats, setStats] = useState<ManageDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { profile, profileName, profileImage, profileInitials } =
    useProfileData();

  const loadData = useCallback(async () => {
    try {
      const menusData = await getManageMenus();

      const hasApps = menusData.some((m) => m.path === "/manage/apps");
      const hasModels = menusData.some((m) => m.path === "/manage/models");
      const hasBanners = menusData.some((m) => m.path === "/manage/banners");

      const statsData =
        hasApps || hasModels || hasBanners
          ? await getManageDashboardStats({
              hasApps,
              hasModels,
              hasBanners,
            }).catch(() => null)
          : null;

      setMenus(menusData);
      setStats(statsData);
    } catch (err) {
      console.error("Failed to load overview data:", err);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await loadData();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  }, [loadData]);

  const allowedRoutes = useMemo(() => {
    return MANAGE_NAV_ITEMS.filter((item) => {
      if (item.href === MANAGE_OVERVIEW_ROUTE.href) return false;
      return menus.some((m) => {
        const resolvedPath = m.path === "/keys" ? "/manage/keys" : m.path;
        return (
          item.href === resolvedPath || item.href.startsWith(resolvedPath + "/")
        );
      });
    });
  }, [menus]);

  const hasAccessToApps = useMemo(
    () => menus.some((m) => m.path === "/manage/apps"),
    [menus],
  );
  const hasAccessToBanners = useMemo(
    () => menus.some((m) => m.path === "/manage/banners"),
    [menus],
  );
  const hasAccessToModels = useMemo(
    () => menus.some((m) => m.path === "/manage/models"),
    [menus],
  );

  const isManager = allowedRoutes.length > 0;

  const workspaceItems = useMemo<WorkspaceItem[]>(
    () =>
      allowedRoutes.map((r) => ({
        href: r.href,
        title: getLocalizedText(r.title),
        subtitle: getLocalizedText(r.subtitle),
      })),
    [allowedRoutes],
  );

  const roleLabel = resolveRoleLabel(profile?.roles);
  const credits = profile?.credits ?? null;

  // Active-ratio ring (managers) — active resources / total across accessible types.
  const ringPercent = useMemo(() => {
    if (!isManager || !stats) return null;
    let total = 0;
    let active = 0;
    if (hasAccessToApps) {
      total += stats.appCount;
      active += stats.activeAppCount;
    }
    if (hasAccessToModels) {
      total += stats.aiModelCount;
      active += stats.activeAiModelCount;
    }
    if (hasAccessToBanners) {
      total += stats.bannerCount;
      active += stats.activeBannerCount;
    }
    return total > 0 ? Math.round((active / total) * 100) : 0;
  }, [isManager, stats, hasAccessToApps, hasAccessToModels, hasAccessToBanners]);

  const pills = useMemo<ProfilePill[]>(() => {
    if (!isManager) {
      return [{ icon: Coins, value: credits ?? "--", tint: "text-brand" }];
    }
    const out: ProfilePill[] = [];
    if (hasAccessToApps)
      out.push({ icon: Layers, value: stats?.appCount ?? "--", tint: "text-brand" });
    if (hasAccessToModels)
      out.push({ icon: Cpu, value: stats?.aiModelCount ?? "--", tint: "text-violet-600" });
    if (hasAccessToBanners)
      out.push({ icon: ImageIcon, value: stats?.bannerCount ?? "--", tint: "text-emerald-600" });
    return out;
  }, [isManager, credits, stats, hasAccessToApps, hasAccessToModels, hasAccessToBanners]);

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-slate-400" />
        <p className="text-xs font-semibold text-slate-500">
          Loading workspace overview...
        </p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in space-y-5 pb-10 duration-500">
      {/* Header / overview block */}
      <section className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <OverviewProfileCard
          name={profileName}
          position={roleLabel}
          image={profileImage}
          initials={profileInitials}
          ringPercent={ringPercent}
          pills={pills}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />

        {isManager ? (
          <OverviewStatCards
            stats={stats}
            hasAccessToApps={hasAccessToApps}
            hasAccessToBanners={hasAccessToBanners}
            hasAccessToModels={hasAccessToModels}
          />
        ) : (
          <div className="flex flex-col justify-center rounded-3xl bg-gradient-to-br from-brand/15 via-rose-100 to-amber-50 p-6 shadow-[0_18px_40px_-20px_rgba(15,23,42,0.22)]">
            <p className="text-sm font-semibold text-slate-800">
              Your Credit Balance
            </p>
            <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
              {credits !== null ? credits.toLocaleString() : "--"}
              <span className="ml-1 text-base font-semibold text-slate-500">
                cr
              </span>
            </p>
            <p className="mt-1 max-w-sm text-xs text-slate-600">
              Use credits to run tools and analyses across the library.
            </p>
            <Link
              href="/apps"
              className="group mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-slate-900 py-2 pl-4 pr-2 text-xs font-semibold text-white transition hover:bg-black"
            >
              Browse Library
              <span className="flex size-6 items-center justify-center rounded-full bg-white text-slate-900 transition group-hover:translate-x-0.5">
                <ArrowRight className="size-3.5" />
              </span>
            </Link>
          </div>
        )}
      </section>

      {isManager ? (
        <>
          {(hasAccessToApps || hasAccessToBanners || hasAccessToModels) && (
            <section className="space-y-3">
              <SectionHeading
                title="Quick Actions"
                desc="Create new resources and configure live data immediately."
              />
              <OverviewQuickActions
                hasAccessToApps={hasAccessToApps}
                hasAccessToBanners={hasAccessToBanners}
                hasAccessToModels={hasAccessToModels}
              />
            </section>
          )}

          {workspaceItems.length > 0 && (
            <section className="space-y-3">
              <SectionHeading
                title="Your Workspaces"
                desc="Full control screens to view, filter, edit, or delete portal elements."
              />
              <OverviewWorkspaces items={workspaceItems} />
            </section>
          )}
        </>
      ) : (
        <section className="space-y-3">
          <SectionHeading
            title="Quick Links"
            desc="Jump straight to the tools and resources available to you."
          />
          <OverviewUserLinks />
        </section>
      )}
    </div>
  );
}
