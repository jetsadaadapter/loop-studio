"use client";

import { useState } from "react";
import type { ToolJob } from "@/core/interfaces/tools.interface";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { AlertCircle, Copy, Check, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";
import { getJobStatus, getItemCount, type AnalysisResult, type PreviousResults, type StartUrlItem, type ExtendedToolJob } from "./tool-job-utils";
import { JobDetailSkeleton } from "./components/job-detail-skeleton";
import { JobRunAccordions } from "./components/job-run-accordions";
import { JobResultItem } from "./components/job-result-item";
import { JobPoliticianGroup } from "./components/job-politician-group";

interface ToolJobModalProps {
    open: boolean;
    isLoading: boolean;
    job: ToolJob | null;
    onOpenChange: (open: boolean) => void;
}

export function ToolJobModal({ open, isLoading, job, onOpenChange }: ToolJobModalProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent 
                side="right" 
                className="!w-full sm:!max-w-[480px] md:!max-w-[580px] lg:!max-w-[680px] xl:!max-w-[720px] overflow-hidden flex flex-col p-0 border-none bg-slate-50 shadow-2xl transition-all duration-300 h-full"
            >
                {isLoading ? (
                    <JobDetailSkeleton />
                ) : job ? (
                    <JobDetailContent job={job} />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <p className="text-sm text-slate-500">No job data available.</p>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}


function JobDetailContent({ job }: { job: ToolJob }) {
    const status = getJobStatus(job);
    const [viewMode, setViewMode] = useState<'flat' | 'group'>('flat');
    const [copiedPrompt, setCopiedPrompt] = useState(false);
    const [copiedJobId, setCopiedJobId] = useState(false);

    const extJob = job as unknown as ExtendedToolJob;

    // Resolve config safely
    let resolvedConfig: Record<string, unknown> = {};
    try {
        if (job.config) {
            resolvedConfig = typeof job.config === 'string' ? JSON.parse(job.config as string) : (job.config as Record<string, unknown>);
        }
    } catch {
        resolvedConfig = (job.config as Record<string, unknown>) || {};
    }

    try {
        const resConfig = extJob.result?.config;
        if (resConfig) {
            const parsedResConfig = typeof resConfig === 'string' ? JSON.parse(resConfig) : (resConfig as Record<string, unknown>);
            resolvedConfig = { ...parsedResConfig, ...resolvedConfig };
        }
    } catch {}

    const configActorId = String(resolvedConfig.actorId || extJob.actorId || extJob.result?.actorId || '');
    const configPlugin = job.plugin ? job.plugin.charAt(0).toUpperCase() + job.plugin.slice(1) : '';
    const configModelWithFallback = String(resolvedConfig.model || extJob.model || (configActorId ? 'Apify Scraper Engine' : 'Default Model'));
    const configItemKey = String(resolvedConfig.itemKey || extJob.itemKey || '');
    const hasItemKey = configItemKey !== '' && configItemKey !== 'N/A';
    const configPrompt = String(resolvedConfig.prompt || extJob.prompt || extJob.result?.prompt || '');

    const otherParams = Object.entries(resolvedConfig).filter(
        ([key]) => !['model', 'itemKey', 'prompt', 'actorId', 'useInput'].includes(key)
    );
    const inputStartUrls = job.input?.startUrls as StartUrlItem[] | undefined;
    const hasStartUrls = Array.isArray(inputStartUrls) && inputStartUrls.length > 0;

    const previousResults = job.input?.previousResults as PreviousResults | undefined;
    const hasPreviousResults = !!previousResults;
    const prevUrls = previousResults?.items?.map(item => {
        const rawUrl = String(item.facebookUrl || item.permalink_url || item.url || '');
        return rawUrl;
    }).filter(url => url !== '') || [];

    const resolvedTargetUrls = hasStartUrls 
        ? inputStartUrls?.map(item => String(item?.url || '')).filter(url => url !== '') || []
        : prevUrls;
    const hasTargetUrls = resolvedTargetUrls.length > 0;

    const otherInputParams = Object.entries(job.input || {}).filter(
        ([key]) => !['startUrls', 'previousResults'].includes(key)
    );
    const hasInputParams = hasTargetUrls || hasPreviousResults || otherInputParams.length > 0;

    // Scan for unique politicians
    const allPoliticiansSet = new Set<string>();
    const items = job.result?.items || [];
    items.forEach(item => {
        const analysis = (item.analysis as AnalysisResult) || {};
        if (Array.isArray(analysis.politicians)) {
            analysis.politicians.forEach(p => allPoliticiansSet.add(p));
        }
    });
    const uniquePoliticians = Array.from(allPoliticiansSet);
    const hasPoliticians = uniquePoliticians.length > 0;

    return (
        <>
            <SheetHeader className="p-4 md:p-5 bg-gradient-to-r from-slate-50/50 via-white to-slate-50/30 border-b border-slate-200 shrink-0 relative pr-16">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-brand/5 border border-brand/10 text-brand rounded-xl shrink-0 shadow-xs">
                        <Workflow className="size-4 animate-spin-slow" />
                    </div>
                    <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <SheetTitle className="text-sm font-bold text-slate-800 tracking-tight leading-none">
                                Job Result Detail
                            </SheetTitle>
                            
                            <div className={cn(
                                "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9.5px] font-bold shadow-xs border transition-all duration-300 select-none shrink-0",
                                status === 'completed' ? "bg-emerald-50/60 text-emerald-700 border-emerald-250/50" :
                                status === 'running' ? "bg-amber-50/60 text-amber-700 border-amber-250/50" :
                                "bg-rose-50/60 text-rose-700 border-rose-250/50"
                            )}>
                                <span className={cn(
                                    "size-1 rounded-full shrink-0",
                                    status === 'completed' ? "bg-emerald-500 animate-pulse" :
                                    status === 'running' ? "bg-amber-500 animate-pulse" :
                                    "bg-rose-500 animate-pulse"
                                )} />
                                {status.toUpperCase()}
                            </div>
                        </div>
                        <SheetDescription className="text-slate-400 text-[10px] truncate block leading-normal">
                            System Engine Analysis & Audit Trail Logs
                        </SheetDescription>
                    </div>
                </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-6">
                {/* Compact Technical Metadata Ribbon */}
                <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-2 px-3.5 flex items-center justify-between text-[11px] font-medium text-slate-650 shadow-xs">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 border-r border-slate-200/60 pr-4">
                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Plugin</span>
                            <div className="flex items-center gap-1 font-bold text-slate-800">
                                <div className="size-1.5 rounded-full bg-brand animate-pulse" />
                                {configPlugin || 'N/A'}
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Processed Time</span>
                            <span className="font-bold text-slate-800">
                                {job.createdAt ? new Date(job.createdAt).toLocaleString() : 'N/A'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Job ID</span>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(job.jobId);
                                setCopiedJobId(true);
                                setTimeout(() => setCopiedJobId(false), 2000);
                            }}
                            className="flex items-center gap-1 bg-white border border-slate-200 hover:bg-slate-50 text-[10px] text-slate-700 font-semibold px-2 py-0.5 rounded-md shadow-xs active:scale-95 transition-all cursor-pointer"
                            title="Copy Job ID"
                        >
                            <span className="truncate max-w-[80px]">#{job.jobId.slice(0, 8)}</span>
                            {copiedJobId ? (
                                <Check className="size-2.5 text-emerald-500" />
                            ) : (
                                <Copy className="size-2.5 text-slate-400" />
                            )}
                        </button>
                    </div>
                </div>

                <JobRunAccordions
                    configActorId={configActorId}
                    configModelWithFallback={configModelWithFallback}
                    configItemKey={configItemKey}
                    hasItemKey={hasItemKey}
                    configPrompt={configPrompt}
                    copiedPrompt={copiedPrompt}
                    onCopyPrompt={() => {
                        navigator.clipboard.writeText(configPrompt);
                        setCopiedPrompt(true);
                        setTimeout(() => setCopiedPrompt(false), 2000);
                    }}
                    otherParams={otherParams}
                    hasPreviousResults={hasPreviousResults}
                    previousResults={previousResults}
                    resolvedTargetUrls={resolvedTargetUrls}
                    hasTargetUrls={hasTargetUrls}
                    otherInputParams={otherInputParams}
                    hasInputParams={hasInputParams}
                />

                {job.error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle className="size-5 text-red-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-red-800">Job Failed</p>
                            <p className="text-xs text-red-650 leading-relaxed">
                                {typeof job.error === 'string' ? job.error : JSON.stringify(job.error)}
                            </p>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Workflow className="size-4 text-brand" /> Processed Items ({getItemCount(job)})
                        </h3>
                        {hasPoliticians && (
                            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 shadow-inner">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('flat')}
                                    className={cn("flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold transition-all duration-200",
                                        viewMode === 'flat' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800")}
                                >
                                    Flat List
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('group')}
                                    className={cn("flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold transition-all duration-200",
                                        viewMode === 'group' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800")}
                                >
                                    Group By Politician
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        {items.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
                                <p className="text-sm text-slate-500">No result items found for this job.</p>
                            </div>
                        ) : viewMode === 'group' ? (
                            <JobPoliticianGroup uniquePoliticians={uniquePoliticians} items={items} />
                        ) : (
                            items.map((item, idx) => (
                                <JobResultItem key={`modal-item-${idx}`} item={item} idx={idx} job={job} />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
