"use client";

import { useState } from "react";
import type { ToolParam } from "@/core/interfaces/tools.interface";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Play,
  Loader2,
  Plus,
  Trash2,
  FileText,
  List,
  Link2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UrlArrayInputProps {
  id: string;
  value: string[];
  onChange: (val: string[]) => void;
  placeholder?: string | null;
  hasError?: boolean;
}

function UrlArrayInput({
  id,
  value,
  onChange,
  placeholder,
  hasError,
}: UrlArrayInputProps) {
  const [isBulk, setIsBulk] = useState(false);
  const [bulkValue, setBulkValue] = useState(value.join("\n"));

  const handleAdd = () => onChange([...value, ""]);
  const handleRemove = (index: number) =>
    onChange(value.filter((_, i) => i !== index));
  const handleItemChange = (index: number, val: string) => {
    const next = [...value];
    next[index] = val;
    onChange(next);
  };
  const handleBulkSave = () => {
    onChange(
      bulkValue
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean),
    );
    setIsBulk(false);
  };
  const handleBulkCancel = () => {
    setBulkValue(value.join("\n"));
    setIsBulk(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="px-2 py-0.5 bg-slate-100 border border-slate-200/50 text-[9px] font-bold text-slate-500 rounded-md uppercase tracking-wider select-none shrink-0">
          {value.length} items added
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7.5 px-2.5 rounded-lg text-[10.5px] font-bold text-slate-600 hover:text-brand hover:bg-brand/5 border border-slate-200/50 shadow-xs bg-white transition-all duration-300 cursor-pointer hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0"
          onClick={() =>
            isBulk
              ? handleBulkCancel()
              : (setBulkValue(value.join("\n")), setIsBulk(true))
          }
        >
          {isBulk ? (
            <>
              <List className="mr-1.5 size-3.5 text-slate-500" /> List View
            </>
          ) : (
            <>
              <FileText className="mr-1.5 size-3.5 text-slate-500" /> Bulk Edit
            </>
          )}
        </Button>
      </div>
      {isBulk ? (
        <div className="space-y-3.5 p-4 rounded-2xl bg-slate-50/50 border border-slate-200/60 shadow-xs">
          <Textarea
            value={bulkValue}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setBulkValue(e.target.value)
            }
            placeholder="Paste your URLs here (one per line or comma-separated)..."
            className={cn(
              "min-h-40 bg-white border-slate-200 focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all text-sm rounded-xl resize-y px-4 py-3 shadow-inner shadow-slate-50",
              hasError && "border-red-500 focus:ring-red-500/20 bg-red-50/30",
            )}
          />

          {/* Premium inline technical formatting advisor */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-brand/5 border border-brand/10 rounded-xl text-[10px] text-slate-600 font-bold select-none">
            <Sparkles className="size-3.5 text-brand shrink-0 animate-pulse" />
            <span>
              Format: Paste one Facebook URL link per line, or separate links
              with commas.
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              className="h-9 rounded-lg bg-linear-to-r from-brand to-brand-strong hover:from-brand-strong hover:to-brand text-white text-xs px-5 shadow-md shadow-brand/25 font-bold transition-all duration-300 hover:shadow-lg hover:shadow-brand/40 hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 cursor-pointer"
              onClick={handleBulkSave}
            >
              Apply Changes
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 rounded-lg text-xs px-5 border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 font-bold shadow-xs transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 cursor-pointer"
              onClick={handleBulkCancel}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : value.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 text-center bg-slate-50/30 rounded-2xl border border-dashed border-slate-200 shadow-xs relative overflow-hidden select-none group min-h-35 transition-all duration-300 hover:border-brand/40">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-brand/5 rounded-full blur-3xl opacity-60 pointer-events-none" />

          <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-xs text-slate-400 group-hover:text-brand group-hover:scale-110 transition-all duration-300 relative z-10 shrink-0 mb-3">
            <Link2 className="size-5 transition-transform duration-500 group-hover:rotate-45" />
          </div>

          <h5 className="text-xs font-bold text-slate-700 relative z-10 leading-normal">
            No Source URLs Added
          </h5>
          <p className="text-[10px] text-slate-400/90 font-medium max-w-70 mt-1 relative z-10 leading-normal">
            Add a direct Facebook post URL or switch to Bulk Edit to paste
            multiple links.
          </p>

          <div className="mt-4 flex gap-2 w-full max-w-70 relative z-10 justify-center">
            <Button
              variant="outline"
              size="sm"
              className="h-8.5 px-3 rounded-lg border-slate-200 text-[10.5px] font-bold text-slate-600 hover:bg-slate-100/50 transition-colors shadow-none cursor-pointer"
              onClick={handleAdd}
            >
              <Plus className="mr-1 size-3.5" /> Add URL
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8.5 px-3 rounded-lg border-brand/20 bg-brand/5 text-[10.5px] font-bold text-brand hover:bg-brand/10 hover:border-brand/30 transition-colors shadow-none cursor-pointer"
              onClick={() => {
                setBulkValue(value.join("\n"));
                setIsBulk(true);
              }}
            >
              <FileText className="mr-1 size-3.5" /> Bulk Paste
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {value.map((item, index) => (
            <div
              key={`url-input-${id}-${index}`}
              className="flex gap-2 items-center group/row"
            >
              {/* Visual index bubble that glows with brand on hover */}
              <div className="flex items-center justify-center size-8 bg-slate-100/80 text-slate-500 text-[10.5px] font-bold rounded-lg shrink-0 select-none group-hover/row:bg-brand/10 group-hover/row:text-brand transition-all duration-300">
                {index + 1}
              </div>

              {/* Inner absolute trash containment */}
              <div className="flex-1 relative flex items-center min-w-0">
                <Input
                  value={item}
                  onChange={(e) => handleItemChange(index, e.target.value)}
                  placeholder={placeholder || "https://..."}
                  className={cn(
                    "h-10 pr-10 bg-slate-50/50 border-slate-200/60 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all text-sm rounded-xl",
                    hasError &&
                      "border-red-500 focus:ring-red-500/20 bg-red-50/30",
                  )}
                />

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 size-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover/row:opacity-100 focus:opacity-100 cursor-pointer"
                  onClick={() => handleRemove(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            className="w-full h-10 rounded-xl border-dashed border-slate-200/80 bg-slate-50/20 text-slate-500 hover:text-brand hover:border-brand hover:bg-brand/5 transition-all duration-300 shadow-none font-bold cursor-pointer hover:-translate-y-0.5 active:scale-[0.99] active:translate-y-0 flex items-center justify-center gap-1.5"
            onClick={handleAdd}
          >
            <Plus className="size-4 shrink-0" /> Add Another URL
          </Button>
        </div>
      )}
    </div>
  );
}

const PARAM_HELPERS: Record<string, string> = {
  starturls:
    "Enter a valid Facebook page URL, e.g. https://www.facebook.com/senatorWong/. Note that you can only scrape public pages with this Actor, not personal profiles.",
  resultslimit:
    "If this limit is not set, only the initial page of results will be extracted.",
  rendertext: "Extract video transcript [ if available ]",
  onlynewerthan:
    "Scrape posts from the analyzed date to the present day (or dates in 'older than'). Supports YYYY-MM-DD absolute format or relative format (e.g. 1 day, 5 months) or UTC ISO timestamp.",
  onlyolderthan:
    "Scrape posts from the analyzed date to the past (or dates in 'newer than'). Supports YYYY-MM-DD absolute format or relative format (e.g. 1 day, 3 months) or UTC ISO timestamp.",
};

function getHelperText(param: ToolParam): string {
  const key = param.key.toLowerCase();

  // Check curated dictionary first
  if (PARAM_HELPERS[key]) {
    return PARAM_HELPERS[key];
  }

  // Fallback keyword parsing for smart helper text extraction
  if (key.includes("url")) {
    return "Enter a valid Facebook page URL, e.g. https://www.facebook.com/senatorWong/. Note that you can only scrape public pages with this Actor, not personal profiles.";
  }
  if (key.includes("limit") || key.includes("max")) {
    return "If this limit is not set, only the initial page of results will be extracted.";
  }
  if (key.includes("newer")) {
    return "Scrape posts from the analyzed date to the present day (or dates in 'older than'). Supports YYYY-MM-DD or relative format.";
  }
  if (key.includes("older")) {
    return "Scrape posts from the analyzed date to the past (or dates in 'newer than'). Supports YYYY-MM-DD or relative format.";
  }
  if (key.includes("caption") || key.includes("render")) {
    return "Extract video transcript [ if available ]";
  }
  if (key.includes("comment")) {
    return "Specify the count threshold of comments to pull and analyze per social post.";
  }

  // Use param placeholder if descriptive, otherwise default key message
  if (
    param.placeholder &&
    param.placeholder.length > 5 &&
    !param.placeholder.includes("https://")
  ) {
    return param.placeholder;
  }

  return `Configure the parameter settings for ${param.label}.`;
}

interface ToolFormSectionProps {
  params: ToolParam[];
  formData: Record<string, unknown>;
  errors: Record<string, string>;
  isRunning: boolean;
  onChange: (key: string, value: unknown) => void;
  onRun: () => void;
}

export function ToolFormSection({
  params,
  formData,
  errors,
  isRunning,
  onChange,
  onRun,
}: ToolFormSectionProps) {
  const clearError = (key: string, value: unknown) => onChange(key, value);

  // Check if there is a prompt param
  const promptParam = params.find((param: ToolParam) => param.key === "prompt");
  if (promptParam) {
    const helperText = getHelperText(promptParam);
    return (
      <Card className="shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-slate-200/60 rounded-2xl overflow-hidden bg-white">
        <div className="bg-linear-to-r from-slate-50/50 via-white to-slate-50/30 border-b border-slate-100/60 px-6 py-5 flex items-center gap-3">
          <div className="p-2 bg-indigo-50 border border-indigo-100/80 text-brand rounded-xl shrink-0 shadow-xs">
            <Sparkles className="size-4 text-brand animate-pulse" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold tracking-tight text-slate-800 leading-none">
              Prompt Test
            </CardTitle>
            <CardDescription className="mt-1 text-[11px] text-slate-400 font-medium">
              Test your prompt with the configured model and see the result.
            </CardDescription>
          </div>
        </div>
        <CardContent className="space-y-7 p-6 sm:p-4">
          <Field className="space-y-2.5">
            <div className="space-y-1">
              <FieldLabel
                htmlFor={promptParam.key}
                className="text-base font-semibold text-slate-800 cursor-pointer"
              >
                {promptParam.label}
                {promptParam.required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </FieldLabel>
              {helperText && !errors[promptParam.key] && (
                <span className="text-[12px] text-slate-400 font-medium block leading-normal select-none">
                  {helperText}
                </span>
              )}
            </div>
            <Textarea
              id={promptParam.key}
              placeholder={
                promptParam.placeholder ||
                `Enter ${promptParam.label.toLowerCase()}...`
              }
              value={String(formData[promptParam.key] || "")}
              onChange={(e) => clearError(promptParam.key, e.target.value)}
              className={cn(
                "min-h-45 py-4 bg-white border-slate-200/60 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all text-base rounded-xl px-5 resize-vertical shadow-inner",
                errors[promptParam.key] &&
                  "border-red-500 focus:ring-red-500/20 bg-red-50/30",
              )}
            />
            <FieldError
              errors={
                errors[promptParam.key]
                  ? [{ message: errors[promptParam.key] }]
                  : []
              }
              className="text-xs mt-1.5 font-medium"
            />
          </Field>
          <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end">
            <Button
              className="h-10 rounded-lg bg-linear-to-r from-brand to-brand-strong hover:from-brand-strong hover:to-brand text-white text-base px-7 shadow-md shadow-brand/25 font-bold transition-all duration-300 hover:shadow-lg hover:shadow-brand/40 hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              onClick={onRun}
              disabled={isRunning}
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 size-5 animate-spin text-white" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 size-5 text-white" />
                  <span>Test prompt</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default: render all params as before
  return (
    <Card className="shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-slate-200/60 rounded-2xl overflow-hidden bg-white">
      <div className="bg-linear-to-r from-slate-50/50 via-white to-slate-50/30 border-b border-slate-100/60 px-6 py-5 flex items-center gap-3">
        <div className="p-2 bg-indigo-50 border border-indigo-100/80 text-brand rounded-xl shrink-0 shadow-xs">
          <Play className="size-4 fill-brand text-brand" />
        </div>
        <div>
          <CardTitle className="text-sm font-bold tracking-tight text-slate-800 leading-none">
            Run Configuration
          </CardTitle>
          <CardDescription className="mt-1 text-[11px] text-slate-400 font-medium">
            Configure the required parameters to start processing.
          </CardDescription>
        </div>
      </div>
      <CardContent className="space-y-7 p-6 sm:p-4">
        {params.map((param: ToolParam) => {
          const helperText = getHelperText(param);
          return (
            <Field key={param.id} className="space-y-2.5">
              <div className="space-y-1">
                <FieldLabel
                  htmlFor={param.key}
                  className="text-sm font-semibold text-slate-800 cursor-pointer"
                >
                  {param.label}
                  {param.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </FieldLabel>
                {helperText && !errors[param.key] && (
                  <span className="text-[11px] text-slate-400 font-medium block leading-normal select-none">
                    {helperText}
                  </span>
                )}
              </div>
              {param.type === "boolean" ? (
                <div className="flex items-center py-2 px-1">
                  <label className="flex items-center gap-3 cursor-pointer select-none group">
                    <Switch
                      id={param.key}
                      checked={!!formData[param.key]}
                      onCheckedChange={(val) => clearError(param.key, val)}
                    />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                      Enabled
                    </span>
                  </label>
                </div>
              ) : param.type === "select" ? (
                <Select
                  value={String(formData[param.key] || "")}
                  onValueChange={(val) => clearError(param.key, val)}
                >
                  <SelectTrigger
                    id={param.key}
                    className={cn(
                      "h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all text-sm rounded-xl",
                      errors[param.key] &&
                        "border-red-500 focus:ring-red-500/20 bg-red-50/30",
                    )}
                  >
                    \
                    <SelectValue
                      placeholder={param.placeholder || "Select an option..."}
                    />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-lg border-slate-100">
                    {param.options?.map((option, idx) => (
                      <SelectItem
                        key={`${option}-${idx}`}
                        value={option}
                        className="py-2.5 cursor-pointer rounded-lg"
                      >
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : param.transform === "urlArray" ? (
                <UrlArrayInput
                  id={param.key}
                  value={(formData[param.key] as string[]) || []}
                  onChange={(val) => clearError(param.key, val)}
                  placeholder={param.placeholder}
                  hasError={!!errors[param.key]}
                />
              ) : param.key === "rawInput" ||
                param.key === "text" ||
                (param as ToolParam & { multiline?: boolean }).multiline ? (
                <Textarea
                  id={param.key}
                  placeholder={
                    param.placeholder || `Enter ${param.label.toLowerCase()}...`
                  }
                  value={String(formData[param.key] || "")}
                  onChange={(e) => clearError(param.key, e.target.value)}
                  className={cn(
                    "min-h-30 py-3 bg-slate-50 border-slate-200/60 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all text-sm rounded-xl px-4 resize-none",
                    errors[param.key] &&
                      "border-red-500 focus:ring-red-500/20 bg-red-50/30",
                  )}
                />
              ) : (
                <Input
                  id={param.key}
                  placeholder={
                    param.placeholder || `Enter ${param.label.toLowerCase()}...`
                  }
                  value={String(formData[param.key] || "")}
                  onChange={(e) => clearError(param.key, e.target.value)}
                  className={cn(
                    "h-11 bg-slate-50 border-slate-200/60 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all text-sm rounded-xl px-4",
                    errors[param.key] &&
                      "border-red-500 focus:ring-red-500/20 bg-red-50/30",
                  )}
                />
              )}
              <FieldError
                errors={
                  errors[param.key] ? [{ message: errors[param.key] }] : []
                }
                className="text-xs mt-1.5 font-medium"
              />
            </Field>
          );
        })}
        <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end">
          <Button
            className="h-9.5 rounded-lg bg-linear-to-r from-brand to-brand-strong hover:from-brand-strong hover:to-brand text-white text-xs px-6 shadow-md shadow-brand/25 font-bold transition-all duration-300 hover:shadow-lg hover:shadow-brand/40 hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            onClick={onRun}
            disabled={isRunning}
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin text-white" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Play className="mr-2 size-3.5 fill-white text-white" />
                <span>Start Automation</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
