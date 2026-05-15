"use client";

import type { ToolJob } from "@/core/interfaces/tools.interface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, Circle, ChevronRight, Clock, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { getJobStatus, getItemCount, type JobStatus } from "./tool-job-utils";

interface ToolHistorySidebarProps {
    jobs: ToolJob[];
    activeTab: JobStatus;
    selectedJobId?: string;
    isRefreshing?: boolean;
    onTabChange: (tab: JobStatus) => void;
    onViewJob: (jobId: string) => void;
    onRefresh: () => void;
}

export function ToolHistorySidebar({ jobs, activeTab, selectedJobId, isRefreshing, onTabChange, onViewJob, onRefresh }: ToolHistorySidebarProps) {
    const tabs = ['all', ...Array.from(new Set(jobs.map(j => getJobStatus(j))))];
    const filtered = jobs.filter(job => activeTab === 'all' || getJobStatus(job) === activeTab);

    return (
        <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3 space-y-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <History className="size-5 text-slate-400" /> Job History
                    </CardTitle>
                    <button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        title="Refresh job history"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand hover:bg-brand/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
                    </button>
                </div>
                {/* Filter group from actual job states */}
                <div className="flex flex-wrap items-center gap-2">
                    {tabs.map((tab) => (
                        <button key={tab} onClick={() => onTabChange(tab)}
                            className={cn("px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full border transition-all",
                                activeTab === tab
                                    ? "bg-brand border-brand text-white shadow-sm"
                                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50")}>
                            {tab}
                        </button>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="px-0">
                <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                    {filtered.length === 0 ? (
                        <div className="py-10 text-center space-y-2">
                            <Clock className="size-8 text-slate-200 mx-auto" />
                            <p className="text-xs text-slate-400">No {activeTab !== 'all' ? activeTab : ''} jobs found.</p>
                        </div>
                    ) : (
                        filtered.map(job => {
                            const status = getJobStatus(job);
                            return (
                                <button key={job.jobId} onClick={() => onViewJob(job.jobId)}
                                    className={cn("w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group",
                                        selectedJobId === job.jobId && "bg-brand/5 border-l-4 border-l-brand")}>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-bold text-slate-900 truncate">{job.jobId.split('-')[0]}...</p>
                                            {job.plugin && (
                                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px] uppercase font-bold tracking-widest">
                                                    {job.plugin}
                                                </span>
                                            )}
                                            <span className="text-[10px] text-slate-400 ml-auto">
                                                {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <div className="flex items-center gap-1">
                                                <Circle className={cn("size-2 fill-current",
                                                    status === 'completed' ? "text-teal-400" :
                                                        status === 'running' ? "text-amber-400 animate-pulse" :
                                                            status === 'failed' ? "text-red-400" : "text-slate-300")} />
                                                <span className="text-[10px] font-bold text-slate-500 uppercase">{status}</span>
                                            </div>
                                            <span className="text-[10px] text-slate-400">•</span>
                                            <span className="text-[10px] text-slate-400 font-medium">{getItemCount(job)} items</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="size-4 text-slate-300 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
                                </button>
                            );
                        })
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
