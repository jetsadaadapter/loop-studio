"use client";

import React from "react";
import Link from "next/link";
import { ListChecks, Settings, LayoutGrid, type LucideIcon } from "lucide-react";

// Workspace navigation as underline tabs, per the reference layout:
// Board (kanban) and Tasks (list), with the Settings shortcut kept on the right
// of the same row. `variant` = "onGradient" restyles for the coloured header.
export type WorkspaceViewTab = "board" | "task";

const TABS: { key: WorkspaceViewTab; label: string; icon: LucideIcon }[] = [
    { key: "board", label: "Board", icon: LayoutGrid },
    { key: "task", label: "Tasks", icon: ListChecks },
];

interface ViewTabsProps {
    viewTab: WorkspaceViewTab;
    onChange: (tab: WorkspaceViewTab) => void;
    variant?: "light" | "onGradient";
}

export function ViewTabs({ viewTab, onChange, variant = "light" }: ViewTabsProps) {
    const onGrad = variant === "onGradient";
    const rowCls = `flex items-center gap-5 border-b shrink-0 select-none overflow-x-auto ${
        onGrad ? "border-white/25" : "border-slate-200/70"
    }`;
    const activeCls = onGrad ? "border-white text-white" : "border-brand text-brand";
    const inactiveCls = onGrad
        ? "border-transparent text-white/70 hover:text-white"
        : "border-transparent text-slate-500 hover:text-slate-700";
    const settingsCls = onGrad ? "text-white/70 hover:text-white" : "text-slate-500 hover:text-slate-700";
    const item = "relative -mb-px flex items-center gap-1.5 border-b-2 px-1 pb-2 pt-1 text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap";

    return (
        <div className={rowCls}>
            {TABS.map(({ key, label, icon: Icon }) => {
                const active = viewTab === key;
                return (
                    <button key={key} onClick={() => onChange(key)} className={`${item} ${active ? activeCls : inactiveCls}`}>
                        <Icon className="size-3.5" />
                        {label}
                    </button>
                );
            })}

            <Link href="/agents" className={`${item} ml-auto border-transparent ${settingsCls}`}>
                <Settings className="size-3.5" />
                Settings
            </Link>
        </div>
    );
}
