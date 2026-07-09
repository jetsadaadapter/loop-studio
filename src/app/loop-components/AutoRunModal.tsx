"use client";

import React, { useState } from "react";
import { Sparkles, Loader2, Trash2, Play } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ModalCloseButton } from "@/components/ui/modal-close-button";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import type { EnrichedPlannedTask } from "@/core/services/loop-planner.service";
import { PlanFromGoalSchema, zodFieldErrors } from "@/core/validators/loop-projects.validator";

interface AutoRunModalProps {
    isOpen: boolean;
    projectId: string;
    onClose: () => void;
    /** Called after tasks are created (and optionally an auto-run started). */
    onSuccess: (startedAutoRun: boolean) => void;
}

const riskColor = (tier: string) =>
    tier === "RED" ? "bg-red-50 text-red-700 border-red-200/60"
    : tier === "ORANGE" ? "bg-orange-50 text-orange-700 border-orange-200/60"
    : tier === "YELLOW" ? "bg-amber-50 text-amber-700 border-amber-200/60"
    : "bg-emerald-50 text-emerald-700 border-emerald-200/60";

function apiKeyHeader(): Record<string, string> {
    const key = typeof window !== "undefined" ? localStorage.getItem("loop_anthropic_api_key") : null;
    return key ? { "X-Anthropic-API-Key": key } : {};
}

export function AutoRunModal({ isOpen, projectId, onClose, onSuccess }: AutoRunModalProps) {
    const [goal, setGoal] = useState("");
    const [drafts, setDrafts] = useState<EnrichedPlannedTask[] | null>(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState<"plan" | "apply" | "run" | null>(null);

    const reset = () => { setGoal(""); setDrafts(null); setError(""); setBusy(null); };
    const close = () => { reset(); onClose(); };

    const generatePlan = async () => {
        setError("");
        const check = PlanFromGoalSchema.safeParse({ goal, apply: false });
        if (!check.success) {
            setError(zodFieldErrors(check.error).goal ?? check.error.issues[0].message);
            return;
        }
        setBusy("plan");
        try {
            const res = await fetch(`/api/loop-projects/${projectId}/plan`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...apiKeyHeader() },
                body: JSON.stringify({ goal, apply: false }),
            });
            const data = await res.json();
            if (data.success) setDrafts(data.data.tasks);
            else setError(data.error || "Failed to generate a plan.");
        } catch {
            setError("Failed to generate a plan due to a network error.");
        } finally {
            setBusy(null);
        }
    };

    const applyPlan = async (startRun: boolean) => {
        if (!drafts?.length) return;
        setError("");
        setBusy(startRun ? "run" : "apply");
        try {
            const res = await fetch(`/api/loop-projects/${projectId}/plan`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...apiKeyHeader() },
                body: JSON.stringify({ goal, apply: true, tasks: drafts }),
            });
            const data = await res.json();
            if (!data.success) { setError(data.error || "Failed to create tasks."); return; }

            if (startRun) {
                const runRes = await fetch(`/api/loop-projects/${projectId}/auto-run`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", ...apiKeyHeader() },
                    body: JSON.stringify({ taskIds: data.data.tasks.map((t: { id: string }) => t.id) }),
                });
                const runData = await runRes.json();
                if (!runData.success) { setError(`Tasks created, but auto-run failed to start: ${runData.error}`); onSuccess(false); return; }
            }
            onSuccess(startRun);
            close();
        } catch {
            setError("Failed to create tasks due to a network error.");
        } finally {
            setBusy(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
            <DialogContent
                hideCloseButton
                className="w-full max-w-2xl rounded-2xl border border-slate-200/60 bg-white p-0 shadow-xl shadow-slate-900/10 focus:outline-none"
            >
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div className="flex items-center gap-2.5">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                            <Sparkles className="size-3.5" />
                        </span>
                        <h2 className="text-sm font-semibold text-slate-800">Plan from Goal</h2>
                    </div>
                    <ModalCloseButton onClose={close} disabled={!!busy} />
                </div>

                <div className="max-h-[70vh] overflow-y-auto px-5 py-4 space-y-4">
                    <Field>
                        <FieldLabel htmlFor="autorun-goal">Goal</FieldLabel>
                        <textarea
                            id="autorun-goal"
                            aria-invalid={!!error}
                            value={goal}
                            onChange={(e) => { setGoal(e.target.value); if (error) setError(""); }}
                            rows={3}
                            disabled={!!drafts}
                            placeholder="Describe what you want built — the Architect will break it into backlog tasks."
                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:bg-slate-50"
                        />
                        <FieldDescription>
                            The AI team plans first; nothing runs until you approve. Requires an API key (AI Team page).
                        </FieldDescription>
                        {error && <FieldError>{error}</FieldError>}
                    </Field>

                    {drafts && (
                        <ul className="space-y-2">
                            {drafts.map((d, i) => (
                                <li key={`${d.name}-${i}`} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200/70 bg-slate-50/50 px-3 py-2">
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-slate-800">{d.name}</p>
                                        <p className="truncate text-xs text-slate-500" title={d.targetFiles.join(", ")}>{d.targetFiles.join(", ")}</p>
                                        <div className="mt-1 flex flex-wrap items-center gap-1">
                                            <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold font-sans ${riskColor(d.riskTier)}`}>{d.riskTier}</span>
                                            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-sans text-slate-600">group {d.groupNumber}</span>
                                            {d.tags.map((t) => (
                                                <span key={t} className="rounded-full border border-indigo-200/60 bg-indigo-50 px-2 py-0.5 text-xs font-sans text-indigo-700">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setDrafts(drafts.filter((_, j) => j !== i))}
                                        className="shrink-0 rounded-sm p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                                        title="Remove from plan"
                                    >
                                        <Trash2 className="size-3.5" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3">
                    {!drafts ? (
                        <button
                            onClick={generatePlan}
                            disabled={busy === "plan"}
                            className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand/90 disabled:opacity-50 cursor-pointer shadow-sm"
                        >
                            {busy === "plan" ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                            Generate Plan
                        </button>
                    ) : (
                        <>
                            <button onClick={() => setDrafts(null)} className="rounded-sm border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">
                                Edit Goal
                            </button>
                            <button
                                onClick={() => applyPlan(false)}
                                disabled={!drafts.length || !!busy}
                                className="rounded-sm border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                            >
                                {busy === "apply" ? <Loader2 className="inline size-3.5 animate-spin" /> : null} Add to Backlog
                            </button>
                            <button
                                onClick={() => applyPlan(true)}
                                disabled={!drafts.length || !!busy}
                                className="flex items-center gap-1.5 rounded-sm bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand/90 disabled:opacity-50 cursor-pointer shadow-sm"
                            >
                                {busy === "run" ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
                                Add & Auto-Run
                            </button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
