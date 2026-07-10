"use client";

import { AgentWithMetrics } from "@/core/services/loop-agent-metrics.service";
import { AgentAvatar } from "./AgentAvatar";

interface SuccessTrendChartProps {
    agents: AgentWithMetrics[];
}

// Forward-slash diagonal hatch with thin, evenly-spaced light lines over solid
// violet — matches the reference bar.
const HATCH = "repeating-linear-gradient(50deg, #7c3aed 0 2.5px, #d6ccfb 2.5px 3.5px)";

/**
 * "Success Rate & Time Trend" — per agent, a hatched violet bar for success rate
 * (%) and a solid lavender bar for the time trend (task load normalized to the
 * busiest agent). Pure CSS pill bars, no chart dependency.
 */
export function SuccessTrendChart({ agents }: SuccessTrendChartProps) {
    const maxTasks = Math.max(1, ...agents.map((a) => a.metrics.totalTasks));

    return (
        <div className="rounded-xl border border-slate-200/70 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
                <h3 className="text-sm font-semibold text-slate-800">Success Rate &amp; Time Trend</h3>
                <div className="flex flex-col gap-1.5">
                    <span className="flex items-center gap-2 text-xs text-slate-500 font-sans">
                        <span className="size-2.5 rounded-full bg-violet-600" /> Success Rate
                    </span>
                    <span className="flex items-center gap-2 text-xs text-slate-500 font-sans">
                        <span className="size-2.5 rounded-full bg-violet-300" /> Time Trend
                    </span>
                </div>
            </div>

            <div className="mt-4 flex items-end justify-between gap-2 overflow-x-auto pb-1">
                {agents.map((agent) => {
                    const success = agent.metrics.successRate; // 0–100
                    const trend = Math.round((agent.metrics.totalTasks / maxTasks) * 100);
                    return (
                        <div key={agent.id} className="flex min-w-[64px] flex-1 flex-col items-center gap-2.5">
                            <div className="flex h-[150px] items-end justify-center gap-2">
                                <div
                                    className="w-5 rounded-full"
                                    style={{ height: `${Math.max(6, success)}%`, backgroundImage: HATCH }}
                                    title={`Success rate ${success}%`}
                                />
                                <div
                                    className="w-5 rounded-full bg-violet-300"
                                    style={{ height: `${Math.max(6, trend)}%` }}
                                    title={`${agent.metrics.totalTasks} task(s) touched`}
                                />
                            </div>
                            <div className="flex items-center gap-1.5">
                                <AgentAvatar seed={agent.id} name={agent.name} size={24} gender={agent.gender} />
                                <span className="text-xs font-semibold uppercase text-slate-600 font-sans">
                                    {agent.name.split("(")[0].trim()}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
