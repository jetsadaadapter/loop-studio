"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Loader2, Trash2, Play, FileText, X, FileJson, FileCode } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ModalCloseButton } from "@/components/ui/modal-close-button";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import type { EnrichedPlannedTask } from "@/core/services/loop-planner.service";
import { PlanFromGoalSchema, zodFieldErrors } from "@/core/validators/loop-projects.validator";

import { Badge, type BadgeVariant } from "@/components/ui/badge";

interface AutoRunModalProps {
    isOpen: boolean;
    projectId: string;
    onClose: () => void;
    /** Called after tasks are created (and optionally an auto-run started). */
    onSuccess: (startedAutoRun: boolean) => void;
}

const TIER_VARIANTS: Record<string, BadgeVariant> = {
    RED: "error",
    ORANGE: "orange",
    YELLOW: "warning",
    GREEN: "success",
};

function apiKeyHeader(): Record<string, string> {
    const key = typeof window !== "undefined" ? localStorage.getItem("loop_anthropic_api_key") : null;
    return key ? { "X-Anthropic-API-Key": key } : {};
}

function getFileIcon(filePath: string, className = "size-3.5") {
    const ext = filePath.split(".").pop()?.toLowerCase();
    const cn = `${className} shrink-0`;
    if (ext === "json") return <FileJson className={`${cn} text-amber-500`} />;
    if (ext === "md" || ext === "mdx") return <FileText className={`${cn} text-blue-500`} />;
    if (["ts", "tsx", "js", "jsx", "mjs", "cjs"].includes(ext || "")) {
        return <FileCode className={`${cn} text-emerald-500`} />;
    }
    return <FileText className={`${cn} text-slate-400`} />;
}

function renderSuggestionItem(pathStr: string) {
    const parts = pathStr.split("/");
    const fileName = parts.pop() || "";
    const dirPath = parts.join("/");
    return (
        <div className="flex items-center gap-2 w-full min-w-0 text-xs">
            {getFileIcon(pathStr, "size-3.5")}
            <span className="font-medium text-slate-800 truncate shrink-0">{fileName}</span>
            {dirPath && (
                <span className="text-[11px] text-slate-400 truncate font-normal">
                    {dirPath}
                </span>
            )}
        </div>
    );
}

