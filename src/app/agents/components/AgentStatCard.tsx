"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { AgentWithMetrics } from "@/core/services/loop-agent-metrics.service";
import { agentInitials, agentTint } from "./agent-visuals";

interface AgentStatCardProps {
    agent: AgentWithMetrics;
    onEdit: (agent: AgentWithMetrics) => void;
    onDelete: (agent: AgentWithMetrics) => void;
}

function StatTile({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-slate-200/70 bg-slate-50/60 px-3 py-2.5">
            <p className="text-[10px] font-sans text-slate-500">{label}</p>
            <p className="mt-0.5 text-base font-semibold text-slate-800">{value}</p>
        </div>
    );
}

/** One agent card: identity, live status, four derived metrics, last activity. */
export function AgentStatCard({ agent, onEdit, onDelete }: AgentStatCardProps) {
    const m = agent.metrics;
    return (
        <div className="group flex flex-col rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${agentTint(agent.id)}`}>
                        {agentInitials(agent.name)}
                    </span>
                    <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-slate-800" title={agent.name}>
                            {agent.name.split("(")[0].trim()}
                        </h3>
                        <p className="truncate text-[11px] text-slate-500 font-sans">{agent.role}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <span
                        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold font-sans ${
                            m.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}
                    >
                        <span className={`size-1.5 rounded-full ${m.active ? "bg-emerald-500" : "bg-slate-400"}`} />
                        {m.active ? "Active" : "Idle"}
                    </span>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
                <StatTile label="Task this week" value={String(m.taskThisWeek)} />
                <StatTile label="Open Tickets" value={String(m.openTickets)} />
                <StatTile label="Success Rate" value={`${m.successRate}%`} />
                <StatTile label="Avg. Resolution" value={m.avgResolutionDays > 0 ? `${m.avgResolutionDays} Days` : "—"} />
            </div>

            <div className="mt-3 border-t border-slate-100 pt-3">
                <p className="text-[10px] font-sans uppercase tracking-wide text-slate-400">Last Activity</p>
                <p className="mt-0.5 truncate text-xs text-slate-600 font-sans" title={m.lastActivity ?? ""}>
                    {m.lastActivity ?? "No recorded activity yet"}
                </p>
            </div>

            <div className="mt-3 flex items-center justify-end gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                    onClick={() => onEdit(agent)}
                    className="flex items-center gap-1 rounded-sm border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 cursor-pointer"
                >
                    <Pencil className="size-3" /> Edit
                </button>
                <button
                    onClick={() => onDelete(agent)}
                    className="flex items-center gap-1 rounded-sm border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-200 cursor-pointer"
                >
                    <Trash2 className="size-3" /> Delete
                </button>
            </div>
        </div>
    );
}
