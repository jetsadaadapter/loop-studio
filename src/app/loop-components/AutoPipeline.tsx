"use client";

import React, { useState } from "react";
import { Zap, Loader2, Check, X, Circle } from "lucide-react";

interface AutoPipelineProps {
    projectId: string;
    taskId: string;
    onComplete: () => void;
    onTriggerLog: () => void;
}

interface StepResult {
    key: string;
    label: string;
    exitCode: number;
    ok: boolean;
}

// Display order/labels mirror the server pipeline steps.
const STEP_LABELS: { key: string; label: string }[] = [
    { key: "vitest", label: "Unit tests (Vitest)" },
    { key: "lint", label: "Lint (ESLint)" },
    { key: "build", label: "Build (next build)" },
];

export function AutoPipeline({ projectId, taskId, onComplete, onTriggerLog }: AutoPipelineProps) {
    const [running, setRunning] = useState(false);
    const [results, setResults] = useState<StepResult[] | null>(null);
    const [allPassed, setAllPassed] = useState<boolean | null>(null);
    const [error, setError] = useState("");

    const run = async () => {
        setRunning(true);
        setResults(null);
        setAllPassed(null);
        setError("");
        onTriggerLog();
        try {
            const res = await fetch(`/api/loop-projects/${projectId}/tasks/${taskId}/pipeline`, {
                method: "POST",
            });
            const data = await res.json();
            if (data.success) {
                setResults(data.data.steps as StepResult[]);
                setAllPassed(data.data.allPassed as boolean);
                onComplete();
            } else {
                setError(data.error || "Pipeline failed to run.");
            }
        } catch {
            setError("Pipeline failed due to a network error.");
        } finally {
            setRunning(false);
            onTriggerLog();
        }
    };

    // Merge static step labels with any result for that step.
    const rows = STEP_LABELS.map((s) => ({
        ...s,
        result: results?.find((r) => r.key === s.key) ?? null,
    }));

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-3xs">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <Zap className="size-3.5" />
                    </span>
                    <div>
                        <h3 className="text-sm font-semibold text-slate-800">Auto Checkpoints</h3>
                        <p className="text-[10px] text-slate-400 font-sans">Runs Verify + Automate, then advances to Observe</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={run}
                    disabled={running}
                    className="flex h-8 items-center gap-1.5 rounded-sm bg-brand px-3.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-brand/90 disabled:opacity-60 cursor-pointer"
                >
                    {running ? <Loader2 className="size-3.5 animate-spin" /> : <Zap className="size-3.5" />}
                    {running ? "Running checks…" : "Run checks"}
                </button>
            </div>

            <ul className="mt-4 space-y-2">
                {rows.map((row) => {
                    const state = running && !row.result ? "running" : row.result ? (row.result.ok ? "pass" : "fail") : "idle";
                    return (
                        <li
                            key={row.key}
                            className="flex items-center gap-2.5 rounded-lg border border-slate-100 px-3 py-2 text-xs font-sans text-slate-700"
                        >
                            {state === "running" && <Loader2 className="size-3.5 shrink-0 animate-spin text-indigo-500" />}
                            {state === "pass" && <Check className="size-3.5 shrink-0 text-emerald-500" />}
                            {state === "fail" && <X className="size-3.5 shrink-0 text-red-500" />}
                            {state === "idle" && <Circle className="size-3.5 shrink-0 text-slate-300" />}
                            <span className={state === "fail" ? "text-red-600 font-semibold" : ""}>{row.label}</span>
                            {row.result && (
                                <span className="ml-auto font-sans text-[10px] text-slate-400">exit {row.result.exitCode}</span>
                            )}
                        </li>
                    );
                })}
            </ul>

            {allPassed === true && (
                <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-emerald-200/60 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                    <Check className="size-3.5" />
                    All checks passed — advanced to Observe.
                </div>
            )}
            {allPassed === false && (
                <div className="mt-3 rounded-lg border border-red-200/60 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                    A check failed — see the run logs below and fix before continuing.
                </div>
            )}
            {error && (
                <div className="mt-3 rounded-lg border border-red-200/60 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
            )}
        </div>
    );
}
