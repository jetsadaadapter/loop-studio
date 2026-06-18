"use client";

import React from "react";
import { Brain, Cpu, Server, Activity } from "lucide-react";

interface ModelStatsProps {
  stats: {
    total: number;
    active: number;
    geminiCount: number;
    othersCount: number;
  };
  isLoading: boolean;
}

export function ModelStats({ stats, isLoading }: ModelStatsProps) {
  const items = [
    {
      label: "Total Models",
      value: stats.total,
      description: "Configured models in the system",
      icon: Cpu,
      colorCls: "text-blue-600",
      bgCls: "bg-blue-50",
      borderCls: "hover:border-blue-200/80 hover:shadow-blue-500/5",
    },
    {
      label: "Active Models",
      value: stats.active,
      description: "Models ready for user interactions",
      icon: Activity,
      colorCls: "text-amber-500",
      bgCls: "bg-amber-50",
      borderCls: "hover:border-amber-200/80 hover:shadow-amber-500/5",
    },
    {
      label: "Google Gemini",
      value: stats.geminiCount,
      description: "Active Gemini foundation models",
      icon: SparklesIcon,
      colorCls: "text-emerald-600",
      bgCls: "bg-emerald-50",
      borderCls: "hover:border-emerald-200/80 hover:shadow-emerald-500/5",
    },
    {
      label: "Other Providers",
      value: stats.othersCount,
      description: "Anthropic, OpenAI & other models",
      icon: Server,
      colorCls: "text-rose-500",
      bgCls: "bg-rose-50",
      borderCls: "hover:border-rose-200/80 hover:shadow-rose-500/5",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6 select-none animate-in fade-in duration-300">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-white shadow-3xs shadow-slate-100/50 hover:shadow-2xs transition-all cursor-pointer"
          >
            {/* Left Content (Text) */}
            <div className="min-w-0 pr-2">
              {isLoading ? (
                <div className="h-8 w-12 animate-pulse rounded bg-slate-100" />
              ) : (
                <span className={`text-3xl font-bold tracking-tight ${item.colorCls}`}>
                  {item.value}
                </span>
              )}
              <h4 className="text-xs font-bold text-slate-700 mt-1 leading-none truncate">
                {item.label}
              </h4>
              <span className="text-[10px] text-slate-400 mt-1 block truncate">
                {item.description}
              </span>
            </div>

            {/* Right Content (Circular Icon) */}
            <div className={`flex size-10 items-center justify-center rounded-full shrink-0 ${item.bgCls} ${item.colorCls}`}>
              <Icon className="size-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Simple Sparkles SVG Icon to avoid extra imports if Sparkles isn't directly loaded,
// but we can just use Lucide-react's Sparkles or write a custom inline SVG for premium look.
function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5z" />
      <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" />
    </svg>
  );
}
