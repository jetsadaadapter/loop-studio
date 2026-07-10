import type { AgentWithMetrics } from "@/core/services/loop-agent-metrics.service";

// Shared, presentation-only helpers for the AI Developer Team dashboard.
// Kept out of the .tsx files so they aren't re-parsed on every UI tweak.
// (Avatars are rendered by AgentAvatar via @humation/react.)

export const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

// Violet scale for the heatmap (matches the reference dashboard).
const HEAT_RGB = "124 58 237"; // violet-600

/**
 * Background for a heatmap cell given its value relative to the busiest cell in
 * the grid. Uses violet at increasing opacity; 0 stays a faint neutral.
 */
export function heatCellStyle(value: number, max: number): React.CSSProperties {
    if (value <= 0 || max <= 0) return { backgroundColor: "rgb(248 250 252)" }; // slate-50
    const t = 0.18 + 0.82 * (value / max);
    return { backgroundColor: `rgba(${HEAT_RGB} / ${t.toFixed(2)})` };
}

/** Whether a heatmap cell should use light text (dark enough background). */
export function heatCellIsDark(value: number, max: number): boolean {
    if (value <= 0 || max <= 0) return false;
    return 0.18 + 0.82 * (value / max) > 0.5;
}

/** The busiest single weekday cell across all agents (for heatmap scaling). */
export function maxWeekdayVolume(agents: AgentWithMetrics[]): number {
    let max = 0;
    for (const a of agents) for (const v of a.metrics.volumeByWeekday) if (v > max) max = v;
    return max;
}
