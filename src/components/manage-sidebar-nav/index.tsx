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
import { getUserCredits, getCreditHistory } from "@/core/services/users.service";
import type { CreditTransaction } from "@/core/services/users.service";
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
  items: { title: string; href: string; icon?: LucideIcon }[];
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
  const HISTORY_LIMIT = 10;

  useEffect(() => {
    getUserCredits().then((b) => setCredits(b.credits)).catch(() => {});
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
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!historyOpen) return;
    setHistoryLoading(true);
    getCreditHistory({ page: historyPage, limit: HISTORY_LIMIT })
      .then((res) => { setHistoryItems(res.data ?? []); setHistoryTotal(res.total ?? 0); })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [historyOpen, historyPage]);

  const historyTotalPages = Math.max(1, Math.ceil(historyTotal / HISTORY_LIMIT));

  function txColor(amount: number) {
    return amount > 0 ? "text-emerald-600" : "text-rose-500";
  }
  function txBg(type: string) {
    const m: Record<string, string> = {
      admin_adjust: "bg-amber-50 text-amber-600",
      charge: "bg-rose-50 text-rose-500",
      topup: "bg-emerald-50 text-emerald-600",
      refund: "bg-sky-50 text-sky-600",
      bonus: "bg-violet-50 text-violet-600",
    };
    return m[type] ?? "bg-slate-50 text-slate-500";
  }
  function fmtDate(iso: string) {
    return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  }

  return (
    <>
    {/* Credit history drawer */}
    <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
      <SheetContent side="left" className="w-[340px] sm:w-[400px] flex flex-col p-0 overflow-hidden">
        <SheetHeader className="px-5 py-4 border-b border-slate-100 shrink-0">
          <SheetTitle className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <LucideIcons.Coins className="size-4 text-amber-500" />
            Credit Transaction History
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {historyLoading ? (
            <div className="flex items-center justify-center py-12">
              <LucideIcons.Loader2 className="size-5 animate-spin text-slate-300" />
            </div>
          ) : historyItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <LucideIcons.Coins className="size-8 text-amber-200" />
              <p className="text-xs text-slate-400">No transactions yet.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {historyItems.map((tx) => {
                const isCredit = tx.amount > 0;
                return (
                  <div key={tx.id} className="flex items-center gap-3 rounded-2xl px-3 py-3 bg-white border border-slate-100/80 hover:border-slate-200 hover:bg-slate-50/50 transition-all duration-150">
                    {/* Icon circle */}
                    <div className={`relative flex size-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold uppercase ${txBg(tx.type)}`}>
                      {tx.type.slice(0, 2).toUpperCase()}
                      {/* Direction indicator */}
                      <span className={`absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full border-2 border-white ${isCredit ? "bg-emerald-500" : "bg-rose-500"}`}>
                        {isCredit
                          ? <LucideIcons.ArrowUpRight className="size-2.5 text-white" />
                          : <LucideIcons.ArrowDownRight className="size-2.5 text-white" />
                        }
                      </span>
                    </div>
                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-800 leading-snug">{tx.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[9px] text-slate-400">{fmtDate(tx.createdAt)}</p>
                        {tx.clientType && (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-1.5 py-0 text-[8px] font-bold uppercase tracking-wide text-slate-500">
                            {tx.clientType}
                          </span>
                        )}
                        <span className={`inline-flex items-center rounded-full px-1.5 py-0 text-[8px] font-bold uppercase tracking-wide ${txBg(tx.type)}`}>
                          {tx.type.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                    {/* Amount */}
                    <span className={`shrink-0 text-sm font-bold tabular-nums ${isCredit ? "text-emerald-600" : "text-rose-500"}`}>
                      {isCredit ? "+" : ""}{tx.amount.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {historyTotalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 shrink-0">
            <button type="button" disabled={historyPage <= 1} onClick={() => setHistoryPage(p => p - 1)}
              className="text-[11px] font-semibold text-slate-500 hover:text-brand disabled:opacity-40 cursor-pointer transition-colors">
              ← Prev
            </button>
            <span className="text-[11px] text-slate-400 tabular-nums">{historyPage} / {historyTotalPages}</span>
            <button type="button" disabled={historyPage >= historyTotalPages} onClick={() => setHistoryPage(p => p + 1)}
              className="text-[11px] font-semibold text-slate-500 hover:text-brand disabled:opacity-40 cursor-pointer transition-colors">
              Next →
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>

    <SidebarMenu className={isCollapsed ? "items-center" : undefined}>
      <SidebarMenuItem className={isCollapsed ? "mx-auto" : undefined}>
        {/* Credit balance widget — expanded sidebar only */}
        {!isCollapsed && credits !== null && (() => {
          const total = credits + usedTotal;
          const pct = total > 0 ? Math.floor((credits / total) * 100) : 100;
          const barColor = pct > 50 ? "bg-white/60" : pct > 20 ? "bg-amber-200" : "bg-rose-300";
          return (
            <button
              type="button"
              onClick={() => { setHistoryPage(1); setHistoryOpen(true); }}
              className="group mb-2 w-full rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400 px-3 pt-2.5 pb-2.5 shadow-[0_4px_16px_-4px_rgba(234,88,12,0.55)] hover:shadow-[0_6px_20px_-4px_rgba(234,88,12,0.7)] hover:brightness-105 transition-all duration-200 cursor-pointer text-left"
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
                <span className="text-[22px] font-extrabold tabular-nums text-white leading-none tracking-tight drop-shadow-sm">{credits.toLocaleString()}</span>
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
              <p className="mt-1 text-[9px] text-white/60 tabular-nums font-medium">{pct}% remaining</p>
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
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="rounded-xl">
                <LucideIcons.Bell />
                Notifications
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
        // type "main" -> Overview
        // type "manage" -> Workspace
        const overviewItems = activeMenus.filter((m) => m.type === "main");
        const manageItems = activeMenus.filter((m) => m.type === "manage");
        const nextSections: MenuSection[] = [];

        if (overviewItems.length > 0) {
          nextSections.push({
            title: "Overview",
            href: "/manage",
            icon: LucideIcons.Home,
            items: overviewItems.map((m) => ({
              title: m.name,
              href:
                m.path === "/manage/dashboard"
                  ? "/manage"
                  : m.path === "/keys"
                    ? "/manage/keys"
                    : m.path,
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
              href:
                m.path === "/manage/dashboard"
                  ? "/manage"
                  : m.path === "/keys"
                    ? "/manage/keys"
                    : m.path,
              icon: ICON_MAP[m.icon],
            })),
          });
        }

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
  }, [pathname]);

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
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500/80">
            Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sections.map((section) => {
                const Icon = section.icon;
                const isSectionActive = section.items.some((item) =>
                  isActivePath(pathname, item.href),
                );

                return (
                  <Collapsible
                    key={section.title}
                    open={
                      openSections[section.title] ?? isSectionActive
                    }
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
                          <span className="sr-only">
                            Toggle {section.title}
                          </span>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub className="ml-0 border-l-0 px-1.5">
                            {section.items.map((item) => (
                              <SidebarMenuSubItem key={item.href}>
                                <SidebarMenuSubButton
                                  isActive={isActivePath(pathname, item.href)}
                                  className="h-9 text-slate-400 data-[active=true]:text-brand"
                                  render={<Link href={item.href} />}
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

      </SidebarContent>

      <SidebarFooter className={isCollapsed ? "items-center" : undefined}>
        <ManageSidebarFooter />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
