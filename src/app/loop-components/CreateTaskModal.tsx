"use client";

import React, { useState, useEffect } from "react";
import { X, FileText, ListChecks, Loader2, Check } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { TagInput } from "@/components/ui/tag-input";
import type { RiskTier } from "@/core/interfaces/loop-projects.interface";
import { CreateTaskSchema } from "@/core/validators/loop-projects.validator";

interface CreateTaskModalProps {
    isOpen: boolean;
    projectId: string;
    onClose: () => void;
    onSuccess: () => void;
}

interface RiskPreview {
    tier: RiskTier;
    count: number;
    safetyNets: string[];
}

const RISK_STYLES: Record<RiskTier, string> = {
    RED: "bg-red-50 text-red-700 border-red-200/60",
    ORANGE: "bg-orange-50 text-orange-700 border-orange-200/60",
    YELLOW: "bg-amber-50 text-amber-700 border-amber-200/60",
    GREEN: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
};

export function CreateTaskModal({ isOpen, projectId, onClose, onSuccess }: CreateTaskModalProps) {
    const [name, setName] = useState("");
    const [targetFiles, setTargetFiles] = useState<string[]>([]);
    const [fileOptions, setFileOptions] = useState<string[]>([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [wasOpen, setWasOpen] = useState(isOpen);
    const [risk, setRisk] = useState<RiskPreview | null>(null);
    const [riskLoading, setRiskLoading] = useState(false);
    const [previewedFile, setPreviewedFile] = useState("");

    // The first target file drives the risk tier (matches the server's task-create logic).
    const primaryFile = targetFiles[0] ?? "";

    // Reset the form each time the modal transitions to open (adjust-during-render
    // pattern — cheaper and lint-clean vs. a state-setting effect).
    if (isOpen !== wasOpen) {
        setWasOpen(isOpen);
        if (isOpen) {
            setName("");
            setTargetFiles([]);
            setError("");
        }
    }

    // Drop a stale tier preview the moment the primary file changes (incl. cleared).
    if (primaryFile !== previewedFile) {
        setPreviewedFile(primaryFile);
        setRisk(null);
    }

    // Load the project's real source files once the modal opens so the picker can
    // suggest them (users can still type a path for a file that doesn't exist yet).
    useEffect(() => {
        if (!isOpen) return;
        let active = true;
        fetch(`/api/loop-projects/${projectId}/files`)
            .then((res) => res.json())
            .then((data) => {
                if (active && data.success) setFileOptions(data.data as string[]);
            })
            .catch(() => {
                /* picker still works with free-text entry */
            });
        return () => {
            active = false;
        };
    }, [isOpen, projectId]);

    // Live risk-tier preview: debounce, then scan the primary file's imports fan-out.
    useEffect(() => {
        if (!isOpen || !primaryFile) return;
        let active = true;
        const timer = setTimeout(() => {
            setRiskLoading(true);
            fetch(`/api/loop-projects/${projectId}/risk-tier?file=${encodeURIComponent(primaryFile)}`)
                .then((res) => res.json())
                .then((data) => {
                    if (active && data.success) setRisk(data.data as RiskPreview);
                })
                .catch(() => {
                    /* preview is best-effort; the real tier is computed on submit */
                })
                .finally(() => {
                    if (active) setRiskLoading(false);
                });
        }, 350);
        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [isOpen, projectId, primaryFile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const check = CreateTaskSchema.safeParse({ name, targetFiles });
        if (!check.success) {
            setError(check.error.issues[0].message);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/loop-projects/${projectId}/tasks`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, targetFiles }),
            });
            const data = await res.json();
            if (data.success) {
                onSuccess();
                onClose();
            } else {
                setError(data.error || "Failed to create task");
            }
        } catch {
            setError("Failed to create task due to network error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                hideCloseButton
                className="w-full max-w-md rounded-2xl border border-slate-200/60 bg-white p-0 shadow-xl shadow-slate-900/10 focus:outline-none"
            >
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div className="flex items-center gap-2.5">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                            <ListChecks className="size-3.5" />
                        </span>
                        <h2 className="text-sm font-semibold text-slate-800">Create Loop Task</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close modal"
                        title="Close modal"
                        className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
                    <Field>
                        <FieldLabel>
                            Task Title / Goal <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                            type="text"
                            required
                            placeholder="e.g. Implement rounding options for Button"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </Field>

                    <Field>
                        <FieldLabel>
                            Target Files <span className="text-destructive">*</span>
                        </FieldLabel>
                        <TagInput
                            value={targetFiles}
                            onChange={setTargetFiles}
                            suggestions={fileOptions}
                            placeholder="Search files… e.g. button.tsx"
                        />
                        <FieldDescription>
                            Type to search project files, then click to add. Press Enter to add a path
                            that doesn&apos;t exist yet (e.g. a new test file).
                        </FieldDescription>
                    </Field>

                    {!primaryFile ? (
                        <div className="flex items-start gap-2 rounded-lg border border-amber-200/50 bg-amber-50/50 p-3">
                            <FileText className="mt-0.5 size-4 shrink-0 text-amber-600" />
                            <div className="text-[10px] leading-normal text-amber-800">
                                <strong>Note on planning:</strong> The first file you add is scanned automatically to calculate its imports fan-out and determine the Task Risk Tier (Red, Orange, Yellow, Green) following the playbook.
                            </div>
                        </div>
                    ) : riskLoading && !risk ? (
                        <div className="flex items-center gap-2 rounded-lg border border-slate-200/60 bg-slate-50/60 p-3 text-[11px] text-slate-500">
                            <Loader2 className="size-3.5 animate-spin" />
                            Analyzing imports fan-out for <span className="font-semibold text-slate-700">{primaryFile}</span>…
                        </div>
                    ) : risk ? (
                        <div className="space-y-2.5 rounded-lg border border-slate-200/60 bg-slate-50/50 p-3">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-semibold text-slate-600">Task Risk Tier</span>
                                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${RISK_STYLES[risk.tier]}`}>
                                    {risk.tier}
                                </span>
                            </div>
                            <p className="text-[10px] text-slate-500">
                                <span className="font-semibold text-slate-700">{primaryFile}</span> is imported in{" "}
                                <span className="font-semibold text-slate-700">{risk.count}</span>{" "}
                                {risk.count === 1 ? "file" : "files"}.
                            </p>
                            <div>
                                <p className="mb-1 text-[10px] font-semibold text-slate-600">Safety nets that will apply:</p>
                                <ul className="space-y-1">
                                    {risk.safetyNets.map((sn) => (
                                        <li key={sn} className="flex items-start gap-1.5 text-[10px] text-slate-600">
                                            <Check className="mt-0.5 size-3 shrink-0 text-emerald-500" />
                                            {sn}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : null}

                    <FieldError errors={error ? [{ message: error }] : []} />

                    <div className="flex items-center justify-end gap-2.5 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-9 cursor-pointer rounded-sm border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex h-9 cursor-pointer items-center gap-2 rounded-sm bg-brand px-5 text-xs font-semibold text-white shadow-sm shadow-brand/10 transition-all hover:bg-brand/90 disabled:opacity-60"
                        >
                            {loading && <Loader2 className="size-3.5 animate-spin" />}
                            {loading ? "Creating Plan..." : "Initialize Loop"}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
