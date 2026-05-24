import { Wrench, ZapOff } from "lucide-react";

interface EmptyStateProps {
  variant: "empty" | "no-results" | "error";
}

const COPY = {
  empty: {
    icon: Wrench,
    iconBg: "bg-slate-50 ring-slate-200/60",
    iconColor: "text-slate-400",
    title: "No tools yet",
    body: "Tools you create will appear here. Each tool can combine data sources and AI scripts into a reusable pipeline.",
  },
  "no-results": {
    icon: Wrench,
    iconBg: "bg-slate-50 ring-slate-200/60",
    iconColor: "text-slate-400",
    title: "No results found",
    body: "Try adjusting your search term.",
  },
  error: {
    icon: ZapOff,
    iconBg: "bg-rose-50 ring-rose-100",
    iconColor: "text-rose-400",
    title: "Unable to load tools",
    body: "Something went wrong fetching your tools. Please refresh the page.",
  },
} satisfies Record<EmptyStateProps["variant"], {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  body: string;
}>;

import type React from "react";

export function ToolListEmpty({ variant }: EmptyStateProps) {
  const { icon: Icon, iconBg, iconColor, title, body } = COPY[variant];

  return (
    <div className="flex flex-col items-center gap-5 rounded-2xl border border-slate-200/60 bg-white px-6 py-16 text-center shadow-xs">
      {/* Glassmorphic floating icon */}
      <div
        className={`relative flex size-16 items-center justify-center rounded-2xl ring-1 shadow-[0_8px_32px_-12px_rgba(15,23,42,0.12)] ${iconBg}`}
      >
        <Icon className={`size-7 ${iconColor}`} />
      </div>

      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="max-w-xs text-xs leading-relaxed text-slate-500">{body}</p>
      </div>
    </div>
  );
}
