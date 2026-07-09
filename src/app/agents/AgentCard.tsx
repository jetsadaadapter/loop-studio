"use client";

import { Save, Trash2, Wand2 } from "lucide-react";
import type { LoopAgent } from "@/core/interfaces/loop-projects.interface";
import { AVAILABLE_SKILLS, AVAILABLE_MODELS } from "@/core/interfaces/loop-projects.interface";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { generateSystemPrompt } from "./generate-prompt";

interface AgentCardProps {
    agent: LoopAgent;
    isSaving: boolean;
    onFieldChange: (id: string, field: keyof LoopAgent, value: string) => void;
    onSkillToggle: (agent: LoopAgent, skillKey: string) => void;
    onSave: (agent: LoopAgent) => void;
    onDeleteRequest: (agent: LoopAgent) => void;
}

export function AgentCard({
    agent,
    isSaving,
    onFieldChange,
    onSkillToggle,
    onSave,
    onDeleteRequest,
}: AgentCardProps) {
    const handleGenerate = () => {
        onFieldChange(
            agent.id,
            "systemPrompt",
            generateSystemPrompt(agent.name, agent.role, agent.skills)
        );
    };

    return (
        <div className="rounded-xl border border-slate-200/70 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                    <Field>
                        <FieldLabel>Agent Name</FieldLabel>
                        <Input
                            value={agent.name}
                            onChange={(e) => onFieldChange(agent.id, "name", e.target.value)}
                        />
                    </Field>
                    <Field>
                        <FieldLabel>Role</FieldLabel>
                        <Input
                            value={agent.role}
                            onChange={(e) => onFieldChange(agent.id, "role", e.target.value)}
                        />
                    </Field>
                </div>
                <div className="flex items-center gap-2 pt-5">
                    <button
                        onClick={() => onSave(agent)}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 rounded-sm bg-brand px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-brand/10 transition-all hover:bg-brand/90 disabled:opacity-60 cursor-pointer"
                    >
                        <Save className="size-3.5" />
                        {isSaving ? "Saving..." : "Save Config"}
                    </button>
                    <button
                        onClick={() => onDeleteRequest(agent)}
                        aria-label="Delete agent"
                        title="Delete agent"
                        className="flex items-center justify-center rounded-sm border border-slate-200 p-1.5 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-200 cursor-pointer"
                    >
                        <Trash2 className="size-3.5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="md:col-span-1 space-y-3">
                    <Field>
                        <FieldLabel>Model Engine</FieldLabel>
                        <Select
                            value={agent.model}
                            onValueChange={(val) => onFieldChange(agent.id, "model", val || "")}
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
                        <div className="space-y-1.5">
                            {AVAILABLE_SKILLS.map((skill) => {
                                const isChecked = agent.skills.includes(skill.key);
                                const id = `${agent.id}-skill-${skill.key}`;
                                return (
                                    <Field key={skill.key} orientation="horizontal">
                                        <Checkbox
                                            id={id}
                                            name={id}
                                            checked={isChecked}
                                            onCheckedChange={() => onSkillToggle(agent, skill.key)}
                                        />
                                        <Label htmlFor={id} className="text-xs font-normal text-slate-700 font-sans">
                                            {skill.label}
                                        </Label>
                                    </Field>
                                );
                            })}
                        </div>
                    </Field>
                </div>

                <div className="md:col-span-2">
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
                            value={agent.systemPrompt}
                            onChange={(e) => onFieldChange(agent.id, "systemPrompt", e.target.value)}
                            className="min-h-0 leading-relaxed"
                        />
                    </Field>
                </div>
            </div>
        </div>
    );
}
