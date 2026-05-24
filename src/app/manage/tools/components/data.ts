import type { ManageToolApiItem } from "@/core/interfaces/tool";

// ── Plugin badge config ───────────────────────────────────────────────────────

export const PLUGIN_META: Record<string, { color: string; dot: string; label: string }> = {
  apify: {
    color: "text-orange-600",
    dot: "bg-orange-400",
    label: "Apify",
  },
  gemini: {
    color: "text-violet-600",
    dot: "bg-violet-400",
    label: "Gemini AI",
  },
};

export const PARAM_TYPE_BADGE: Record<string, string> = {
  prompt: "bg-indigo-50/60 text-indigo-650 border border-indigo-150",
  url: "bg-sky-50/60 text-sky-650 border border-sky-150",
  boolean: "bg-emerald-50/60 text-emerald-650 border border-emerald-150",
  string: "bg-slate-50/60 text-slate-600 border border-slate-200",
  number: "bg-amber-50/60 text-amber-650 border border-amber-150",
  select: "bg-rose-50/60 text-rose-650 border border-rose-150",
};

// ── Derived display helpers ───────────────────────────────────────────────────

export function getShortId(id: string): string {
  return `#${id.slice(-8).toLowerCase()}`;
}

export function formatUpdatedAt(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function getSortedScripts(tool: ManageToolApiItem) {
  return [...tool.scripts].sort((a, b) => a.sortOrder - b.sortOrder);
}
