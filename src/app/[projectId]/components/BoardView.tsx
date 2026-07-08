"use client";

import React from "react";
import Link from "next/link";
import { MessageSquare, Activity, FileCode2 } from "lucide-react";
import type { LoopTask, KanbanColumn } from "@/core/interfaces/loop-projects.interface";

interface BoardViewProps {
    projectId: string;
    tasks: LoopTask[];
}

const COLUMNS: { key: KanbanColumn; label: string; dot: string }[] = [
    { key: "backlog", label: "Backlog", dot: "bg-slate-400" },
    { key: "todo", label: "To Do", dot: "bg-sky-500" },
    { key: "in_progress", label: "In Progress", dot: "bg-violet-500" },
    { key: "done", label: "Done", dot: "bg-emerald-500" },
];

// Tasks created before the kanban field existed derive their column from status.
function columnOf(t: LoopTask): KanbanColumn {
    if (t.kanbanColumn) return t.kanbanColumn;
    if (t.status === "completed") return "done";
    if (t.status === "running") return "in_progress";
    return "todo";
}

const RISK_CHIP: Record<string, string> = {
    RED: "bg-red-50 text-red-700 border-red-200/60",
    ORANGE: "bg-orange-50 text-orange-700 border-orange-200/60",
    YELLOW: "bg-amber-50 text-amber-700 border-amber-200/60",
    GREEN: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
};

function TaskCard({ projectId, task }: { projectId: string; task: LoopTask }) {
    const comments = task.chatHistory?.length ?? 0;
    const activities = task.activities?.length ?? 0;
    const awaitingApproval = task.kanbanColumn === "in_progress" && task.status === "completed" && task.currentStage === "OBSERVE";

    return (
        <Link
            href={`/${projectId}/tasks/${task.id}`}
            className="group block rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-slate-300/70"
        >
            <p className="text-sm font-semibold text-slate-800 group-hover:text-brand transition-colors">{task.name}</p>

            <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500 font-sans truncate" title={task.targetFiles.join(", ")}>
                <FileCode2 className="size-3 shrink-0 text-slate-400" />
                {task.targetFiles[0]}
                {task.targetFiles.length > 1 && <span className="text-slate-400">+{task.targetFiles.length - 1}</span>}
            </p>

            <div className="mt-2.5 flex flex-wrap items-center gap-1">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold font-sans ${RISK_CHIP[task.riskTier ?? "GREEN"]}`}>
                    {task.riskTier ?? "GREEN"}
                </span>
                {(task.tags ?? []).map((tag) => (
                    <span key={tag} className="rounded-full border border-indigo-200/60 bg-indigo-50 px-2 py-0.5 text-[10px] font-sans text-indigo-700">
                        {tag}
                    </span>
                ))}
                {awaitingApproval && (
                    <span className="rounded-full border border-amber-200/60 bg-amber-50 px-2 py-0.5 text-[10px] font-sans text-amber-700">
                        awaiting approval
                    </span>
                )}
            </div>

            <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-2.5 text-[11px] text-slate-400 font-sans">
                <span className="flex items-center gap-1"><MessageSquare className="size-3" /> {comments}</span>
                <span className="flex items-center gap-1"><Activity className="size-3" /> {activities}</span>
                <span className="ml-auto uppercase tracking-wider text-[10px]">{task.currentStage}</span>
            </div>
        </Link>
    );
}

// Kanban board grouped by kanbanColumn, styled after the reference dashboard:
// soft column wells, count badges, and rounded card stacks.
export function BoardView({ projectId, tasks }: BoardViewProps) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {COLUMNS.map((col) => {
                const items = tasks.filter((t) => columnOf(t) === col.key);
                return (
                    <div key={col.key} className="rounded-2xl bg-slate-50/70 border border-slate-200/50 p-3">
                        <div className="flex items-center gap-2 px-1 pb-3">
                            <span className={`size-2 rounded-full ${col.dot}`} />
                            <h3 className="text-sm font-semibold text-slate-700">{col.label}</h3>
                            <span className="rounded-full bg-white border border-slate-200/60 px-2 py-0.5 text-[10px] font-semibold font-sans text-slate-500">
                                {items.length}
                            </span>
                        </div>
                        <div className="space-y-3">
                            {items.length === 0 ? (
                                <p className="rounded-xl border border-dashed border-slate-200 bg-white/50 px-3 py-6 text-center text-[11px] text-slate-400 font-sans">
                                    No tasks
                                </p>
                            ) : (
                                items.map((t) => <TaskCard key={t.id} projectId={projectId} task={t} />)
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
