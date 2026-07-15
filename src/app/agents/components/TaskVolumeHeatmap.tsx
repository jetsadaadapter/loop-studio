"use client";

import type { AgentWithMetrics } from "@/core/services/loop-agent-metrics.service";
import {
    WEEKDAY_LABELS,
    heatCellStyle,
    heatCellIsDark,
    maxWeekdayVolume,
} from "./agent-visuals";
import { AgentAvatar } from "./AgentAvatar";

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
                            <div key={i} className="text-center text-xs font-semibold text-slate-400 font-sans">
                                {d}
                            </div>
                        ))}
                    </div>

                    {agents.map((agent) => (
                        <div key={agent.id} className="grid grid-cols-[92px_repeat(7,1fr)] items-center gap-1.5 py-0.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <AgentAvatar seed={agent.id} name={agent.name} size={20} gender={agent.gender} />
                                <span className="truncate text-xs font-semibold uppercase text-slate-600 font-sans" title={agent.name}>
                                    {agent.name.split("(")[0].trim()}
                                </span>
                            </div>
                            {agent.metrics.volumeByWeekday.map((v, i) => (
                                <div
                                    key={i}
                                    style={heatCellStyle(v, max)}
                                    className={`flex h-9 items-center justify-center rounded-lg text-xs font-semibold font-sans ${
                                        heatCellIsDark(v, max) ? "text-white" : v > 0 ? "text-violet-700" : "text-slate-300"
                                    }`}
                                    title={`${v} message(s)`}
                                >
                                    {v}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
