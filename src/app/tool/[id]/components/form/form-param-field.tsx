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
import { PARAM_TYPE_CONFIGS } from "@/core/config/param-types";
import { ParamType } from "@/core/interfaces/tools.interface";

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

  const typeConfig = PARAM_TYPE_CONFIGS[param.type as ParamType] || PARAM_TYPE_CONFIGS[ParamType.TEXT];
  const renderType = typeConfig.renderType;
  const isPromptField = param.key === "prompt" || renderType === "prompt";
  const isTextarea =
    renderType === "textarea" ||
    param.key === "rawInput" ||
    param.key === "text" ||
    (param as ToolParam & { multiline?: boolean }).multiline;

  return (
    <Field className="space-y-2.5 w-full">
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
              "text-slate-400 font-normal block leading-normal select-none transition-all duration-300",
              isPromptField ? "text-[11.5px]" : "text-[10.5px]",
            )}
          >
            {helperText}
          </span>
        )}
      </div>

      <div className={typeConfig.widthClass}>
        {renderType === "boolean" ? (
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
        ) : renderType === "select" ? (
          <Select
            value={String(value || "")}
            onValueChange={(val) => onChange(param.key, val)}
          >
            <SelectTrigger
              id={param.key}
              className={cn(
                "h-8 bg-transparent border-slate-200 focus:bg-transparent focus:border-brand focus:ring-0 focus:ring-transparent focus-visible:ring-0 focus-visible:ring-transparent transition-all text-xs font-normal rounded-md cursor-pointer shadow-none hover:border-slate-300",
                error && "border-red-500 focus:ring-0 focus:ring-transparent focus-visible:ring-0 focus-visible:ring-transparent bg-transparent",
              )}
            >
              <SelectValue
                placeholder={param.placeholder || "Select an option..."}
              />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-lg border-slate-100">
              {param.options?.map((option, idx) => {
                // Standardize options to string values
                const optionStr = typeof option === "object" && option !== null ? String((option as { value?: string }).value || "") : String(option);
                const optionLabel = typeof option === "object" && option !== null ? String((option as { label?: string }).label || "") : String(option);
                return (
                  <SelectItem
                    key={`${optionStr}-${idx}`}
                    value={optionStr}
                    className="py-2.5 cursor-pointer rounded-lg text-xs font-semibold"
                  >
                    {optionLabel}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        ) : renderType === "url" ? (
          <UrlArrayInput
            id={param.key}
            value={(() => {
              if (Array.isArray(value)) return value as string[];
              if (typeof value === "string") {
                const trimmed = value.trim();
                if (!trimmed) return [];
                if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                  try {
                    const parsed = JSON.parse(trimmed);
                    if (Array.isArray(parsed)) return parsed.map(String);
                  } catch { }
                }
                return [trimmed];
              }
              return [];
            })()}
            onChange={(val) => onChange(param.key, val)}
            placeholder={param.placeholder}
            hasError={!!error}
          />
        ) : isPromptField ? (
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
        ) : isTextarea ? (
          <Textarea
            id={param.key}
            placeholder={
              param.placeholder || `Enter ${param.label.toLowerCase()}...`
            }
            value={String(value || "")}
            onChange={(e) => onChange(param.key, e.target.value)}
            className={cn(
              "min-h-30 py-3 bg-transparent border-slate-200/60 focus:bg-transparent focus:border-brand focus:ring-0 focus:ring-transparent focus-visible:ring-0 focus-visible:ring-transparent transition-all text-xs placeholder:text-xs font-normal rounded-md px-4 resize-none shadow-none hover:border-slate-300",
              error && "border-red-500 focus:ring-0 focus:ring-transparent focus-visible:ring-0 focus-visible:ring-transparent bg-transparent",
            )}
          />
        ) : (
          <Input
            id={param.key}
            type={renderType === "number" ? "number" : renderType === "date" ? "date" : "text"}
            placeholder={
              param.placeholder || `Enter ${param.label.toLowerCase()}...`
            }
            value={String(value || "")}
            onChange={(e) => onChange(param.key, e.target.value)}
            className={cn(
              "h-8 bg-transparent border-slate-200/60 focus:bg-transparent focus:border-brand focus:ring-0 focus:ring-transparent focus-visible:ring-0 focus-visible:ring-transparent transition-all text-xs md:text-xs placeholder:text-xs font-normal rounded-md px-4 shadow-none hover:border-slate-300",
              error && "border-red-500 focus:ring-0 focus:ring-transparent focus-visible:ring-0 focus-visible:ring-transparent bg-transparent",
            )}
          />
        )}
      </div>
      <FieldError
        errors={error ? [{ message: error }] : []}
        className="text-[11px] -mt-2 font-normal text-red-500 flex items-center gap-1"
      />
    </Field>
  );
}
