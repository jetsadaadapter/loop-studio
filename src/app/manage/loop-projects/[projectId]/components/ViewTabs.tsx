"use client";

import React from "react";
import { LayoutDashboard, CalendarRange, ListChecks, Footprints, PlayCircle, type LucideIcon } from "lucide-react";

export type WorkspaceViewTab = "overview" | "planning" | "task" | "walkthrough" | "simulation";

const TABS: { key: WorkspaceViewTab; label: string; icon: LucideIcon }[] = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "planning", label: "Planning", icon: CalendarRange },
    { key: "task", label: "Task", icon: ListChecks },
    { key: "walkthrough", label: "Walkthrough", icon: Footprints },
    { key: "simulation", label: "Live Run", icon: PlayCircle },
];

interface ViewTabsProps {
    viewTab: WorkspaceViewTab;
    onChange: (tab: WorkspaceViewTab) => void;
}

export function ViewTabs({ viewTab, onChange }: ViewTabsProps) {
    return (
        <div className="flex border-b border-slate-200 gap-6 shrink-0 select-none pb-px overflow-x-auto">
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
        </div>
    );
}
