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
  MANAGE_DASHBOARD_FLAGS,
  MANAGE_FUTURE_NAV_ITEMS,
  getLocalizedText,
} from "@/app/manage/config";
import { ManageLogo } from "@/components/manage-logo";
import { getManageMenus } from "@/core/services/menus.service";
import { getUserProfile } from "@/core/services/users.service";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getDepartmentBadgeClass } from "@/lib/utils";
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

  return (
    <SidebarMenu className={isCollapsed ? "items-center" : undefined}>
      <SidebarMenuItem className={isCollapsed ? "mx-auto" : undefined}>
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
  );
}

export function ManageSidebarNav() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;

    void getManageMenus()
      .then((menus) => {
        if (cancelled) return;

        // Grouping logic:
        // type "main" -> Overview
        // type "manage" -> Workspace
        const overviewItems = menus.filter((m) => m.type === "main");
        const manageItems = menus.filter((m) => m.type === "manage");

        const nextSections: MenuSection[] = [];

        if (overviewItems.length > 0) {
          nextSections.push({
            title: "Overview",
            href: "/manage",
            icon: LucideIcons.Home,
            items: overviewItems.map((m) => ({
              title: m.name,
              href: m.path,
              icon: ICON_MAP[m.icon],
            })),
          });
        }

        if (manageItems.length > 0) {
          nextSections.push({
            title: getLocalizedText(MANAGE_PARENT_CRUMB),
            href: manageItems[0].path,
            icon: LucideIcons.Layers,
            items: manageItems.map((m) => ({
              title: m.name,
              href: m.path,
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

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className={isCollapsed ? "items-center" : undefined}>
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
                      isSectionActive || (openSections[section.title] ?? false)
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
                      render={<Link href={section.href} />}
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
