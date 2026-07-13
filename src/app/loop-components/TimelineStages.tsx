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
        <div className="w-full px-2 py-1.5 select-none relative">
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-1">
                {/* Connecting track line */}
                <div className="hidden md:block absolute top-[11px] left-[8%] right-[8%] h-px bg-slate-200 z-0">
                    <div
                        className="h-full bg-[#5D8736] transition-all duration-500 ease-in-out"
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
                        nodeColor = "bg-[#5D8736] border-[#5D8736] text-white";
                    } else if (isCurrent) {
                        nodeColor = "bg-brand border-brand text-white";
                        ringClass = "ring-2 ring-brand/20 animate-pulse";
                    } else if (isActiveView) {
                        nodeColor = "bg-white border-brand text-brand";
                    }

                    const Icon = item.icon;

                    return (
                        <button
                            key={item.stage}
                            onClick={() => onSelectStage(item.stage)}
                            className="flex-1 group flex flex-col items-center text-center focus:outline-none cursor-pointer relative z-10"
                        >
                            {/* Circle Node */}
                            <div className={`relative flex size-6 items-center justify-center rounded-full border transition-all duration-300 ${nodeColor} ${ringClass} group-hover:scale-105`}>
                                {isCompleted ? (
                                    <Check className="size-3 stroke-[3]" />
                                ) : (
                                    <Icon className="size-3" />
                                )}

                                {/* Ping dot for currently running stage */}
                                {isCurrent && (
                                    <span className="absolute -top-0.5 -right-0.5 flex size-1.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5D8736] opacity-75"></span>
                                        <span className="relative inline-flex rounded-full size-1.5 bg-[#5D8736]"></span>
                                    </span>
                                )}
                            </div>

                            {/* Label & status */}
                            <div className="mt-1 flex flex-col items-center gap-0.5">
                                <span className={`text-[9px] font-semibold font-sans leading-none transition-colors ${
                                    isActiveView ? "text-brand" : "text-slate-600 group-hover:text-slate-900"
                                }`}>
                                    {item.label}
                                </span>
                                <span className={`text-[7px] leading-none font-bold uppercase tracking-wide font-sans transition-colors ${
                                    isCompleted
                                        ? "text-[#5D8736]"
                                        : isCurrent
                                            ? "text-brand animate-pulse"
                                            : "text-slate-300"
                                }`}>
                                    {isCompleted ? "Done" : isCurrent ? "Running" : "·"}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
