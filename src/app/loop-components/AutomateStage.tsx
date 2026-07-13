"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";

interface AutomateStageProps {
    onRunAction: (type: string) => void;
    readOnly?: boolean;
    onAdvance: () => void;
}

export function AutomateStage({ onRunAction, readOnly = false, onAdvance }: AutomateStageProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-indigo-600" />
                <h3 className="font-semibold text-slate-800 text-sm">Stage 4 (Automate): CI Guard (Lint & Build)</h3>
            </div>

            <ul className="space-y-2 text-xs font-sans text-slate-600">
                <li className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-slate-400" />
                    <span>Run Lint compilation check (eslint)</span>
                </li>
                <li className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-slate-400" />
                    <span>Type checking validation (tsc --noEmit)</span>
                </li>
                <li className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-slate-400" />
                    <span>Build production bundle compile (next build)</span>
                </li>
            </ul>

            <div className="flex gap-2">
                <button
                    onClick={() => onRunAction("lint")}
                    className="flex-1 rounded-sm border border-slate-200 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                    Run Lint Check
                </button>
                <button
                    onClick={() => onRunAction("build")}
                    className="flex-1 rounded-sm border border-slate-200 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                    Run Typecheck & Build
                </button>
            </div>

            <button
                onClick={onAdvance}
                disabled={readOnly}
                className="w-full rounded-sm bg-brand py-2 text-xs font-semibold text-white hover:bg-brand/90 cursor-pointer shadow-sm disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-brand"
            >
                CI Tests Passed & Advance to Observe
            </button>
            {readOnly && (
                <p className="text-center text-[10px] text-slate-400 font-sans">
                    Viewing history — this action only applies to the task&apos;s current stage.
                </p>
            )}
        </div>
    );
}
