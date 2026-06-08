"use client";

import { cn } from "@/lib/utils";

interface JobStatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_CLASSES: Record<string, { bg: string; dot: string }> = {
  completed: {
    bg: "bg-emerald-50/60 border-emerald-200/50 text-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.08)]",
    dot: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]"
  },
  active: {
    bg: "bg-amber-50/60 border-amber-200/50 text-amber-600 shadow-[0_0_8px_rgba(245,158,11,0.08)] animate-pulse",
    dot: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)] animate-pulse"
  },
  running: {
    bg: "bg-amber-550/10 border-amber-500/20 text-amber-600 shadow-[0_0_8px_rgba(245,158,11,0.08)]",
    dot: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)] animate-pulse"
  },
  queued: {
    bg: "bg-blue-50/60 border-blue-200/50 text-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.08)] animate-pulse",
    dot: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.7)] animate-pulse"
  },
  waiting: {
    bg: "bg-purple-50/60 border-purple-200/50 text-purple-600 shadow-[0_0_8px_rgba(168,85,247,0.08)] animate-pulse",
    dot: "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.7)] animate-pulse"
  },
  failed: {
    bg: "bg-rose-50/60 border-rose-200/50 text-rose-600 shadow-[0_0_8px_rgba(244,63,94,0.08)]",
    dot: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]"
  }
};

const DEFAULT_CLASS = {
  bg: "bg-slate-50 border-slate-200 text-slate-500",
  dot: "bg-slate-400"
};

export function JobStatusBadge({ status, className }: JobStatusBadgeProps) {
  const statusLower = String(status || "").toLowerCase();
  const config = STATUS_CLASSES[statusLower] || DEFAULT_CLASS;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-extrabold uppercase select-none tracking-wider transition-all duration-205 shrink-0",
        config.bg,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full shrink-0", config.dot)} />
      <span className="leading-none">{status}</span>
    </div>
  );
}
