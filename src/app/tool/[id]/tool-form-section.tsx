"use client";

import { useState } from "react";
import type { ToolParam } from "@/core/interfaces/tools.interface";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{value.length} items added</p>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] text-slate-500 hover:text-brand"
                    onClick={() => isBulk ? handleBulkCancel() : (setBulkValue(value.join('\n')), setIsBulk(true))}>
                    {isBulk ? <><List className="mr-1 size-3" /> List View</> : <><FileText className="mr-1 size-3" /> Bulk Edit</>}
                </Button>
            </div>
            {isBulk ? (
                <div className="space-y-3">
                    <Textarea value={bulkValue}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBulkValue(e.target.value)}
                        placeholder="Paste your URLs here (one per line or comma-separated)..."
                        className={cn("min-h-40 bg-slate-50 border-slate-200 focus:bg-white transition-all text-xs font-mono", hasError && "border-red-500 bg-red-50/30")} />
                    <div className="flex gap-2">
                        <Button size="sm" className="h-8 bg-brand text-white text-xs px-4" onClick={handleBulkSave}>Apply Bulk Changes</Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs px-4" onClick={handleBulkCancel}>Cancel</Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    {value.map((item, index) => (
                        <div key={`url-input-${id}-${index}`} className="flex gap-2">
                            <Input value={item} onChange={(e) => handleItemChange(index, e.target.value)}
                                placeholder={placeholder || "https://..."}
                                className={cn("h-9 bg-slate-50 border-slate-200 focus:bg-white transition-all text-xs", hasError && "border-red-500 bg-red-50/30")} />
                            <Button variant="outline" size="icon" className="size-9 shrink-0 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100"
                                onClick={() => handleRemove(index)}><Trash2 className="size-4" /></Button>
                        </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full h-9 border-dashed border-slate-200 text-slate-500 hover:text-brand hover:border-brand hover:bg-brand/5"
                        onClick={handleAdd}><Plus className="mr-1 size-4" /> Add Another URL</Button>
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
        <Card className="shadow-sm border-slate-200">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Play className="size-5 text-brand" /> Run Configuration
                </CardTitle>
                <CardDescription>Configure the parameters for this run.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {params.map(param => (
                    <Field key={param.id}>
                        <FieldLabel htmlFor={param.key} className="cursor-pointer">
                            {param.label}{param.required && <span className="text-destructive ml-1">*</span>}
                        </FieldLabel>
                        {param.type === 'boolean' ? (
                            <div className="flex items-center py-1">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <Checkbox id={param.key} checked={!!formData[param.key]}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => clearError(param.key, !!e.target.checked)} />
                                    <span className="text-sm text-slate-600">Enabled</span>
                                </label>
                            </div>
                        ) : param.type === 'select' ? (
                            <Select value={String(formData[param.key] || "")} onValueChange={(val) => clearError(param.key, val)}>
                                <SelectTrigger id={param.key} className={cn("bg-slate-50 border-slate-200 focus:bg-white transition-all", errors[param.key] && "border-destructive bg-destructive/5")}>
                                    <SelectValue placeholder={param.placeholder || "Select an option..."} />
                                </SelectTrigger>
                                <SelectContent>
                                    {param.options?.map((option, idx) => (
                                        <SelectItem key={`${option}-${idx}`} value={option}>{option}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : param.transform === 'urlArray' ? (
                            <UrlArrayInput id={param.key} value={(formData[param.key] as string[]) || []}
                                onChange={(val) => clearError(param.key, val)} placeholder={param.placeholder} hasError={!!errors[param.key]} />
                        ) : (
                            <Input id={param.key} placeholder={param.placeholder || `Enter ${param.label.toLowerCase()}...`}
                                value={String(formData[param.key] || "")} onChange={(e) => clearError(param.key, e.target.value)}
                                className={cn("bg-slate-50 border-slate-200 focus:bg-white transition-all", errors[param.key] && "border-destructive bg-destructive/5")} />
                        )}
                        {param.placeholder && param.type !== 'select' && param.transform !== 'urlArray' && (
                            <FieldDescription>{param.placeholder}</FieldDescription>
                        )}
                        <FieldError errors={errors[param.key] ? [{ message: errors[param.key] }] : []} />
                    </Field>
                ))}
                <div className="pt-4">
                    <Button className="w-full sm:w-auto min-w-40 bg-brand hover:bg-brand/90 text-white font-semibold rounded-xl py-6"
                        onClick={onRun} disabled={isRunning}>
                        {isRunning ? <><Loader2 className="mr-2 size-5 animate-spin" /> Running...</> : <><Play className="mr-2 size-5 fill-current" /> Start Job</>}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
