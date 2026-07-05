"use client";

import React from "react";
import { Check, ClipboardList, Code, CheckSquare, ShieldCheck, Eye, GraduationCap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TaskStage } from "@/core/interfaces/loop-projects.interface";

interface TimelineStagesProps {
    currentStage: TaskStage;
    activeStage: TaskStage;
    onSelectStage: (stage: TaskStage) => void;
}

const STAGES: { stage: TaskStage; label: string; icon: LucideIcon }[] = [
    { stage: "PLAN", label: "Plan", icon: ClipboardList },
    { stage: "BUILD", label: "Build", icon: Code },
    { stage: "VERIFY", label: "Verify", icon: CheckSquare },
    { stage: "AUTOMATE", label: "Automate", icon: ShieldCheck },
    { stage: "OBSERVE", label: "Observe", icon: Eye },
    { stage: "LEARN", label: "Learn", icon: GraduationCap },
];

export function TimelineStages({ currentStage, activeStage, onSelectStage }: TimelineStagesProps) {
    const getStageIndex = (s: TaskStage) => STAGES.findIndex(item => item.stage === s);
    const currentIndex = getStageIndex(currentStage);

    return (
        <div className="w-full bg-slate-50 border border-slate-200/60 rounded-xl p-4 select-none">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {STAGES.map((item, idx) => {
                    const isActive = activeStage === item.stage;
                    const isCompleted = idx < currentIndex;
                    const isCurrent = idx === currentIndex;

                    let statusClass = "border-slate-200 bg-white text-slate-400";
                    if (isCompleted) {
                        statusClass = "border-emerald-500 bg-emerald-500 text-white";
                    } else if (isCurrent) {
                        statusClass = "border-indigo-600 bg-indigo-50 text-indigo-600 font-semibold";
                    } else if (isActive) {
                        statusClass = "border-slate-400 bg-slate-100 text-slate-700";
                    }

                    return (
                        <button
                            key={item.stage}
                            onClick={() => onSelectStage(item.stage)}
                            className={`flex-1 flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer text-left ${
                                isActive ? "border-indigo-500 shadow-3xs ring-1 ring-indigo-500/20 bg-white" : "border-slate-200/60 hover:bg-slate-100/50 bg-white"
                            }`}
                        >
                            <div className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-xs transition-colors duration-200 ${statusClass}`}>
                                {isCompleted ? <Check className="size-3.5" /> : idx + 1}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-800 leading-normal truncate">{item.label}</p>
                                <p className="text-[10px] text-slate-400 font-sans truncate uppercase tracking-wider">
                                    {isCompleted ? "Completed" : isCurrent ? "Active" : "Pending"}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
