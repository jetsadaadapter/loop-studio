"use client";

import React, { useState } from "react";
import { X, FolderInput, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface RegisterModalProps {
    isOpen: boolean;
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

export function RegisterModal({ isOpen, onClose, onSuccess }: RegisterModalProps) {
    const [name, setName] = useState("");
    const [path, setPath] = useState("");
    const [template, setTemplate] = useState("nextjs-app");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/manage/loop-projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "register", name, path, template }),
            });
            const data = await res.json();
            if (data.success) {
                onSuccess();
                onClose();
            } else {
                setError(data.error || "Failed to register project");
            }
        } catch {
            setError("Failed to register project due to network error");
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
                            <FolderInput className="size-3.5" />
                        </span>
                        <h2 className="text-sm font-semibold text-slate-800">Register Existing Project</h2>
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
                            Project Name <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                            type="text"
                            required
                            placeholder="e.g. My Website"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </Field>

                    <Field>
                        <FieldLabel>
                            Absolute Directory Path <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                            type="text"
                            required
                            placeholder="e.g. /Users/name/AdapterWorks/2026/my-app"
                            value={path}
                            onChange={(e) => setPath(e.target.value)}
                        />
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
                            {loading ? "Registering..." : "Register"}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
