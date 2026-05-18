"use client";

import { useState } from "react";
import type { ToolParam } from "@/core/interfaces/tools.interface";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Play, Loader2, Plus, Trash2, FileText, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UrlArrayInputProps {
    id: string;
    value: string[];
    onChange: (val: string[]) => void;
    placeholder?: string | null;
    hasError?: boolean;
}

function UrlArrayInput({ id, value, onChange, placeholder, hasError }: UrlArrayInputProps) {
    const [isBulk, setIsBulk] = useState(false);
    const [bulkValue, setBulkValue] = useState(value.join('\n'));

    const handleAdd = () => onChange([...value, ""]);
    const handleRemove = (index: number) => onChange(value.filter((_, i) => i !== index));
    const handleItemChange = (index: number, val: string) => {
        const next = [...value]; next[index] = val; onChange(next);
    };
    const handleBulkSave = () => {
        onChange(bulkValue.split(/[\n,]/).map(s => s.trim()).filter(Boolean));
        setIsBulk(false);
    };
    const handleBulkCancel = () => { setBulkValue(value.join('\n')); setIsBulk(false); };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">{value.length} items added</p>
                <Button variant="ghost" size="sm" className="h-8 px-3 rounded-lg text-xs font-medium text-slate-600 hover:text-brand hover:bg-brand/5 transition-colors"
                    onClick={() => isBulk ? handleBulkCancel() : (setBulkValue(value.join('\n')), setIsBulk(true))}>
                    {isBulk ? <><List className="mr-1.5 size-3.5" /> List View</> : <><FileText className="mr-1.5 size-3.5" /> Bulk Edit</>}
                </Button>
            </div>
            {isBulk ? (
                <div className="space-y-3 p-4 rounded-sm bg-slate-50/50 border border-slate-100">
                    <Textarea value={bulkValue}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBulkValue(e.target.value)}
                        placeholder="Paste your URLs here (one per line or comma-separated)..."
                        className={cn("min-h-40 bg-white border-slate-200 focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all text-sm font-mono rounded-sm resize-y", hasError && "border-red-500 focus:ring-red-500/20 bg-red-50/30")} />
                    <div className="flex gap-2">
                        <Button size="sm" className="h-9 rounded-lg bg-brand hover:bg-brand/90 text-white text-xs px-5 shadow-sm" onClick={handleBulkSave}>Apply Bulk Changes</Button>
                        <Button size="sm" variant="outline" className="h-9 rounded-lg text-xs px-5 border-slate-200" onClick={handleBulkCancel}>Cancel</Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {value.map((item, index) => (
                        <div key={`url-input-${id}-${index}`} className="flex gap-2 items-center">
                            <Input value={item} onChange={(e) => handleItemChange(index, e.target.value)}
                                placeholder={placeholder || "https://..."}
                                className={cn("h-10 bg-slate-50 border-slate-200 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all text-sm rounded-sm", hasError && "border-red-500 focus:ring-red-500/20 bg-red-50/30")} />
                            <Button variant="ghost" size="icon" className="size-10 rounded-sm shrink-0 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                onClick={() => handleRemove(index)}><Trash2 className="size-4.5" /></Button>
                        </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full h-10 rounded-sm border-dashed border-slate-300 text-slate-500 hover:text-brand hover:border-brand hover:bg-brand/5 transition-all shadow-none"
                        onClick={handleAdd}><Plus className="mr-1.5 size-4" /> Add Another URL</Button>
                </div>
            )}
        </div>
    );
}

interface ToolFormSectionProps {
    params: ToolParam[];
    formData: Record<string, unknown>;
    errors: Record<string, string>;
    isRunning: boolean;
    onChange: (key: string, value: unknown) => void;
    onRun: () => void;
}

export function ToolFormSection({ params, formData, errors, isRunning, onChange, onRun }: ToolFormSectionProps) {
    const clearError = (key: string, value: unknown) => onChange(key, value);

    return (
        <Card className="shadow-[0_2px_12px_rgba(0,0,0,0.04)] border-zinc-100 rounded-2xl overflow-hidden bg-white">
            <div className="bg-slate-50/50 border-b border-zinc-100 px-6 py-5">
                <CardTitle className="text-xl flex items-center gap-2 font-bold tracking-tight text-slate-900">
                    <Play className="size-5 text-brand" /> Run Configuration
                </CardTitle>
                <CardDescription className="mt-1.5 text-sm text-slate-500">Configure the required parameters to start processing.</CardDescription>
            </div>
            <CardContent className="space-y-7 p-6 sm:p-4">
                {params.map(param => (
                    <Field key={param.id} className="space-y-2.5">
                        <FieldLabel htmlFor={param.key} className="text-sm font-semibold text-slate-800 cursor-pointer">
                            {param.label}{param.required && <span className="text-red-500 ml-1">*</span>}
                        </FieldLabel>
                        {param.type === 'boolean' ? (
                            <div className="flex items-center py-2 px-1">
                                <label className="flex items-center gap-3 cursor-pointer select-none group">
                                    <Switch id={param.key} checked={!!formData[param.key]}
                                        onCheckedChange={(val) => clearError(param.key, val)}
                                    />
                                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">Enabled</span>
                                </label>
                            </div>
                        ) : param.type === 'select' ? (
                            <Select value={String(formData[param.key] || "")} onValueChange={(val) => clearError(param.key, val)}>
                                <SelectTrigger id={param.key} className={cn("h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all text-sm rounded-sm", errors[param.key] && "border-red-500 focus:ring-red-500/20 bg-red-50/30")}>
                                    <SelectValue placeholder={param.placeholder || "Select an option..."} />
                                </SelectTrigger>
                                <SelectContent className="rounded-sm shadow-lg border-slate-100">
                                    {param.options?.map((option, idx) => (
                                        <SelectItem key={`${option}-${idx}`} value={option} className="py-2.5 cursor-pointer rounded-lg">{option}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : param.transform === 'urlArray' ? (
                            <UrlArrayInput id={param.key} value={(formData[param.key] as string[]) || []}
                                onChange={(val) => clearError(param.key, val)} placeholder={param.placeholder} hasError={!!errors[param.key]} />
                        ) : (param.key === 'rawInput' || param.key === 'text' || (param as ToolParam & { multiline?: boolean }).multiline) ? (
                            <Textarea id={param.key} placeholder={param.placeholder || `Enter ${param.label.toLowerCase()}...`}
                                value={String(formData[param.key] || "")} onChange={(e) => clearError(param.key, e.target.value)}
                                className={cn("min-h-[120px] py-3 bg-slate-50 border-slate-200 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all text-sm rounded-sm px-4 resize-none", errors[param.key] && "border-red-500 focus:ring-red-500/20 bg-red-50/30")} />
                        ) : (
                            <Input id={param.key} placeholder={param.placeholder || `Enter ${param.label.toLowerCase()}...`}
                                value={String(formData[param.key] || "")} onChange={(e) => clearError(param.key, e.target.value)}
                                className={cn("h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all text-sm rounded-sm px-4", errors[param.key] && "border-red-500 focus:ring-red-500/20 bg-red-50/30")} />
                        )}
                        {param.placeholder && param.type !== 'select' && param.transform !== 'urlArray' && !errors[param.key] && (
                            <FieldDescription className="text-xs text-slate-500 mt-1.5">{param.placeholder}</FieldDescription>
                        )}
                        <FieldError errors={errors[param.key] ? [{ message: errors[param.key] }] : []} className="text-xs mt-1.5 font-medium" />
                    </Field>
                ))}
                <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end">
                    <Button className="h-9 rounded-lg bg-brand hover:bg-brand/90 text-white text-xs px-5 shadow-sm transition-all"
                        onClick={onRun} disabled={isRunning}>
                        {isRunning ? <><Loader2 className="mr-2 size-4 animate-spin" /> Processing...</> : <><Play className="mr-2 size-4 fill-current" /> Start</>}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
