"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { TimelineStages } from "../../components/TimelineStages";
import { StageWorkspace } from "../../components/StageWorkspace";
import type { LoopTask, TaskStage } from "@/core/interfaces/loop-projects.interface";

interface WalkthroughViewProps {
    projectId: string;
    tasks: LoopTask[];
    onRefresh: () => void;
}

// Walkthrough flow — step a chosen task through the real 6-stage loop
// (Plan→Build→Verify→Automate→Observe→Learn). Advancing a stage and running
// stage actions persist for real via the task API; chat/logs live in the full workspace.
export function WalkthroughView({ projectId, tasks, onRefresh }: WalkthroughViewProps) {
    const [selectedId, setSelectedId] = useState<string>(tasks[0]?.id ?? "");
    const [activeStage, setActiveStage] = useState<TaskStage>("PLAN");
    const [, setTriggerCount] = useState(0);

    const task = tasks.find((t) => t.id === selectedId) ?? tasks[0];

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (task) setActiveStage(task.currentStage || "PLAN");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [task?.id, task?.currentStage]);

    const handleUpdateTask = async (fields: Partial<LoopTask>) => {
        if (!task) return;
        try {
            const res = await fetch(`/api/manage/loop-projects/${projectId}/tasks/${task.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(fields),
            });
            const data = await res.json();
            if (data.success) {
                onRefresh();
                if (fields.currentStage) setActiveStage(fields.currentStage);
            }
        } catch (e) {
            console.error("Failed to update task:", e);
        }
    };

    if (!task) return null;

    return (
        <div className="space-y-4">
            {/* Task picker */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-semibold text-slate-500">Task:</span>
                {tasks.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setSelectedId(t.id)}
                        className={`rounded-sm px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer border ${
                            t.id === task.id
                                ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                        {t.name}
                    </button>
                ))}
                <Link
                    href={`/manage/loop-projects/${projectId}/tasks/${task.id}`}
                    className="ml-auto flex items-center gap-1 rounded-sm border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                    <ExternalLink className="size-3.5" />
                    Full workspace
                </Link>
            </div>

            <TimelineStages currentStage={task.currentStage} activeStage={activeStage} onSelectStage={setActiveStage} />

            <StageWorkspace
                projectId={projectId}
                task={task}
                activeStage={activeStage}
                onUpdateTask={handleUpdateTask}
                onTriggerLog={() => setTriggerCount((c) => c + 1)}
            />
        </div>
    );
}
