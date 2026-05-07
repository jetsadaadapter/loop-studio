"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getManageBreadcrumbItems } from "@/app/manage/config";

export function ManageTopbar() {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    return getManageBreadcrumbItems(pathname);
  }, [pathname]);

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
