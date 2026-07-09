import type { AgentWithMetrics } from "@/core/services/loop-agent-metrics.service";

// Shared, presentation-only helpers for the AI Developer Team dashboard.
// Kept out of the .tsx files so they aren't re-parsed on every UI tweak.

export const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

/** Up-to-two-letter initials from an agent name, ignoring a parenthetical role. */
export function agentInitials(name: string): string {
    const base = name.split("(")[0].trim() || name.trim();
    const words = base.split(/\s+/).filter(Boolean);
    if (words.length === 0) return "?";
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
}

// Deterministic soft tint per agent so avatars/rows read as distinct without
// needing real photos. Palette is brand-neutral (slate/indigo/emerald/etc.).
const AVATAR_TINTS = [
    "bg-rose-100 text-rose-700",
    "bg-indigo-100 text-indigo-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-sky-100 text-sky-700",
    "bg-violet-100 text-violet-700",
    "bg-teal-100 text-teal-700",
];

export function agentTint(id: string): string {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    return AVATAR_TINTS[hash % AVATAR_TINTS.length];
}

/**
 * Background for a heatmap cell given its value relative to the busiest cell in
 * the grid. Uses the brand color at increasing opacity; 0 stays neutral.
 */
export function heatCellStyle(value: number, max: number): React.CSSProperties {
    if (value <= 0 || max <= 0) return { backgroundColor: "rgb(241 245 249)" }; // slate-100
    const t = 0.15 + 0.85 * (value / max);
    return { backgroundColor: `rgba(var(--brand-rgb) / ${t.toFixed(2)})` };
}

/** Whether a heatmap cell should use light text (dark enough background). */
export function heatCellIsDark(value: number, max: number): boolean {
    if (value <= 0 || max <= 0) return false;
    return 0.15 + 0.85 * (value / max) > 0.55;
}

/** The busiest single weekday cell across all agents (for heatmap scaling). */
export function maxWeekdayVolume(agents: AgentWithMetrics[]): number {
    let max = 0;
    for (const a of agents) for (const v of a.metrics.volumeByWeekday) if (v > max) max = v;
    return max;
}
