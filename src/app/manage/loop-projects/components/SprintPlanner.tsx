"use client";

import React, { useState } from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { LoopTask } from "@/core/interfaces/loop-projects.interface";

interface SprintPlannerProps {
    projectId: string;
    tasks: LoopTask[];
    onUpdateTask: (taskId: string, fields: Partial<LoopTask>) => void;
}

export function SprintPlanner({ projectId, tasks, onUpdateTask }: SprintPlannerProps) {
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [storyPoints, setStoryPoints] = useState(1);

    const backlogTasks = tasks.filter((t) => !t.sprintId);
    const sprintTasks = tasks.filter((t) => t.sprintId === "sprint-1");

    const totalSprintPoints = sprintTasks.reduce((acc, t) => acc + (t.storyPoints || 0), 0);

    const handleMoveToSprint = async (taskId: string, sprintId: string | null) => {
        try {
            const res = await fetch(`/api/manage/loop-projects/${projectId}/tasks/reorder`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ taskId, sprintId })
            });
            const data = await res.json();
            if (data.success) {
                onUpdateTask(taskId, { sprintId: sprintId || undefined });
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSavePoints = async (taskId: string) => {
        try {
            const res = await fetch(`/api/manage/loop-projects/${projectId}/tasks/reorder`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ taskId, storyPoints })
            });
            const data = await res.json();
            if (data.success) {
                onUpdateTask(taskId, { storyPoints });
                setEditingTaskId(null);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const renderTaskCard = (t: LoopTask, isSprint: boolean) => (
        <div key={t.id} className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-3xs flex items-center justify-between gap-4 group">
            <div className="min-w-0 flex-1">
                <h4 className="text-xs font-semibold text-slate-800 leading-normal truncate">{t.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                    {editingTaskId === t.id ? (
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1 rounded-lg">
                            <Select
                                value={String(storyPoints)}
                                onValueChange={(val) => setStoryPoints(Number(val))}
                            >
                                <SelectTrigger size="sm" className="h-6 bg-white text-[10px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[1, 2, 3, 5, 8].map(val => (
                                        <SelectItem key={val} value={String(val)} className="text-[10px]">
                                            {val} SP
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <button
                                onClick={() => handleSavePoints(t.id)}
                                className="rounded-lg bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-white hover:bg-brand/90 cursor-pointer"
                            >
                                OK
                            </button>
                        </div>
                    ) : (
                        <span 
                            onClick={() => {
                                setEditingTaskId(t.id);
                                setStoryPoints(t.storyPoints || 1);
                            }}
                            className="inline-flex items-center gap-1 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-0.5 border border-indigo-200/60 text-[10px] font-semibold font-sans cursor-pointer transition-colors"
                        >
                            {t.storyPoints || 1} Story Point{t.storyPoints !== 1 ? "s" : ""}
                        </span>
                    )}
                </div>
            </div>

            <div className="shrink-0 flex items-center gap-1">
                {isSprint ? (
                    <button
                        onClick={() => handleMoveToSprint(t.id, null)}
                        className="rounded-lg p-1 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 cursor-pointer transition-all"
                        title="Move to Backlog"
                    >
                        <ArrowLeft className="size-3.5" />
                    </button>
                ) : (
                    <button
                        onClick={() => handleMoveToSprint(t.id, "sprint-1")}
                        className="rounded-lg p-1 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 cursor-pointer transition-all"
                        title="Move to Sprint 1"
                    >
                        <ArrowRight className="size-3.5" />
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none">
            {/* Backlog Column */}
            <div className="rounded-xl border border-slate-200/60 bg-slate-50/50 p-4 flex flex-col min-h-[450px]">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 mb-3">
                    <span className="text-xs font-semibold text-slate-700 font-sans">Product Backlog</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 border border-slate-200/60 text-[10px] font-semibold text-slate-700 font-sans">
                        {backlogTasks.length} tasks
                    </span>
                </div>
                <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
                    {backlogTasks.length === 0 ? (
                        <div className="flex h-20 items-center justify-center text-[10px] font-sans text-slate-500 italic">
                            Backlog empty. Add task above.
                        </div>
                    ) : (
                        backlogTasks.map(t => renderTaskCard(t, false))
                    )}
                </div>
            </div>

            {/* Active Sprint Column */}
            <div className="rounded-xl border border-indigo-200/60 bg-indigo-50/10 p-4 flex flex-col min-h-[450px]">
                <div className="flex items-center justify-between border-b border-indigo-200/40 pb-2 mb-3">
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-indigo-800 font-sans">Active Sprint 1</span>
                        <span className="text-[10px] text-indigo-500/80 font-sans mt-0.5 font-medium">Goal: Implement Loop DevStudio integrations</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white font-sans">
                            {totalSprintPoints} Story Points
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 border border-indigo-200/60 text-[10px] font-semibold text-indigo-700 font-sans">
                            {sprintTasks.length} tasks
                        </span>
                    </div>
                </div>
                <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
                    {sprintTasks.length === 0 ? (
                        <div className="flex h-20 items-center justify-center text-[10px] font-sans text-indigo-400/80 italic border border-dashed border-indigo-200/30 rounded-lg">
                            Move tasks from backlog to activate sprint load
                        </div>
                    ) : (
                        sprintTasks.map(t => renderTaskCard(t, true))
                    )}
                </div>
            </div>
        </div>
    );
}
