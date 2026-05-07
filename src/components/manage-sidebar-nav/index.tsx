"use client";

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
  ShieldCheck,
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

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  const { isMobile } = useSidebar();
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

  const profileInitials = useMemo(() => {
    if (!profile) return "AD";
    return `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();
  }, [profile]);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="aria-expanded:bg-sidebar-accent"
              />
            }
          >
            <Avatar>
              <AvatarFallback>{profileInitials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-medium">{profileName}</span>
              <span className="truncate text-xs text-sidebar-foreground/70">
                {profileSubtitle}
              </span>
            </div>
            <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar>
                    <AvatarFallback>{profileInitials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{profileName}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {profileDetails}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => router.push("/manage/apps?action=create")}
              >
                <Plus />
                Create App
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/manage/models?action=create")}
              >
                <BadgeCheck />
                Create Model
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/api/auth/logout")}>
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

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="h-auto"
              render={<Link href="/manage" />}
            >
              <div className="hidden aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground group-data-[collapsible=icon]:flex">
                <ShieldCheck className="size-4" />
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

      <SidebarFooter>
        <ManageSidebarFooter />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
