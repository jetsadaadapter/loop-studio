"use client";

import React from "react";
import Link from "next/link";
import { PanelsTopLeft, ListChecks, Settings, LayoutGrid, type LucideIcon } from "lucide-react";

// Workspace navigation as a pill bar: Studio (walkthrough), Board (kanban),
// and Tasks (list). The active tab is a solid brand pill, matching the
// dashboard-style reference design.
export type WorkspaceViewTab = "walkthrough" | "board" | "task";

const TABS: { key: WorkspaceViewTab; label: string; icon: LucideIcon }[] = [
    { key: "walkthrough", label: "Studio", icon: PanelsTopLeft },
    { key: "board", label: "Board", icon: LayoutGrid },
    { key: "task", label: "Tasks", icon: ListChecks },
];

interface ViewTabsProps {
    viewTab: WorkspaceViewTab;
    onChange: (tab: WorkspaceViewTab) => void;
}

export function ViewTabs({ viewTab, onChange }: ViewTabsProps) {
    return (
        <div className="flex items-center gap-3 shrink-0 select-none overflow-x-auto">
            <div className="flex items-center gap-1 rounded-full border border-slate-200/60 bg-white p-1 shadow-sm">
                {TABS.map(({ key, label, icon: Icon }) => {
                    const active = viewTab === key;
                    return (
                        <button
                            key={key}
                            onClick={() => onChange(key)}
                            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                                active
                                    ? "bg-brand text-white shadow-sm"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                            }`}
                        >
                            <Icon className="size-3.5" />
                            {label}
                        </button>
                    );
                })}
            </div>

            <Link
                href="/agents"
                className="ml-auto flex items-center gap-1.5 rounded-full border border-slate-200/60 bg-white px-4 py-2 text-xs font-semibold text-slate-500 shadow-sm hover:text-slate-700 hover:bg-slate-50 transition-all cursor-pointer whitespace-nowrap"
            >
                <Settings className="size-3.5" />
                Settings
            </Link>
        </div>
    );
}
