"use client";

import React from "react";
import Link from "next/link";
import { MessageSquare, Activity, Flag, Plus, FileCode2 } from "lucide-react";
import type { LoopTask, KanbanColumn, TaskPriority } from "@/core/interfaces/loop-projects.interface";

import { Badge, type BadgeVariant } from "@/components/ui/badge";

interface BoardViewProps {
    projectId: string;
    tasks: LoopTask[];
    /** Opens the create-task modal (the reference design's per-column "+"). */
    onAddTask?: () => void;
}

const COLUMNS: { key: KanbanColumn; label: string; dot: string; badge: string }[] = [
    { key: "backlog", label: "Backlog", dot: "bg-slate-400", badge: "bg-slate-100 text-slate-600" },
    { key: "todo", label: "To Do", dot: "bg-sky-500", badge: "bg-sky-100 text-sky-700" },
    { key: "in_progress", label: "In Progress", dot: "bg-violet-500", badge: "bg-violet-100 text-violet-700" },
    { key: "done", label: "Done", dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
];

// Tasks created before the kanban field existed derive their column from status.
function columnOf(t: LoopTask): KanbanColumn {
    if (t.kanbanColumn) return t.kanbanColumn;
    if (t.status === "completed") return "done";
    if (t.status === "running") return "in_progress";
    return "todo";
}

// Status chip per the reference cards (colored dot + label).
function statusChip(t: LoopTask): { label: string; variant: BadgeVariant } {
    if (t.kanbanColumn === "in_progress" && t.status === "completed" && t.currentStage === "OBSERVE") {
        return { label: "Awaiting Approval", variant: "warning" };
    }
    switch (t.status) {
        case "running": return { label: "On Track", variant: "info" };
        case "completed": return { label: "Complete", variant: "success" };
        case "failed": return { label: "Failed", variant: "error" };
        default: return { label: "Not Started", variant: "default" };
    }
}

const PRIORITY_CHIP: Record<TaskPriority, BadgeVariant> = {
    low: "success",
    medium: "warning",
    high: "orange",
    critical: "error",
};

function shortDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function TaskCard({ projectId, task }: { projectId: string; task: LoopTask }) {
    const comments = task.chatHistory?.length ?? 0;
    const activities = task.activities?.length ?? 0;
    const status = statusChip(task);
    const priority = task.priority ?? "medium";

    return (
        <Link
            href={`/${projectId}/tasks/${task.id}`}
            className="group block rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-slate-300/70"
        >
            <Badge variant={status.variant} className={task.status === "running" ? "animate-pulse" : ""}>
                <span className="size-1.5 rounded-full bg-current" />
                {status.label}
            </Badge>

            <p className="mt-2 text-sm font-semibold text-slate-800 group-hover:text-brand transition-colors">{task.name}</p>
            <p className="text-[9.5px] text-slate-400 font-sans mt-0.5 select-all">ID: {task.id}</p>

            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 font-sans truncate" title={task.targetFiles.join(", ")}>
                <FileCode2 className="size-3 shrink-0 text-slate-400" />
                {task.targetFiles[0]}
                {task.targetFiles.length > 1 && <span className="text-slate-400">+{task.targetFiles.length - 1}</span>}
            </p>

            <div className="mt-2.5 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs text-slate-500 font-sans">
                    <Flag className="size-3 text-slate-400" />
                    {shortDate(task.updatedAt)}
                </span>
                <Badge variant={PRIORITY_CHIP[priority]}>
                    {priority}
                </Badge>
            </div>

            <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-2.5 text-xs text-slate-400 font-sans">
                <span className="flex items-center gap-1"><MessageSquare className="size-3" /> {comments} Comments</span>
                <span className="flex items-center gap-1"><Activity className="size-3" /> {activities}</span>
                <span className="ml-auto uppercase tracking-wider text-xs">{task.currentStage}</span>
            </div>
        </Link>
    );
}

// Kanban board per the reference layout: column header with colored dot,
// count badge, and a "+" quick-add; card stacks with status/priority chips.
export function BoardView({ projectId, tasks, onAddTask }: BoardViewProps) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {COLUMNS.map((col) => {
                const items = tasks.filter((t) => columnOf(t) === col.key);
                return (
                    <div key={col.key} className="rounded-2xl bg-slate-50/70 border border-slate-200/50 p-3">
                        <div className="flex items-center gap-2 px-1 pb-3">
                            <span className={`size-2 rounded-full ${col.dot}`} />
                            <h3 className="text-sm font-semibold text-slate-700">{col.label}</h3>
                            <span className={`flex size-5 items-center justify-center rounded-full text-xs font-bold font-sans ${col.badge}`}>
                                {items.length}
                            </span>
                            {onAddTask && (
                                <button
                                    onClick={onAddTask}
                                    className="ml-auto rounded-md p-1 text-slate-400 hover:bg-white hover:text-slate-600 transition-colors cursor-pointer"
                                    title="Create task"
                                >
                                    <Plus className="size-3.5" />
                                </button>
                            )}
                        </div>
                        <div className="space-y-3">
                            {items.length === 0 ? (
                                <p className="rounded-xl border border-dashed border-slate-200 bg-white/50 px-3 py-6 text-center text-xs text-slate-400 font-sans">
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
