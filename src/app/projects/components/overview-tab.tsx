"use client";

import { Sparkles, LayoutGrid, KeyRound, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProjectItem } from "@/core/interfaces/projects.interface";
import type { ProjectActivity } from "@/core/services/projects-mock-data";

interface OverviewTabProps {
  projects: ProjectItem[];
  activities: ProjectActivity[];
  onTopUpClick: (project: ProjectItem) => void;
  onConnectClick: (project: ProjectItem) => void;
  now: number;
}

export function OverviewTab({
  projects,
  activities,
  onTopUpClick,
  onConnectClick,
  now,
}: OverviewTabProps) {
  // Aggregate stats
  const activeProjectsCount = projects.length;
  const totalCreditsAllocated = projects.reduce((sum, p) => sum + p.credits, 0);
  const totalAppsConnected = projects.reduce((sum, p) => sum + (p.connectedAppIds?.length ?? 0), 0);
  const totalToolsConnected = projects.reduce((sum, p) => sum + (p.connectedToolIds?.length ?? 0), 0);
  const totalKeysConnected = projects.reduce((sum, p) => sum + (p.connectedApiKeyIds?.length ?? 0), 0);

  const getPriorityBadgeClass = (priority?: string) => {
    switch (priority) {
      case "urgent":
        return "bg-rose-500 text-white shadow-rose-500/20";
      case "high":
        return "bg-amber-500 text-white shadow-amber-500/20";
      case "medium":
        return "bg-amber-100 text-amber-700 border-amber-200/50";
      case "in progress":
        return "bg-indigo-500 text-white shadow-indigo-500/20";
      default:
        return "bg-emerald-500 text-white shadow-emerald-500/20";
    }
  };

  const getRelativeTime = (isoString: string) => {
    const diffMs = now - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

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
            bg: "from-blue-50/40 via-indigo-50/20 to-white border-blue-100/50",
          },
          {
            title: "Total Credits Pool",
            value: `${totalCreditsAllocated.toLocaleString()} cr`,
            sub: totalCreditsAllocated === 0 ? "No credits allocated" : "Across all projects",
            subIcon: ArrowDownRight,
            subColor: totalCreditsAllocated < 500 ? "text-rose-600" : "text-slate-500",
            bg: "from-amber-50/40 via-yellow-50/20 to-white border-amber-100/50",
          },
          {
            title: "Connected Tools & Apps",
            value: totalAppsConnected + totalToolsConnected,
            sub: (totalAppsConnected + totalToolsConnected) === 0 ? "None connected yet" : "Active pipelines",
            subIcon: Sparkles,
            subColor: "text-brand",
            bg: "from-emerald-50/40 via-teal-50/20 to-white border-emerald-100/50",
          },
          {
            title: "API Connections",
            value: totalKeysConnected,
            sub: totalKeysConnected === 0 ? "No keys linked yet" : "Active integrations",
            subIcon: KeyRound,
            subColor: "text-indigo-600",
            bg: "from-pink-50/40 via-rose-50/20 to-white border-pink-100/50",
          },
        ].map((stat, idx) => (
          <div
            key={stat.title}
            className={`rounded-2xl border bg-gradient-to-br ${stat.bg} p-5 shadow-xs transition-all duration-300 hover:shadow-sm motion-enter-${idx + 1}`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-450">{stat.title}</p>
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
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Recent Projects</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.slice(0, 3).map((proj) => {
            // Derive real values from actual project data
            const totalConnections = (proj.connectedAppIds?.length ?? 0) + (proj.connectedToolIds?.length ?? 0) + (proj.connectedApiKeyIds?.length ?? 0);
            // Progress represents credit allocation activity: more connections = more active
            const progress = Math.min(95, totalConnections > 0 ? 40 + totalConnections * 15 : 10);
            // Priority derived from credit level
            const priority = proj.credits === 0 ? "urgent" : proj.credits < 200 ? "medium" : proj.credits < 1000 ? "in progress" : "low";
            const updatedDate = new Date(proj.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });

            return (
              <div
                key={proj.id}
                className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xs motion-enter-2 flex flex-col justify-between min-h-[220px]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-450 font-bold flex items-center gap-1">
                      <Clock className="size-3" />
                      Updated {updatedDate}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-sans font-bold capitalize select-none ${getPriorityBadgeClass(priority)}`}>
                      {priority}
                    </span>
                  </div>

                  <h3 className="mt-3.5 text-sm font-bold text-slate-800 tracking-tight">{proj.name}</h3>
                  <p className="mt-1 text-[11px] text-slate-500 leading-relaxed font-medium select-text line-clamp-2">
                    ID: <span className="font-sans text-slate-400 select-all">{proj.id.slice(0, 12).toUpperCase()}</span>
                    {totalConnections > 0
                      ? ` · ${totalConnections} connected resource${totalConnections !== 1 ? "s" : ""}`
                      : " · No connected resources yet"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5 select-none">
                    <span className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200/40 text-[9px] font-sans font-bold text-slate-450">
                      {proj.credits.toLocaleString()} cr
                    </span>
                    {proj.connectedAppIds?.length ? (
                      <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-100/50 text-[9px] font-sans font-bold text-blue-500">
                        {proj.connectedAppIds.length} App{proj.connectedAppIds.length !== 1 ? "s" : ""}
                      </span>
                    ) : null}
                    {proj.connectedToolIds?.length ? (
                      <span className="px-2 py-0.5 rounded bg-violet-50 border border-violet-100/50 text-[9px] font-sans font-bold text-violet-500">
                        {proj.connectedToolIds.length} Tool{proj.connectedToolIds.length !== 1 ? "s" : ""}
                      </span>
                    ) : null}
                    {proj.connectedApiKeyIds?.length ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100/50 text-[9px] font-sans font-bold text-emerald-500">
                        {proj.connectedApiKeyIds.length} Key{proj.connectedApiKeyIds.length !== 1 ? "s" : ""}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-4">
                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-450 mb-1">
                      <span>Asset Coverage</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Connected Asset Metrics */}
                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 select-none">
                    <div className="flex gap-2">
                      <span className="flex items-center gap-0.5">
                        <LayoutGrid className="size-3 text-slate-400" />
                        {proj.connectedAppIds?.length ?? 0}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Sparkles className="size-3 text-slate-400" />
                        {proj.connectedToolIds?.length ?? 0}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <KeyRound className="size-3 text-slate-400" />
                        {proj.connectedApiKeyIds?.length ?? 0}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => onConnectClick(proj)}
                        className="h-6 text-[9px] font-bold text-slate-650 hover:bg-slate-50 cursor-pointer"
                      >
                        Connect
                      </Button>
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
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Recent Activity ─── */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">Recent Activity</h2>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-slate-600">User</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-600">Action</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-600">Task/Asset</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-600">Project</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-600">Priority</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-600">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 select-text">
                {activities.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center select-none">
                      <p className="text-slate-500 font-bold text-sm">No activity yet</p>
                      <p className="text-slate-400 text-xs mt-1">Create a project or top up credits to see activity here.</p>
                    </td>
                  </tr>
                ) : activities.slice(0, 3).map((act) => (
                  <tr key={act.id} className="align-middle">
                    <td className="px-4 py-3.5 flex items-center gap-2">
                      {act.userAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={act.userAvatar}
                          alt={act.userName}
                          className="size-6 rounded-full border border-slate-200/50 shadow-2xs select-none"
                        />
                      ) : null}
                      <span className="font-bold text-slate-800 text-xs">{act.userName}</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-medium">{act.action}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-700">{act.targetName}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-650">{act.projectName}</td>
                    <td className="px-4 py-3.5 select-none">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-sans font-bold capitalize ${getPriorityBadgeClass(act.priority)}`}>
                        {act.priority ?? "low"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 font-bold select-none">
                      {getRelativeTime(act.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
