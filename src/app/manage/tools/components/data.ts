import type { ManageToolApiItem } from "@/core/interfaces/tool";

// ── Plugin badge config ───────────────────────────────────────────────────────

export const PLUGIN_META: Record<string, { color: string; dot: string; label: string; circleBg: string; circleText: string; circleBorder: string }> = {
  apify: {
    color: "text-orange-600",
    dot: "bg-orange-400",
    label: "Apify",
    circleBg: "bg-gradient-to-br from-orange-400 to-amber-500",
    circleText: "text-white",
    circleBorder: "border-orange-200",
  },
  gemini: {
    color: "text-sky-600",
    dot: "bg-sky-400",
    label: "Gemini AI",
    circleBg: "bg-gradient-to-br from-sky-400 to-blue-500",
    circleText: "text-white",
    circleBorder: "border-sky-200",
  },
  exportcomments: {
    color: "text-violet-600",
    dot: "bg-violet-400",
    label: "Export Comments",
    circleBg: "bg-gradient-to-br from-violet-400 to-purple-500",
    circleText: "text-white",
    circleBorder: "border-violet-200",
  },
};

export const PARAM_TYPE_BADGE: Record<string, string> = {
  prompt: "bg-indigo-50/60 text-indigo-650 border border-indigo-150",
  url: "bg-sky-50/60 text-sky-650 border border-sky-150",
  boolean: "bg-emerald-50/60 text-emerald-650 border border-emerald-150",
  string: "bg-slate-50/60 text-slate-600 border border-slate-200",
  text: "bg-slate-50/60 text-slate-600 border border-slate-200",
  multiline: "bg-slate-50/60 text-slate-600 border border-slate-200",
  textarea: "bg-slate-50/60 text-slate-600 border border-slate-200",
  number: "bg-amber-50/60 text-amber-650 border border-amber-150",
  select: "bg-rose-50/60 text-rose-650 border border-rose-150",
  date: "bg-teal-50/60 text-teal-650 border border-teal-150",
  json: "bg-indigo-50/60 text-indigo-650 border border-indigo-150",
};

// ── Derived display helpers ───────────────────────────────────────────────────

export function getSortedScripts(tool: ManageToolApiItem) {
  return [...tool.scripts].sort((a, b) => a.sortOrder - b.sortOrder);
}
