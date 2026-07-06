"use client";

import React from "react";
import Link from "next/link";
import { PanelsTopLeft, ListChecks, Settings, type LucideIcon } from "lucide-react";

// Trimmed Studio navigation (Phase 4): the workspace ("Studio") and the task
// backlog ("Tasks"). Overview folded into the header; Planning and the standalone
// Live Run tab removed (preview + auto-pipeline cover that flow).
export type WorkspaceViewTab = "walkthrough" | "task";

const TABS: { key: WorkspaceViewTab; label: string; icon: LucideIcon }[] = [
    { key: "walkthrough", label: "Studio", icon: PanelsTopLeft },
    { key: "task", label: "Tasks", icon: ListChecks },
];

interface ViewTabsProps {
    viewTab: WorkspaceViewTab;
    onChange: (tab: WorkspaceViewTab) => void;
}

export function ViewTabs({ viewTab, onChange }: ViewTabsProps) {
    return (
        <div className="flex items-center border-b border-slate-200 gap-6 shrink-0 select-none pb-px overflow-x-auto">
            {TABS.map(({ key, label, icon: Icon }) => {
                const active = viewTab === key;
                return (
                    <button
                        key={key}
                        onClick={() => onChange(key)}
                        className={`flex items-center gap-1.5 text-xs font-semibold py-2.5 transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                            active
                                ? "border-indigo-600 text-indigo-600"
                                : "border-transparent text-slate-400 hover:text-slate-600"
                        }`}
                    >
                        <Icon className="size-3.5" />
                        {label}
                    </button>
                );
            })}

            <Link
                href="/manage/loop-projects/agents"
                className="ml-auto flex items-center gap-1.5 text-xs font-semibold py-2.5 border-b-2 border-transparent text-slate-400 hover:text-slate-600 transition-all cursor-pointer whitespace-nowrap"
            >
                <Settings className="size-3.5" />
                Settings
            </Link>
        </div>
    );
}
