"use client";

import React, { useEffect, useState } from "react";
import { Plus, Sparkles, Check } from "lucide-react";
import type { LoopAgent, LoopProject } from "@/core/interfaces/loop-projects.interface";
import type { AgentWithMetrics } from "@/core/services/loop-agent-metrics.service";
import { ProjectSidebar } from "@/app/loop-components/ProjectSidebar";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ManagerDeleteConfirm } from "@/components/manager-delete-confirm";
import { ManagerToolbar } from "@/components/manager-toolbar";
import { ManageRefreshButton } from "@/components/ui/manage-refresh-button";
import { AddAgentModal } from "./AddAgentModal";
import { Breadcrumbs } from "@/app/loop-components/Breadcrumbs";
import { AppFooter } from "@/app/loop-components/AppFooter";
import { TaskVolumeHeatmap } from "./components/TaskVolumeHeatmap";
import { SuccessTrendChart } from "./components/SuccessTrendChart";
import { AgentStatCard } from "./components/AgentStatCard";
import { AVATAR_CREDIT } from "./components/agent-visuals";

export default function AiTeamSpace() {
    const [agents, setAgents] = useState<AgentWithMetrics[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editing, setEditing] = useState<LoopAgent | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<LoopAgent | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const [apiKey, setApiKey] = useState("");
    const [allProjects, setAllProjects] = useState<LoopProject[]>([]);

    const [agentSearch, setAgentSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const filteredAgents = agents.filter((a) => {
        const q = agentSearch.trim().toLowerCase();
        const matchesSearch = !q || a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q);
        const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "active" ? a.metrics.active : !a.metrics.active);
        return matchesSearch && matchesStatus;
    });

    const agentFilters = [
        {
            key: "status",
            label: "Status",
            value: statusFilter,
            options: [
                { value: "all", label: "All Statuses" },
                { value: "active", label: "Active" },
                { value: "idle", label: "Idle" },
            ],
            onChange: (val: string) => setStatusFilter(val),
        },
    ];

    const loadAgents = async () => {
        try {
            const res = await fetch("/api/loop-agents/summary");
            const data = await res.json();
            if (data.success) setAgents(data.data || []);
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
        fetch("/api/loop-projects")
            .then((res) => res.json())
            .then((data) => { if (data.success) setAllProjects(data.data || []); })
            .catch(() => { /* sidebar just shows an empty list */ });
    }, []);

    const saveApiKey = (key: string) => {
        setApiKey(key);
        localStorage.setItem("loop_anthropic_api_key", key);
        setMessage("API Key saved locally.");
        setTimeout(() => setMessage(""), 3000);
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

    const openAdd = () => { setEditing(null); setIsAddOpen(true); };
    const openEdit = (agent: LoopAgent) => { setEditing(agent); setIsAddOpen(true); };

    return (
        <div className="flex min-h-0 flex-1 overflow-hidden bg-white motion-hero-enter">
            <ProjectSidebar projects={allProjects} />

            <section className="flex min-w-0 flex-1 flex-col overflow-y-auto">
                {/* Sticky breadcrumb bar — stays visible while the content scrolls */}
                <div className="sticky top-0 z-20 border-b border-slate-100 bg-white px-6 py-3">
                    <Breadcrumbs items={[{ label: "AI Developer Team" }]} />
                </div>

                <div className="flex w-full flex-1 flex-col px-6 py-5">
                    <div className="flex flex-col space-y-6">
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">AI Developer Team</h1>
                        <p className="mt-1 text-xs text-slate-500 font-sans">
                            Live overview of your autonomous AI team — activity, success, and workload across every project
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex h-40 items-center justify-center text-xs text-slate-500">Loading AI team…</div>
                    ) : agents.length === 0 ? (
                        <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
                            <p className="text-sm font-semibold text-slate-700">No agents yet</p>
                            <p className="mt-1 text-xs text-slate-500 font-sans">Add an agent to start building your autonomous team.</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                <TaskVolumeHeatmap agents={agents} />
                                <SuccessTrendChart agents={agents} />
                            </div>

                            <div>
                                <h2 className="mb-5 text-sm font-semibold text-slate-800">All agents</h2>
                                <ManagerToolbar
                                    searchValue={agentSearch}
                                    onSearchChange={setAgentSearch}
                                    searchPlaceholder="Search agents by name or role…"
                                    filters={agentFilters}
                                    trailing={
                                        <>
                                            <ManageRefreshButton
                                                isLoading={loading}
                                                isRefreshing={loading}
                                                onRefresh={loadAgents}
                                                title="Refresh Agents"
                                            />
                                            <button
                                                onClick={openAdd}
                                                className="flex items-center gap-1.5 rounded-sm bg-brand px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-brand/10 transition-all hover:bg-brand/90 cursor-pointer shrink-0"
                                            >
                                                <Plus className="size-3.5" />
                                                Add Agent
                                            </button>
                                        </>
                                    }
                                />
                                {filteredAgents.length === 0 ? (
                                    <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
                                        <p className="text-sm font-semibold text-slate-700">No agents match your filters</p>
                                        <p className="mt-1 text-xs text-slate-500 font-sans">Try a different search or status.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                        {filteredAgents.map((agent) => (
                                            <AgentStatCard
                                                key={agent.id}
                                                agent={agent}
                                                onEdit={openEdit}
                                                onDelete={setDeleteTarget}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* API Key Configuration */}
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
                    </div>

                    <AppFooter className="mt-auto pt-6">
                        <a href={AVATAR_CREDIT.href} target="_blank" rel="noopener noreferrer" className="hover:text-slate-500 hover:underline">
                            {AVATAR_CREDIT.label}
                        </a>
                    </AppFooter>

                    <AddAgentModal
                        isOpen={isAddOpen}
                        agent={editing}
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
            </section>
        </div>
    );
}
