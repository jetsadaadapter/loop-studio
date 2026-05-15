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
    ExternalLink
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

interface ToolClientProps {
    tool: Tool;
    initialJobs: GetToolJobsResponse;
}

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

            // Refresh jobs list
            const updatedJobs = await getToolJobs(tool.id);
            setJobs(updatedJobs.data);
        } catch (error) {
            console.error(error);
            pushDialogToast("Failed to start job.", "error");
        } finally {
            setIsRunning(false);
        }
    };

    const handleViewJob = async (jobId: string) => {
        try {
            const job = await getToolJob(tool.id, jobId);
            setSelectedJob(job);
        } catch (error) {
            console.error(error);
            pushDialogToast("Failed to fetch job details.", "error");
        }
    };

    return (
        <div className="mx-auto max-w-6xl px-4 pb-8 sm:px-6 lg:pb-10">
            <div className="mb-8">
                <AppCover
                    src={null} // Tools don't have images yet
                    alt={`${tool.name} cover`}
                    accentColor="#0ea5e9"
                >
                    <div className="absolute left-5 top-5 z-20 sm:left-8 sm:top-8">
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

                    <div className="relative z-10 flex min-h-64 flex-col justify-end p-5 pt-20 text-white sm:min-h-80 sm:p-8 sm:pt-24 lg:min-h-96 lg:p-10 lg:pt-28">
                        <div className="max-w-3xl">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-slate-300 ring-1 ring-white/10">
                                    AI Tool
                                </span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                                {tool.name}
                            </h1>
                            <p className="mt-4 text-lg text-slate-300 max-w-2xl leading-relaxed">
                                {tool.description || "Configure and run this automated tool to analyze your data."}
                            </p>
                        </div>
                    </div>
                </AppCover>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

                    {/* Result View */}
                    {selectedJob && (
                        <Card className="shadow-md border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                            <CardHeader className="bg-slate-900 text-white border-b-0">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg">Job Result</CardTitle>
                                        <CardDescription className="text-slate-400">ID: {selectedJob.jobId}</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-teal-500/20 text-teal-400 rounded-full border border-teal-500/30 text-xs font-bold">
                                        <CheckCircle2 className="size-4" />
                                        COMPLETED
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-100">
                                    {selectedJob.result.items.map((item, idx) => (
                                        <div key={`item-${item.id || item.sourceKey || idx}`} className="p-6 space-y-4 hover:bg-slate-50/50 transition-colors">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                                                        {String(item.pageName || item.sourceKeyValue || `Item ${idx + 1}`)}
                                                    </h4>
                                                    <p className="text-xs text-slate-500 mt-1">{String(item.facebookUrl || item.url || "")}</p>
                                                </div>
                                                {!!(item.url) && (
                                                    <a href={String(item.url)} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-brand transition-colors rounded-lg hover:bg-white shadow-xs border border-transparent hover:border-slate-200">
                                                        <ExternalLink className="size-4" />
                                                    </a>
                                                )}
                                            </div>

                                            {item.analysis && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
                                                    <div className="space-y-3">
                                                        <div>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sentiment</span>
                                                            <div className={cn(
                                                                "mt-1 px-2.5 py-1 rounded-full text-xs font-bold inline-block",
                                                                (item.analysis as Record<string, unknown> | undefined)?.sentiment === 'positive' ? "bg-teal-50 text-teal-600 border border-teal-100" :
                                                                    (item.analysis as Record<string, unknown> | undefined)?.sentiment === 'negative' ? "bg-red-50 text-red-600 border border-red-100" :
                                                                        "bg-slate-50 text-slate-600 border border-slate-100"
                                                            )}>
                                                                {String((item.analysis as Record<string, unknown> | undefined)?.sentiment || 'unknown').toUpperCase()}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Summary</span>
                                                            <p className="mt-1 text-xs text-slate-700 leading-relaxed italic line-clamp-4">
                                                                &quot;{String((item.analysis as Record<string, unknown> | undefined)?.summary || '')}&quot;
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Keywords</span>
                                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                                {Array.isArray((item.analysis as Record<string, unknown> | undefined)?.keywords) &&
                                                                    ((item.analysis as Record<string, unknown> | undefined)?.keywords as string[]).map((kw, i) => (
                                                                        <span key={`kw-${kw}-${i}`} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium border border-slate-200">
                                                                            {kw}
                                                                        </span>
                                                                    ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {!!(item.text) && (
                                                <div className="bg-slate-50 rounded-lg p-3">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Extracted Text</span>
                                                    <p className="mt-1 text-[11px] text-slate-600 line-clamp-3 leading-relaxed">
                                                        {typeof item.text === 'string' ? item.text : JSON.stringify(item.text)}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* History Section */}
                <div className="space-y-6">
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <History className="size-5 text-slate-400" />
                                Job History
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-0">
                            <div className="divide-y divide-slate-100">
                                {jobs.length === 0 ? (
                                    <div className="py-10 text-center space-y-2">
                                        <Clock className="size-8 text-slate-200 mx-auto" />
                                        <p className="text-xs text-slate-400">No jobs run yet.</p>
                                    </div>
                                ) : (
                                    jobs.map(job => (
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
                                                        <Circle className="size-2 fill-teal-400 text-teal-400" />
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Completed</span>
                                                    </div>
                                                    <span className="text-[10px] text-slate-400">•</span>
                                                    <span className="text-[10px] text-slate-400 font-medium">{(job.result?.itemCount ?? 0)} items</span>
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
    );
}
