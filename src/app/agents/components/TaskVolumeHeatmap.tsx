"use client";

import { AgentWithMetrics } from "@/core/services/loop-agent-metrics.service";
import {
    WEEKDAY_LABELS,
    agentInitials,
    agentTint,
    heatCellStyle,
    heatCellIsDark,
    maxWeekdayVolume,
} from "./agent-visuals";

interface TaskVolumeHeatmapProps {
    agents: AgentWithMetrics[];
}

/** "Task Volume By Day" — agents × weekdays heatmap of message activity. */
export function TaskVolumeHeatmap({ agents }: TaskVolumeHeatmapProps) {
    const max = maxWeekdayVolume(agents);

    return (
        <div className="rounded-xl border border-slate-200/70 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800">Task Volume By Day</h3>

            <div className="mt-4 overflow-x-auto">
                <div className="min-w-[320px]">
                    {/* Weekday header */}
                    <div className="grid grid-cols-[92px_repeat(7,1fr)] gap-1.5 pb-1.5">
                        <div />
                        {WEEKDAY_LABELS.map((d, i) => (
                            <div key={i} className="text-center text-[10px] font-semibold text-slate-400 font-sans">
                                {d}
                            </div>
                        ))}
                    </div>

                    {agents.map((agent) => (
                        <div key={agent.id} className="grid grid-cols-[92px_repeat(7,1fr)] items-center gap-1.5 py-0.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${agentTint(agent.id)}`}>
                                    {agentInitials(agent.name)}
                                </span>
                                <span className="truncate text-[11px] text-slate-600 font-sans" title={agent.name}>
                                    {agent.name.split("(")[0].trim()}
                                </span>
                            </div>
                            {agent.metrics.volumeByWeekday.map((v, i) => (
                                <div
                                    key={i}
                                    style={heatCellStyle(v, max)}
                                    className={`flex h-7 items-center justify-center rounded-md text-[10px] font-semibold font-sans ${
                                        heatCellIsDark(v, max) ? "text-white" : "text-slate-500"
                                    }`}
                                    title={`${v} message(s)`}
                                >
                                    {v > 0 ? v : ""}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
