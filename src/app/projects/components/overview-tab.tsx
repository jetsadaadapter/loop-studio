"use client";

import React from "react";
import {
  Sparkles,
  KeyRound,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Coins,
  FolderOpen,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProjectItem } from "@/core/interfaces/projects.interface";

interface OverviewTabProps {
  projects: ProjectItem[];
  onTopUpClick: (project: ProjectItem) => void;
}

export function OverviewTab({ projects, onTopUpClick }: OverviewTabProps) {
  // Aggregate stats — all computed from real project data
  const activeProjectsCount = projects.length;
  const totalCreditsAllocated = projects.reduce((sum, p) => sum + p.credits, 0);
  const totalAppsConnected = projects.reduce((sum, p) => sum + (p.connectedAppIds?.length ?? 0), 0);
  const totalToolsConnected = projects.reduce((sum, p) => sum + (p.connectedToolIds?.length ?? 0), 0);
  const totalKeysConnected = projects.reduce((sum, p) => sum + (p.connectedApiKeyIds?.length ?? 0), 0);
  const totalConnected = totalAppsConnected + totalToolsConnected;

  // Only include stat cards that have meaningful data to show
  const allStats = [
    {
      title: "Active Projects",
      value: activeProjectsCount,
      formatted: activeProjectsCount.toString(),
      sub:
        activeProjectsCount === 0
          ? "No projects yet"
          : `${activeProjectsCount} project${activeProjectsCount !== 1 ? "s" : ""} tracked`,
      subIcon: activeProjectsCount === 0 ? FolderOpen : ArrowUpRight,
      subColor: activeProjectsCount === 0 ? "text-slate-400" : "text-emerald-600",
      bg: "bg-[radial-gradient(circle_at_top_right,rgba(253,186,116,0.22)_0%,rgba(255,255,255,0)_70%)]",
      iconBg: "bg-amber-50 text-amber-500",
      icon: FolderOpen,
      alwaysShow: true,
    },
    {
      title: "Total Credits Pool",
      value: totalCreditsAllocated,
      formatted: `${totalCreditsAllocated.toLocaleString()} cr`,
      sub: totalCreditsAllocated === 0 ? "No credits allocated" : "Across all projects",
      subIcon: totalCreditsAllocated === 0 ? Coins : ArrowDownRight,
      subColor: totalCreditsAllocated < 500 ? "text-rose-500" : "text-slate-500",
      bg: "bg-[radial-gradient(circle_at_top_right,rgba(191,219,254,0.32)_0%,rgba(255,255,255,0)_70%)]",
      iconBg: "bg-blue-50 text-blue-500",
      icon: Coins,
      alwaysShow: true,
    },
    {
      title: "Connected Tools & Apps",
      value: totalConnected,
      formatted: totalConnected.toString(),
      sub: totalConnected === 0 ? "None connected yet" : "Active pipelines",
      subIcon: totalConnected === 0 ? Sparkles : TrendingUp,
      subColor: totalConnected === 0 ? "text-slate-400" : "text-brand",
      bg: "bg-[radial-gradient(circle_at_top_right,rgba(187,247,208,0.35)_0%,rgba(255,255,255,0)_70%)]",
      iconBg: "bg-emerald-50 text-emerald-500",
      icon: Sparkles,
      alwaysShow: false,
    },
    {
      title: "API Connections",
      value: totalKeysConnected,
      formatted: totalKeysConnected.toString(),
      sub: totalKeysConnected === 0 ? "No keys linked yet" : "Active integrations",
      subIcon: totalKeysConnected === 0 ? KeyRound : Zap,
      subColor: totalKeysConnected === 0 ? "text-slate-400" : "text-indigo-600",
      bg: "bg-[radial-gradient(circle_at_top_right,rgba(251,207,232,0.35)_0%,rgba(255,255,255,0)_70%)]",
      iconBg: "bg-indigo-50 text-indigo-500",
      icon: KeyRound,
      alwaysShow: false,
    },
  ];

  // Only show stat cards that are always shown OR have data > 0
  const visibleStats = allStats.filter((s) => s.alwaysShow || s.value > 0);

  const recentProjects = projects.slice(0, 3);

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* ─── Header Stats Grid ─── */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${visibleStats.length <= 2 ? "lg:grid-cols-2" : "lg:grid-cols-4"}`}>
        {visibleStats.map((stat, idx) => (
          <div
            key={stat.title}
            className={`rounded-2xl border border-slate-200/60 bg-white ${stat.bg} p-5 shadow-xs transition-all duration-300 hover:shadow-sm motion-stagger-item`}
            style={{ "--stagger-delay": `${100 + idx * 100}ms` } as React.CSSProperties}
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{stat.title}</p>
                <p className="mt-2 text-2xl font-bold text-slate-800 leading-none">{stat.formatted}</p>
                <div className="mt-2.5 flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                  <stat.subIcon className={`size-3 shrink-0 ${stat.subColor}`} />
                  <span className={stat.subColor}>{stat.sub}</span>
                </div>
              </div>
              <div className={`ml-3 shrink-0 rounded-xl p-2.5 ${stat.iconBg}`}>
                <stat.icon className="size-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Recent Projects ─── */}
      {recentProjects.length > 0 && (
        <div className="space-y-4">
          <div
            className="flex items-center justify-between motion-stagger-item"
            style={{ "--stagger-delay": "500ms" } as React.CSSProperties}
          >
            <h2 className="text-sm font-bold text-slate-800">Recent Projects</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentProjects.map((proj, pIdx) => {
              const updatedDate = new Date(proj.updatedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
              const creditsLow = proj.credits < 100;

              return (
                <div
                  key={proj.id}
                  className="group rounded-2xl border border-slate-200/60 bg-white p-5 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300/60 motion-stagger-item flex flex-col min-h-[170px]"
                  style={{ "--stagger-delay": `${600 + pIdx * 100}ms` } as React.CSSProperties}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                      <Clock className="size-3 shrink-0" />
                      <span>Updated {updatedDate}</span>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border select-none ${
                        creditsLow
                          ? "bg-rose-50 text-rose-600 border-rose-200/60"
                          : "bg-amber-50 text-amber-700 border-amber-200/60"
                      }`}
                    >
                      <Coins className="size-2.5" />
                      {proj.credits.toLocaleString()} cr
                    </span>
                  </div>

                  {/* Project name & ID */}
                  <div className="mt-3.5 flex-1">
                    <h3 className="text-sm font-semibold text-slate-800 tracking-tight leading-snug line-clamp-1">
                      {proj.name}
                    </h3>
                    <p className="mt-1 text-[10px] text-slate-400 font-medium select-text font-sans">
                      ID: <span className="select-all text-slate-350">{proj.id.slice(0, 16).toUpperCase()}</span>
                    </p>
                  </div>

                  {/* Footer row */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                      {(proj.connectedAppIds?.length ?? 0) > 0 && (
                        <span className="flex items-center gap-1">
                          <Sparkles className="size-2.5 text-brand" />
                          {proj.connectedAppIds!.length} app{proj.connectedAppIds!.length !== 1 ? "s" : ""}
                        </span>
                      )}
                      {(proj.connectedToolIds?.length ?? 0) > 0 && (
                        <span className="flex items-center gap-1">
                          <Zap className="size-2.5 text-indigo-500" />
                          {proj.connectedToolIds!.length} tool{proj.connectedToolIds!.length !== 1 ? "s" : ""}
                        </span>
                      )}
                      {(proj.connectedApiKeyIds?.length ?? 0) > 0 && (
                        <span className="flex items-center gap-1">
                          <KeyRound className="size-2.5 text-emerald-500" />
                          {proj.connectedApiKeyIds!.length} key{proj.connectedApiKeyIds!.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => onTopUpClick(proj)}
                      className="h-6 px-2.5 text-[10px] font-semibold text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300 cursor-pointer transition-all duration-200"
                    >
                      Top-up
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state for recent projects */}
      {recentProjects.length === 0 && (
        <div
          className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-10 flex flex-col items-center justify-center text-center motion-stagger-item"
          style={{ "--stagger-delay": "500ms" } as React.CSSProperties}
        >
          <div className="rounded-full bg-slate-100 p-3 mb-3">
            <FolderOpen className="size-5 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-600">No projects yet</p>
          <p className="mt-1 text-xs text-slate-400">Create your first project to get started.</p>
        </div>
      )}
    </div>
  );
}
