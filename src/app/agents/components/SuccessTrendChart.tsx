"use client";

import { AgentWithMetrics } from "@/core/services/loop-agent-metrics.service";
import { agentInitials, agentTint } from "./agent-visuals";

interface SuccessTrendChartProps {
    agents: AgentWithMetrics[];
}

/**
 * "Success Rate & Workload" — per agent, a solid bar for success rate (%) and a
 * lighter bar for task load (tasks touched, normalized to the busiest agent).
 * Pure CSS bars, no chart dependency.
 */
export function SuccessTrendChart({ agents }: SuccessTrendChartProps) {
    const maxTasks = Math.max(1, ...agents.map((a) => a.metrics.totalTasks));

    return (
        <div className="rounded-xl border border-slate-200/70 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">Success Rate &amp; Workload</h3>
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-sans">
                        <span className="size-2 rounded-full bg-brand" /> Success Rate
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-sans">
                        <span className="size-2 rounded-full bg-brand/25" /> Task Load
                    </span>
                </div>
            </div>

            <div className="mt-4 flex items-end justify-between gap-2 overflow-x-auto pb-1">
                {agents.map((agent) => {
                    const success = agent.metrics.successRate; // 0–100
                    const load = Math.round((agent.metrics.totalTasks / maxTasks) * 100);
                    return (
                        <div key={agent.id} className="flex min-w-[44px] flex-1 flex-col items-center gap-2">
                            <div className="flex h-[120px] items-end gap-1">
                                <div
                                    className="w-3 rounded-full bg-brand transition-all"
                                    style={{ height: `${Math.max(4, success)}%` }}
                                    title={`Success rate ${success}%`}
                                />
                                <div
                                    className="w-3 rounded-full bg-brand/25 transition-all"
                                    style={{ height: `${Math.max(4, load)}%` }}
                                    title={`${agent.metrics.totalTasks} task(s) touched`}
                                />
                            </div>
                            <span className={`flex size-6 items-center justify-center rounded-full text-[9px] font-bold ${agentTint(agent.id)}`}>
                                {agentInitials(agent.name)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
