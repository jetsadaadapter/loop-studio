"use client";

import { useState } from "react";
import { Loader2, UserPlus, Wand2, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AVAILABLE_SKILLS, AVAILABLE_MODELS } from "@/core/interfaces/loop-projects.interface";
import { generateSystemPrompt } from "./generate-prompt";

interface AddAgentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const EMPTY_FORM = { name: "", role: "", model: "claude-sonnet-5", systemPrompt: "", skills: [] as string[] };

export function AddAgentModal({ isOpen, onClose, onSuccess }: AddAgentModalProps) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [wasOpen, setWasOpen] = useState(isOpen);

    if (isOpen !== wasOpen) {
        setWasOpen(isOpen);
        if (isOpen) {
            setForm(EMPTY_FORM);
            setError("");
        }
    }

    const toggleSkill = (key: string) => {
        setForm((prev) => ({
            ...prev,
            skills: prev.skills.includes(key)
                ? prev.skills.filter((s) => s !== key)
                : [...prev.skills, key],
        }));
    };

    const handleGenerate = () => {
        setForm((prev) => ({
            ...prev,
            systemPrompt: generateSystemPrompt(prev.name, prev.role, prev.skills),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!form.name.trim() || !form.role.trim()) {
            setError("Name and role are required");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/manage/loop-agents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (data.success) {
                onSuccess();
                onClose();
            } else {
                setError(data.error || "Failed to create agent");
            }
        } catch {
            setError("Failed to create agent due to network error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                hideCloseButton
                className="w-full max-w-lg rounded-2xl border border-slate-200/60 bg-white p-0 shadow-xl shadow-slate-900/10 focus:outline-none"
            >
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div className="flex items-center gap-2.5">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                            <UserPlus className="size-3.5" />
                        </span>
                        <h2 className="text-sm font-semibold text-slate-800">Add AI Agent</h2>
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

                <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field>
                            <FieldLabel>
                                Agent Name <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input
                                required
                                placeholder="e.g. Ada"
                                value={form.name}
                                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                            />
                        </Field>
                        <Field>
                            <FieldLabel>
                                Role <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input
                                required
                                placeholder="e.g. Frontend Engineer"
                                value={form.role}
                                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                            />
                        </Field>
                    </div>

                    <Field>
                        <FieldLabel>Model Engine</FieldLabel>
                        <Select
                            value={form.model}
                            onValueChange={(val) => setForm((p) => ({ ...p, model: val || "" }))}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent align="start">
                                {AVAILABLE_MODELS.map((m) => (
                                    <SelectItem key={m.id} value={m.id}>
                                        {m.label} ({m.provider})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>

                    <Field>
                        <FieldLabel>Expertise Skills</FieldLabel>
                        <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                            {AVAILABLE_SKILLS.map((skill) => {
                                const isChecked = form.skills.includes(skill.key);
                                return (
                                    <label key={skill.key} className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => toggleSkill(skill.key)}
                                            className="rounded-sm border-slate-300 text-brand focus:ring-brand/50 size-3.5"
                                        />
                                        <span className="text-xs text-slate-700 font-sans">{skill.label}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </Field>

                    <Field>
                        <div className="flex items-center justify-between">
                            <FieldLabel>System Instructions Prompt</FieldLabel>
                            <button
                                type="button"
                                onClick={handleGenerate}
                                className="flex items-center gap-1 rounded-sm border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 cursor-pointer"
                            >
                                <Wand2 className="size-3" />
                                Generate from role & skills
                            </button>
                        </div>
                        <Textarea
                            rows={7}
                            placeholder="Describe the agent's responsibilities and behavior..."
                            value={form.systemPrompt}
                            onChange={(e) => setForm((p) => ({ ...p, systemPrompt: e.target.value }))}
                            className="min-h-0 leading-relaxed"
                        />
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
                            {loading ? "Creating..." : "Add Agent"}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
