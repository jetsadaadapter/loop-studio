"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Sparkles, Check } from "lucide-react";
import type { LoopAgent } from "@/core/interfaces/loop-projects.interface";
import { AVAILABLE_SKILLS, AVAILABLE_MODELS } from "@/core/interfaces/loop-projects.interface";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function AiTeamSpace() {
    const [agents, setAgents] = useState<LoopAgent[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [message, setMessage] = useState("");

    // Load Anthropic API Key from local storage
    const [apiKey, setApiKey] = useState("");

    const loadAgents = async () => {
        try {
            const res = await fetch("/api/manage/loop-agents");
            const data = await res.json();
            if (data.success) {
                setAgents(data.data || []);
            }
        } catch (e) {
            console.error("Failed to load agents:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (typeof window !== "undefined") {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setApiKey(localStorage.getItem("loop_anthropic_api_key") || "");
        }
        loadAgents();
    }, []);

    const saveApiKey = (key: string) => {
        setApiKey(key);
        localStorage.setItem("loop_anthropic_api_key", key);
        setMessage("API Key saved locally.");
        setTimeout(() => setMessage(""), 3000);
    };

    const handleUpdateAgent = async (id: string, updatedFields: Partial<LoopAgent>) => {
        setSavingId(id);
        try {
            const res = await fetch(`/api/manage/loop-agents/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedFields)
            });
            const data = await res.json();
            if (data.success) {
                setMessage("Agent settings updated.");
                setTimeout(() => setMessage(""), 3000);
                loadAgents();
            }
        } catch (e) {
            console.error("Failed to update agent:", e);
        } finally {
            setSavingId(null);
        }
    };

    const handleSkillToggle = (agent: LoopAgent, skillKey: string) => {
        const isChecked = agent.skills.includes(skillKey);
        const nextSkills = isChecked
            ? agent.skills.filter(s => s !== skillKey)
            : [...agent.skills, skillKey];

        setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, skills: nextSkills } : a));
    };

    const handleFieldChange = (id: string, field: string, val: string) => {
        setAgents(prev => prev.map(a => a.id === id ? { ...a, [field]: val } : a));
    };

    return (
        <div className="flex flex-col space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <Link href="/manage/loop-projects" className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 transition-colors">
                    <ArrowLeft className="size-4" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight">AI Developer Team</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Manage models, prompt templates, and professional skills for your autonomous AI team</p>
                </div>
            </div>

            {/* API Key Configuration Card */}
            <div className="rounded-xl border border-slate-200/70 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <Sparkles className="size-4" />
                    </span>
                    <h3 className="font-semibold text-slate-800 text-sm">AI Provider API Key</h3>
                </div>
                <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                    Paste an <span className="font-semibold text-slate-700">Anthropic</span> key (<code className="font-sans">sk-ant-…</code>) or a free
                    {" "}<span className="font-semibold text-slate-700">Google AI Studio</span> key (<code className="font-sans">AIza…</code> or <code className="font-sans">AQ.…</code>) to enable live chat and autonomous file editing.
                    Any non-Anthropic key is treated as Gemini. This key is stored strictly in your browser&apos;s local storage and never leaves your computer.
                </p>
                <Field className="mt-4">
                    <Input
                        type="password"
                        placeholder="sk-ant-…  or  AIza… / AQ.…"
                        value={apiKey}
                        onChange={(e) => saveApiKey(e.target.value)}
                    />
                </Field>
                {message && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-600">
                        <Check className="size-3.5" />
                        <span>{message}</span>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex h-40 items-center justify-center text-xs text-slate-500">Loading AI profiles...</div>
            ) : (
                <div className="space-y-6">
                    {agents.map((agent) => (
                        <div key={agent.id} className="rounded-xl border border-slate-200/70 bg-white p-5 shadow-sm space-y-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-semibold text-slate-800 text-sm">{agent.name}</h3>
                                    <span className="text-xs text-slate-500">{agent.role}</span>
                                </div>
                                <button
                                    onClick={() => handleUpdateAgent(agent.id, {
                                        model: agent.model,
                                        systemPrompt: agent.systemPrompt,
                                        skills: agent.skills
                                    })}
                                    disabled={savingId === agent.id}
                                    className="flex items-center gap-1.5 rounded-sm bg-brand px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-brand/10 transition-all hover:bg-brand/90 disabled:opacity-60 cursor-pointer"
                                >
                                    <Save className="size-3.5" />
                                    {savingId === agent.id ? "Saving..." : "Save Config"}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                <div className="md:col-span-1 space-y-3">
                                    <Field>
                                        <FieldLabel>Model Engine</FieldLabel>
                                        <Select
                                            value={agent.model}
                                            onValueChange={(val) => handleFieldChange(agent.id, "model", val || "")}
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
                                        <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                                            {AVAILABLE_SKILLS.map((skill) => {
                                                const isChecked = agent.skills.includes(skill.key);
                                                return (
                                                    <label key={skill.key} className="flex items-center gap-2 cursor-pointer select-none">
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() => handleSkillToggle(agent, skill.key)}
                                                            className="rounded-sm border-slate-300 text-brand focus:ring-brand/50 size-3.5"
                                                        />
                                                        <span className="text-xs text-slate-700">{skill.label}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </Field>
                                </div>

                                <div className="md:col-span-2">
                                    <Field>
                                        <FieldLabel>System Instructions Prompt</FieldLabel>
                                        <Textarea
                                            rows={7}
                                            value={agent.systemPrompt}
                                            onChange={(e) => handleFieldChange(agent.id, "systemPrompt", e.target.value)}
                                            className="min-h-0 leading-relaxed"
                                        />
                                    </Field>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
