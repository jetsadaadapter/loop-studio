import type { ReactNode } from "react";

import { ManageSidebarNav } from "@/components/manage-sidebar-nav";
import { ManageTopbar } from "@/components/manage-topbar";
import { ManageFooter } from "@/components/manage-footer";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function ProjectsLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <ManageSidebarNav />
      <SidebarInset className="flex flex-col min-h-screen bg-white overflow-hidden">
        <header className="sticky top-0 z-20 flex h-14 items-center border-b border-slate-200/60 bg-white/80 px-3 backdrop-blur sm:px-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <SidebarTrigger className="shrink-0" />
            <div className="h-5 w-px bg-slate-200" aria-hidden="true" />
            <ManageTopbar />
          </div>
        </header>
        <main className="flex-1 w-full p-3 sm:p-4">{children}</main>
        <ManageFooter />
      </SidebarInset>
    </SidebarProvider>
  );
}
