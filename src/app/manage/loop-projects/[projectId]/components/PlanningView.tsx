"use client";

import React, { useState } from "react";
import { SprintPlanner } from "../../components/SprintPlanner";
import { TimelineView } from "../../components/TimelineView";
import type { LoopTask } from "@/core/interfaces/loop-projects.interface";

interface PlanningViewProps {
    projectId: string;
    tasks: LoopTask[];
    onUpdateTask: (taskId: string, fields: Partial<LoopTask>) => void;
}

type PlanningSub = "sprint" | "roadmap";

const SUBS: { key: PlanningSub; label: string }[] = [
    { key: "sprint", label: "Sprint Board" },
    { key: "roadmap", label: "Roadmap (Timeline)" },
];

// Planning flow — sprint assignment + story points (SprintPlanner) and date-based
// roadmap (TimelineView). Both persist changes via the reorder API (real, not mock).
export function PlanningView({ projectId, tasks, onUpdateTask }: PlanningViewProps) {
    const [sub, setSub] = useState<PlanningSub>("sprint");

    return (
        <div className="space-y-4">
            <div className="inline-flex rounded-sm border border-slate-200 bg-slate-50 p-0.5">
                {SUBS.map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setSub(key)}
                        className={`rounded-sm px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                            sub === key ? "bg-white text-indigo-600 shadow-3xs" : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {sub === "sprint" ? (
                <SprintPlanner projectId={projectId} tasks={tasks} onUpdateTask={onUpdateTask} />
            ) : (
                <TimelineView projectId={projectId} tasks={tasks} onUpdateTask={onUpdateTask} />
            )}
        </div>
    );
}
