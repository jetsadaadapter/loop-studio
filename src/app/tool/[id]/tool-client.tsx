"use client";

import { useState } from "react";
import {
    Tool,
    ToolJob,
    GetToolJobsResponse
} from "@/core/interfaces/tools.interface";
import { runTool, getToolJobs, getToolJob } from "@/core/services/tools.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Play,
    Loader2,
    History,
    Circle,
    ChevronRight,
    Plus,
    Trash2,
    FileText,
    List,
    CheckCircle2,
    Clock,
    ExternalLink,
    AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useDialogToast } from "@/components/ui/alert-dialog-toast";
import { Textarea } from "@/components/ui/textarea";

import { AppCover } from "@/components/app-cover";
import Link from "next/link";
import { createToolExecutionSchema } from "@/core/validators/tools.validator";
import {
    Field,
    FieldLabel,
    FieldDescription,
    FieldError
} from "@/components/ui/field";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { LibraryFooter } from "@/components/library-footer";

interface ToolClientProps {
    tool: Tool;
    initialJobs: GetToolJobsResponse;
}

type JobStatus = string;

interface AnalysisResult {
    sentiment?: string;
    summary?: string;
    keywords?: string[];
}

interface SourceItem {
    postId?: string;
    id?: string;
    _id?: string;
    pageName?: string;
    url?: string;
    text?: string;
    message?: string;
    caption?: string;
    content?: string;
    [key: string]: unknown;
}

const getJobStatus = (job: ToolJob) => {
    if (job.status) return job.status;
    if (job.error) return 'failed';
    if (job.state) return job.state.toLowerCase() as JobStatus;
    if (job.processed) return 'completed';
    return 'running';
};

const getItemCount = (job: ToolJob) => {
    // 1. Priority: Use explicit itemCount from results
    if (job.result?.itemCount && job.result.itemCount > 0) return job.result.itemCount;

    // 2. Secondary: Count actual result items array
    if (Array.isArray(job.result?.items) && job.result.items.length > 0) return job.result.items.length;

    // 3. Fallback: Extract from input (common in list view)
    const input = job.input || {};
    if (Array.isArray(input.startUrls)) return input.startUrls.length;
    if (Array.isArray(input.items)) return input.items.length;

    // 4. Fallback for chained jobs (check for previousResults)
    const prevResults = input.previousResults as { itemCount?: number; items?: unknown[] } | undefined;
    if (prevResults) {
        if (typeof prevResults.itemCount === 'number' && prevResults.itemCount > 0) return prevResults.itemCount;
        if (Array.isArray(prevResults.items)) return prevResults.items.length;
    }

    return 0;
};

function UrlArrayInput({
    id,
    value,
    onChange,
    placeholder,
    hasError
}: {
    id: string;
    value: string[];
    onChange: (val: string[]) => void;
    placeholder?: string | null;
    hasError?: boolean;
}) {
    const [isBulk, setIsBulk] = useState(false);
    const [bulkValue, setBulkValue] = useState(value.join('\n'));

    const handleAdd = () => onChange([...value, ""]);
    const handleRemove = (index: number) => onChange(value.filter((_, i) => i !== index));
    const handleItemChange = (index: number, val: string) => {
        const next = [...value];
        next[index] = val;
        onChange(next);
    };

    const handleBulkSave = () => {
        const next = bulkValue
            .split(/[\n,]/)
            .map(s => s.trim())
            .filter(Boolean);
        onChange(next);
        setIsBulk(false);
    };

    const handleBulkCancel = () => {
        setBulkValue(value.join('\n'));
        setIsBulk(false);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                    {value.length} items added
                </p>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[10px] text-slate-500 hover:text-brand"
                    onClick={() => {
                        if (isBulk) {
                            handleBulkCancel();
                        } else {
                            setBulkValue(value.join('\n'));
                            setIsBulk(true);
                        }
                    }}
                >
                    {isBulk ? (
                        <><List className="mr-1 size-3" /> List View</>
                    ) : (
                        <><FileText className="mr-1 size-3" /> Bulk Edit</>
                    )}
                </Button>
            </div>

            {isBulk ? (
                <div className="space-y-3">
                    <Textarea
                        value={bulkValue}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBulkValue(e.target.value)}
                        placeholder="Paste your URLs here (one per line or comma-separated)..."
                        className={cn(
                            "min-h-40 bg-slate-50 border-slate-200 focus:bg-white transition-all text-xs font-mono",
                            hasError && "border-red-500 bg-red-50/30"
                        )}
                    />
                    <div className="flex gap-2">
                        <Button size="sm" className="h-8 bg-brand text-white text-xs px-4" onClick={handleBulkSave}>
                            Apply Bulk Changes
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs px-4" onClick={handleBulkCancel}>
                            Cancel
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    {value.map((item, index) => (
                        <div key={`url-input-${id}-${index}`} className="flex gap-2">
                            <Input
                                value={item}
                                onChange={(e) => handleItemChange(index, e.target.value)}
                                placeholder={placeholder || "https://..."}
                                className={cn(
                                    "h-9 bg-slate-50 border-slate-200 focus:bg-white transition-all text-xs",
                                    hasError && "border-red-500 bg-red-50/30"
                                )}
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-9 shrink-0 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100"
                                onClick={() => handleRemove(index)}
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        </div>
                    ))}
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-9 border-dashed border-slate-200 text-slate-500 hover:text-brand hover:border-brand hover:bg-brand/5"
                        onClick={handleAdd}
                    >
                        <Plus className="mr-1 size-4" /> Add Another URL
                    </Button>
                </div>
            )}
        </div>
    );
}

