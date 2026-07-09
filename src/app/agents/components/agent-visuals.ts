import { createAvatar } from "@dicebear/core";
import { bottts } from "@dicebear/collection";
import type { AgentWithMetrics } from "@/core/services/loop-agent-metrics.service";

// Shared, presentation-only helpers for the AI Developer Team dashboard.
// Kept out of the .tsx files so they aren't re-parsed on every UI tweak.

export const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

// Deterministic illustrated avatar per agent, generated offline as an SVG data
// URI (no network — the app's CSP blocks external images, and data: is allowed).
// DiceBear "bottts" (robot) style — apt for an AI team and license-clean
// (code MIT, art "free for personal and commercial use").
const AVATAR_BG = ["ede9fe", "e0e7ff", "dcfce7", "fef3c7", "ffe4e6", "cffafe", "ccfbf1"];
const AVATAR_CACHE = new Map<string, string>();

export function agentAvatarUri(seed: string): string {
    const key = seed.trim() || "agent";
    const cached = AVATAR_CACHE.get(key);
    if (cached) return cached;
    const uri = createAvatar(bottts, {
        seed: key,
        radius: 50,
        backgroundColor: AVATAR_BG,
    }).toDataUri();
    AVATAR_CACHE.set(key, uri);
    return uri;
}

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
