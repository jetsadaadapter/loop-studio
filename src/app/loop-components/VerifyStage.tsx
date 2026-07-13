"use client";

import React from "react";
import { CheckSquare, PlayCircle } from "lucide-react";

interface VerifyStageProps {
    runner: "vitest" | "playwright";
    onRunnerChange: (runner: "vitest" | "playwright") => void;
    runningAction: string | null;
    onRunAction: (type: string) => void;
    readOnly?: boolean;
    onAdvance: () => void;
}

export function VerifyStage({ runner, onRunnerChange, runningAction, onRunAction, readOnly = false, onAdvance }: VerifyStageProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <CheckSquare className="size-5 text-indigo-600" />
                <h3 className="font-semibold text-slate-800 text-sm">Stage 3 (Verify): Local Test Suite</h3>
            </div>

            <div className="flex items-center gap-4 text-xs font-sans text-slate-700">
                <span>Select Test Runner:</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                        type="radio"
                        name="runner"
                        checked={runner === "vitest"}
                        onChange={() => onRunnerChange("vitest")}
                        className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Vitest (Unit tests)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                        type="radio"
                        name="runner"
                        checked={runner === "playwright"}
                        onChange={() => onRunnerChange("playwright")}
                        className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Playwright (E2E / Visual)</span>
                </label>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={() => onRunAction(runner)}
                    disabled={runningAction !== null}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-sm bg-brand py-2 text-xs font-semibold text-white hover:bg-brand/90 disabled:opacity-50 cursor-pointer shadow-sm animate-pulse"
                >
                    <PlayCircle className="size-4" />
                    {runningAction === runner ? "Running Suite..." : `Execute ${runner === "vitest" ? "Vitest" : "Playwright"}`}
                </button>
            </div>

            <button
                onClick={onAdvance}
                disabled={readOnly}
                className="w-full rounded-sm border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer shadow-3xs disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
            >
                Advance to Automate
            </button>
            {readOnly && (
                <p className="text-center text-[10px] text-slate-400 font-sans">
                    Viewing history — this action only applies to the task&apos;s current stage.
                </p>
            )}
        </div>
    );
}
