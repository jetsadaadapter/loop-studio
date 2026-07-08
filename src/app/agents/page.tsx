"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Sparkles, Check } from "lucide-react";
import type { LoopAgent } from "@/core/interfaces/loop-projects.interface";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ManagerDeleteConfirm } from "@/components/manager-delete-confirm";
import { AgentCard } from "./AgentCard";
import { AddAgentModal } from "./AddAgentModal";
import { Breadcrumbs } from "@/app/loop-components/Breadcrumbs";

export default function AiTeamSpace() {
    const [agents, setAgents] = useState<LoopAgent[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [message, setMessage] = useState("");
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<LoopAgent | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const [apiKey, setApiKey] = useState("");

    const loadAgents = async () => {
        try {
            const res = await fetch("/api/loop-agents");
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
            const res = await fetch(`/api/loop-agents/${id}`, {
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

    const handleSave = (agent: LoopAgent) => {
        handleUpdateAgent(agent.id, {
            name: agent.name,
            role: agent.role,
            model: agent.model,
            systemPrompt: agent.systemPrompt,
            skills: agent.skills,
        });
    };

    const handleDelete = async (agent: LoopAgent) => {
        setDeletingId(agent.id);
        try {
            const res = await fetch(`/api/loop-agents/${agent.id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                setDeleteTarget(null);
                loadAgents();
            }
        } catch (e) {
            console.error("Failed to delete agent:", e);
        } finally {
            setDeletingId(null);
        }
    };

    const handleSkillToggle = (agent: LoopAgent, skillKey: string) => {
        const isChecked = agent.skills.includes(skillKey);
        const nextSkills = isChecked
            ? agent.skills.filter(s => s !== skillKey)
            : [...agent.skills, skillKey];

        setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, skills: nextSkills } : a));
    };

    const handleFieldChange = (id: string, field: keyof LoopAgent, val: string) => {
        setAgents(prev => prev.map(a => a.id === id ? { ...a, [field]: val } : a));
    };

    return (
        <div className="flex flex-col space-y-6 max-w-4xl mx-auto w-full">
            <Breadcrumbs items={[{ label: "AI Developer Team" }]} />

            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                    <Link href="/" className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 transition-colors">
                        <ArrowLeft className="size-4" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 tracking-tight">AI Developer Team</h1>
                        <p className="text-xs text-slate-500 mt-0.5">Manage models, prompt templates, and professional skills for your autonomous AI team</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsAddOpen(true)}
                    className="flex items-center gap-1.5 rounded-sm bg-brand px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-brand/10 transition-all hover:bg-brand/90 cursor-pointer shrink-0"
                >
                    <Plus className="size-3.5" />
                    Add Agent
                </button>
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
                        <AgentCard
                            key={agent.id}
                            agent={agent}
                            isSaving={savingId === agent.id}
                            onFieldChange={handleFieldChange}
                            onSkillToggle={handleSkillToggle}
                            onSave={handleSave}
                            onDeleteRequest={setDeleteTarget}
                        />
                    ))}
                </div>
            )}

            <AddAgentModal
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                onSuccess={loadAgents}
            />

            {deleteTarget && (
                <ManagerDeleteConfirm
                    itemTypeLabel="agent"
                    itemName={deleteTarget.name}
                    itemId={deleteTarget.id}
                    isLoading={deletingId === deleteTarget.id}
                    onCancel={() => setDeleteTarget(null)}
                    onConfirm={() => handleDelete(deleteTarget)}
                />
            )}
        </div>
    );
}
