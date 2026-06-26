"use client";

import { Clock, Loader2 } from "lucide-react";
import { ManagerPagination } from "@/components/manager-pagination";
import type { ProjectActivity } from "@/core/services/projects-mock-data";
import {
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

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

  const getInitials = (name: string) => {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? "")
      .join("");
  };

  const getAvatarBgColor = (name: string) => {
    const colors = [
      "bg-indigo-50 text-indigo-700 border-indigo-100/50",
      "bg-violet-50 text-violet-700 border-violet-100/50",
      "bg-emerald-50 text-emerald-700 border-emerald-100/50",
      "bg-amber-50 text-amber-700 border-amber-100/50",
      "bg-rose-50 text-rose-700 border-rose-100/50",
      "bg-sky-50 text-sky-700 border-sky-100/50",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  return (
    <div className="space-y-4 animate-fade-in font-sans">
      {/* Desktop view */}
      <div className="hidden md:block">
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4">User</TableHead>
                <TableHead className="px-4">Action</TableHead>
                <TableHead className="px-4">Target/Asset</TableHead>
                <TableHead className="px-4">Project</TableHead>
                <TableHead className="px-4">Priority</TableHead>
                <TableHead className="px-4">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="select-text">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-4 py-12 text-center text-slate-400 select-none">
                    <Loader2 className="size-5 animate-spin mx-auto text-slate-400" />
                  </TableCell>
                </TableRow>
              ) : activities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-4 py-10 text-center select-none">
                    <p className="text-slate-700 font-semibold text-sm">No activity recorded yet</p>
                    <p className="text-slate-400 text-xs mt-1">Activity is logged automatically when you create, rename, delete projects or top up credits.</p>
                  </TableCell>
                </TableRow>
              ) : (
                activities.map((act) => (
                  <TableRow key={act.id}>
                    <TableCell className="px-4 py-3.5 flex items-center gap-2">
                      {act.userAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={act.userAvatar}
                          alt={act.userName}
                          className="size-6 rounded-full border border-slate-200/50 shadow-2xs select-none shrink-0"
                        />
                      ) : (
                        <span className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold shadow-2xs select-none uppercase ${getAvatarBgColor(act.userName)}`}>
                          {getInitials(act.userName)}
                        </span>
                      )}
                      <span className="text-sm font-semibold text-slate-800 tracking-tight">{act.userName}</span>
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-slate-500">{act.action}</TableCell>
                    <TableCell className="px-4 py-3.5 font-semibold text-slate-700">{act.targetName}</TableCell>
                    <TableCell className="px-4 py-3.5 font-semibold text-slate-600">{act.projectName}</TableCell>
                    <TableCell className="px-4 py-3.5 select-none">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-sans font-bold capitalize ${getPriorityBadgeClass(act.priority)}`}>
                        {act.priority ?? "low"}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-slate-400 flex items-center gap-1 select-none">
                      <Clock className="size-3 text-slate-350" />
                      {getRelativeTime(act.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {/* Mobile view */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 py-12 text-center text-slate-450 shadow-3xs select-none">
            <Loader2 className="size-5 animate-spin mx-auto text-slate-400" />
          </div>
        ) : activities.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 p-6 text-center select-none shadow-3xs">
            <p className="text-slate-700 font-semibold text-sm">No activity recorded yet</p>
            <p className="text-slate-400 text-xs mt-1">Activity is logged automatically when you create, rename, delete projects or top up credits.</p>
          </div>
        ) : (
          activities.map((act) => (
            <div key={act.id} className="bg-white rounded-xl border border-slate-200/60 p-4 space-y-2.5 shadow-3xs select-text">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {act.userAvatar ? (
                    <img
                      src={act.userAvatar}
                      alt={act.userName}
                      className="size-6 rounded-full border border-slate-200/50 shadow-2xs select-none shrink-0"
                    />
                  ) : (
                    <span className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold shadow-2xs select-none uppercase ${getAvatarBgColor(act.userName)}`}>
                      {getInitials(act.userName)}
                    </span>
                  )}
                  <span className="text-xs font-semibold text-slate-800 tracking-tight">{act.userName}</span>
                </div>
                <span className="text-[10px] text-slate-400 flex items-center gap-1 select-none">
                  <Clock className="size-3 text-slate-350" />
                  {getRelativeTime(act.createdAt)}
                </span>
              </div>

              <div className="text-xs text-slate-750 leading-relaxed pl-8">
                <span className="text-slate-500 font-normal">{act.action}</span>{" "}
                <span className="font-semibold text-slate-800">{act.targetName}</span>
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 pl-8">
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold select-none">Project:</span>
                  <span className="text-[10px] font-semibold text-slate-650 truncate max-w-[140px]">{act.projectName}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-sans font-bold capitalize select-none ${getPriorityBadgeClass(act.priority)}`}>
                  {act.priority ?? "low"}
                </span>
              </div>
            </div>
          ))
        )}
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
