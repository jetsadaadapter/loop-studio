"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Workflow } from "lucide-react";

import { ManageSidebarNav } from "@/components/manage-sidebar-nav";
import { ManageTopbar } from "@/components/manage-topbar";
import { ManageFooter } from "@/components/manage-footer";
import { ManageRouteGuard } from "./route-guard";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

// Loop DevStudio is a standalone product (its own dark, v0-style UI), not a
// page inside the App Store's manage console, so it gets a dedicated
// full-bleed shell here instead of the sidebar/breadcrumb/footer chrome below.
// Still passes through ManageRouteGuard for the super-admin gate.
function isLoopStudioPath(pathname: string): boolean {
  return pathname === "/manage/loop-projects" || pathname.startsWith("/manage/loop-projects/");
}

export default function ManageLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (isLoopStudioPath(pathname)) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
          <Link
            href="/manage"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-800"
          >
            <ArrowLeft className="size-3.5" />
            Back to App Store
          </Link>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Workflow className="size-3.5 text-brand" />
            Loop DevStudio
          </span>
        </div>
        <main className="p-3 sm:p-5">
          <ManageRouteGuard>{children}</ManageRouteGuard>
        </main>
      </div>
    );
  }

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
        <main className="flex-1 w-full p-3 sm:p-4">
          <ManageRouteGuard>{children}</ManageRouteGuard>
        </main>
        <ManageFooter />
      </SidebarInset>
    </SidebarProvider>
  );
}
