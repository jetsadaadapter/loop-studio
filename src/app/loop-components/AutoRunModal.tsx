"use client";

import { Sparkles, Loader2, Trash2, Play, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ModalCloseButton } from "@/components/ui/modal-close-button";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { TIER_VARIANTS, getFileIcon, renderSuggestionItem } from "./autorun-helpers";
import { useAutoRunPlan } from "./useAutoRunPlan";

interface AutoRunModalProps {
    isOpen: boolean;
    projectId: string;
    onClose: () => void;
    /** Called after tasks are created (and optionally an auto-run started). */
    onSuccess: (startedAutoRun: boolean) => void;
}

export function AutoRunModal({ isOpen, projectId, onClose, onSuccess }: AutoRunModalProps) {
    const {
        goal,
        drafts,
        setDrafts,
        error,
        busy,
        textareaRef,
        suggestions,
        showSuggestions,
        activeIndex,
        selectedFiles,
        onGoalChange,
        handleSelectionChange,
        handleKeyDown,
        selectSuggestion,
        removeSelectedFile,
        close,
        generatePlan,
        applyPlan,
    } = useAutoRunPlan({ isOpen, projectId, onClose, onSuccess });

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
                                    onChange={(e) => onGoalChange(e.target.value, e.target.selectionStart)}
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
