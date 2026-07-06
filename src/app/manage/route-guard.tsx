"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getManageMenus } from "@/core/services/menus.service";
import { getUserProfile } from "@/core/services/users.service";
import type { UserRole } from "@/core/interfaces/auth.interface";
import { Loader2, ShieldAlert } from "lucide-react";
import { customToast } from "@/components/ui/sonner";

// Loop DevStudio can run shell/git/npm commands and write files on disk, so it is
// gated to super admins only (keep in sync with the sidebar menu visibility).
const LOOP_STUDIO_ROLES: UserRole[] = ["system-admin"];

function isLoopStudioPath(pathname: string): boolean {
  return (
    pathname === "/manage/loop-projects" ||
    pathname.startsWith("/manage/loop-projects/")
  );
}

export function ManageRouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(() => {
      if (cancelled) return;
      setChecking(true);
      setForbidden(false);
    });

    // Loop DevStudio is role-gated (elevated roles only), not menu-driven.
    if (isLoopStudioPath(pathname)) {
      getUserProfile()
        .then((profile) => {
          if (cancelled) return;
          const allowed = profile.roles?.some((r) => LOOP_STUDIO_ROLES.includes(r)) ?? false;
          if (allowed) {
            setChecking(false);
          } else {
            setForbidden(true);
            customToast.error("You do not have permission to access Loop DevStudio.");
            router.replace("/manage");
          }
        })
        .catch((err) => {
          if (cancelled) return;
          console.error("Loop DevStudio role check failed:", err);
          setForbidden(true);
          router.replace("/manage");
        });
      return;
    }

    getManageMenus()
      .then((menus) => {
        if (cancelled) return;

        // Base paths that are always public / allowed
        const alwaysAllowed = ["/manage", "/", "/dashboard", "/projects", "/docs"];
        const isPublicPath = alwaysAllowed.includes(pathname);
        if (isPublicPath) {
          setChecking(false);
          return;
        }

        // Check if the current pathname starts with any of the allowed menu paths
        const isAllowed = menus.some((m) => {
          const resolvePath =
            m.path === "/keys" ? "/manage/keys"
            : m.path === "/manage/dashboard" ? "/manage"
            : m.path;
          return pathname === resolvePath || pathname.startsWith(resolvePath + "/");
        });

        if (!isAllowed) {
          setForbidden(true);
          customToast.error("You do not have permission to access this page.");
          router.replace("/manage");
        } else {
          setChecking(false);
        }
      })
      .catch((err) => {
        console.error("Route guard check failed:", err);
        setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (checking) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-slate-450" />
        <p className="text-xs font-semibold text-slate-500 font-sans">Checking permissions...</p>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4 text-center font-sans">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-100">
          <ShieldAlert className="size-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-slate-800">Access Denied</h3>
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
            You do not have permission to view this resource.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
