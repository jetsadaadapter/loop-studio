"use client";

import React from "react";
import { Sparkles, KeyRound, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProjectItem } from "@/core/interfaces/projects.interface";

interface OverviewTabProps {
  projects: ProjectItem[];
  onTopUpClick: (project: ProjectItem) => void;
}

export function OverviewTab({
  projects,
  onTopUpClick,
}: OverviewTabProps) {
  // Aggregate stats
  const activeProjectsCount = projects.length;
  const totalCreditsAllocated = projects.reduce((sum, p) => sum + p.credits, 0);
  const totalAppsConnected = projects.reduce((sum, p) => sum + (p.connectedAppIds?.length ?? 0), 0);
  const totalToolsConnected = projects.reduce((sum, p) => sum + (p.connectedToolIds?.length ?? 0), 0);
  const totalKeysConnected = projects.reduce((sum, p) => sum + (p.connectedApiKeyIds?.length ?? 0), 0);

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* ─── Header Stats Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Active Projects",
            value: activeProjectsCount,
            sub: activeProjectsCount === 0 ? "No projects yet" : `${activeProjectsCount} project${activeProjectsCount !== 1 ? "s" : ""} tracked`,
            subIcon: ArrowUpRight,
            subColor: "text-emerald-600",
            bg: "bg-white border-slate-200/50 bg-[radial-gradient(circle_at_top_right,rgba(253,186,116,0.22)_0%,rgba(255,255,255,0)_70%)]",
          },
          {
            title: "Total Credits Pool",
            value: `${totalCreditsAllocated.toLocaleString()} cr`,
            sub: totalCreditsAllocated === 0 ? "No credits allocated" : "Across all projects",
            subIcon: ArrowDownRight,
            subColor: totalCreditsAllocated < 500 ? "text-rose-600" : "text-slate-500",
            bg: "bg-white border-slate-200/50 bg-[radial-gradient(circle_at_top_right,rgba(191,219,254,0.32)_0%,rgba(255,255,255,0)_70%)]",
          },
          {
            title: "Connected Tools & Apps",
            value: totalAppsConnected + totalToolsConnected,
            sub: (totalAppsConnected + totalToolsConnected) === 0 ? "None connected yet" : "Active pipelines",
            subIcon: Sparkles,
            subColor: "text-brand",
            bg: "bg-white border-slate-200/50 bg-[radial-gradient(circle_at_top_right,rgba(187,247,208,0.35)_0%,rgba(255,255,255,0)_70%)]",
          },
          {
            title: "API Connections",
            value: totalKeysConnected,
            sub: totalKeysConnected === 0 ? "No keys linked yet" : "Active integrations",
            subIcon: KeyRound,
            subColor: "text-indigo-600",
            bg: "bg-white border-slate-200/50 bg-[radial-gradient(circle_at_top_right,rgba(251,207,232,0.35)_0%,rgba(255,255,255,0)_70%)]",
          },
        ].map((stat, idx) => (
          <div
            key={stat.title}
            className={`rounded-2xl border ${stat.bg} p-5 shadow-xs transition-all duration-300 hover:shadow-sm motion-stagger-item`}
            style={{ "--stagger-delay": `${100 + idx * 100}ms` } as React.CSSProperties}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-455">{stat.title}</p>
            <p className="mt-1.5 text-2xl font-bold text-slate-800">{stat.value}</p>
            <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-slate-500">
              <stat.subIcon className={`size-3 ${stat.subColor}`} />
              <span className={stat.subColor}>{stat.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Recent Projects ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between motion-stagger-item" style={{ "--stagger-delay": "500ms" } as React.CSSProperties}>
          <h2 className="text-base font-bold text-slate-900">Recent Projects</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.slice(0, 3).map((proj, pIdx) => {
            const updatedDate = new Date(proj.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });

            return (
              <div
                key={proj.id}
                className="rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white via-white to-violet-50/50 p-5 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xs motion-stagger-item flex flex-col justify-between min-h-[160px]"
                style={{ "--stagger-delay": `${600 + pIdx * 100}ms` } as React.CSSProperties}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-450 font-bold flex items-center gap-1">
                      <Clock className="size-3" />
                      Updated {updatedDate}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-sans font-bold bg-amber-100 text-amber-700 border border-amber-200/50 select-none">
                      {proj.credits.toLocaleString()} cr
                    </span>
                  </div>

                  <h3 className="mt-3.5 text-sm font-bold text-slate-800 tracking-tight">{proj.name}</h3>
                  <p className="mt-1 text-[11px] text-slate-500 leading-relaxed font-medium select-text line-clamp-2">
                    ID: <span className="font-sans text-slate-400 select-all">{proj.id.slice(0, 12).toUpperCase()}</span>
                  </p>
                </div>

                {/* Footer: Action Button */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-end text-[10px] font-semibold text-slate-400 select-none">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => onTopUpClick(proj)}
                      className="h-6 text-[9px] font-bold text-slate-600 border-slate-200 hover:bg-slate-50 cursor-pointer"
                    >
                      Top-up
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
