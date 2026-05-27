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
import { Send, Loader2 } from "lucide-react";

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
      ) : isPromptField ? (
        <div className="space-y-3.5">
          {/* ซ่อน Floating Pill Buttons for Format Templates ตามคำขอ */}
          {/* <div className="select-none"> ... (ปุ่มรูปแบบ url) ... </div> */}

          {/* ChatGPT-style Unified Capsule Container */}
          <div
            className={cn(
              "group/prompt border border-slate-200/80 bg-slate-50/15 focus-within:bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/10 transition-all rounded-2xl flex flex-col shadow-[0_8px_30px_rgba(15,23,42,0.01)] overflow-hidden",
              error &&
                "border-red-500 focus-within:ring-red-500/20 bg-red-50/10",
            )}
          >
            <Textarea
              id={param.key}
              placeholder={
                placeholderText ||
                "อยากให้ช่วยวิเคราะห์ข้อมูลแบบไหน บอกได้เลยนะครับ... (เช่น วิเคราะห์ทัศนคติ แยกแยะกลุ่มผู้ใช้ หรือ ค้นหาความเห็นเชิงบวก/เชิงลบ)"
              }
              value={String(value || "")}
              onChange={(e) => onChange(param.key, e.target.value)}
              className="min-h-58 pb-2 pt-4 bg-transparent border-none focus:outline-none focus:ring-0 focus-visible:ring-0 rounded-none px-5 resize-none shadow-none font-normal placeholder:text-slate-400 placeholder:opacity-85 text-slate-700 leading-relaxed text-sm whitespace-pre-wrap outline-none"
            />

            {/* Embedded Bottom Controls Ribbon */}
            <div className="flex items-center justify-between bg-transparent px-5 pb-4 pt-1.5 select-none text-[10.5px] z-10 w-full shrink-0 flex-wrap gap-3">
              {/* Left Side: Complexity & Clear button */}
              <div className="flex flex-wrap items-center gap-2">
                {(() => {
                  const len = String(value || "").length;
                  const pill =
                    len === 0
                      ? {
                          text: "Empty prompt",
                          cls: "text-slate-400",
                          dot: "bg-slate-300",
                        }
                      : len < 150
                        ? {
                            text: "Simple Scope",
                            cls: "text-sky-600 bg-sky-50/45 border border-sky-100 px-2 py-0.5 rounded-md shadow-3xs",
                            dot: "bg-sky-400",
                          }
                        : len < 500
                          ? {
                              text: "Balanced Query",
                              cls: "text-emerald-600 bg-emerald-50/45 border border-emerald-100 px-2 py-0.5 rounded-md shadow-3xs",
                              dot: "bg-emerald-500",
                            }
                          : {
                              text: "Deep AI Analysis",
                              cls: "text-violet-600 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-md shadow-3xs animate-pulse",
                              dot: "bg-violet-500",
                            };
                  return (
                    <span
                      className={cn(
                        "flex items-center gap-1.5 font-bold",
                        pill.cls,
                      )}
                    >
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          pill.dot,
                        )}
                      ></span>
                      {pill.text}
                    </span>
                  );
                })()}

                {/* Micro Clear button */}
                {String(value || "").length > 0 && (
                  <button
                    type="button"
                    onClick={() => onChange(param.key, "")}
                    className="flex items-center gap-1 text-slate-450 hover:text-rose-500 transition-colors font-bold bg-white border border-slate-200/60 hover:border-rose-100 px-2 py-0.5 rounded-md shadow-3xs hover:bg-rose-50/50 cursor-pointer pointer-events-auto"
                  >
                    Clear Prompt
                  </button>
                )}
              </div>

              {/* Right Side: Send Button */}
              <div className="flex items-center gap-3.5 ml-auto">
                {onSend && (
                  <button
                    type="button"
                    onClick={onSend}
                    disabled={
                      isSendLoading || String(value || "").trim().length === 0
                    }
                    className={cn(
                      "flex items-center justify-center h-7.5 w-7.5 rounded-lg transition-all duration-200 shadow-3xs select-none cursor-pointer border border-transparent shrink-0",
                      isSendLoading
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : String(value || "").trim().length === 0
                          ? "bg-slate-100/80 text-slate-300 border-slate-200/40 cursor-not-allowed"
                          : testResult?.success
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-105 active:scale-95 shadow-md shadow-emerald-500/10"
                            : "bg-brand hover:bg-brand/90 text-white hover:scale-105 active:scale-95 shadow-md shadow-brand/10",
                    )}
                    title={
                      testResult?.success
                        ? "Run Tool Job"
                        : "Test prompt instruction"
                    }
                  >
                    {isSendLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.25 w-3.25 fill-current" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
          {/* Character Count text placed outside the capsule container, at the bottom right corner */}
          <div className="flex justify-end text-[10px] text-slate-400 font-normal select-none mt-1.5 pr-2">
            <span className="text-slate-550 font-normal">
              {String(value || "").length}
            </span>{" "}
            / 2,000 chars
          </div>
        </div>
      ) : param.key === "rawInput" ||
        param.key === "text" ||
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
