"use client";

import type {
  ToolParam,
  ToolTestPromptResult,
} from "@/core/interfaces/tools.interface";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UrlArrayInput } from "../url-array-input";
import { PromptInputField } from "./prompt-input-field";

const PARAM_HELPERS: Record<string, string> = {
  starturls:
    "Enter a valid Facebook page URL, e.g. https://www.facebook.com/senatorWong/.",
  resultslimit:
    "If this limit is not set, only the initial page of results will be extracted.",
  rendertext: "Extract video transcript [ if available ]",
  onlynewerthan:
    "Scrape posts from the analyzed date to the present day YYYY-MM-DD format.",
  onlyolderthan:
    "Scrape posts from the analyzed date to the past YYYY-MM-DD format.",
};

// ...existing code...

function getHelperText(param: ToolParam): string {
  const key = param.key.toLowerCase();
  if (PARAM_HELPERS[key]) return PARAM_HELPERS[key];
  if (key.includes("url"))
    return "Enter a valid Facebook page URL. Note that you can only scrape public pages.";
  if (key.includes("limit") || key.includes("max"))
    return "If this limit is not set, only the initial page of results will be extracted.";
  if (key.includes("newer"))
    return "Scrape posts from the analyzed date to the present day (YYYY-MM-DD or relative).";
  if (key.includes("older"))
    return "Scrape posts from the analyzed date to the past (YYYY-MM-DD or relative).";
  if (key.includes("caption") || key.includes("render"))
    return "Extract video transcript [ if available ]";
  if (key.includes("comment"))
    return "Specify the count threshold of comments to pull and analyze per social post.";
  return param.placeholder &&
    param.placeholder.length > 5 &&
    !param.placeholder.includes("https://")
    ? param.placeholder
    : `Configure the parameter settings for ${param.label}.`;
}

interface FormParamFieldProps {
  param: ToolParam;
  value: unknown;
  error?: string;
  placeholderText?: string;
  onChange: (key: string, value: unknown) => void;
  onSend?: () => void;
  isSendLoading?: boolean;
  testResult?: ToolTestPromptResult | null;
  activeModel?: string;
  onActivityAccess?: () => void;
}

export function FormParamField({
  param,
  value,
  error,
  placeholderText,
  onChange,
  onSend,
  isSendLoading,
  testResult,
  activeModel = "Gemini 1.5 Flash",
  onActivityAccess,
}: FormParamFieldProps) {
  const helperText = getHelperText(param);
  const isPromptField = param.key === "prompt";

  return (
    <Field className="space-y-2.5">
      <div className="space-y-1">
        <FieldLabel
          htmlFor={param.key}
          className={cn(
            "font-semibold text-slate-700 cursor-pointer select-none",
            isPromptField ? "text-[15px]" : "text-sm",
          )}
        >
          {param.label}
          {param.required && <span className="text-red-500 ml-1">*</span>}
        </FieldLabel>
        {helperText && !error && (
          <span
            className={cn(
              "text-slate-400 font-semibold block leading-normal select-none transition-all duration-300",
              isPromptField ? "text-[11.5px]" : "text-[10.5px]",
            )}
          >
            {helperText}
          </span>
        )}
      </div>

      {param.type === "boolean" ? (
        <div className="flex items-center py-2 px-1">
          <label className="flex items-center gap-3 cursor-pointer select-none group">
            <Switch
              id={param.key}
              checked={!!value}
              onCheckedChange={(val) => onChange(param.key, val)}
            />
            <span className="text-xs font-bold text-slate-650 group-hover:text-slate-900 transition-colors">
              Enabled
            </span>
          </label>
        </div>
      ) : param.type === "select" ? (
        <Select
          value={String(value || "")}
          onValueChange={(val) => onChange(param.key, val)}
        >
          <SelectTrigger
            id={param.key}
            className={cn(
              "h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all text-xs font-bold rounded-xl cursor-pointer shadow-xs hover:border-slate-300",
              error && "border-red-500 focus:ring-red-500/20 bg-red-50/30",
            )}
          >
            <SelectValue
              placeholder={param.placeholder || "Select an option..."}
            />
          </SelectTrigger>
          <SelectContent className="rounded-xl shadow-lg border-slate-100">
            {param.options?.map((option, idx) => (
              <SelectItem
                key={`${option}-${idx}`}
                value={option}
                className="py-2.5 cursor-pointer rounded-lg text-xs font-semibold"
              >
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : param.transform === "urlArray" ? (
        <UrlArrayInput
          id={param.key}
          value={(value as string[]) || []}
          onChange={(val) => onChange(param.key, val)}
          placeholder={param.placeholder}
          hasError={!!error}
        />
      ) : isPromptField || param.type === "prompt" ? (
        <PromptInputField
          id={param.key}
          value={String(value || "")}
          onChange={(val) => onChange(param.key, val)}
          placeholderText={placeholderText}
          onSend={onSend}
          isSendLoading={isSendLoading}
          testResult={testResult}
          activeModel={activeModel}
          error={error}
          onActivityAccess={onActivityAccess}
        />
      ) : param.key === "rawInput" ||
        param.key === "text" ||
        param.type === "multiline" ||
        param.type === "textarea" ||
        param.type === "json" ||
        (param as ToolParam & { multiline?: boolean }).multiline ? (
        <Textarea
          id={param.key}
          placeholder={
            param.placeholder || `Enter ${param.label.toLowerCase()}...`
          }
          value={String(value || "")}
          onChange={(e) => onChange(param.key, e.target.value)}
          className={cn(
            "min-h-30 py-3 bg-slate-50 border-slate-200/60 focus:bg-white focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all text-xs font-semibold rounded-xl px-4 resize-none shadow-2xs hover:border-slate-300",
            error && "border-red-500 focus:ring-red-500/20 bg-red-50/30",
          )}
        />
      ) : (
        <Input
          id={param.key}
          type={param.type === "number" ? "number" : param.type === "date" ? "date" : "text"}
          placeholder={
            param.placeholder || `Enter ${param.label.toLowerCase()}...`
          }
          value={String(value || "")}
          onChange={(e) => onChange(param.key, e.target.value)}
          className={cn(
            "h-11 bg-slate-50 border-slate-200/60 focus:bg-white focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all text-xs font-semibold rounded-xl px-4 shadow-2xs hover:border-slate-300",
            error && "border-red-500 focus:ring-red-500/20 bg-red-50/30",
          )}
        />
      )}
      <FieldError
        errors={error ? [{ message: error }] : []}
        className="text-[11px] -mt-2 font-normal text-red-500 flex items-center gap-1"
      />
    </Field>
  );
}
