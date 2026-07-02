"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getManageBreadcrumbItems } from "@/app/manage/config";
import { getManageMenus } from "@/core/services/menus.service";
import { type ManageMenuItem } from "@/core/interfaces/menus.interface";

export function ManageTopbar() {
  const pathname = usePathname();
  const [menus, setMenus] = useState<ManageMenuItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    void getManageMenus()
      .then((data) => {
        if (!cancelled) setMenus(data);
      })
      .catch((err) => {
        console.error("Failed to fetch manage menus for topbar:", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const breadcrumbs = useMemo(() => {
    return getManageBreadcrumbItems(pathname, "th", menus);
  }, [pathname, menus]);

  return (
    <div className="min-w-0">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <div
              key={`${item.label}-${index}`}
              className="flex min-w-0 items-center gap-1.5"
            >
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="truncate font-medium hover:text-slate-700"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={
                    isLast
                      ? "truncate font-semibold text-slate-900"
                      : "truncate font-medium"
                  }
                >
                  {item.label}
                </span>
              )}
              {!isLast ? (
                <ChevronRight className="size-3 text-slate-400" />
              ) : null}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
