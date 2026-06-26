"use client";

import { Clock, Loader2 } from "lucide-react";
import { ManagerPagination } from "@/components/manager-pagination";
import type { ProjectActivity } from "@/core/services/projects-mock-data";

interface ActivityTabProps {
  activities: ProjectActivity[];
  totalActivities: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  isLoading: boolean;
  now: number;
}

export function ActivityTab({
  activities,
  totalActivities,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  isLoading,
  now,
}: ActivityTabProps) {
  const getPriorityBadgeClass = (priority?: string) => {
    switch (priority) {
      case "urgent":
        return "bg-rose-500 text-white shadow-rose-500/20";
      case "high":
        return "bg-amber-500 text-white shadow-amber-500/20";
      case "medium":
        return "bg-amber-100 text-amber-700 border border-amber-200/50";
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
    <div className="space-y-4 animate-fade-in font-sans">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 select-none">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-slate-650">User</th>
                <th className="px-4 py-3 text-left font-bold text-slate-650">Action</th>
                <th className="px-4 py-3 text-left font-bold text-slate-650">Target/Asset</th>
                <th className="px-4 py-3 text-left font-bold text-slate-650">Project</th>
                <th className="px-4 py-3 text-left font-bold text-slate-650">Priority</th>
                <th className="px-4 py-3 text-left font-bold text-slate-650">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 select-text">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400 select-none">
                    <Loader2 className="size-5 animate-spin mx-auto text-slate-400" />
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center select-none">
                    <p className="text-slate-500 font-bold text-sm">No activity recorded yet</p>
                    <p className="text-slate-400 text-xs mt-1">Activity is logged automatically when you create, rename, delete projects or top up credits.</p>
                  </td>
                </tr>
              ) : (
                activities.map((act) => (
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
                    <td className="px-4 py-3.5 text-slate-400 font-bold flex items-center gap-1 select-none">
                      <Clock className="size-3 text-slate-350" />
                      {getRelativeTime(act.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ManagerPagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={totalActivities}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
