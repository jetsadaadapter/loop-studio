"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MessageSquare, Activity, Flag, Plus, FileCode2, GripVertical, Lock } from "lucide-react";
import type { LoopTask, KanbanColumn } from "@/core/interfaces/loop-projects.interface";

import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { COLUMNS, columnOf, PRIORITY_CHIP, shortDate } from "./task-grouping";

interface BoardViewProps {
    projectId: string;
    tasks: LoopTask[];
    /** Opens the create-task modal (the reference design's per-column "+"). */
    onAddTask?: () => void;
    /** Refetch after a drag-and-drop move so the board reflects the saved state. */
    onRefresh?: () => void;
}

// Persists a card's new column via the same PATCH the board already relied on
// for status/kanbanColumn coherence (src/.../tasks/reorder/route.ts derives a
// matching `status` server-side, so callers never duplicate that mapping).
async function moveTaskToColumn(projectId: string, taskId: string, kanbanColumn: KanbanColumn) {
    await fetch(`/api/loop-projects/${projectId}/tasks/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, kanbanColumn }),
    });
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

function TaskCard({ projectId, task, dragging, onDragStart, onDragEnd }: {
    projectId: string;
    task: LoopTask;
    dragging: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: () => void;
}) {
    const comments = task.chatHistory?.length ?? 0;
    const activities = task.activities?.length ?? 0;
    const status = statusChip(task);
    const priority = task.priority ?? "medium";
    // A task whose pipeline is actively running must not be dragged: moving it
    // rewrites its status (see the reorder route), which would desync the run
    // that's mid-flight. Only the grip is a drag source, so clicking the card
    // still opens it (no accidental navigation while dragging).
    const isRunning = task.status === "running";

    return (
        <Link
            href={`/${projectId}/tasks/${task.id}`}
            draggable={false}
            className={`group block rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md ${
                isRunning ? "border-blue-300/60" : "border-slate-200/60 hover:border-slate-300/70"
            } ${dragging ? "opacity-40" : ""}`}
        >
            <div className="mb-1.5 flex items-center justify-between gap-2">
                <Badge variant={status.variant} className={task.status === "running" ? "animate-pulse" : ""}>
                    <span className="size-1.5 rounded-full bg-current" />
                    {status.label}
                </Badge>
                <span
                    draggable={!isRunning}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDragStart={(e) => { e.stopPropagation(); onDragStart(e); }}
                    onDragEnd={onDragEnd}
                    title={isRunning ? "Task is running — stop or let it finish before moving" : "Drag to move"}
                    aria-label={isRunning ? "Locked while running" : "Drag to move"}
                    className={`-m-1 shrink-0 rounded p-1 ${
                        isRunning
                            ? "cursor-not-allowed text-slate-300"
                            : "cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500"
                    }`}
                >
                    {isRunning
                        ? <Lock className="size-3.5" />
                        : <GripVertical className="size-3.5 opacity-60 transition-opacity group-hover:opacity-100" />}
                </span>
            </div>

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
// Cards are draggable between columns (native HTML5 DnD — no extra
// dependency needed for a single board with four drop zones).
export function BoardView({ projectId, tasks, onAddTask, onRefresh }: BoardViewProps) {
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOverCol, setDragOverCol] = useState<KanbanColumn | null>(null);

    const handleDrop = async (e: React.DragEvent, col: KanbanColumn) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("text/plain") || draggingId;
        setDragOverCol(null);
        setDraggingId(null);
        if (!taskId) return;
        const task = tasks.find((t) => t.id === taskId);
        if (!task || columnOf(task) === col) return;
        // Defensive: never move a task whose pipeline is running (the grip is
        // already non-draggable for it, but a drop must not slip through).
        if (task.status === "running") return;
        await moveTaskToColumn(projectId, taskId, col);
        onRefresh?.();
    };

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {COLUMNS.map((col) => {
                const items = tasks.filter((t) => columnOf(t) === col.key);
                const isDragOver = dragOverCol === col.key;
                return (
                    <div
                        key={col.key}
                        onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.key); }}
                        onDragLeave={() => setDragOverCol((c) => (c === col.key ? null : c))}
                        onDrop={(e) => handleDrop(e, col.key)}
                        className={`rounded-2xl bg-slate-50/70 border p-3 transition-colors ${
                            isDragOver ? "border-brand/50 bg-brand/5 ring-2 ring-brand/20" : "border-slate-200/50"
                        }`}
                    >
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
                                <p className={`rounded-xl border border-dashed px-3 py-6 text-center text-xs font-sans transition-colors ${
                                    isDragOver ? "border-brand/40 bg-white text-brand" : "border-slate-200 bg-white/50 text-slate-400"
                                }`}>
                                    {isDragOver ? "Drop here" : "No tasks"}
                                </p>
                            ) : (
                                items.map((t) => (
                                    <TaskCard
                                        key={t.id}
                                        projectId={projectId}
                                        task={t}
                                        dragging={draggingId === t.id}
                                        onDragStart={(e) => {
                                            e.dataTransfer.effectAllowed = "move";
                                            e.dataTransfer.setData("text/plain", t.id);
                                            setDraggingId(t.id);
                                        }}
                                        onDragEnd={() => { setDraggingId(null); setDragOverCol(null); }}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
