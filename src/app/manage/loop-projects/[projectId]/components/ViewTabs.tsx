"use client";

import React from "react";

export type WorkspaceViewTab = "list" | "kanban" | "timeline" | "sprint" | "grouped";

const TABS: readonly WorkspaceViewTab[] = ["list", "kanban", "timeline", "sprint", "grouped"];

interface ViewTabsProps {
    viewTab: WorkspaceViewTab;
    onChange: (tab: WorkspaceViewTab) => void;
}

export function ViewTabs({ viewTab, onChange }: ViewTabsProps) {
    return (
        <div className="flex border-b border-slate-200 gap-6 shrink-0 select-none pb-px">
            {TABS.map((tab) => (
                <button
                    key={tab}
                    onClick={() => onChange(tab)}
                    className={`text-xs font-semibold py-2.5 capitalize transition-all border-b-2 cursor-pointer ${
                        viewTab === tab
                            ? "border-indigo-600 text-indigo-600 font-semibold"
                            : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                >
                    {tab === "sprint" ? "Sprint Planner" : tab === "grouped" ? "Grouped List" : `${tab} View`}
                </button>
            ))}
        </div>
    );
}