export function AutoRunModal({ isOpen, projectId, onClose, onSuccess }: AutoRunModalProps) {
    const [goal, setGoal] = useState("");
    const [drafts, setDrafts] = useState<EnrichedPlannedTask[] | null>(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState<"plan" | "apply" | "run" | null>(null);

    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    // Auto-complete files states
    const [projectFiles, setProjectFiles] = useState<string[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [triggerIndex, setTriggerIndex] = useState(-1);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

    React.useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [goal, isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        let active = true;
        fetch(`/api/loop-projects/${projectId}/files`)
            .then((r) => r.json())
            .then((data) => {
                if (active && data.success) {
                    setProjectFiles(data.data || []);
                }
            })
            .catch(console.error);

        return () => {
            active = false;
        };
    }, [projectId, isOpen]);

    const handleSelectionChange = (val: string, selectionStart: number) => {
        if (!val) {
            setShowSuggestions(false);
            return;
        }
        const textBeforeCursor = val.slice(0, selectionStart);
        const lastSlash = textBeforeCursor.lastIndexOf("/");
        const lastAt = textBeforeCursor.lastIndexOf("@");
        const lastTrigger = Math.max(lastSlash, lastAt);
        
        if (lastTrigger !== -1) {
            const textBetween = textBeforeCursor.slice(lastTrigger + 1);
            // Must not contain spaces or newlines (typing a continuous path/file)
            if (!textBetween.includes(" ") && !textBetween.includes("\n")) {
                setTriggerIndex(lastTrigger);
                const query = textBetween.toLowerCase();
                const filtered = projectFiles.filter((f) => f.toLowerCase().includes(query));
                setSuggestions(filtered.slice(0, 10)); // limit to 10
                setShowSuggestions(filtered.length > 0);
                return;
            }
        }
        setShowSuggestions(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Backspace" && !goal && selectedFiles.length > 0) {
            e.preventDefault();
            setSelectedFiles((prev) => prev.slice(0, prev.length - 1));
            return;
        }

        if (!showSuggestions || suggestions.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((prev) => (prev + 1) % suggestions.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === "Enter" || e.key === "Tab") {
            e.preventDefault();
            selectSuggestion(suggestions[activeIndex]);
        } else if (e.key === "Escape") {
            e.preventDefault();
            setShowSuggestions(false);
        }
    };

    const selectSuggestion = (filePath: string) => {
        if (!selectedFiles.includes(filePath)) {
            setSelectedFiles((prev) => [...prev, filePath]);
        }

        const textarea = textareaRef.current;
        if (!textarea) return;

        const val = goal;
        // Strip the trigger and query from the text
        const before = val.slice(0, triggerIndex);
        const after = val.slice(textarea.selectionStart);
        const newVal = before + after;
        
        setGoal(newVal);
        setShowSuggestions(false);

        // Put focus back and place cursor where the trigger was
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(triggerIndex, triggerIndex);
        }, 0);
    };

    const removeSelectedFile = (fileToRemove: string) => {
        setSelectedFiles((prev) => prev.filter((f) => f !== fileToRemove));
    };

    const reset = () => {
        setGoal("");
        setDrafts(null);
        setError("");
        setBusy(null);
        setShowSuggestions(false);
        setSuggestions([]);
        setSelectedFiles([]);
        setProjectFiles([]);
    };
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
            const enrichedGoal = selectedFiles.length > 0 
                ? `${goal}\n\nAttached files context:\n${selectedFiles.map(f => `- ${f}`).join("\n")}` 
                : goal;
            const res = await fetch(`/api/loop-projects/${projectId}/plan`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...apiKeyHeader() },
                body: JSON.stringify({ goal: enrichedGoal, apply: false }),
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
            const enrichedGoal = selectedFiles.length > 0 
                ? `${goal}\n\nAttached files context:\n${selectedFiles.map(f => `- ${f}`).join("\n")}` 
                : goal;
            const res = await fetch(`/api/loop-projects/${projectId}/plan`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...apiKeyHeader() },
                body: JSON.stringify({ goal: enrichedGoal, apply: true, tasks: drafts }),
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

                <div className={drafts 
                    ? "max-h-[70vh] overflow-y-auto px-5 py-4 space-y-4" 
                    : "px-5 py-4 space-y-4 overflow-visible"
                }>
                    <Field>
                        <FieldLabel htmlFor="autorun-goal">Goal</FieldLabel>
                        <div className="relative">
                            <div className="w-full rounded-md border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-brand/30 focus-within:border-brand/40 overflow-hidden">
                                {/* Selected File Pills */}
                                {selectedFiles.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50/50 border-b border-slate-100 select-none">
                                        {selectedFiles.map((file) => (
                                            <span
                                                key={file}
                                                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white py-1 pl-1.5 pr-1 text-[11px] text-slate-700 font-sans shadow-3xs"
                                            >
                                                {getFileIcon(file, "size-3")}
                                                <span className="font-medium max-w-48 truncate" title={file}>
                                                    {file.split("/").pop() || ""}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeSelectedFile(file)}
                                                    className="flex size-3.5 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-650 cursor-pointer"
                                                >
                                                    <X className="size-2.5" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <textarea
                                    ref={textareaRef}
                                    id="autorun-goal"
                                    aria-invalid={!!error}
                                    value={goal}
                                    onChange={(e) => {
                                        setGoal(e.target.value);
                                        if (error) setError("");
                                        handleSelectionChange(e.target.value, e.target.selectionStart);
                                    }}
                                    onKeyUp={(e) => {
                                        const target = e.target as HTMLTextAreaElement;
                                        handleSelectionChange(target.value, target.selectionStart);
                                    }}
                                    onKeyDown={handleKeyDown}
                                    rows={3}
                                    disabled={!!drafts}
                                    placeholder="Describe what you want built. Type @ or / to mention files..."
                                    className="w-full px-3 py-2 text-sm text-slate-800 focus:outline-none disabled:bg-slate-50 resize-none border-0"
                                />
                            </div>
                            {showSuggestions && suggestions.length > 0 && (
                                <ul className="absolute left-0 right-0 z-30 mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-200/80 bg-white py-1 shadow-xl shadow-slate-900/10 focus:outline-none divide-y divide-slate-50">
                                    {suggestions.map((s, idx) => (
                                        <li
                                            key={s}
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => selectSuggestion(s)}
                                            className={`cursor-pointer px-2.5 py-1 transition-all ${
                                                idx === activeIndex
                                                    ? "bg-slate-50 border-l-2 border-brand pl-2"
                                                    : "hover:bg-slate-50/50 pl-2.5"
                                            }`}
                                        >
                                            {renderSuggestionItem(s)}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
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
                                            <Badge variant={TIER_VARIANTS[d.riskTier]}>{d.riskTier}</Badge>
                                            <Badge variant="default">group {d.groupNumber}</Badge>
                                            {d.tags.map((t) => (
                                                <Badge key={t} variant="info">{t}</Badge>
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
