"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { AgentWithMetrics } from "@/core/services/loop-agent-metrics.service";
import { agentAvatarUri } from "./agent-visuals";

interface AgentStatCardProps {
    agent: AgentWithMetrics;
    onEdit: (agent: AgentWithMetrics) => void;
    onDelete: (agent: AgentWithMetrics) => void;
}

// One cell of the 2×2 stat grid. Internal borders are drawn per-cell so the
// group reads as a single bordered table like the reference.
function StatTile({ label, value, className }: { label: string; value: string; className: string }) {
    return (
        <div className={`px-4 py-3 ${className}`}>
            <p className="text-xs font-sans text-slate-500">{label}</p>
            <p className="mt-1 text-base font-semibold text-slate-800">{value}</p>
        </div>
    );
}

/** One agent card: identity, live status, four derived metrics, last activity. */
export function AgentStatCard({ agent, onEdit, onDelete }: AgentStatCardProps) {
    const m = agent.metrics;
    return (
        <div className="group relative flex flex-col rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            {/* Identity + status */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                    <span
                        style={{ backgroundImage: `url("${agentAvatarUri(agent.name)}")` }}
                        className="size-12 shrink-0 rounded-full bg-slate-100 bg-cover bg-center ring-1 ring-slate-200/60"
                        role="img"
                        aria-label={`${agent.name} avatar`}
                    />
                    <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-slate-800" title={agent.name}>
                            {agent.name.split("(")[0].trim()}
                        </h3>
                        <p className="truncate text-xs text-slate-500 font-sans">{agent.role}</p>
                    </div>
                </div>
                <span
                    className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold font-sans ${
                        m.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}
                >
                    <span className={`size-1.5 rounded-full ${m.active ? "bg-emerald-500" : "bg-slate-400"}`} />
                    {m.active ? "Active" : "Idle"}
                </span>
            </div>

            {/* Metrics grid */}
            <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200/70">
                <StatTile label="Task this week" value={String(m.taskThisWeek)} className="border-b border-r border-slate-200/70" />
                <StatTile label="Open Ticket" value={String(m.openTickets)} className="border-b border-slate-200/70" />
                <StatTile label="Success Rate" value={`${m.successRate}%`} className="border-r border-slate-200/70" />
                <StatTile label="Avg. Resolution" value={m.avgResolutionDays > 0 ? `${m.avgResolutionDays} Days` : "—"} className="" />
            </div>

            {/* Last activity */}
            <div className="mt-4 border-t border-slate-100 pt-3">
                <p className="text-xs font-sans uppercase tracking-wide text-slate-400">Last Activity</p>
                <p className="mt-1 truncate text-sm text-slate-600 font-sans" title={m.lastActivity ?? ""}>
                    {m.lastActivity ?? "No recorded activity yet"}
                </p>
            </div>

            {/* Hover actions — absolute so the card matches the reference at rest */}
            <div className="absolute right-3 bottom-3 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                    onClick={() => onEdit(agent)}
                    title="Edit agent"
                    className="flex size-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 cursor-pointer"
                >
                    <Pencil className="size-3.5" />
                </button>
                <button
                    onClick={() => onDelete(agent)}
                    title="Delete agent"
                    className="flex size-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-200 cursor-pointer"
                >
                    <Trash2 className="size-3.5" />
                </button>
            </div>
        </div>
    );
}
