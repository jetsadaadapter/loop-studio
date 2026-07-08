"use client";

import React from "react";
import Link from "next/link";
import { PanelsTopLeft, ListChecks, Settings, LayoutGrid, type LucideIcon } from "lucide-react";

// Workspace navigation as underline tabs, per the reference layout:
// Studio (walkthrough), Board (kanban), and Tasks (list), with the
// Settings shortcut kept on the right of the same row.
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
        <div className="flex items-center gap-6 border-b border-slate-200/70 shrink-0 select-none overflow-x-auto">
            {TABS.map(({ key, label, icon: Icon }) => {
                const active = viewTab === key;
                return (
                    <button
                        key={key}
                        onClick={() => onChange(key)}
                        className={`relative -mb-px flex items-center gap-1.5 border-b-2 px-1 pb-2.5 pt-1 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                            active
                                ? "border-brand text-brand"
                                : "border-transparent text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        <Icon className="size-3.5" />
                        {label}
                    </button>
                );
            })}

            <Link
                href="/agents"
                className="-mb-px ml-auto flex items-center gap-1.5 border-b-2 border-transparent px-1 pb-2.5 pt-1 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer whitespace-nowrap"
            >
                <Settings className="size-3.5" />
                Settings
            </Link>
        </div>
    );
}
