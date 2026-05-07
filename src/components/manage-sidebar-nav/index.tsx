"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BadgeCheck,
  Bell,
  Bot,
  ChevronRight,
  ChevronsUpDown,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Plus,
} from "lucide-react";
import type { UserProfile } from "@/core/interfaces/auth.interface";
import {
  MANAGE_PARENT_CRUMB,
  MANAGE_DASHBOARD_FLAGS,
  MANAGE_FUTURE_NAV_ITEMS,
  getLocalizedText,
} from "@/app/manage/config";
import { ManageLogo } from "@/components/manage-logo";
import { getUserProfile } from "@/core/services/library.service";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

const manageSections = [
  {
    title: "ภาพรวม",
    href: "/manage",
    icon: LayoutDashboard,
    items: [{ title: "แดชบอร์ด", href: "/manage" }],
  },
  {
    title: getLocalizedText(MANAGE_PARENT_CRUMB),
    href: "/manage/apps",
    icon: LayoutGrid,
    items: [
      { title: "แอป", href: "/manage/apps" },
      { title: "โมเดล AI", href: "/manage/models" },
    ],
  },
] as const;

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
    if (!profile) return "Admin workspace";
    return profile.email;
  }, [profile]);

  const profileDetails = useMemo(() => {
    if (!profile) return "Workspace Console";
    const position = profile.position.trim();
    return position
      ? `${profile.department} • ${position}`
      : profile.department;
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
            <div className="relative rounded-full bg-linear-to-br from-sky-100 via-white to-violet-100 p-0.75 shadow-[0_10px_24px_-14px_rgba(15,23,42,0.55)] ring-1 ring-slate-200/80 group-data-[collapsible=icon]:p-0.5 group-data-[collapsible=icon]:shadow-[0_12px_20px_-16px_rgba(15,23,42,0.45)]">
              <span
                className="absolute right-0 top-0 hidden size-2.5 translate-x-1/5 -translate-y-1/5 rounded-full border-2 border-white bg-emerald-400 shadow-sm group-data-[collapsible=icon]:block"
                aria-hidden="true"
              />
              <Avatar className="size-10 bg-white group-data-[collapsible=icon]:size-7">
                {profileImage ? (
                  <AvatarImage src={profileImage} alt={profileName} />
                ) : null}
                <AvatarFallback className="bg-linear-to-br from-rose-500 via-red-500 to-orange-400 text-[11px] font-semibold tracking-tight text-white shadow-inner">
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
            <ChevronsUpDown className="ml-auto size-4 text-slate-400 group-data-[collapsible=icon]:hidden" />
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
                  <div className="rounded-full bg-linear-to-br from-sky-100 via-white to-violet-100 p-1 shadow-inner ring-1 ring-slate-200/80">
                    <Avatar className="size-10 bg-white">
                      {profileImage ? (
                        <AvatarImage src={profileImage} alt={profileName} />
                      ) : null}
                      <AvatarFallback className="bg-linear-to-br from-rose-500 via-red-500 to-orange-400 text-[11px] font-semibold tracking-tight text-white shadow-inner">
                        {profileInitials}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-slate-900">
                      {profileName}
                    </span>
                    <span className="truncate text-xs text-slate-500">
                      {profileDetails}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="rounded-xl"
                onClick={() => router.push("/manage/apps?action=create")}
              >
                <Plus />
                Create App
              </DropdownMenuItem>
              <DropdownMenuItem
                className="rounded-xl"
                onClick={() => router.push("/manage/models?action=create")}
              >
                <BadgeCheck />
                Create Model
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl">
                <Bell />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="rounded-xl"
                onClick={() => router.push("/api/auth/logout")}
              >
                <LogOut />
                Log out
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
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    () => {
      return Object.fromEntries(
        manageSections.map((section) => [
          section.title,
          section.items.some((item) => isActivePath(pathname, item.href)),
        ]),
      );
    },
  );
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
                  width={120}
                  height={34}
                  alt="Adapter digital group"
                />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {manageSections.map((section) => {
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
                    <CollapsibleTrigger
                      render={
                        <SidebarMenuAction className="aria-expanded:rotate-90" />
                      }
                    >
                      <ChevronRight className="size-4" />
                      <span className="sr-only">Toggle {section.title}</span>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {section.items.map((item) => (
                          <SidebarMenuSubItem key={item.href}>
                            <SidebarMenuSubButton
                              isActive={isActivePath(pathname, item.href)}
                              render={<Link href={item.href} />}
                            >
                              <span>{item.title}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {MANAGE_DASHBOARD_FLAGS.showComingSoon ? (
          <SidebarGroup className="mt-auto">
            <SidebarGroupLabel>Coming Soon</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {MANAGE_FUTURE_NAV_ITEMS.map((item) => {
                  const label = getLocalizedText(item.label);
                  return (
                    <SidebarMenuItem key={label}>
                      <SidebarMenuButton
                        disabled
                        size="sm"
                        tooltip={`${label} (เร็วๆ นี้)`}
                      >
                        <Bot className="size-4" />
                        <span>{label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter className={isCollapsed ? "items-center" : undefined}>
        <ManageSidebarFooter />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
