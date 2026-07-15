"use client";

import React, { useState } from "react";
import { Pencil, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ModalCloseButton } from "@/components/ui/modal-close-button";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import { RegisterProjectSchema, zodFieldErrors } from "@/core/validators/loop-projects.validator";
import { FolderPicker } from "./FolderPicker";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { LoopProject } from "@/core/interfaces/loop-projects.interface";
import { AUTO_AGENTS } from "@/core/interfaces/loop-projects.interface";

interface EditProjectModalProps {
    project: LoopProject | null;
    onClose: () => void;
    onSuccess: () => void;
}

const TEMPLATE_OPTIONS = [
    { value: "nextjs-app", label: "Next.js (App Router)" },
    { value: "nextjs-pages", label: "Next.js (Pages Router)" },
    { value: "vite-react", label: "Vite React (SPA)" },
    { value: "nodejs", label: "Node.js / Backend" },
    { value: "generic", label: "Generic Project" },
];

// Edit a registered project's metadata. Opens when a project is passed;
// fields are prefilled and saved via PATCH /api/loop-projects/[projectId].
// The form is keyed by project id so switching projects remounts it with
// fresh initial state (no prop→state syncing effects).
export function EditProjectModal({ project, onClose, onSuccess }: EditProjectModalProps) {
    return (
        <Dialog open={!!project} onOpenChange={(open) => !open && onClose()}>
            {project && <EditProjectForm key={project.id} project={project} onClose={onClose} onSuccess={onSuccess} />}
        </Dialog>
    );
}

function EditProjectForm({ project, onClose, onSuccess }: EditProjectModalProps & { project: LoopProject }) {
    const [name, setName] = useState(project.name);
    const [path, setPath] = useState(project.path);
    const [template, setTemplate] = useState<string>(project.template);
    const [previewUrl, setPreviewUrl] = useState(project.previewUrl ?? "");
    // "off" is a UI sentinel (Radix Select forbids an empty-string value); it maps
    // to "" in the PATCH body, which clears project.autoAgent.
    const [autoAgent, setAutoAgent] = useState<string>(project.autoAgent ?? "off");
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const clearFieldError = (key: string) => {
        if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: "" }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const check = RegisterProjectSchema.safeParse({ name, path, template, previewUrl });
        if (!check.success) {
            setFieldErrors(zodFieldErrors(check.error));
            return;
        }
        setFieldErrors({});

        setLoading(true);
        try {
            const res = await fetch(`/api/loop-projects/${project.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, path, template, previewUrl, autoAgent: autoAgent === "off" ? "" : autoAgent }),
            });
            const data = await res.json();
            if (data.success) {
                onSuccess();
                onClose();
            } else {
                setError(data.error || "Failed to update project");
            }
        } catch {
            setError("Failed to update project due to network error");
        } finally {
            setLoading(false);
        }
    };

    return (
            <DialogContent
                hideCloseButton
                className="w-full max-w-md rounded-2xl border border-slate-200/60 bg-white p-0 shadow-xl shadow-slate-900/10 focus:outline-none"
            >
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div className="flex items-center gap-2.5">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                            <Pencil className="size-3.5" />
                        </span>
                        <h2 className="text-sm font-semibold text-slate-800">Edit Project</h2>
                    </div>
                    <ModalCloseButton onClose={onClose} />
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-4 px-5 py-4">
                    <Field>
                        <FieldLabel htmlFor="edit-proj-name">Project Name <span className="text-brand">*</span></FieldLabel>
                        <Input
                            id="edit-proj-name"
                            aria-invalid={!!fieldErrors.name}
                            value={name}
                            onChange={(e) => { setName(e.target.value); clearFieldError("name"); }}
                            placeholder="e.g. My Website"
                        />
                        <FieldError errors={fieldErrors.name ? [{ message: fieldErrors.name }] : []} />
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="edit-proj-path">Absolute Directory Path <span className="text-brand">*</span></FieldLabel>
                        <div className="flex items-center gap-2">
                            <Input
                                id="edit-proj-path"
                                aria-invalid={!!fieldErrors.path}
                                value={path}
                                disabled={project.isHost}
                                onChange={(e) => { setPath(e.target.value); clearFieldError("path"); }}
                                placeholder="e.g. /Users/name/AdapterWorks/2026/my-app"
                            />
                            {!project.isHost && <FolderPicker value={path} onChange={(v) => { setPath(v); clearFieldError("path"); }} />}
                        </div>
                        {project.isHost && (
                            <FieldDescription>
                                Locked — this is the running Loop Studio app; its safety guards depend on this path.
                            </FieldDescription>
                        )}
                        <FieldError errors={fieldErrors.path ? [{ message: fieldErrors.path }] : []} />
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="edit-proj-preview">Preview / Dev server URL</FieldLabel>
                        <Input
                            id="edit-proj-preview"
                            aria-invalid={!!fieldErrors.previewUrl}
                            value={previewUrl}
                            onChange={(e) => { setPreviewUrl(e.target.value); clearFieldError("previewUrl"); }}
                            placeholder="e.g. http://localhost:3001"
                        />
                        <FieldDescription>
                            Optional. Where this project&apos;s app runs, shown in the Studio preview pane.
                        </FieldDescription>
                        <FieldError errors={fieldErrors.previewUrl ? [{ message: fieldErrors.previewUrl }] : []} />
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="edit-proj-template">Template Framework</FieldLabel>
                        <Select value={template} onValueChange={(v) => setTemplate(v ?? "generic")}>
                            <SelectTrigger id="edit-proj-template" className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {TEMPLATE_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="edit-proj-agent">Auto agent (IDE bridge)</FieldLabel>
                        <Select value={autoAgent} onValueChange={(v) => setAutoAgent(v ?? "off")}>
                            <SelectTrigger id="edit-proj-agent" className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="off">Off — wait for a human</SelectItem>
                                {AUTO_AGENTS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FieldDescription>
                            When set, keyless chat/collaborate is auto-fulfilled by this local agent (read-only) instead of waiting for a human. Overrides the server default.
                        </FieldDescription>
                    </Field>

                    {error && <FieldError>{error}</FieldError>}

                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                        <button type="button" onClick={onClose} className="rounded-sm border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-1.5 rounded-sm bg-brand px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand/90 disabled:opacity-50 cursor-pointer shadow-sm"
                        >
                            {loading && <Loader2 className="size-3.5 animate-spin" />}
                            Save Changes
                        </button>
                    </div>
                </form>
            </DialogContent>
    );
}
