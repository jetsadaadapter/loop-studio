"use client";

import React from "react";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";
import { cn } from "@/lib/utils";

interface TopBarProps {
    /** Breadcrumb trail (Home implicit). Takes priority over `title` when present. */
    crumbs?: Crumb[];
    /** Page title, used when there's no breadcrumb trail to show (e.g. the root dashboard). */
    title?: string;
    subtitle?: string;
    /** Right-aligned buttons/controls. */
    actions?: React.ReactNode;
    className?: string;
}

// Shared sticky top bar for the app's list-style pages: breadcrumb or title on
// the left, primary actions on the right. Consolidates what used to be three
// slightly different hand-rolled headers (dashboard h1, agents' inline sticky
// div, StickyCrumbs) into one component for the pages that don't have their
// own bespoke banner (project workspace keeps WorkspaceHeader as-is).
export function TopBar({ crumbs, title, subtitle, actions, className }: TopBarProps) {
    return (
        <div
            className={cn(
                "sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-slate-100 bg-white px-6 py-3",
                className,
            )}
        >
            <div className="min-w-0">
                {crumbs ? (
                    <Breadcrumbs items={crumbs} />
                ) : title ? (
                    <h1 className="truncate text-sm font-bold tracking-tight text-slate-800">{title}</h1>
                ) : null}
                {subtitle && <p className="mt-0.5 truncate text-[11px] text-slate-500 font-sans">{subtitle}</p>}
            </div>
            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
    );
}
