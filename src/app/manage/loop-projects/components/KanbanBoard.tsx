"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Flag } from "lucide-react";
import type { LoopTask, KanbanColumn, TaskPriority } from "@/core/interfaces/loop-projects.interface";

interface KanbanBoardProps {
    projectId: string;
    tasks: LoopTask[];
    onUpdateTask: (taskId: string, fields: Partial<LoopTask>) => void;
}

const COLUMNS: { key: KanbanColumn; label: string; bg: string; text: string }[] = [
    { key: "backlog", label: "Backlog", bg: "bg-slate-50/80 border-slate-200/60", text: "text-slate-700" },
    { key: "todo", label: "To Do", bg: "bg-amber-50/20 border-amber-200/30", text: "text-amber-700" },
    { key: "in_progress", label: "In Progress", bg: "bg-indigo-50/20 border-indigo-200/30", text: "text-indigo-700" },
    { key: "done", label: "Done", bg: "bg-emerald-50/20 border-emerald-200/30", text: "text-emerald-700" },
];

export function KanbanBoard({ projectId, tasks, onUpdateTask }: KanbanBoardProps) {
    
    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData("text/plain", taskId);
    };

    const handleDrop = async (e: React.DragEvent, columnKey: KanbanColumn) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("text/plain");
        if (!taskId) return;
        
        try {
            const res = await fetch(`/api/manage/loop-projects/${projectId}/tasks/reorder`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ taskId, kanbanColumn: columnKey })
            });
            const data = await res.json();
            if (data.success) {
                onUpdateTask(taskId, { kanbanColumn: columnKey });
            }
        } catch (e) {
            console.error("Failed to move task:", e);
        }
    };

    const getPriorityColor = (p?: TaskPriority) => {
        switch (p) {
            case "critical": return "text-red-500 fill-red-500";
            case "high": return "text-orange-500 fill-orange-500";
            case "medium": return "text-indigo-500 fill-indigo-500";
            default: return "text-slate-400 fill-slate-400";
        }
    };

    const getRiskColor = (tier?: string) => {
        switch (tier) {
            case "RED": return "bg-red-50 text-red-700 border-red-200/60";
            case "ORANGE": return "bg-orange-50 text-orange-700 border-orange-200/60";
            case "YELLOW": return "bg-amber-50 text-amber-700 border-amber-200/60";
            default: return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 select-none">
            {COLUMNS.map((col) => {
                const colTasks = tasks.filter((t) => (t.kanbanColumn || "backlog") === col.key);

                return (
                    <div
                        key={col.key}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, col.key)}
                        className={`rounded-xl border p-4 min-h-[450px] flex flex-col ${col.bg}`}
                    >
                        <div className="flex items-center justify-between border-b border-slate-200/50 pb-2 mb-3">
                            <span className={`text-xs font-semibold font-sans ${col.text}`}>{col.label}</span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 border border-slate-200/60 text-[10px] font-semibold text-slate-700 font-sans">
                                {colTasks.length}
                            </span>
                        </div>

                        <div className="flex-1 space-y-3 overflow-y-auto min-h-0 max-h-[500px] pr-1">
                            {colTasks.length === 0 ? (
                                <div className="flex h-20 items-center justify-center text-[10px] font-sans text-slate-400 border border-dashed border-slate-200/60 rounded-lg">
                                    Drag tasks here
                                </div>
                            ) : (
                                colTasks.map((t) => (
                                    <div
                                        key={t.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, t.id)}
                                        className="rounded-lg border border-slate-200 bg-white p-3 shadow-3xs hover:shadow-3xs transition-all duration-200 hover:border-indigo-500/30 cursor-grab active:cursor-grabbing relative group"
                                    >
                                        <div className="flex items-start justify-between gap-1">
                                            <h4 className="text-xs font-semibold text-slate-800 leading-normal line-clamp-2 truncate">{t.name}</h4>
                                            <Flag className={`size-3 shrink-0 mt-0.5 ${getPriorityColor(t.priority)}`} />
                                        </div>

                                        <div className="mt-3 flex items-center justify-between">
                                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-sans font-semibold uppercase ${getRiskColor(t.riskTier)}`}>
                                                {t.riskTier || "GREEN"}
                                            </span>
                                            
                                            <Link
                                                href={`/manage/loop-projects/${projectId}/tasks/${t.id}`}
                                                className="flex items-center gap-0.5 text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                            >
                                                Open Loop
                                                <ArrowRight className="size-3" />
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
