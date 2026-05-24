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
  prompt: "bg-indigo-50 text-indigo-600 ring-indigo-100",
  url: "bg-sky-50 text-sky-600 ring-sky-100",
  boolean: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  string: "bg-slate-50 text-slate-500 ring-slate-200",
  number: "bg-amber-50 text-amber-600 ring-amber-100",
  select: "bg-rose-50 text-rose-600 ring-rose-100",
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