export function ToolClient({ tool, initialJobs }: ToolClientProps) {
    const [jobs, setJobs] = useState<ToolJob[]>(initialJobs.data);
    const [isRunning, setIsRunning] = useState(false);
    const [formData, setFormData] = useState<Record<string, unknown>>(() => {
        const initialData: Record<string, unknown> = {};
        tool.params.forEach(param => {
            if (param.defaultValue !== null) {
                if (param.type === 'boolean') {
                    initialData[param.key] = param.defaultValue === 'true';
                } else {
                    initialData[param.key] = param.defaultValue;
                }
            }
        });
        return initialData;
    });
    const [selectedJob, setSelectedJob] = useState<ToolJob | null>(null);
    const [isJobModalOpen, setIsJobModalOpen] = useState(false);
    const [isJobLoading, setIsJobLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<JobStatus>('all');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const { pushDialogToast } = useDialogToast();

    const handleRun = async () => {
        // Validation
        const schema = createToolExecutionSchema(tool.params);
        const result = schema.safeParse(formData);

        if (!result.success) {
            const newErrors: Record<string, string> = {};
            result.error.issues.forEach(issue => {
                const path = issue.path[0] as string;
                newErrors[path] = issue.message;
            });
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setIsRunning(true);
        try {
            await runTool(tool.id, formData);
            pushDialogToast("Job started successfully!", "success");

            const fetchJobs = async () => {
                try {
                    const response = await getToolJobs(tool.id);
                    console.log("[ToolClient] Fetched jobs list:", response.data);
                    setJobs(response.data);
                } catch (error) {
                    console.error(error);
                }
            };
            fetchJobs();
        } catch (error) {
            console.error(error);
            pushDialogToast("Failed to start job.", "error");
        } finally {
            setIsRunning(false);
        }
    };

    const handleViewJob = async (jobId: string) => {
        console.log(`[ToolClient] handleViewJob: Fetching details for Job ID: ${jobId}`);
        setIsJobModalOpen(true);
        setIsJobLoading(true);
        setSelectedJob(null);
        try {
            const job = await getToolJob(tool.id, jobId);
            console.log(`[ToolClient] handleViewJob: Successfully fetched job:`, job);
            setSelectedJob(job);
            // Merge fetched detail (including result.itemCount) back into jobs list
            setJobs(prev => prev.map(j => j.jobId === jobId ? { ...j, result: job.result } : j));
        } catch (error) {
            console.error(`[ToolClient] handleViewJob: Error fetching job details:`, error);
            pushDialogToast("Failed to fetch job details.", "error");
            setIsJobModalOpen(false);
        } finally {
            setIsJobLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col">
            <div className="mx-auto w-full max-w-6xl px-4 pb-6 sm:px-6 flex-1">
                <div className="mb-6">
                    <AppCover
                        src={null} // Tools don't have images yet
                        alt={`${tool.name} cover`}
                        accentColor="#0ea5e9"
                    >
                        <div className="pt-5 sm:pt-8">
                            <Link
                                href="/apps"
                                className="inline-flex items-center gap-1.5 rounded-full bg-black/50 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-black/70"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                                    <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
                                </svg>
                                Back to Library
                            </Link>
                        </div>

                        <div className="relative z-10 flex min-h-48 flex-col justify-end py-5 pt-10 text-white sm:min-h-64 sm:py-8 sm:pt-16 lg:min-h-80 lg:py-10 lg:pt-20">
                            <div className="max-w-3xl">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-slate-300 ring-1 ring-white/10">
                                        AI Tool
                                    </span>
                                </div>
                                <h1 className="page-hero-title text-white">
                                    {tool.name}
                                </h1>
                                <p className="mt-4 text-lg text-slate-300 max-w-2xl leading-relaxed">
                                    {tool.description || "Configure and run this automated tool to analyze your data."}
                                </p>
                            </div>
                        </div>
                    </AppCover>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Form Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Play className="size-5 text-brand" />
                                    Run Configuration
                                </CardTitle>
                                <CardDescription>Configure the parameters for this run.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {tool.params.map(param => (
                                    <Field key={param.id}>
                                        <FieldLabel htmlFor={param.key} className="cursor-pointer">
                                            {param.label}
                                            {param.required && <span className="text-destructive ml-1">*</span>}
                                        </FieldLabel>

                                        {param.type === 'boolean' ? (
                                            <div className="flex items-center py-1">
                                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                                    <Checkbox
                                                        id={param.key}
                                                        checked={!!formData[param.key]}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                            const checked = e.target.checked;
                                                            setFormData({ ...formData, [param.key]: !!checked });
                                                            if (errors[param.key]) {
                                                                const next = { ...errors };
                                                                delete next[param.key];
                                                                setErrors(next);
                                                            }
                                                        }}
                                                    />
                                                    <span className="text-sm text-slate-600">
                                                        Enabled
                                                    </span>
                                                </label>
                                            </div>
                                        ) : param.type === 'select' ? (
                                            <Select
                                                value={String(formData[param.key] || "")}
                                                onValueChange={(val) => {
                                                    setFormData({ ...formData, [param.key]: val });
                                                    if (errors[param.key]) {
                                                        const next = { ...errors };
                                                        delete next[param.key];
                                                        setErrors(next);
                                                    }
                                                }}
                                            >
                                                <SelectTrigger id={param.key} className={cn(
                                                    "bg-slate-50 border-slate-200 focus:bg-white transition-all",
                                                    errors[param.key] && "border-destructive bg-destructive/5"
                                                )}>
                                                    <SelectValue placeholder={param.placeholder || "Select an option..."} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {param.options?.map((option, idx) => (
                                                        <SelectItem key={`${option}-${idx}`} value={option}>
                                                            {option}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : param.transform === 'urlArray' ? (
                                            <UrlArrayInput
                                                id={param.key}
                                                value={(formData[param.key] as string[]) || []}
                                                onChange={(val) => {
                                                    setFormData({ ...formData, [param.key]: val });
                                                    if (errors[param.key]) {
                                                        const next = { ...errors };
                                                        delete next[param.key];
                                                        setErrors(next);
                                                    }
                                                }}
                                                placeholder={param.placeholder}
                                                hasError={!!errors[param.key]}
                                            />
                                        ) : (
                                            <Input
                                                id={param.key}
                                                placeholder={param.placeholder || `Enter ${param.label.toLowerCase()}...`}
                                                value={String(formData[param.key] || "")}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, [param.key]: e.target.value });
                                                    if (errors[param.key]) {
                                                        const next = { ...errors };
                                                        delete next[param.key];
                                                        setErrors(next);
                                                    }
                                                }}
                                                className={cn(
                                                    "bg-slate-50 border-slate-200 focus:bg-white transition-all",
                                                    errors[param.key] && "border-destructive bg-destructive/5"
                                                )}
                                            />
                                        )}

                                        {param.placeholder && param.type !== 'select' && param.transform !== 'urlArray' && (
                                            <FieldDescription>{param.placeholder}</FieldDescription>
                                        )}

                                        <FieldError errors={errors[param.key] ? [{ message: errors[param.key] }] : []} />
                                    </Field>
                                ))}

                                <div className="pt-4">
                                    <Button
                                        className="w-full sm:w-auto min-w-40 bg-brand hover:bg-brand/90 text-white font-semibold rounded-xl py-6"
                                        onClick={handleRun}
                                        disabled={isRunning}
                                    >
                                        {isRunning ? (
                                            <>
                                                <Loader2 className="mr-2 size-5 animate-spin" />
                                                Running...
                                            </>
                                        ) : (
                                            <>
                                                <Play className="mr-2 size-5 fill-current" />
                                                Start Job
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                    </div>

                    {/* History Section */}
                    <div className="space-y-6">
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="pb-3 space-y-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <History className="size-5 text-slate-400" />
                                    Job History
                                </CardTitle>

                                {/* Tabs — derived from actual job states in the list */}
                                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                                    {['all', ...Array.from(new Set(jobs.map(j => getJobStatus(j))))].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={cn(
                                                "flex-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                                                activeTab === tab
                                                    ? "bg-white text-slate-900 shadow-sm"
                                                    : "text-slate-500 hover:text-slate-700"
                                            )}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                            </CardHeader>
                            <CardContent className="px-0">
                                <div className="divide-y divide-slate-100">
                                    {jobs.filter(job => activeTab === 'all' || getJobStatus(job) === activeTab).length === 0 ? (
                                        <div className="py-10 text-center space-y-2">
                                            <Clock className="size-8 text-slate-200 mx-auto" />
                                            <p className="text-xs text-slate-400">No {activeTab !== 'all' ? activeTab : ''} jobs found.</p>
                                        </div>
                                    ) : (
                                        jobs
                                            .filter(job => activeTab === 'all' || getJobStatus(job) === activeTab)
                                            .map(job => (
                                                <button
                                                    key={job.jobId}
                                                    onClick={() => handleViewJob(job.jobId)}
                                                    className={cn(
                                                        "w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group",
                                                        selectedJob?.jobId === job.jobId && "bg-brand/5 border-l-4 border-l-brand"
                                                    )}
                                                >
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-xs font-bold text-slate-900 truncate">
                                                                {job.jobId.split('-')[0]}...
                                                            </p>
                                                            <span className="text-[10px] text-slate-400">
                                                                {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <div className="flex items-center gap-1">
                                                                <Circle className={cn(
                                                                    "size-2 fill-current",
                                                                    getJobStatus(job) === 'completed' ? "text-teal-400" :
                                                                        getJobStatus(job) === 'running' ? "text-amber-400 animate-pulse" :
                                                                            getJobStatus(job) === 'failed' ? "text-red-400" : "text-slate-300"
                                                                )} />
                                                                <span className="text-[10px] font-bold text-slate-500 uppercase">
                                                                    {getJobStatus(job)}
                                                                </span>
                                                            </div>
                                                            <span className="text-[10px] text-slate-400">•</span>
                                                            <span className="text-[10px] text-slate-400 font-medium">{getItemCount(job)} items</span>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="size-4 text-slate-300 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
                                                </button>
                                            ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
            {/* Modal for Job Detail */}
            <Dialog open={isJobModalOpen} onOpenChange={setIsJobModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-none bg-slate-50">
                    {isJobLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <Loader2 className="size-10 text-brand animate-spin" />
                            <p className="text-sm text-slate-500 font-medium">Loading job details...</p>
                        </div>
                    ) : selectedJob ? (
                        <>
                            <DialogHeader className="p-6 bg-slate-900 text-white shrink-0">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                            <FileText className="size-5" />
                                            Job Result Detail
                                        </DialogTitle>
                                        <DialogDescription className="text-slate-400 font-mono text-xs">
                                            ID: {selectedJob.jobId}
                                        </DialogDescription>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "font-bold px-3 py-1",
                                            getJobStatus(selectedJob) === 'completed' ? "bg-teal-500/20 text-teal-400 border-teal-500/30" :
                                                getJobStatus(selectedJob) === 'running' ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                                                    "bg-red-500/20 text-red-400 border-red-500/30"
                                        )}
                                    >
                                        {getJobStatus(selectedJob) === 'completed' && <CheckCircle2 className="size-3 mr-1" />}
                                        {getJobStatus(selectedJob) === 'running' && <Loader2 className="size-3 mr-1 animate-spin" />}
                                        {(getJobStatus(selectedJob)).toUpperCase()}
                                    </Badge>
                                </div>
                            </DialogHeader>
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Configuration Summary */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Model Configuration</span>
                                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                            <div className="size-2 rounded-full bg-brand" />
                                            {String(selectedJob.config?.model || 'Default Model')}
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Processed Time</span>
                                        <div className="text-sm font-semibold text-slate-700">
                                            {selectedJob.createdAt ? new Date(selectedJob.createdAt).toLocaleString() : 'N/A'}
                                        </div>
                                    </div>
                                </div>

                                {/* Error Display */}
                                {selectedJob.error && (
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                                        <AlertCircle className="size-5 text-red-500 shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-red-800">Job Failed</p>
                                            <p className="text-xs text-red-600 leading-relaxed">
                                                {typeof selectedJob.error === 'string'
                                                    ? selectedJob.error
                                                    : JSON.stringify(selectedJob.error)}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Result Items */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <List className="size-4 text-brand" />
                                        Processed Items ({getItemCount(selectedJob)})
                                    </h3>

                                    <div className="space-y-4">
                                        {(selectedJob.result?.items || []).length === 0 ? (
                                            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
                                                <div className="size-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                                    <List className="size-6 text-slate-300" />
                                                </div>
                                                <p className="text-sm text-slate-500">No result items found for this job.</p>
                                            </div>
                                        ) : (
                                            selectedJob.result?.items.map((item, idx) => {
                                                // 1. Read text directly from result item
                                                const itemText = typeof item.text === 'string' ? item.text : '';

                                                // 2. Fallback: find matching source from previousResults
                                                const inputItems = (selectedJob.input?.previousResults as { items?: SourceItem[] })?.items || [];
                                                const sourceItem: SourceItem = inputItems.find((ii) =>
                                                    ii.postId === item.sourceKeyValue ||
                                                    ii.id === item.sourceKeyValue ||
                                                    ii._id === item.sourceKeyValue ||
                                                    ii.url === item.sourceKeyValue
                                                ) || {};

                                                const sourceText =
                                                    itemText ||
                                                    sourceItem.text ||
                                                    sourceItem.message ||
                                                    sourceItem.caption ||
                                                    sourceItem.content ||
                                                    '';
                                                const analysis = (item.analysis as AnalysisResult) || {};

                                                return (
                                                    <div key={`modal-item-${idx}`} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                                        <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="size-8 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs font-bold border border-brand/20">
                                                                    {idx + 1}
                                                                </div>
                                                                <div>
                                                                    <span className="text-xs font-bold text-slate-900 truncate max-w-[200px] block">
                                                                        {String(
                                                                            (typeof item.pageName === 'string' ? item.pageName : '') ||
                                                                            sourceItem.pageName ||
                                                                            item.postId ||
                                                                            item.sourceKeyValue ||
                                                                            `Item ${idx + 1}`
                                                                        )}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-400">ID: {String(item.postId || item.sourceKeyValue || '—')}</span>
                                                                </div>
                                                            </div>
                                                            {sourceItem.url && (
                                                                <a
                                                                    href={sourceItem.url}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="p-1.5 text-slate-400 hover:text-brand hover:bg-white rounded-md transition-all border border-transparent hover:border-slate-100"
                                                                >
                                                                    <ExternalLink className="size-4" />
                                                                </a>
                                                            )}
                                                        </div>
                                                        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
                                                            {/* Source Content */}
                                                            <div className="lg:col-span-5 space-y-3">
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Source Content</span>
                                                                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                                                    {sourceText ? (
                                                                        <p className="text-xs text-slate-600 line-clamp-6 leading-relaxed italic">
                                                                            &quot;{sourceText}&quot;
                                                                        </p>
                                                                    ) : (
                                                                        <p className="text-xs text-slate-400 italic">No source content available.</p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Analysis Result */}
                                                            <div className="lg:col-span-7 space-y-4">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Analysis</span>
                                                                    <div className={cn(
                                                                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                                        analysis.sentiment === 'positive' ? "bg-teal-100 text-teal-700" :
                                                                            analysis.sentiment === 'negative' ? "bg-red-100 text-red-700" :
                                                                                "bg-slate-100 text-slate-700"
                                                                    )}>
                                                                        {analysis.sentiment || 'Neutral'}
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-3">
                                                                    <div className="bg-brand/5 border border-brand/10 p-3 rounded-xl">
                                                                        <p className="text-[11px] text-slate-800 leading-relaxed font-medium">
                                                                            {analysis.summary || 'No summary available.'}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {Array.isArray(analysis.keywords) && analysis.keywords.length > 0 ? (
                                                                            analysis.keywords.map((kw: string, i: number) => (
                                                                                <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 text-slate-500 rounded-md text-[10px] font-semibold hover:border-brand/30 hover:text-brand transition-colors">
                                                                                    #{kw}
                                                                                </span>
                                                                            ))
                                                                        ) : (
                                                                            <span className="text-[10px] text-slate-400 italic">No keywords</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <p className="text-sm text-slate-500">No job data available.</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            <LibraryFooter />
        </div>
    );
}
