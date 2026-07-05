"use client";

import React, { useState } from "react";
import { Calendar, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { LoopTask } from "@/core/interfaces/loop-projects.interface";

interface TimelineViewProps {
    projectId: string;
    tasks: LoopTask[];
    onUpdateTask: (taskId: string, fields: Partial<LoopTask>) => void;
}

export function TimelineView({ projectId, tasks, onUpdateTask }: TimelineViewProps) {
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Generate 14 days starting from today to show as headers
    const dates: Date[] = [];
    for (let i = 0; i < 14; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        dates.push(d);
    }

    const handleSaveDates = async (taskId: string) => {
        try {
            const res = await fetch(`/api/manage/loop-projects/${projectId}/tasks/reorder`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ taskId, startDate, endDate })
            });
            const data = await res.json();
            if (data.success) {
                onUpdateTask(taskId, { startDate, endDate });
                setEditingTaskId(null);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Calculate column span and offset for Gantt bar
    const getGanttSpan = (task: LoopTask) => {
        if (!task.startDate || !task.endDate) return null;
        
        const start = new Date(task.startDate);
        const end = new Date(task.endDate);
        const today = new Date();
        today.setHours(0,0,0,0);

        // Normalize start and end
        const diffStart = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const diffEnd = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        const gridStart = Math.max(1, diffStart + 1); // 1-indexed for grid-column
        const gridEnd = Math.min(15, diffEnd + 2); // max columns is 14 days, so grid-column end is 15

        if (gridStart > 14 || gridEnd < 1) return null; // out of range
        
        return { start: gridStart, end: gridEnd };
    };

    const getRiskColor = (tier?: string) => {
        switch (tier) {
            case "RED": return "bg-red-500/80 border-red-600";
            case "ORANGE": return "bg-orange-500/80 border-orange-600";
            case "YELLOW": return "bg-amber-500/80 border-amber-600";
            default: return "bg-emerald-500/80 border-emerald-600";
        }
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-3xs space-y-6 select-none overflow-x-auto min-w-[750px]">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Calendar className="size-4.5 text-indigo-600" />
                <h3 className="font-semibold text-slate-800 text-sm">Gantt Timeline View</h3>
                <span className="text-[10px] text-slate-400 font-sans">(14-day sprint outlook starting from today)</span>
            </div>

            <div className="grid grid-cols-18 gap-2 border-b border-slate-200/60 pb-2">
                {/* Header Column */}
                <div className="col-span-4 font-semibold text-slate-500 text-[10px] uppercase font-sans">Task Name</div>
                {/* 14 Calendar columns */}
                {dates.map((date, idx) => (
                    <div key={idx} className="col-span-1 text-center font-sans font-medium text-slate-400 text-[10px] flex flex-col items-center">
                        <span>{date.toLocaleDateString("en-US", { weekday: "narrow" })}</span>
                        <span className="text-slate-700 text-[10px] mt-0.5">{date.getDate()}</span>
                    </div>
                ))}
            </div>

            <div className="space-y-4">
                {tasks.map((task) => {
                    const span = getGanttSpan(task);
                    return (
                        <div key={task.id} className="grid grid-cols-18 items-center gap-2 border-b border-slate-100 pb-3">
                            {/* Task name / Edit Date Form */}
                            <div className="col-span-4 min-w-0 pr-2">
                                {editingTaskId === task.id ? (
                                    <div className="flex flex-col gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-200">
                                        <Input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="h-auto rounded-sm px-1 py-0.5 text-[10px]"
                                        />
                                        <Input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="h-auto rounded-sm px-1 py-0.5 text-[10px]"
                                        />
                                        <button
                                            onClick={() => handleSaveDates(task.id)}
                                            className="flex items-center justify-center gap-1 rounded-sm bg-brand px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-brand/90 cursor-pointer"
                                        >
                                            <Save className="size-3" /> Save
                                        </button>
                                    </div>
                                ) : (
                                    <div className="group">
                                        <h4 className="font-semibold text-slate-700 text-xs truncate" title={task.name}>{task.name}</h4>
                                        <button
                                            onClick={() => {
                                                setEditingTaskId(task.id);
                                                setStartDate(task.startDate || "");
                                                setEndDate(task.endDate || "");
                                            }}
                                            className="text-[10px] text-indigo-600 hover:text-indigo-700 font-sans opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 cursor-pointer block"
                                        >
                                            Set Dates
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Gantt Bar Section */}
                            <div className="col-span-14 grid grid-cols-14 gap-2 relative min-h-[32px] items-center">
                                {/* Background grid guides */}
                                {Array.from({ length: 14 }).map((_, i) => (
                                    <div key={i} className="col-span-1 border-r border-slate-100 h-8 absolute top-0 bottom-0" style={{ left: `${(i / 14) * 100}%` }} />
                                ))}

                                {/* Gantt Bar */}
                                {span ? (
                                    <div
                                        className={`h-5 rounded-full border text-white font-sans text-[10px] font-semibold flex items-center justify-center shadow-3xs truncate select-none ${getRiskColor(task.riskTier)}`}
                                        style={{
                                            gridColumnStart: span.start,
                                            gridColumnEnd: span.end,
                                        }}
                                        title={`${task.name} (${task.startDate} to ${task.endDate})`}
                                    >
                                        Active Loop
                                    </div>
                                ) : (
                                    <div className="col-span-14 text-center text-[10px] font-sans text-slate-400 italic">
                                        No timeline scheduled
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
