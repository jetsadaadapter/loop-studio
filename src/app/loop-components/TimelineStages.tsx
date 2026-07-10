"use client";

import React from "react";
import { Check, ClipboardList, Code, CheckSquare, ShieldCheck, Eye, GraduationCap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TaskStage, TaskStatus } from "@/core/interfaces/loop-projects.interface";

interface TimelineStagesProps {
    currentStage: TaskStage;
    activeStage: TaskStage;
    onSelectStage: (stage: TaskStage) => void;
    status?: TaskStatus;
}

const STAGES: { stage: TaskStage; label: string; icon: LucideIcon }[] = [
    { stage: "PLAN", label: "Plan", icon: ClipboardList },
    { stage: "BUILD", label: "Build", icon: Code },
    { stage: "VERIFY", label: "Verify", icon: CheckSquare },
    { stage: "AUTOMATE", label: "Automate", icon: ShieldCheck },
    { stage: "OBSERVE", label: "Observe", icon: Eye },
    { stage: "LEARN", label: "Learn", icon: GraduationCap },
];

export function TimelineStages({ currentStage, activeStage, onSelectStage, status }: TimelineStagesProps) {
    const getStageIndex = (s: TaskStage) => STAGES.findIndex(item => item.stage === s);
    const currentIndex = getStageIndex(currentStage);
    const isTaskComplete = status === "completed";

    return (
        <div className="w-full bg-slate-50/50 border border-slate-200/50 rounded-2xl p-6 select-none shadow-xs relative">
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-2">
                {/* Connecting track line for medium+ screens */}
                <div className="hidden md:block absolute top-[22px] left-[8%] right-[8%] h-0.75 bg-slate-200 -z-10 rounded-full">
                    <div 
                        className="h-full bg-emerald-500 transition-all duration-500 ease-in-out rounded-full"
                        style={{ 
                            width: isTaskComplete 
                                ? "100%" 
                                : `${(currentIndex / (STAGES.length - 1)) * 100}%` 
                        }}
                    />
                </div>

                {STAGES.map((item, idx) => {
                    const isActiveView = activeStage === item.stage;
                    const isCompleted = isTaskComplete || idx < currentIndex;
                    const isCurrent = !isTaskComplete && idx === currentIndex;

                    let nodeColor = "bg-white border-slate-200 text-slate-400";
                    let ringClass = "";
                    if (isCompleted) {
                        nodeColor = "bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/10";
                    } else if (isCurrent) {
                        nodeColor = "bg-brand border-brand text-white shadow-sm shadow-brand/10";
                        ringClass = "ring-4 ring-brand/10 animate-pulse";
                    } else if (isActiveView) {
                        nodeColor = "bg-white border-brand text-brand shadow-xs";
                    }

                    const Icon = item.icon;

                    return (
                        <button
                            key={item.stage}
                            onClick={() => onSelectStage(item.stage)}
                            className="flex-1 group flex flex-col items-center text-center focus:outline-none cursor-pointer z-10"
                        >
                            {/* Circle Node */}
                            <div className={`relative flex size-11 items-center justify-center rounded-full border-2 transition-all duration-300 ${nodeColor} ${ringClass} group-hover:scale-105`}>
                                {isCompleted ? (
                                    <Check className="size-5 stroke-[3]" />
                                ) : (
                                    <Icon className="size-5" />
                                )}
                                
                                {/* Status dot on top right if it's the current executing stage */}
                                {isCurrent && (
                                    <span className="absolute -top-0.5 -right-0.5 flex size-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full size-2.5 bg-emerald-500"></span>
                                    </span>
                                )}
                            </div>

                            {/* Label & Description */}
                            <div className="mt-3 flex flex-col items-center">
                                <span className={`text-xs font-bold font-sans transition-colors duration-150 ${
                                    isActiveView ? "text-brand" : "text-slate-800 group-hover:text-slate-900"
                                }`}>
                                    {item.label}
                                </span>
                                <span className={`text-[10px] mt-0.5 font-bold uppercase tracking-wider font-sans px-2.5 py-0.5 rounded-full border transition-colors ${
                                    isCompleted 
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                        : isCurrent 
                                            ? "bg-brand/5 text-brand border-brand/10 animate-pulse" 
                                            : isActiveView 
                                                ? "bg-slate-100 text-slate-700 border-slate-200"
                                                : "bg-slate-50 text-slate-400 border-slate-100"
                                }`}>
                                    {isCompleted ? "Completed" : isCurrent ? "Running" : "Pending"}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
