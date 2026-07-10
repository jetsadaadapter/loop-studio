"use client";

import { useState } from "react";
import { Loader2, UserPlus, Pencil, Wand2 } from "lucide-react";
import type { LoopAgent } from "@/core/interfaces/loop-projects.interface";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ModalCloseButton } from "@/components/ui/modal-close-button";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CreateAgentSchema, zodFieldErrors } from "@/core/validators/loop-projects.validator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AVAILABLE_SKILLS, AVAILABLE_MODELS } from "@/core/interfaces/loop-projects.interface";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { generateSystemPrompt } from "./generate-prompt";

interface AddAgentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    /** When provided, the modal edits this agent instead of creating a new one. */
    agent?: LoopAgent | null;
}

const EMPTY_FORM = { name: "", role: "", model: "claude-sonnet-5", systemPrompt: "", skills: [] as string[], gender: "male" as "male" | "female" };

const formFromAgent = (agent: LoopAgent) => ({
    name: agent.name,
    role: agent.role,
    model: agent.model,
    systemPrompt: agent.systemPrompt,
    skills: [...agent.skills],
    gender: agent.gender ?? "male",
});

export function AddAgentModal({ isOpen, onClose, onSuccess, agent }: AddAgentModalProps) {
    const isEdit = !!agent;
    const [form, setForm] = useState(EMPTY_FORM);
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [wasOpen, setWasOpen] = useState(isOpen);

    if (isOpen !== wasOpen) {
        setWasOpen(isOpen);
        if (isOpen) {
            setForm(agent ? formFromAgent(agent) : EMPTY_FORM);
            setError("");
            setFieldErrors({});
        }
    }

    const setField = (key: keyof typeof EMPTY_FORM, value: string) => {
        setForm((p) => ({ ...p, [key]: value }));
        if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: "" }));
    };

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

        const check = CreateAgentSchema.safeParse(form);
        if (!check.success) {
            setFieldErrors(zodFieldErrors(check.error));
            return;
        }
        setFieldErrors({});

        setLoading(true);
        try {
            const res = await fetch(
                isEdit ? `/api/loop-agents/${agent!.id}` : "/api/loop-agents",
                {
                    method: isEdit ? "PATCH" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(form),
                },
            );
            const data = await res.json();
            if (data.success) {
                onSuccess();
                onClose();
            } else {
                setError(data.error || `Failed to ${isEdit ? "update" : "create"} agent`);
            }
        } catch {
            setError(`Failed to ${isEdit ? "update" : "create"} agent due to network error`);
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
                            {isEdit ? <Pencil className="size-3.5" /> : <UserPlus className="size-3.5" />}
                        </span>
                        <h2 className="text-sm font-semibold text-slate-800">{isEdit ? "Edit AI Agent" : "Add AI Agent"}</h2>
                    </div>
                    <ModalCloseButton onClose={onClose} />
                </div>

                <form onSubmit={handleSubmit} noValidate className="px-5 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field>
                            <FieldLabel>
                                Agent Name <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input
                                aria-invalid={!!fieldErrors.name}
                                placeholder="e.g. Ada"
                                value={form.name}
                                onChange={(e) => setField("name", e.target.value)}
                            />
                            <FieldError errors={fieldErrors.name ? [{ message: fieldErrors.name }] : []} />
                        </Field>
                        <Field>
                            <FieldLabel>
                                Role <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input
                                aria-invalid={!!fieldErrors.role}
                                placeholder="e.g. Frontend Engineer"
                                value={form.role}
                                onChange={(e) => setField("role", e.target.value)}
                            />
                            <FieldError errors={fieldErrors.role ? [{ message: fieldErrors.role }] : []} />
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
                        <FieldLabel>Gender</FieldLabel>
                        <Select
                            value={form.gender}
                            onValueChange={(val) => setForm((p) => ({ ...p, gender: (val as "male" | "female") || "male" }))}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent align="start">
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                            </SelectContent>
                        </Select>
                        <FieldDescription>Sets the avatar&apos;s hair &amp; clothing style.</FieldDescription>
                    </Field>

                    <Field>
                        <FieldLabel>Expertise Skills</FieldLabel>
                        <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                            {AVAILABLE_SKILLS.map((skill) => {
                                const isChecked = form.skills.includes(skill.key);
                                const id = `add-skill-${skill.key}`;
                                return (
                                    <Field key={skill.key} orientation="horizontal">
                                        <Checkbox
                                            id={id}
                                            name={id}
                                            checked={isChecked}
                                            onCheckedChange={() => toggleSkill(skill.key)}
                                        />
                                        <Label htmlFor={id} className="text-xs font-normal text-slate-700 font-sans">
                                            {skill.label}
                                        </Label>
                                    </Field>
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
                                className="flex items-center gap-1 rounded-sm border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 cursor-pointer"
                            >
                                <Wand2 className="size-3" />
                                Generate from role & skills
                            </button>
                        </div>
                        <Textarea
                            rows={7}
                            aria-invalid={!!fieldErrors.systemPrompt}
                            placeholder="Describe the agent's responsibilities and behavior..."
                            value={form.systemPrompt}
                            onChange={(e) => setField("systemPrompt", e.target.value)}
                            className="min-h-0 leading-relaxed"
                        />
                        <FieldError errors={fieldErrors.systemPrompt ? [{ message: fieldErrors.systemPrompt }] : []} />
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
                            {loading ? (isEdit ? "Saving..." : "Creating...") : (isEdit ? "Save Changes" : "Add Agent")}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
