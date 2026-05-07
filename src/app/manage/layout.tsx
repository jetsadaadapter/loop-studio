import type { ReactNode } from "react";

import { ManageSidebarNav } from "@/components/manage-sidebar-nav";
import { ManageTopbar } from "@/components/manage-topbar";
import { ProfileAvatarMenu } from "@/components/profile-avatar-menu";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function ManageLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <ManageSidebarNav />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200/80 bg-white/80 px-3 backdrop-blur sm:px-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <SidebarTrigger className="shrink-0" />
            <div className="h-5 w-px bg-slate-200" aria-hidden="true" />
            <ManageTopbar />
          </div>
          <div className="ml-4 shrink-0">
            <ProfileAvatarMenu />
          </div>
        </header>
        <div className="w-full p-3 sm:p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
