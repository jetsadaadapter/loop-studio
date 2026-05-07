"use client";

import { Bell, LogOut } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ManageHeaderActions() {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="relative h-9 w-9 p-0 hover:bg-slate-100"
      >
        <Bell className="size-4 text-slate-600" />
        <span className="absolute top-1 right-1 size-2 rounded-full bg-red-500"></span>
      </Button>

      <div className="mx-1 h-6 w-px bg-slate-200"></div>

      <Link
        href="/api/auth/logout"
        className="flex h-9 w-9 items-center justify-center rounded-md p-0 transition-colors hover:bg-slate-100"
      >
        <LogOut className="size-4 text-slate-600" />
      </Link>
    </div>
  );
}
