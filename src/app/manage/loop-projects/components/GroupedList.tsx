"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FolderKanban, Flag, ArrowRight } from "lucide-react";
import type { LoopTask, TaskPriority, RiskTier } from "@/core/interfaces/loop-projects.interface";

interface GroupedListProps {
    projectId: string;
    tasks: LoopTask[];
}

type GroupByOption = "risk" | "priority";

export function GroupedList({ projectId, tasks }: GroupedListProps) {
    const [groupBy, setGroupBy] = useState<GroupByOption>("risk");

    const getRiskColor = (tier?: string) => {
        switch (tier) {
            case "RED": return "text-red-700 bg-red-50 border-red-200/60";
            case "ORANGE": return "text-orange-700 bg-orange-50 border-orange-200/60";
            case "YELLOW": return "text-amber-700 bg-amber-50 border-amber-200/60";
            default: return "text-emerald-700 bg-emerald-50 border-emerald-200/60";
        }
    };

    const getPriorityIcon = (p?: TaskPriority) => {
        switch (p) {
            case "critical": return <Flag className="size-3.5 text-red-500 fill-red-500" />;
            case "high": return <Flag className="size-3.5 text-orange-500 fill-orange-500" />;
            case "medium": return <Flag className="size-3.5 text-indigo-500 fill-indigo-500" />;
            default: return <Flag className="size-3.5 text-slate-400 fill-slate-400" />;
        }
    };

    // Calculate grouping
    const renderGroupedSections = () => {
        if (groupBy === "risk") {
            const tiers: RiskTier[] = ["RED", "ORANGE", "YELLOW", "GREEN"];
            return tiers.map(tier => {
                const grouped = tasks.filter(t => (t.riskTier || "GREEN") === tier);
                if (grouped.length === 0) return null;

                return (
                    <div key={tier} className="border border-slate-200 bg-white rounded-xl overflow-hidden shadow-3xs">
                        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold font-sans uppercase ${getRiskColor(tier)}`}>
                                    {tier} Risk
                                </span>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-500 font-sans">{grouped.length} tasks</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {grouped.map(renderTaskRow)}
                        </div>
                    </div>
                );
            });
        } else {
            const priorities: TaskPriority[] = ["critical", "high", "medium", "low"];
            return priorities.map(p => {
                const grouped = tasks.filter(t => (t.priority || "medium") === p);
                if (grouped.length === 0) return null;

                return (
                    <div key={p} className="border border-slate-200 bg-white rounded-xl overflow-hidden shadow-3xs">
                        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-sans text-xs font-semibold text-slate-700 capitalize">
                                {getPriorityIcon(p)}
                                <span>{p} Priority</span>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-500 font-sans">{grouped.length} tasks</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {grouped.map(renderTaskRow)}
                        </div>
                    </div>
                );
            });
        }
    };

    const renderTaskRow = (t: LoopTask) => (
        <div key={t.id} className="flex items-center justify-between p-4 bg-white hover:bg-slate-50/40 transition-colors">
            <div className="min-w-0 pr-4">
                <h4 className="font-semibold text-slate-800 text-xs truncate max-w-sm" title={t.name}>{t.name}</h4>
                <p className="text-[10px] text-slate-400 font-sans mt-0.5 select-all truncate max-w-xs">{t.targetFiles[0]}</p>
            </div>
            
            <div className="flex items-center gap-4 text-xs font-sans shrink-0">
                <span className="text-[10px] uppercase text-slate-500 tracking-wider font-semibold">
                    {t.currentStage}
                </span>

                <Link
                    href={`/manage/loop-projects/${projectId}/tasks/${t.id}`}
                    className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-700"
                >
                    Run Loop
                    <ArrowRight className="size-3.5" />
                </Link>
            </div>
        </div>
    );

    return (
        <div className="space-y-4 select-none">
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200/60 p-3 rounded-lg text-xs font-sans">
                <div className="flex items-center gap-1.5 text-slate-600">
                    <FolderKanban className="size-4.5 text-indigo-600" />
                    <span>Group List By:</span>
                </div>
                
                <div className="flex gap-2">
                    <button
                        onClick={() => setGroupBy("risk")}
                        className={`px-3 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                            groupBy === "risk" ? "bg-indigo-600 border-indigo-600 text-white shadow-3xs" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                        Risk Tier
                    </button>
                    <button
                        onClick={() => setGroupBy("priority")}
                        className={`px-3 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                            groupBy === "priority" ? "bg-indigo-600 border-indigo-600 text-white shadow-3xs" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                        Priority
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {renderGroupedSections()}
            </div>
        </div>
    );
}
