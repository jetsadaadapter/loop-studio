"use client";

import React from "react";
import { Wrench, Activity, Settings2, Terminal } from "lucide-react";

interface ToolStatsProps {
  stats: {
    total: number;
    active: number;
    totalParams: number;
    totalScripts: number;
  };
  isLoading: boolean;
}

export function ToolStats({ stats, isLoading }: ToolStatsProps) {
  const items = [
    {
      label: "Total Tools",
      value: stats.total,
      description: "Total custom tools registered",
      icon: Wrench,
      colorCls: "text-blue-600",
      bgCls: "bg-blue-50",
      borderCls: "hover:border-blue-200/80 hover:shadow-blue-500/5",
    },
    {
      label: "Active Tools",
      value: stats.active,
      description: "Enabled tools in runtime environment",
      icon: Activity,
      colorCls: "text-amber-500",
      bgCls: "bg-amber-50",
      borderCls: "hover:border-amber-200/80 hover:shadow-amber-500/5",
    },
    {
      label: "Total Parameters",
      value: stats.totalParams,
      description: "Configured parameter mappings",
      icon: Settings2,
      colorCls: "text-emerald-600",
      bgCls: "bg-emerald-50",
      borderCls: "hover:border-emerald-200/80 hover:shadow-emerald-500/5",
    },
    {
      label: "Total Scripts",
      value: stats.totalScripts,
      description: "Custom plugin executor scripts",
      icon: Terminal,
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
