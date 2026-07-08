"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Rocket, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { BootstrapProjectSchema } from "@/core/validators/loop-projects.validator";
import { FolderPicker } from "./FolderPicker";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface BootstrapModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const TEMPLATE_OPTIONS = [
    { value: "nextjs-app", label: "Next.js (App Router, Tailwind, TS)" },
    { value: "vite-react", label: "Vite React (Single Page App, TS)" },
    { value: "generic", label: "Empty Directory" },
];

export function BootstrapModal({ isOpen, onClose, onSuccess }: BootstrapModalProps) {
    const [name, setName] = useState("");
    const [pathValue, setPathValue] = useState("");
    const [template, setTemplate] = useState("nextjs-app");
    const [error, setError] = useState("");
    const [isBootstrapping, setIsBootstrapping] = useState(false);
    const [logs, setLogs] = useState("");
    const logContainerRef = useRef<HTMLPreElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const check = BootstrapProjectSchema.safeParse({ name, path: pathValue, template });
        if (!check.success) {
            setError(check.error.issues[0].message);
            return;
        }

        setIsBootstrapping(true);
        setLogs("Initializing bootstrap process...\n");

        try {
            const res = await fetch("/api/loop-projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "bootstrap",
                    name,
                    path: pathValue,
                    template,
                }),
            });
            const data = await res.json();
            if (data.success && data.projectId) {
                // Connect to EventSource for logs
                // The logs route keys streams by taskId only; the bootstrap job id
                // is used as the taskId while the project is still being created.
                const eventSource = new EventSource(`/api/loop-projects/bootstrap/tasks/${data.projectId}/logs`);

                const finalize = () => {
                    eventSource.close();
                    setIsBootstrapping(false);
                    onSuccess();
                };

                eventSource.onmessage = (event) => {
                    try {
                        const parsed = JSON.parse(event.data);
                        if (parsed.text) {
                            const text = String(parsed.text);
                            // Backend appends this sentinel once the job truly finishes
                            // (project created + deps installed/registered). Strip it
                            // from the visible log and finalize the modal state.
                            const done = text.includes("[Bootstrap] __DONE__");
                            const clean = text.replace(/\n?\[Bootstrap\] __DONE__\n?/g, "");
                            if (clean) setLogs((prev) => prev + clean);
                            if (done) finalize();
                        }
                    } catch {
                        // ignore
                    }
                };

                eventSource.onerror = () => {
                    // Stream dropped (e.g. server restart) — finalize gracefully.
                    finalize();
                };
            } else {
                setError(data.error || "Failed to initiate bootstrapping");
                setIsBootstrapping(false);
            }
        } catch {
            setError("Failed to boot project due to network error");
            setIsBootstrapping(false);
        }
    };

    // Auto-scroll logs
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && !isBootstrapping && onClose()}>
            <DialogContent
                hideCloseButton
                className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-2xl border border-slate-200/60 bg-white p-0 shadow-xl shadow-slate-900/10 focus:outline-none"
            >
                <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div className="flex items-center gap-2.5">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                            <Rocket className="size-3.5" />
                        </span>
                        <h2 className="text-sm font-semibold text-slate-800">Bootstrap New Project</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isBootstrapping}
                        aria-label="Close modal"
                        title="Close modal"
                        className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {!isBootstrapping ? (
                    <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto px-5 py-5">
                        <Field>
                            <FieldLabel>
                                Project Name <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input
                                type="text"
                                required
                                placeholder="e.g. Next Big Thing"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </Field>

                        <Field>
                            <FieldLabel>Directory Path (To Create Folder)</FieldLabel>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="text"
                                    placeholder="Leave blank to create in .projects/"
                                    value={pathValue}
                                    onChange={(e) => setPathValue(e.target.value)}
                                    className="flex-1"
                                />
                                <FolderPicker value={pathValue} onChange={setPathValue} />
                            </div>
                            <FieldDescription>
                                Optional. Blank creates the folder under Loop Studio&apos;s <span className="font-semibold">.projects/</span> workspace, named after the project.
                            </FieldDescription>
                        </Field>

                        <Field>
                            <FieldLabel>Template Framework</FieldLabel>
                            <Select value={template} onValueChange={(val) => setTemplate(val || "")}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent align="start">
                                    {TEMPLATE_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>

                        <FieldError errors={error ? [{ message: error }] : []} />

                        <div className="flex items-center justify-end gap-2.5 pt-1">
                            <button
                                type="button"
                                onClick={onClose}
                                className="h-9 cursor-pointer rounded-sm border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="h-9 cursor-pointer rounded-sm bg-brand px-5 text-xs font-semibold text-white shadow-sm shadow-brand/10 transition-all hover:bg-brand/90"
                            >
                                Generate Project
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="flex min-h-0 flex-1 flex-col px-5 py-5">
                        <div className="mb-2 flex items-center gap-2 text-xs text-slate-600">
                            <Loader2 className="size-4 animate-spin text-brand" />
                            <span>Generating project in background... Feel free to wait or close when done.</span>
                        </div>
                        <pre
                            ref={logContainerRef}
                            className="flex-1 select-text overflow-y-auto rounded-lg border border-slate-800 bg-slate-900 p-4 font-mono text-[10px] leading-relaxed text-slate-200"
                        >
                            {logs}
                        </pre>
                        <div className="mt-4 flex shrink-0 justify-end border-t border-slate-100 pt-3">
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    onSuccess();
                                }}
                                className="h-9 cursor-pointer rounded-sm bg-brand px-5 text-xs font-semibold text-white shadow-sm shadow-brand/10 transition-all hover:bg-brand/90"
                            >
                                Close Console
                            </button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
