"use client";

import React from "react";
import Link from "next/link";
import { Home, ChevronRight } from "lucide-react";

export interface Crumb {
    label: string;
    /** Omit for the current page (rendered as plain text, not a link). */
    href?: string;
}

interface BreadcrumbsProps {
    /** Trail after the implicit Home root, e.g. [{label: "Project", href}, {label: "Task"}]. */
    items: Crumb[];
}

// Compact breadcrumb trail for sub-pages: Home icon → intermediate links →
// current page. Keeps back-navigation one click away from anywhere.
export function Breadcrumbs({ items }: BreadcrumbsProps) {
    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs font-sans">
            <Link
                href="/"
                className="flex items-center gap-1 rounded-sm px-1 py-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Dashboard"
            >
                <Home className="size-3.5" />
            </Link>
            {items.map((item, i) => {
                const isLast = i === items.length - 1;
                return (
                    <React.Fragment key={`${item.label}-${i}`}>
                        <ChevronRight className="size-3 shrink-0 text-slate-300" />
                        {item.href && !isLast ? (
                            <Link
                                href={item.href}
                                className="max-w-[180px] truncate rounded-sm px-1 py-0.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <span aria-current={isLast ? "page" : undefined} className="max-w-[220px] truncate px-1 py-0.5 font-semibold text-slate-700">
                                {item.label}
                            </span>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
}
