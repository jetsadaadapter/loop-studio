"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as LucideIcons from "lucide-react";
import { type LucideIcon } from "lucide-react";
import type { UserProfile } from "@/core/interfaces/auth.interface";
import {
  MANAGE_PARENT_CRUMB,
  getLocalizedText,
} from "@/app/manage/config";
import { ManageLogo } from "@/components/manage-logo";
import { getManageMenus } from "@/core/services/menus.service";
import { getUserProfile } from "@/core/services/users.service";
import { checkRouteImplemented } from "@/app/manage/actions";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getDepartmentBadgeClass } from "@/lib/utils";
import { getUserCredits, getCreditHistory, adjustUserCredits } from "@/core/services/users.service";
import type { CreditTransaction } from "@/core/services/users.service";
import { CreditHistoryDrawer } from "@/components/credit-history-drawer";
import { UserCreditModal } from "@/app/manage/users/components/user-credit-modal";
import { useNotifications } from "@/components/notification-provider";
import { NotificationPanel } from "@/components/notification-panel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

const ICON_MAP = LucideIcons as unknown as Record<string, LucideIcon>;


type MenuSection = {
  title: string;
  href: string;
  icon: LucideIcon;
  items: { title: string; href: string; icon?: LucideIcon; external?: boolean }[];
};

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function ManageSidebarFooter() {
  const router = useRouter();
  const { isMobile, state } = useSidebar();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    let cancelled = false;

    void getUserProfile()
      .then((nextProfile) => {
        if (!cancelled) {
          setProfile(nextProfile);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProfile(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const profileName = useMemo(() => {
    if (!profile) return "Adapter Admin";
    return `${profile.firstName} ${profile.lastName}`.trim();
  }, [profile]);

  const profileSubtitle = useMemo(() => {
    if (!profile) return "Admin Console";
    return profile.email;
  }, [profile]);

  const profileDetails = useMemo(() => {
    if (!profile) return null;
    return {
      department: profile.department.trim(),
      position: profile.position.trim(),
    };
  }, [profile]);

  const profileImage = useMemo(() => {
    return profile?.image?.trim() || null;
  }, [profile]);

  const profileInitials = useMemo(() => {
    if (!profile) return "AD";
    return `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();
  }, [profile]);

  const isCollapsed = state === "collapsed";

  // ── Credit balance state ──────────────────────────────────────────────────
  const [credits, setCredits] = useState<number | null>(null);
  const [usedToday, setUsedToday] = useState(0);
  const [usedTotal, setUsedTotal] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyItems, setHistoryItems] = useState<CreditTransaction[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySortAsc, setHistorySortAsc] = useState(false);
  const HISTORY_LIMIT = 10;
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpSubmitting, setTopUpSubmitting] = useState(false);
  const [topUpError, setTopUpError] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const { unreadCount, push: pushNotif } = useNotifications();

  // Refresh credit balance when a tool run completes or is refunded
  useEffect(() => {
    function handleCreditRefresh() {
      getUserCredits().then((b) => setCredits(b.credits)).catch(() => {});
    }
    window.addEventListener("adt:credit-refresh", handleCreditRefresh);
    return () => window.removeEventListener("adt:credit-refresh", handleCreditRefresh);
  }, []);

  useEffect(() => {
    getUserCredits().then((b) => setCredits(b.credits)).catch(() => { });
    // Fetch recent history to compute usage stats
    getCreditHistory({ page: 1, limit: 100 })
      .then((res) => {
        const today = new Date();
        const charges = (res.data ?? []).filter((tx) => tx.amount < 0);
        // today's usage
        const todayUsed = charges
          .filter((tx) => {
            const d = new Date(tx.createdAt);
            return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
          })
          .reduce((acc, tx) => acc + Math.abs(tx.amount), 0);
        // all-time usage from fetched history (best approximation)
        const allUsed = charges.reduce((acc, tx) => acc + Math.abs(tx.amount), 0);
        setUsedToday(todayUsed);
        setUsedTotal(allUsed);
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (!historyOpen) return;
    setHistoryLoading(true);
    getCreditHistory({ page: historyPage, limit: HISTORY_LIMIT })
      .then((res) => { setHistoryItems(res.data ?? []); setHistoryTotal(res.total ?? 0); })
      .catch(() => { })
      .finally(() => setHistoryLoading(false));
  }, [historyOpen, historyPage]);

  const historyTotalPages = Math.max(1, Math.ceil(historyTotal / HISTORY_LIMIT));
  const sortedHistoryItems = historySortAsc
    ? [...historyItems].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    : [...historyItems].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  function txTypeBadge(type: string) {
    const m: Record<string, string> = {
      admin_adjust: "bg-amber-50 text-amber-600 border-amber-200/60",
      charge: "bg-rose-50 text-rose-500 border-rose-200/60",
      topup: "bg-emerald-50 text-emerald-600 border-emerald-200/60",
      refund: "bg-sky-50 text-sky-600 border-sky-200/60",
      bonus: "bg-violet-50 text-violet-600 border-violet-200/60",
    };
    return m[type] ?? "bg-slate-50 text-slate-500 border-slate-200/60";
  }
  function txIconBg(type: string) {
    const m: Record<string, string> = {
      admin_adjust: "bg-amber-100 text-amber-600",
      charge: "bg-rose-100 text-rose-500",
      topup: "bg-emerald-100 text-emerald-600",
      refund: "bg-sky-100 text-sky-600",
      bonus: "bg-violet-100 text-violet-600",
    };
    return m[type] ?? "bg-slate-100 text-slate-500";
  }
  function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  function fmtDayHeader(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }
  function isSameDay(a: string, b: string) {
    const da = new Date(a), db = new Date(b);
    return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
  }

  async function handleTopUpSubmit(amount: number, description: string) {
    if (!profile) return;
    setTopUpSubmitting(true);
    setTopUpError("");
    try {
      await adjustUserCredits(profile.empid, amount, description);
      setTopUpOpen(false);
      getUserCredits().then((b) => setCredits(b.credits)).catch(() => {});
      router.refresh();
      pushNotif("Credits adjusted", {
        message: `${amount > 0 ? "+" : ""}${amount} credits — ${description}`,
        type: amount > 0 ? "success" : "warning",
      });
    } catch {
      setTopUpError("Failed to adjust credits. Please try again.");
    } finally {
      setTopUpSubmitting(false);
    }
  }

  return (
    <>
      {/* Notification panel */}
      <NotificationPanel open={notifOpen} onOpenChange={setNotifOpen} />

      {/* Top-up credits modal */}
      {topUpOpen && profile && (
        <UserCreditModal
          user={profile}
          isSubmitting={topUpSubmitting}
          submitError={topUpError}
          onSubmit={handleTopUpSubmit}
          onClose={() => { setTopUpOpen(false); setTopUpError(""); }}
        />
      )}

      {/* Credit history drawer */}
      <CreditHistoryDrawer
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        currentBalance={credits}
        usedToday={usedToday}
        usedTotal={usedTotal}
      />

      <SidebarMenu className={isCollapsed ? "items-center" : undefined}>
        <SidebarMenuItem className={isCollapsed ? "mx-auto" : undefined}>
          {/* Credit balance widget — expanded sidebar only */}
          {!isCollapsed && credits !== null && (() => {
            const total = credits + usedTotal;
            const pct = total > 0 ? Math.floor((credits / total) * 100) : 100;
            const isDepleted = credits === 0;
            const isLow = !isDepleted && pct <= 20;
            const barColor = isDepleted ? "bg-rose-400" : pct > 50 ? "bg-white/60" : pct > 20 ? "bg-amber-200" : "bg-rose-300";

            const isUserRole = (profile?.roles ?? []).every(
              (r) => r === "user" || r === "viewer"
            );

            if (isDepleted) {
              return (
                <div className="mb-2 w-full rounded-xl overflow-hidden bg-[#1a0a0a] border border-rose-900/60 shadow-[0_4px_16px_-4px_rgba(220,38,38,0.4)] text-left">
                  {/* Top row */}
                  <div className="px-3 pt-3 pb-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-rose-500/20 text-rose-400">
                          <LucideIcons.Coins className="size-3" />
                        </span>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-rose-400/90">Credits</p>
                      </div>
                      <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wide">Limit reached</span>
                    </div>
                    {/* Balance */}
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-[22px] font-extrabold tabular-nums text-white leading-none tracking-tight">0</span>
                      {usedToday > 0 && (
                        <span className="text-[9px] text-rose-400/70 font-semibold tabular-nums">−{usedToday} today</span>
                      )}
                    </div>
                    {/* Full red bar */}
                    <div className="h-1.5 w-full rounded-full bg-rose-900/40 overflow-hidden">
                      <div className="h-full w-full rounded-full bg-rose-500" />
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-[9px] text-rose-400/60 font-medium">0% remaining</p>
                      {total > 0 && (
                        <p className="text-[9px] text-rose-400/50 tabular-nums font-medium">0<span className="opacity-60">/{total.toLocaleString()}</span></p>
                      )}
                    </div>
                  </div>
                  {/* CTA — only for users who cannot self-adjust */}
                  {isUserRole && (
                    <button
                      type="button"
                      onClick={() => setTopUpOpen(true)}
                      className="group w-full flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 border-t border-rose-900/50 px-3 py-2.5 text-[11px] font-bold text-white transition-all duration-200 cursor-pointer"
                    >
                      <LucideIcons.ArrowUpCircle className="size-3.5 text-rose-400 group-hover:text-rose-300" />
                      Top Up Credits
                    </button>
                  )}
                </div>
              );
            }

            return (
              <button
                type="button"
                onClick={() => { setHistoryPage(1); setHistoryOpen(true); }}
                className={`group mb-2 w-full rounded-xl px-3 pt-2.5 pb-2.5 transition-all duration-200 cursor-pointer text-left ${
                  isLow
                    ? "bg-gradient-to-br from-rose-600 via-rose-500 to-orange-500 shadow-[0_4px_16px_-4px_rgba(220,38,38,0.5)] hover:shadow-[0_6px_20px_-4px_rgba(220,38,38,0.65)] hover:brightness-105"
                    : "bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400 shadow-[0_4px_16px_-4px_rgba(234,88,12,0.55)] hover:shadow-[0_6px_20px_-4px_rgba(234,88,12,0.7)] hover:brightness-105"
                }`}
              >
                {/* Top row: icon + label + chevron */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-white/20 text-white">
                      <LucideIcons.Coins className="size-3" />
                    </span>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-white/80">Credits</p>
                  </div>
                  <LucideIcons.ChevronRight className="size-3 text-white/60 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-200" />
                </div>
                {/* Balance row */}
                <div className="flex items-baseline justify-between mb-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[22px] font-extrabold tabular-nums text-white leading-none tracking-tight drop-shadow-sm">{credits.toLocaleString()}</span>
                    {isLow && (
                      <span className="text-[8px] font-bold text-white/90 uppercase tracking-wide bg-white/20 rounded-full px-1.5 py-0.5 leading-none">Low</span>
                    )}
                  </div>
                  {usedToday > 0 && (
                    <span className="text-[9px] text-white/70 font-semibold tabular-nums">−{usedToday} today</span>
                  )}
                </div>
                {/* Progress bar */}
                <div className="h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-[9px] text-white/60 tabular-nums font-medium">{pct}% remaining</p>
                  {total > 0 && (
                    <p className="text-[9px] text-white/50 tabular-nums font-medium">{credits.toLocaleString()}<span className="opacity-60">/{total.toLocaleString()}</span></p>
                  )}
                </div>
              </button>
            );
          })()}

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                isCollapsed ? (
                  <button
                    type="button"
                    aria-label={profileName}
                    title={profileName}
                    className="flex size-8 items-center justify-center bg-transparent p-0 text-inherit shadow-none outline-hidden ring-0 transition hover:bg-transparent hover:text-inherit focus-visible:ring-0 active:bg-transparent active:text-inherit"
                  />
                ) : (
                  <SidebarMenuButton
                    size="lg"
                    className="min-h-16 rounded-2xl border border-slate-200/80 bg-white/85 px-3 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.95)] transition hover:border-slate-300 hover:bg-white aria-expanded:border-slate-300 aria-expanded:bg-white"
                  />
                )
              }
            >
              <div className="relative rounded-full bg-brand/20 p-0.75 shadow-[0_10px_24px_-14px_rgba(15,23,42,0.55)] ring-1 ring-slate-200/80 group-data-[collapsible=icon]:p-0.5 group-data-[collapsible=icon]:shadow-[0_12px_20px_-16px_rgba(15,23,42,0.45)]">
                <span
                  className="absolute right-0 top-0 hidden size-2.5 translate-x-1/5 -translate-y-1/5 rounded-full border-2 border-white bg-emerald-400 shadow-sm group-data-[collapsible=icon]:block"
                  aria-hidden="true"
                />
                <Avatar className="size-10 bg-white group-data-[collapsible=icon]:size-7">
                  {profileImage ? (
                    <AvatarImage src={profileImage} alt={profileName} />
                  ) : null}
                  <AvatarFallback className="bg-brand text-[11px] font-semibold tracking-tight text-white shadow-inner">
                    {profileInitials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold text-slate-900">
                  {profileName}
                </span>
                <span className="truncate text-xs text-slate-500">
                  {profileSubtitle}
                </span>
              </div>
              <LucideIcons.ChevronsUpDown className="ml-auto size-4 text-slate-400 group-data-[collapsible=icon]:hidden" />
              {isCollapsed ? (
                <span className="sr-only">{profileName}</span>
              ) : null}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="min-w-64 rounded-2xl border border-slate-200 bg-white p-1 shadow-2xl"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-3 rounded-xl bg-linear-to-br from-slate-50 via-white to-sky-50/70 px-3 py-3 text-left text-sm">
                    <div className="rounded-full bg-brand/20 p-1 shadow-inner ring-1 ring-slate-200/80">
                      <Avatar className="size-10 bg-white">
                        {profileImage ? (
                          <AvatarImage src={profileImage} alt={profileName} />
                        ) : null}
                        <AvatarFallback className="bg-brand text-[11px] font-semibold tracking-tight text-white shadow-inner">
                          {profileInitials}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold text-slate-900">
                        {profileName}
                      </span>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px]">
                        {profileDetails ? (
                          <>
                            <span
                              className={`rounded-full px-2 py-0.5 font-semibold ring-1 ${getDepartmentBadgeClass(profileDetails.department)}`}
                            >
                              {profileDetails.department}
                            </span>
                            <span className="truncate font-medium text-slate-500">
                              {profileDetails.position}
                            </span>
                          </>
                        ) : (
                          <span className="truncate text-slate-500">
                            Workspace Console
                          </span>
                        )}
                      </div>
                      {credits !== null && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/70 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                            <LucideIcons.Coins className="size-2.5 shrink-0" />
                            {credits.toLocaleString()} credits
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem className="rounded-xl" onClick={() => setNotifOpen(true)}>
                  <div className="relative">
                    <LucideIcons.Bell className="size-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex size-3.5 items-center justify-center rounded-full bg-brand text-white text-[7px] font-bold">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </div>
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="ml-auto inline-flex items-center justify-center rounded-full bg-brand/10 text-brand text-[9px] font-bold min-w-[18px] h-4 px-1">
                      {unreadCount}
                    </span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="rounded-xl"
                  onClick={() => router.push("/api/auth/logout")}
                >
                  <LucideIcons.LogOut />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  );
}

export function ManageSidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [navProfile, setNavProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    getUserProfile().then(setNavProfile).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;

    void getManageMenus()
      .then(async (menus) => {
        if (cancelled) return;

        // Dynamic route check using Server Action
        const checkedItems = await Promise.all(
          menus.map(async (m) => {
            const isImplemented = await checkRouteImplemented(m.path);
            return isImplemented ? m : null;
          })
        );
        const activeMenus = checkedItems.filter((m): m is NonNullable<typeof m> => m !== null);

        // Grouping logic:
        // type "main" -> Overview  (excludes keys)
        // type "manage" -> Workspace (excludes keys)
        // path /keys or /manage/keys -> Developer (always)
        const isDeveloperItem = (m: { path: string }) =>
          m.path === "/keys" || m.path === "/manage/keys";

        const resolveHref = (path: string) =>
          path === "/manage/dashboard" ? "/manage" : path === "/keys" ? "/manage/keys" : path;

        const overviewItems = activeMenus.filter((m) => m.type === "main" && !isDeveloperItem(m));
        const manageItems = activeMenus.filter((m) => m.type === "manage" && !isDeveloperItem(m));
        const developerItems = activeMenus.filter(isDeveloperItem);
        const nextSections: MenuSection[] = [];

        if (overviewItems.length > 0) {
          nextSections.push({
            title: "Overview",
            href: "/manage",
            icon: LucideIcons.Home,
            items: overviewItems.map((m) => ({
              title: m.name,
              href: resolveHref(m.path),
              icon: ICON_MAP[m.icon],
            })),
          });
        }

        if (manageItems.length > 0) {
          const firstPath = manageItems[0].path;
          nextSections.push({
            title: getLocalizedText(MANAGE_PARENT_CRUMB),
            href: firstPath === "/manage/dashboard" ? "/manage" : firstPath,
            icon: LucideIcons.Layers,
            items: manageItems.map((m) => ({
              title: m.name,
              href: resolveHref(m.path),
              icon: ICON_MAP[m.icon],
            })),
          });
        }

        // Always show Developers group — includes API Keys (from API) + static docs links
        // API Reference is only shown to users with the "developer" role
        const isDeveloperRole = (navProfile?.roles ?? []).some(
          (r) => r === "developer" || r === "system-admin" || r === "admin"
        );
        nextSections.push({
          title: "Developers",
          href: developerItems.length > 0 ? "/manage/keys" : "/docs",
          icon: LucideIcons.Code2,
          items: [
            ...developerItems.map((m) => ({
              title: m.name,
              href: resolveHref(m.path),
              icon: ICON_MAP[m.icon],
            })),
            ...(isDeveloperRole ? [{
              title: "API Reference",
              href: "/docs",
              icon: LucideIcons.BookOpen,
              external: true,
            }] : []),
          ],
        });

        setSections(nextSections);

        // Initial open state
        const initialOpen = Object.fromEntries(
          nextSections.map((section) => [
            section.title,
            section.items.some((item) => isActivePath(pathname, item.href)),
          ]),
        );
        setOpenSections(initialOpen);
      })
      .catch((err) => {
        console.error("Failed to fetch manage menus:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, navProfile]);

  useEffect(() => {
    if (isMobile && setOpenMobile) {
      setOpenMobile(false);
    }
  }, [pathname, isMobile, setOpenMobile]);

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className={isCollapsed ? "items-center" : undefined}>
        {isMobile && (
          <div className="flex items-center justify-between px-2 pt-2 pb-1">
            <ManageLogo width={110} height={32} alt="Adapter Digital Group" />
            <button
              type="button"
              onClick={() => setOpenMobile?.(false)}
              aria-label="Close menu"
              className="flex size-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <LucideIcons.X className="size-5" />
            </button>
          </div>
        )}
        {!isMobile && (
          <SidebarMenu className={isCollapsed ? "items-center" : undefined}>
            <SidebarMenuItem className={isCollapsed ? "mx-auto" : undefined}>
              <SidebarMenuButton
                size="lg"
                className={isCollapsed ? "h-auto justify-center" : "h-auto"}
                render={<Link href="/manage" />}
              >
                <div className="hidden aspect-square size-8 items-center justify-center overflow-hidden rounded-2xl bg-[#C20019] shadow-[0_16px_24px_-16px_rgba(194,0,25,0.75)] ring-1 ring-black/5 group-data-[collapsible=icon]:flex">
                  <Image
                    src="/images/logo/logo-app-1200x1200.svg"
                    alt="Adapter app logo"
                    width={32}
                    height={32}
                    className="size-full object-cover"
                    priority
                  />
                </div>
                <div className="group-data-[collapsible=icon]:hidden">
                  <ManageLogo
                    width={130}
                    height={38}
                    alt="Adapter Digital Group"
                  />
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* Helper: renders a list of sections into collapsible menu items */}
        {(["Management", "Developers"] as const).map((groupLabel) => {
          const groupSections = sections.filter((s) =>
            groupLabel === "Developers" ? s.title === "Developers" : s.title !== "Developers"
          );
          if (groupSections.length === 0) return null;
          return (
            <SidebarGroup key={groupLabel}>
              <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500/80">
                {groupLabel}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {groupSections.map((section) => {
                    const Icon = section.icon;
                    const isSectionActive = section.items.some((item) =>
                      isActivePath(pathname, item.href),
                    );
                    return (
                      <Collapsible
                        key={section.title}
                        open={openSections[section.title] ?? isSectionActive}
                        onOpenChange={(open) => {
                          setOpenSections((previous) => ({
                            ...previous,
                            [section.title]: open,
                          }));
                        }}
                        render={<SidebarMenuItem />}
                      >
                        <SidebarMenuButton
                          tooltip={section.title}
                          isActive={isSectionActive}
                          render={
                            isMobile && section.items.length > 0
                              ? <button type="button" />
                              : <Link href={section.href} />
                          }
                          onClick={() => {
                            if (isMobile && section.items.length > 0) {
                              setOpenSections((prev) => {
                                const current = prev[section.title] ?? isSectionActive;
                                return { ...prev, [section.title]: !current };
                              });
                            } else if (!isMobile) {
                              router.push(section.href);
                            }
                          }}
                        >
                          <Icon />
                          <span>{section.title}</span>
                        </SidebarMenuButton>
                        {section.items.length > 0 && (
                          <>
                            <CollapsibleTrigger
                              render={
                                <SidebarMenuAction className="aria-expanded:rotate-90" />
                              }
                            >
                              <LucideIcons.ChevronRight className="size-4" />
                              <span className="sr-only">Toggle {section.title}</span>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub className="ml-0 border-l-0 px-1.5">
                                {section.items.map((item) => (
                                  <SidebarMenuSubItem key={item.href}>
                                    <SidebarMenuSubButton
                                      isActive={isActivePath(pathname, item.href)}
                                      className="h-9 text-slate-400 data-[active=true]:text-brand"
                                      render={<Link href={item.href} {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})} />}
                                      onClick={() => {
                                        if (isMobile) setOpenMobile?.(false);
                                      }}
                                    >
                                      {item.icon && (
                                        <item.icon className="size-4 opacity-70" />
                                      )}
                                      <span className="transition-colors group-data-[active=true]:text-brand!">
                                        {item.title}
                                      </span>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </>
                        )}
                      </Collapsible>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className={isCollapsed ? "items-center" : undefined}>
        <ManageSidebarFooter />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
