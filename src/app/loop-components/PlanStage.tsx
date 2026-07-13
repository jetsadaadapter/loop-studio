"use client";

import React from "react";
import { AlertTriangle, Check } from "lucide-react";
import type { LoopTask } from "@/core/interfaces/loop-projects.interface";

import { Badge, type BadgeVariant } from "@/components/ui/badge";

interface PlanStageProps {
    task: LoopTask;
    onAdvance: () => void;
}

const TIER_VARIANTS: Record<string, BadgeVariant> = {
    RED: "error",
    ORANGE: "orange",
    YELLOW: "warning",
    GREEN: "success",
};

export function PlanStage({ task, onAdvance }: PlanStageProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-indigo-600" />
                <h3 className="font-semibold text-slate-800 text-sm">Stage 1 (Plan): Risk Tier Router</h3>
            </div>

            <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-sans">Primary Target:</span>
                <code className="text-xs bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 font-sans font-medium text-slate-700">
                    {task.targetFiles[0]}
                </code>
                <Badge variant={TIER_VARIANTS[task.riskTier || "GREEN"]}>
                    {task.riskTier || "GREEN"} Tier
                </Badge>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3">
                <h4 className="text-xs font-semibold text-slate-700">Required Safety Net Checklist:</h4>
                <ul className="space-y-1.5 text-xs text-slate-600 font-sans">
                    {(task.safetyNets || []).map((sn, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                            <Check className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{sn}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <button
                onClick={onAdvance}
                className="w-full rounded-sm bg-brand py-2 text-xs font-semibold text-white hover:bg-brand/90 cursor-pointer shadow-sm"
            >
                Approve Plan & Advance to Build
            </button>
        </div>
    );
}
