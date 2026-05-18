"use client";

import { useState } from "react";
import Image from "next/image";
import type { ToolJob } from "@/core/interfaces/tools.interface";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, List, AlertCircle, CheckCircle2, ExternalLink, Users, User, Heart, MessageCircle, Eye, Repeat, Maximize2, Sparkles, MoreVertical, Settings, ChevronDown, ChevronUp, Copy, Check, Cpu, Workflow, Smile, Frown, Meh } from "lucide-react";
import { cn } from "@/lib/utils";
import { getJobStatus, getItemCount, type AnalysisResult, type SourceItem, type ScrapedComment, type ScrapedJobItem } from "./tool-job-utils";
import { RatioVisualizer, MultiLabelVisualizer, AccordionVisualizer } from "./visualizer-strategies";

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

function JobDetailSkeleton() {
    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
            {/* Header Skeleton */}
            <div className="bg-white border-b border-slate-200 px-6 py-4.5 shrink-0 flex items-center justify-between">
                <div className="space-y-2 animate-pulse w-full">
                    <div className="h-5 bg-slate-200 rounded-full w-2/5" />
                    <div className="h-3.5 bg-slate-100 rounded-full w-3/5" />
                </div>
            </div>

            {/* Scrollable Content Skeleton */}
            <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
                {/* Tab switcher skeleton */}
                <div className="flex bg-slate-200/50 p-1 rounded-xl w-48 h-9 animate-pulse" />

                {/* Social Card Skeleton Container */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-4 md:p-6 space-y-4 overflow-hidden relative">
                    {/* Card Header */}
                    <div className="flex items-center gap-3 animate-pulse">
                        <div className="size-10 bg-slate-200 rounded-full shrink-0" />
                        <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="h-4 bg-slate-200 rounded-full w-1/3" />
                            <div className="h-3 bg-slate-100 rounded-full w-1/4" />
                        </div>
                    </div>

                    {/* Caption skeleton */}
                    <div className="space-y-2 animate-pulse py-1">
                        <div className="h-3.5 bg-slate-200 rounded-full w-11/12" />
                        <div className="h-3.5 bg-slate-200 rounded-full w-10/12" />
                        <div className="h-3 bg-slate-100 rounded-full w-2/3" />
                    </div>

                    {/* Edge-to-Edge Media Block */}
                    <div className="-mx-6 bg-slate-200 h-[280px] animate-pulse relative" />

                    {/* Flat social stats */}
                    <div className="flex items-center gap-4 py-2 border-b border-slate-100 animate-pulse">
                        <div className="h-5 bg-slate-100 rounded-full w-12" />
                        <div className="h-5 bg-slate-100 rounded-full w-12" />
                        <div className="h-5 bg-slate-100 rounded-full w-12" />
                        <div className="h-5 bg-slate-100 rounded-full w-12" />
                    </div>

                    {/* Dashed summary widget skeleton */}
                    <div className="border-2 border-dashed border-slate-200 bg-white rounded-2xl p-4 space-y-3 animate-pulse">
                        <div className="flex items-center justify-between">
                            <div className="h-4 bg-slate-200 rounded-full w-1/4" />
                            <div className="size-6 bg-slate-200 rounded-full" />
                        </div>
                        <div className="space-y-2">
                            <div className="h-3 bg-slate-100 rounded-full w-full" />
                            <div className="h-3 bg-slate-100 rounded-full w-5/6" />
                            <div className="h-3 bg-slate-100 rounded-full w-4/5" />
                        </div>
                    </div>

                    {/* Visualizer stacks */}
                    <div className="space-y-3 pt-2 animate-pulse">
                        <div className="h-10 bg-slate-100 rounded-xl w-full" />
                        <div className="h-10 bg-slate-100 rounded-xl w-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}

interface PreviousResultsItem {
    facebookUrl?: string;
    permalink_url?: string;
    url?: string;
    [key: string]: unknown;
}

interface PreviousResults {
    resultId?: string;
    actorId?: string;
    runId?: string;
    itemCount?: number;
    items?: PreviousResultsItem[];
}

interface StartUrlItem {
    url?: string;
    [key: string]: unknown;
}

interface ExtendedToolJobResult {
    itemCount: number;
    items: Array<{
        sourceIndex: number;
        sourceKey: string;
        sourceKeyValue: string;
        analysis: Record<string, unknown>;
        [key: string]: unknown;
    }>;
    config?: Record<string, unknown> | string;
    prompt?: string;
    actorId?: string;
}

interface ExtendedToolJob extends Omit<ToolJob, 'result'> {
    result: ExtendedToolJobResult;
    model?: string;
    itemKey?: string;
    prompt?: string;
    actorId?: string;
}

function JobDetailContent({ job }: { job: ToolJob }) {
    const status = getJobStatus(job);
    const [viewMode, setViewMode] = useState<'flat' | 'group'>('flat');
    const [showConfig, setShowConfig] = useState(false);
    const [showInput, setShowInput] = useState(false);
    const [copiedPrompt, setCopiedPrompt] = useState(false);
    const [copiedJobId, setCopiedJobId] = useState(false);

    const extJob = job as unknown as ExtendedToolJob;

    // Resolve config safely from both root level and inside result key
    let resolvedConfig: Record<string, unknown> = {};
    try {
        if (job.config) {
            resolvedConfig = typeof job.config === 'string' ? JSON.parse(job.config as string) : (job.config as Record<string, unknown>);
        }
    } catch {
        resolvedConfig = (job.config as Record<string, unknown>) || {};
    }

    // Also check inside result.config
    try {
        const resConfig = extJob.result?.config;
        if (resConfig) {
            const parsedResConfig = typeof resConfig === 'string' ? JSON.parse(resConfig) : (resConfig as Record<string, unknown>);
            resolvedConfig = { ...parsedResConfig, ...resolvedConfig };
        }
    } catch {}

    const configActorId = String(resolvedConfig.actorId || extJob.actorId || extJob.result?.actorId || '');
    const configPlugin = job.plugin ? job.plugin.charAt(0).toUpperCase() + job.plugin.slice(1) : '';
    const configModel = String(resolvedConfig.model || extJob.model || '');
    const configModelWithFallback = String(resolvedConfig.model || extJob.model || (configActorId ? 'Apify Scraper Engine' : 'Default Model'));
    const configItemKey = String(resolvedConfig.itemKey || extJob.itemKey || '');
    const hasItemKey = configItemKey !== '' && configItemKey !== 'N/A';
    const configPrompt = String(resolvedConfig.prompt || extJob.prompt || extJob.result?.prompt || '');

    // Inside parameters grid columns count (always has Model Configuration, optionally has Item Key Mapping)
    const metadataColsCount = hasItemKey ? 2 : 1;

    // Extract other miscellaneous keys for task runtime display
    const otherParams = Object.entries(resolvedConfig).filter(
        ([key]) => !['model', 'itemKey', 'prompt', 'actorId', 'useInput'].includes(key)
    );
    // Safely parse active job run inputs (both startUrls and previousResults chained workflows)
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
                    <div className="p-2 bg-indigo-50/80 border border-indigo-100/50 text-brand rounded-xl shrink-0 shadow-xs">
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
                <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-2 px-3.5 flex items-center justify-between text-[11px] font-medium text-slate-600 shadow-xs">
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

                    {/* Right-aligned Balanced Job ID Indicator with Copy Action */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Job ID</span>
                        <button
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

                {/* Unified Collapsible Technical Stack */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden transition-all duration-300">
                    
                    {/* 1. Technical Configuration Accordion */}
                    <div>
                        <button
                            onClick={() => setShowConfig(!showConfig)}
                            className="w-full px-4 py-2.5 flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-2">
                                <Settings className="size-3.5 text-slate-500 animate-spin-slow" />
                                <span className="text-[11px] font-bold text-slate-700">
                                    {configActorId ? 'Inspect Apify Scraper Run Parameters' : 'Inspect AI Run Parameters & Prompt Template'}
                                </span>
                            </div>
                            {showConfig ? (
                                <ChevronUp className="size-3.5 text-slate-400" />
                            ) : (
                                <ChevronDown className="size-3.5 text-slate-400" />
                            )}
                        </button>

                        {showConfig && (
                            <div className="p-3.5 bg-white space-y-3.5 text-xs">
                                <div className={cn(
                                    "grid gap-2 pb-2.5 border-b border-slate-100",
                                    metadataColsCount === 2 ? "grid-cols-2" : "grid-cols-1"
                                )}>
                                    <div>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Model Configuration</span>
                                        <span className="font-semibold text-slate-800 text-[10.5px] break-all">{configModelWithFallback}</span>
                                    </div>
                                    {hasItemKey && (
                                        <div>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Item Key Mapping</span>
                                            <span className="font-semibold text-slate-800 text-[10.5px]">{configItemKey}</span>
                                        </div>
                                    )}
                                </div>

                                {configPrompt && (
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase block">System Prompt Template</span>
                                        <div className="relative group rounded-lg bg-slate-950 p-2.5 pr-10 text-[10.5px] text-slate-200 overflow-x-auto max-h-[140px] overflow-y-auto leading-relaxed border border-slate-800 whitespace-pre-wrap">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigator.clipboard.writeText(configPrompt);
                                                    setCopiedPrompt(true);
                                                    setTimeout(() => setCopiedPrompt(false), 2000);
                                                }}
                                                className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-800/80 hover:bg-slate-750 text-slate-400 hover:text-slate-100 transition-all shadow-sm"
                                                title="Copy Prompt"
                                            >
                                                {copiedPrompt ? (
                                                    <Check className="size-3.5 text-emerald-400" />
                                                ) : (
                                                    <Copy className="size-3.5" />
                                                )}
                                            </button>
                                            {configPrompt}
                                        </div>
                                    </div>
                                )}

                                {configActorId && !configPrompt && (
                                    <div className="space-y-2">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Apify Actor Integration</span>
                                        <div className="bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-100/70 rounded-xl p-3 flex items-start gap-2.5 shadow-xs">
                                            <div className="p-1.5 bg-amber-500 text-white rounded-lg shadow-sm shrink-0">
                                                <Cpu className="size-3.5 animate-pulse" />
                                            </div>
                                            <div className="space-y-0.5 min-w-0">
                                                <span className="text-[9px] font-bold text-amber-700 tracking-wide uppercase block">Data Scraper Provider</span>
                                                <span className="font-bold text-slate-800 text-[11px] block truncate">{configActorId}</span>
                                                <p className="text-[9.5px] text-slate-500 leading-normal">
                                                    This task executed an external Apify automation cloud actor to extract structural post media and engagement statistics directly from social targets.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {otherParams.length > 0 && (
                                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Task Runtime Parameters</span>
                                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 bg-slate-50/50 rounded-xl p-2.5 border border-slate-100">
                                            {otherParams.map(([key, val]) => (
                                                <div key={key} className="flex justify-between items-center py-0.5 min-w-0 text-[9.5px]">
                                                    <span className="text-slate-500 font-medium truncate mr-2 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                                    <span className="font-bold text-slate-700 shrink-0 bg-white border border-slate-100 px-1.5 py-0.5 rounded-md shadow-xs">
                                                        {typeof val === 'boolean' ? (val ? 'True' : 'False') : String(val)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 2. Tool Run Inputs Accordion */}
                    <div>
                        <button
                            onClick={() => setShowInput(!showInput)}
                            className="w-full px-4 py-2.5 flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-2">
                                <List className="size-3.5 text-slate-500" />
                                <span className="text-[11px] font-bold text-slate-700">Inspect Tool Run Inputs</span>
                            </div>
							{showInput ? (
                                <ChevronUp className="size-3.5 text-slate-400" />
                            ) : (
                                <ChevronDown className="size-3.5 text-slate-400" />
                            )}
                        </button>

                        {showInput && (
                            <div className="p-3.5 bg-white space-y-3.5 text-xs">
                                {/* Chained Workflow Reference Block */}
                                {hasPreviousResults && previousResults && (
                                    <div className="space-y-1.5">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Chained Workflow Reference</span>
                                        <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/30 border border-blue-100 rounded-xl p-3 space-y-2 shadow-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1 bg-blue-500 text-white rounded-md shrink-0">
                                                    <Repeat className="size-3" />
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="text-[9px] font-bold text-blue-700 uppercase tracking-wide block leading-none">Workflow Input Source</span>
                                                    <span className="text-[10.5px] font-semibold text-slate-800 break-all block">{previousResults.actorId || 'Chained Job Result'}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-100/50 text-[9px]">
                                                <div>
                                                    <span className="text-slate-400 font-bold uppercase block mb-0.5">Reference Result ID</span>
                                                    <span className="font-semibold text-slate-750 break-all bg-white border border-slate-100 px-1 py-0.5 rounded-md shadow-xs block">{previousResults.resultId || 'N/A'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 font-bold uppercase block mb-0.5">Reference Run ID</span>
                                                    <span className="font-semibold text-slate-750 break-all bg-white border border-slate-100 px-1 py-0.5 rounded-md shadow-xs block">{previousResults.runId || 'N/A'}</span>
                                                </div>
                                                <div className="col-span-2 pt-0.5">
                                                    <div className="flex justify-between items-center bg-white border border-slate-100 px-2 py-1 rounded-md shadow-xs">
                                                        <span className="text-slate-500 font-medium">Chained Items Count</span>
                                                        <span className="font-bold text-blue-700">{previousResults.itemCount ?? previousResults.items?.length ?? 0} Items</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Target URLs List */}
                                {hasTargetUrls && (
                                    <div className="space-y-1.5">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase block">
                                            {hasPreviousResults ? 'Chained Target URLs' : 'Start Target URLs'}
                                        </span>
                                        <div className="space-y-1 max-h-[180px] overflow-y-auto pr-1">
                                            {resolvedTargetUrls.map((rawUrl, idx) => {
                                                let decodedUrl = rawUrl;
                                                try {
                                                    decodedUrl = decodeURIComponent(rawUrl);
                                                } catch {}
                                                
                                                return (
                                                    <div 
                                                        key={idx} 
                                                        className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-lg transition-all min-w-0"
                                                    >
                                                        <ExternalLink className="size-3 text-brand shrink-0" />
                                                        <a 
                                                            href={rawUrl} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="text-[10px] font-semibold text-slate-700 hover:text-brand hover:underline truncate leading-normal"
                                                        >
                                                            {decodedUrl}
                                                        </a>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Other Input keys */}
                                {otherInputParams.length > 0 && (
                                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Input Configuration Parameters</span>
                                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 bg-slate-50/50 rounded-xl p-2.5 border border-slate-100">
                                            {otherInputParams.map(([key, val]) => (
                                                <div key={key} className="flex justify-between items-center py-0.5 min-w-0 text-[9.5px]">
                                                    <span className="text-slate-500 font-medium truncate mr-2 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                                    <span className="font-bold text-slate-700 shrink-0 bg-white border border-slate-150 px-1.5 py-0.5 rounded-md shadow-xs">
                                                        {typeof val === 'boolean' ? (val ? 'True' : 'False') : String(val)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {!hasInputParams ? (
                                    <p className="text-slate-400 text-center py-2 text-[10px]">No input parameters configured for this job.</p>
                                ) : null}
                            </div>
                        )}
                    </div>
                </div>

                {/* Error */}
                {job.error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle className="size-5 text-red-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-red-800">Job Failed</p>
                            <p className="text-xs text-red-600 leading-relaxed">
                                {typeof job.error === 'string' ? job.error : JSON.stringify(job.error)}
                            </p>
                        </div>
                    </div>
                )}

                {/* Result Items */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <List className="size-4 text-brand" /> Processed Items ({getItemCount(job)})
                        </h3>
                        {hasPoliticians && (
                            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 shadow-inner">
                                <button
                                    onClick={() => setViewMode('flat')}
                                    className={cn("flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold transition-all duration-200",
                                        viewMode === 'flat' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800")}
                                >
                                    <List className="size-3.5" /> Flat List
                                </button>
                                <button
                                    onClick={() => setViewMode('group')}
                                    className={cn("flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold transition-all duration-200",
                                        viewMode === 'group' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800")}
                                >
                                    <Users className="size-3.5" /> Group By Politician
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        {items.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
                                <div className="size-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                    <List className="size-6 text-slate-300" />
                                </div>
                                <p className="text-sm text-slate-500">No result items found for this job.</p>
                            </div>
                        ) : viewMode === 'group' ? (
                            uniquePoliticians.map((politician, index) => {
                                const politicianComments: Array<{
                                    authorName?: string;
                                    text: string;
                                    postUrl?: string;
                                    postPage?: string;
                                    profilePic?: string;
                                }> = [];

                                items.forEach(item => {
                                    const typedItem = item as unknown as ScrapedJobItem;
                                    const comments = Array.isArray(typedItem.comments) ? typedItem.comments : [];
                                    const pageProfilePic = typedItem.user?.profilePic || "";
                                    comments.forEach((comment: ScrapedComment) => {
                                        if (comment.mentions?.some((m: string) => m.toLowerCase().includes(politician.toLowerCase()))) {
                                            politicianComments.push({
                                                authorName: comment.authorName,
                                                text: comment.text,
                                                postUrl: String(typedItem.url || typedItem.facebookUrl || ""),
                                                postPage: String(typedItem.pageName || typedItem.postId || ""),
                                                profilePic: pageProfilePic
                                            });
                                        }
                                    });
                                });

                                return (
                                    <div key={`${politician}-${index}`} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all hover:shadow-md">
                                        <div className="bg-slate-50/80 px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="size-8 rounded-full bg-brand/10 text-brand flex items-center justify-center">
                                                    <User className="size-4 animate-pulse" />
                                                </div>
                                                <div>
                                                    <span className="text-sm font-bold text-slate-800">{politician}</span>
                                                    <span className="text-[10px] text-slate-400 block font-semibold">{politicianComments.length} mentions across all scraped links</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-5 space-y-3 max-h-[300px] overflow-y-auto bg-slate-50/30">
                                            {politicianComments.length > 0 ? (
                                                politicianComments.map((comment, commentIdx) => (
                                                    <div key={commentIdx} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm space-y-2.5 transition-all hover:scale-[1.005]">
                                                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                                            <div className="flex items-center gap-2">
                                                                {comment.profilePic ? (
                                                                    <Image 
                                                                        src={comment.profilePic} 
                                                                        width={20} 
                                                                        height={20} 
                                                                        unoptimized 
                                                                        className="size-5 rounded-full object-cover border border-slate-200" 
                                                                        alt={comment.postPage || "Profile pic"} 
                                                                    />
                                                                ) : (
                                                                    <div className="size-5 rounded-full bg-brand/10 text-brand flex items-center justify-center text-[10px] font-bold">
                                                                        {comment.postPage?.charAt(0) || 'P'}
                                                                    </div>
                                                                )}
                                                                <span className="text-[10px] font-bold text-slate-500 truncate max-w-[120px]">{comment.postPage}</span>
                                                            </div>
                                                            <span className="font-bold text-brand text-[10px]">👤 {comment.authorName || "Anonymous User"}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-xs text-slate-600 leading-relaxed italic font-medium">&quot;{comment.text}&quot;</p>
                                                            {comment.postUrl && (
                                                                <a href={comment.postUrl} target="_blank" rel="noreferrer" className="text-[10px] font-semibold text-slate-400 hover:text-brand flex items-center gap-1 transition-colors shrink-0 ml-4">
                                                                    View Post <ExternalLink className="size-3" />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-slate-400 italic text-center py-4">No comments found matching this politician.</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
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

function JobResultItem({ item, idx, job }: {
    item: ToolJob['result']['items'][0];
    idx: number;
    job: ToolJob;
}) {
    const itemText = typeof item.text === 'string' ? item.text : '';
    const inputItems = (job.input?.previousResults as { items?: SourceItem[] })?.items || [];
    const sourceItem: SourceItem = inputItems.find((ii) =>
        ii.postId === item.sourceKeyValue ||
        ii.id === item.sourceKeyValue ||
        ii._id === item.sourceKeyValue ||
        ii.url === item.sourceKeyValue
    ) || {};

    const typedItem = item as unknown as ScrapedJobItem;
    const typedSource = sourceItem as unknown as ScrapedJobItem;

    const sourceText = itemText || sourceItem.text || sourceItem.message || sourceItem.caption || sourceItem.content || '';
    const analysis = (item.analysis as AnalysisResult) || {};

    // Audited fields from raw scraper JSON
    const profilePic = String(typedItem.user?.profilePic || typedSource.user?.profilePic || '');
    const likes = typeof typedItem.likes === 'number' ? typedItem.likes : typeof typedSource.likes === 'number' ? typedSource.likes : undefined;
    const shares = typeof typedItem.shares === 'number' ? typedItem.shares : typeof typedSource.shares === 'number' ? typedSource.shares : undefined;
    const viewsCount = typeof typedItem.viewsCount === 'number' ? typedItem.viewsCount : typeof typedSource.viewsCount === 'number' ? typedSource.viewsCount : undefined;
    const commentsCount = typeof typedItem.commentsCount === 'number' 
        ? typedItem.commentsCount 
        : typeof typedItem.comments === 'number'
            ? typedItem.comments
            : Array.isArray(typedItem.comments) 
                ? typedItem.comments.length 
                : typeof typedSource.commentsCount === 'number' 
                    ? typedSource.commentsCount 
                    : typeof typedSource.comments === 'number'
                        ? typedSource.comments
                        : undefined;
    const thumbnail = String(typedItem.media?.[0]?.thumbnail || typedSource.media?.[0]?.thumbnail || '');

    const displayName = String(
        (typeof item.pageName === 'string' ? item.pageName : '') ||
        sourceItem.pageName || item.postId || item.sourceKeyValue || `Item ${idx + 1}`
    );

    const postUrl = String(item.url || item.facebookUrl || sourceItem.url || '');

    const rawTime = typedItem.time || typedSource.time || item.time || sourceItem.time;
    const rawTimestamp = typedItem.timestamp || typedSource.timestamp;

    const postDateString = (() => {
        if (rawTime) {
            try {
                const parsedDate = new Date(String(rawTime));
                if (!isNaN(parsedDate.getTime())) {
                    return parsedDate.toLocaleString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                }
            } catch {
                // Ignore
            }
        }
        if (typeof rawTimestamp === 'number' && rawTimestamp > 0) {
            try {
                const ms = rawTimestamp < 99999999999 ? rawTimestamp * 1000 : rawTimestamp;
                const parsedDate = new Date(ms);
                if (!isNaN(parsedDate.getTime())) {
                    return parsedDate.toLocaleString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                }
            } catch {
                // Ignore
            }
        }
        return 'Posted recently';
    })();

    // Helper function to render hashtags beautifully in brand color
    const renderTextWithHashtags = (text: string) => {
        if (!text) return null;
        const parts = text.split(/(\s+)/);
        return parts.map((part, i) => {
            if (part.startsWith('#')) {
                return (
                    <span key={i} className="text-brand font-semibold hover:underline cursor-pointer transition-colors duration-150">
                        {part}
                    </span>
                );
            }
            return part;
        });
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 w-full">
            {/* 1. Header Area: Social Media Profile Info */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-3">
                    {profilePic ? (
                        <div className="relative size-10 rounded-full overflow-hidden border border-slate-200 shadow-sm shrink-0">
                            <Image
                                src={profilePic}
                                alt={displayName}
                                fill
                                unoptimized
                                className="object-cover"
                                onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                }}
                            />
                        </div>
                    ) : (
                        <div className="size-10 rounded-full bg-brand/10 text-brand flex items-center justify-center text-sm font-bold border border-brand/20 shrink-0">
                            {idx + 1}
                        </div>
                    )}
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-slate-900 truncate max-w-[200px] block">{displayName}</span>
                            {/* Verified checkmark badge in emerald green */}
                            <CheckCircle2 className="size-4 text-emerald-500 fill-emerald-50 shrink-0" />
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                            {postDateString}
                        </span>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {postUrl && (
                        <a href={postUrl} target="_blank" rel="noreferrer" title="Open original post"
                            className="p-2 text-slate-400 hover:text-brand hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100 shadow-sm bg-slate-50/50">
                            <ExternalLink className="size-4" />
                        </a>
                    )}
                    <button className="p-2 text-slate-400 hover:text-slate-650 hover:bg-slate-50 rounded-xl transition-all">
                        <MoreVertical className="size-4" />
                    </button>
                </div>
            </div>

            {/* Main Post Card Content & AI Analysis */}
            <div className="p-6 space-y-6">
                {/* 2. Post text / caption with tags */}
                <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line font-medium">
                    {sourceText ? (
                        renderTextWithHashtags(sourceText)
                    ) : (
                        <p className="text-slate-400 italic">No text content available.</p>
                    )}
                </div>

                {/* 3. Media Picture / Video Thumbnail */}
                {thumbnail && (
                    <div className="relative -mx-6 overflow-hidden border-y border-slate-100/80 shadow-xs h-[320px] bg-slate-50 group">
                        <Image
                            src={thumbnail}
                            alt="Post Media Content"
                            fill
                            unoptimized
                            sizes="(max-width: 768px) 100vw, 600px"
                            className="object-cover"
                            onError={(e) => {
                                (e.target as HTMLElement).parentElement!.style.display = 'none';
                            }}
                        />
                        {/* Overlay expand button inside the media image */}
                        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-xs p-2 rounded-full text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Maximize2 className="size-4" />
                        </div>
                    </div>
                )}

                {/* 4. Bottom Social Engagement Stats (Save/Bookmark removed as requested!) */}
                {(likes !== undefined || shares !== undefined || viewsCount !== undefined || commentsCount !== undefined) && (
                    <div className="flex flex-wrap items-center gap-6 pt-1 text-slate-500 font-bold text-xs border-b border-slate-100/60 pb-5">
                        {viewsCount !== undefined && (
                            <span className="flex items-center gap-1.5 transition-all hover:text-slate-700 cursor-default">
                                <Eye className="size-4 text-slate-450" /> {viewsCount.toLocaleString()}
                            </span>
                        )}
                        {likes !== undefined && (
                            <span className="flex items-center gap-1.5 transition-all hover:text-rose-600 cursor-default text-rose-500">
                                <Heart className="size-4 fill-rose-500 text-rose-500" /> {likes.toLocaleString()}
                            </span>
                        )}
                        {commentsCount !== undefined && (
                            <span className="flex items-center gap-1.5 transition-all hover:text-teal-650 cursor-default text-teal-600">
                                <MessageCircle className="size-4 text-teal-500 fill-teal-50" /> {commentsCount.toLocaleString()}
                            </span>
                        )}
                        {shares !== undefined && (
                            <span className="flex items-center gap-1.5 transition-all hover:text-indigo-650 cursor-default">
                                <Repeat className="size-4 text-indigo-400" /> {shares.toLocaleString()}
                            </span>
                        )}
                    </div>
                )}

                {/* ============================================================== */}
                {/* 5. INTEGRATED AI ANALYSIS ZONE                                 */}
                {/* ============================================================== */}
                <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-3.5 space-y-3.5">
                    {/* Unified Premium AI Digest Card */}
                    <div className="bg-gradient-to-br from-violet-50/50 via-white to-indigo-50/20 border border-violet-100/60 rounded-xl p-3.5 space-y-3 shadow-xs relative overflow-hidden">
                        {/* Decorative background aura glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-200/20 rounded-full blur-3xl pointer-events-none -mr-8 -mt-8" />
                        
                        <div className="flex items-center justify-between min-w-0 relative z-10">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-gradient-to-tr from-violet-600 to-indigo-600 text-white rounded-lg shadow-sm shrink-0">
                                    <Sparkles className="size-3.5 animate-pulse" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-[11px] font-extrabold text-slate-900 tracking-tight block">AI Summary</h4>
                                    <span className="text-[9px] text-slate-400 font-medium block leading-none">Smart digest generated by AI Engine</span>
                                </div>
                            </div>
                            
                            {/* Elegant Violet pill badge */}
                            <div className="shrink-0 bg-violet-50 text-violet-700 font-bold px-2 py-0.5 rounded-full text-[8.5px] uppercase tracking-wider border border-violet-100/50">
                                AI Powered
                            </div>
                        </div>

                        {/* Content text */}
                        <div className="text-[11px] text-slate-700 leading-relaxed font-medium relative z-10 pt-0.5">
                            {analysis.summary || 'No summary available.'}
                        </div>
                    </div>

                    {/* Sentiment and visualizers stacked beautifully */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100/60 pb-2">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sentiment Analysis</span>
                            {(() => {
                                const s = String(analysis.sentiment || '').toLowerCase();
                                if (s === 'positive') {
                                    return (
                                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500 text-white border border-emerald-400 rounded-full text-[9.5px] font-extrabold uppercase shadow-xs shadow-emerald-500/20 select-none">
                                            <Smile className="size-3 text-white animate-bounce-slow" />
                                            <span>Positive</span>
                                        </div>
                                    );
                                }
                                if (s === 'negative') {
                                    return (
                                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-rose-500 text-white border border-rose-450 rounded-full text-[9.5px] font-extrabold uppercase shadow-xs shadow-rose-500/20 select-none">
                                            <Frown className="size-3 text-white animate-bounce-slow" />
                                            <span>Negative</span>
                                        </div>
                                    );
                                }
                                return (
                                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-600 text-white border border-slate-500 rounded-full text-[9.5px] font-extrabold uppercase shadow-xs shadow-slate-600/10 select-none">
                                        <Meh className="size-3 text-white" />
                                        <span>{analysis.sentiment || 'Neutral'}</span>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Keywords Hashdeck */}
                        <div className="flex flex-wrap gap-1 pb-1">
                            {Array.isArray(analysis.keywords) && analysis.keywords.length > 0
                                ? analysis.keywords.map((kw: string, i: number) => (
                                    <span key={i} className="px-1.5 py-0.5 bg-white border border-slate-200 text-slate-500 rounded-md text-[9px] font-semibold hover:border-brand/30 hover:text-brand transition-colors cursor-default shadow-xs">#{kw}</span>
                                ))
                                : <span className="text-[9px] text-slate-400 italic">No keywords available</span>}
                        </div>

                        {/* Visualizers Stack */}
                        {analysis.intentRatios && (
                            <div className="pt-4 border-t border-slate-100">
                                <RatioVisualizer intentRatios={analysis.intentRatios} />
                            </div>
                        )}

                        {analysis.postType && (
                            <div className="pt-4 border-t border-slate-100">
                                <MultiLabelVisualizer postType={analysis.postType} commentThemes={analysis.commentThemes} />
                            </div>
                        )}

                        {analysis.politicians && (
                            <div className="pt-4 border-t border-slate-100">
                                <AccordionVisualizer politicians={analysis.politicians} comments={Array.isArray(typedItem.comments) ? typedItem.comments : []} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
