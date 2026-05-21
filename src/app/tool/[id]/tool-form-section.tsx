"use client";

import { useState, useEffect } from "react";
import type { ToolParam, ToolTestPromptResult } from "@/core/interfaces/tools.interface";
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
  Sparkles,
  AlertCircle,
  Layers,
  Link,
  ListOrdered,
  List,
  CornerDownLeft,
  FileText,
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
import { UrlArrayInput } from "./components/url-array-input";
import { PromptTestSkeleton } from "./components/prompt-test-skeleton";
import { PromptTestPreview } from "./components/prompt-test-preview";
// import { PromptDetectionBar } from "./components/prompt-detection-bar";

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

const URL_TEMPLATES = {
  numbered: "1. https://facebook.com/share/p/1/\n2. https://facebook.com/share/p/2/\n3. https://facebook.com/share/p/3/\n\nช่วยวิเคราะห์ให้หน่อยครับว่า โพสต์ไหนมีแนวโน้มที่คนสนใจจะซื้อสินค้ามากที่สุด? โดยแบ่งกลุ่มคนที่เข้ามาคอมเมนต์ออกเป็น 3 กลุ่มหลัก คือ: 1. กลุ่มที่สนใจซื้อสินค้า 2. กลุ่มที่ไม่สนใจ/ถามเฉยๆ 3. กลุ่มเชิงลบหรือต่อต้าน และช่วยเปรียบเทียบสัดส่วนของแต่ละโพสต์ให้เห็นภาพง่ายที่สุดครับ",
  dashed: "- https://facebook.com/share/p/1/\n- https://facebook.com/share/p/2/\n- https://facebook.com/share/p/3/\n\nช่วยวิเคราะห์ให้หน่อยครับว่า โพสต์ไหนมีแนวโน้มที่คนสนใจจะซื้อสินค้ามากที่สุด? โดยแบ่งกลุ่มคนที่เข้ามาคอมเมนต์ออกเป็น 3 กลุ่มหลัก คือ: 1. กลุ่มที่สนใจซื้อสินค้า 2. กลุ่มที่ไม่สนใจ/ถามเฉยๆ 3. กลุ่มเชิงลบหรือต่อต้าน และช่วยเปรียบเทียบสัดส่วนของแต่ละโพสต์ให้เห็นภาพง่ายที่สุดครับ",
  newline: "https://facebook.com/share/p/1/\nhttps://facebook.com/share/p/2/\nhttps://facebook.com/share/p/3/\n\nช่วยวิเคราะห์ให้หน่อยครับว่า โพสต์ไหนมีแนวโน้มที่คนสนใจจะซื้อสินค้ามากที่สุด? โดยแบ่งกลุ่มคนที่เข้ามาคอมเมนต์ออกเป็น 3 กลุ่มหลัก คือ: 1. กลุ่มที่สนใจซื้อสินค้า 2. กลุ่มที่ไม่สนใจ/ถามเฉยๆ 3. กลุ่มเชิงลบหรือต่อต้าน และช่วยเปรียบเทียบสัดส่วนของแต่ละโพสต์ให้เห็นภาพง่ายที่สุดครับ",
  comma: "https://facebook.com/share/p/1/, https://facebook.com/share/p/2/, https://facebook.com/share/p/3/\n\nช่วยวิเคราะห์ให้หน่อยครับว่า โพสต์ไหนมีแนวโน้มที่คนสนใจจะซื้อสินค้ามากที่สุด? โดยแบ่งกลุ่มคนที่เข้ามาคอมเมนต์ออกเป็น 3 กลุ่มหลัก คือ: 1. กลุ่มที่สนใจซื้อสินค้า 2. กลุ่มที่ไม่สนใจ/ถามเฉยๆ 3. กลุ่มเชิงลบหรือต่อต้าน และช่วยเปรียบเทียบสัดส่วนของแต่ละโพสต์ให้เห็นภาพง่ายที่สุดครับ",
};

function getHelperText(param: ToolParam): string {
  const key = param.key.toLowerCase();

  if (PARAM_HELPERS[key]) {
    return PARAM_HELPERS[key];
  }

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
  onTestPrompt?: () => void;
  isTesting?: boolean;
  testResult?: ToolTestPromptResult | null;
}

export function ToolFormSection(props: ToolFormSectionProps) {
  const {
    params,
    formData,
    errors,
    isRunning,
    onChange,
    onRun,
    onTestPrompt,
    isTesting,
    testResult,
  } = props;

  const clearError = (key: string, value: unknown) => onChange(key, value);

  // Typing animation for placeholderText inside textarea
  const [placeholderText, setPlaceholderText] = useState("");

  useEffect(() => {
    const PROMPTS = [
      "Enter prompt input...\n\nตัวอย่าง:\n1. https://facebook.com/share/p/1/\n2. https://facebook.com/share/p/2/\n3. https://facebook.com/share/p/3/\n\nช่วยวิเคราะห์ให้หน่อยครับว่า โพสต์ไหนมีแนวโน้มที่คนสนใจจะซื้อสินค้ามากที่สุด? โดยแบ่งกลุ่มคนที่เข้ามาคอมเมนต์ออกเป็น 3 กลุ่มหลัก คือ: 1. กลุ่มที่สนใจซื้อสินค้า 2. กลุ่มที่ไม่สนใจ/ถามเฉยๆ 3. กลุ่มเชิงลบหรือต่อต้าน และช่วยเปรียบเทียบสัดส่วนของแต่ละโพสต์ให้เห็นภาพง่ายที่สุดครับ",
      "Enter prompt input...\n\nตัวอย่าง:\n- https://facebook.com/share/p/1/\n- https://facebook.com/share/p/2/\n- https://facebook.com/share/p/3/\n\nช่วยวิเคราะห์ทัศนคติ (Sentiment) ของแต่ละคอมเมนต์ และแยกหัวข้อที่มีการพูดถึงบ่อยที่สุด"
    ];

    let currentPromptIdx = 0;
    let currentCharIdx = 0;
    let isDeleting = false;
    let timer: NodeJS.Timeout;

    const tick = () => {
      const fullText = PROMPTS[currentPromptIdx];
      if (!isDeleting) {
        setPlaceholderText(fullText.slice(0, currentCharIdx + 1));
        currentCharIdx++;
        if (currentCharIdx === fullText.length) {
          timer = setTimeout(() => {
            isDeleting = true;
            tick();
          }, 4500);
          return;
        }
        timer = setTimeout(tick, 25);
      } else {
        setPlaceholderText(fullText.slice(0, currentCharIdx - 1));
        currentCharIdx--;
        if (currentCharIdx === 0) {
          isDeleting = false;
          currentPromptIdx = (currentPromptIdx + 1) % PROMPTS.length;
          timer = setTimeout(tick, 500);
          return;
        }
        timer = setTimeout(tick, 12);
      }
    };

    tick();
    return () => clearTimeout(timer);
  }, []);

  // Check if there is a prompt param
  const promptParam = params.find((param: ToolParam) => param.key === "prompt");
  const hasPrompt = !!promptParam;

  // Single active button state machine configuration
  let buttonLabel = hasPrompt ? "Test prompt" : "Start Automation";
  let buttonIcon = hasPrompt ? (
    <Layers className="size-4 shrink-0" />
  ) : (
    <Play className="size-3.5 fill-white text-white" />
  );
  let buttonAction = hasPrompt ? onTestPrompt : onRun;
  let buttonDisabled = hasPrompt ? isTesting : isRunning;
  let buttonClass =
    "bg-brand hover:bg-brand/90 text-white shadow-sm shadow-brand/10 transition-colors duration-200 border border-transparent";

  if (hasPrompt) {
    if (isTesting) {
      buttonLabel = "Testing...";
      buttonIcon = <Loader2 className="size-4 shrink-0 animate-spin text-white" />;
      buttonAction = undefined;
    } else if (testResult?.success) {
      buttonLabel = "Run Tool";
      buttonIcon = <Play className="size-4 shrink-0 fill-white text-white" />;
      buttonAction = onRun;
      buttonDisabled = isRunning;
      buttonClass =
        "bg-emerald-600 hover:bg-emerald-600/90 text-white shadow-sm shadow-emerald-600/10 transition-colors duration-200 border border-transparent";
    }

    if (isRunning) {
      buttonLabel = "Processing...";
      buttonIcon = <Loader2 className="size-4 shrink-0 animate-spin text-white" />;
      buttonAction = undefined;
      buttonDisabled = true;
    }
  } else {
    if (isRunning) {
      buttonLabel = "Processing...";
      buttonIcon = <Loader2 className="size-4 shrink-0 animate-spin text-white" />;
      buttonAction = undefined;
      buttonDisabled = true;
    }
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-slate-200/60 rounded-2xl overflow-hidden bg-white">
        <div className="bg-linear-to-r from-slate-50/50 via-white to-slate-50/30 border-b border-slate-100/60 px-6 py-5 flex items-center gap-3">
          <div
            className={cn(
              "p-2 border rounded-xl shrink-0 shadow-xs",
              hasPrompt
                ? "bg-indigo-50 border-indigo-100/80 text-brand"
                : "bg-indigo-50 border-indigo-100/80 text-brand"
            )}
          >
            {hasPrompt ? (
              <Sparkles className="size-4 text-brand animate-pulse" />
            ) : (
              <Play className="size-4 fill-brand text-brand" />
            )}
          </div>
          <div>
            <CardTitle className="text-sm font-bold tracking-tight text-slate-800 leading-none">
              {hasPrompt ? "Run Configuration & Prompt Test" : "Run Configuration"}
            </CardTitle>
            <CardDescription className="mt-1 text-[11px] text-slate-400 font-medium">
              {hasPrompt
                ? "Configure parameters and test your prompt before running."
                : "Configure the required parameters to start processing."}
            </CardDescription>
          </div>
        </div>

        <CardContent className="space-y-7 p-6 sm:p-4">
          <div className="space-y-7 relative">
            {(isTesting || isRunning) && (
              <div className="absolute -inset-2 bg-white/40 backdrop-blur-[0.5px] z-30 pointer-events-auto cursor-not-allowed rounded-2xl transition-all duration-300" />
            )}
            {params.map((param: ToolParam) => {
              const helperText = getHelperText(param);
              const isPromptField = param.key === "prompt";

              return (
                <Field key={param.id} className="space-y-2.5">
                  <div className="space-y-1">
                    <FieldLabel
                      htmlFor={param.key}
                      className={cn(
                        "font-semibold text-slate-800 cursor-pointer",
                        isPromptField ? "text-base" : "text-sm"
                      )}
                    >
                      {param.label}
                      {param.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </FieldLabel>
                    {helperText && !errors[param.key] && (
                      <span
                        className={cn(
                          "text-slate-400 font-medium block leading-normal select-none",
                          isPromptField ? "text-[12px]" : "text-[11px]"
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
                  ) : isPromptField ? (
                    <div className="space-y-3">
                      <Textarea
                        id={param.key}
                        placeholder={placeholderText}
                        value={String(formData[param.key] || "")}
                        onChange={(e) => clearError(param.key, e.target.value)}
                        className={cn(
                          "min-h-55 py-4 bg-white border-slate-200/60 focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all rounded-xl px-5 resize-vertical shadow-inner font-medium placeholder:text-slate-400 placeholder:opacity-85 text-slate-700 leading-relaxed text-sm whitespace-pre-wrap",
                          errors[param.key] &&
                          "border-red-500 focus:ring-red-500/20 bg-red-50/30",
                        )}
                      />
                      {/* <PromptDetectionBar text={String(formData[param.key] || "")} /> */}
                      <div className="bg-slate-50/50 rounded-2xl border border-slate-200/50 p-3.5 space-y-3 transition-all duration-300 shadow-2xs">
                        <div className="flex items-center justify-between flex-wrap gap-2 select-none">
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                            <Link className="h-3.5 w-3.5 text-brand" />
                            <span>รูปแบบ URL ที่รองรับ (คลิกเพื่อเติมตัวอย่างด่วน)</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 bg-slate-100/80 px-2 py-0.5 rounded-full border border-slate-200/40">
                            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Auto-fill Template</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => clearError(param.key, URL_TEMPLATES.numbered)}
                            className="group relative flex items-center gap-1.5 h-8 px-2.5 bg-white hover:bg-slate-50 border border-slate-200/60 hover:border-slate-350 text-slate-600 hover:text-slate-900 rounded-xl font-semibold transition-all duration-200 cursor-pointer text-[11px] shadow-2xs hover:shadow-xs hover:-translate-y-0.5"
                          >
                            <ListOrdered className="h-3.5 w-3.5 text-slate-400 group-hover:text-brand transition-colors" />
                            <span>ลำดับ (1. https://...)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => clearError(param.key, URL_TEMPLATES.dashed)}
                            className="group relative flex items-center gap-1.5 h-8 px-2.5 bg-white hover:bg-slate-50 border border-slate-200/60 hover:border-slate-350 text-slate-600 hover:text-slate-900 rounded-xl font-semibold transition-all duration-200 cursor-pointer text-[11px] shadow-2xs hover:shadow-xs hover:-translate-y-0.5"
                          >
                            <List className="h-3.5 w-3.5 text-slate-400 group-hover:text-brand transition-colors" />
                            <span>ขีดละรายการ (- https://...)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => clearError(param.key, URL_TEMPLATES.newline)}
                            className="group relative flex items-center gap-1.5 h-8 px-2.5 bg-white hover:bg-slate-50 border border-slate-200/60 hover:border-slate-350 text-slate-600 hover:text-slate-900 rounded-xl font-semibold transition-all duration-200 cursor-pointer text-[11px] shadow-2xs hover:shadow-xs hover:-translate-y-0.5"
                          >
                            <CornerDownLeft className="h-3.5 w-3.5 text-slate-400 group-hover:text-brand transition-colors" />
                            <span>แยกบรรทัด (https://...)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => clearError(param.key, URL_TEMPLATES.comma)}
                            className="group relative flex items-center gap-1.5 h-8 px-2.5 bg-white hover:bg-slate-50 border border-slate-200/60 hover:border-slate-350 text-slate-600 hover:text-slate-900 rounded-xl font-semibold transition-all duration-200 cursor-pointer text-[11px] shadow-2xs hover:shadow-xs hover:-translate-y-0.5"
                          >
                            <FileText className="h-3.5 w-3.5 text-slate-400 group-hover:text-brand transition-colors" />
                            <span>คั่นด้วยจุลภาค (https://..., ...)</span>
                          </button>
                        </div>
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
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 flex flex-col gap-4 sm:flex-row sm:justify-end items-center">
            {/* Show error notification inline if test fails, otherwise show supported links max count */}
            {hasPrompt && testResult && testResult.error ? (
              <div className="w-full sm:w-auto mr-auto py-1.5 px-3 text-xs font-semibold flex items-center gap-1.5 select-none transition-all duration-200 text-rose-500">
                <AlertCircle className="size-4 shrink-0" />
                <span>{testResult.error}</span>
              </div>
            ) : hasPrompt ? (
              <div className="w-full sm:w-auto mr-auto text-xs font-semibold text-slate-500 select-none py-1 leading-normal">
                รองรับ URL สูงสุด <span className="text-brand font-bold">10 links</span> ต่อครั้ง
              </div>
            ) : null}

            {hasPrompt && testResult?.success && !isTesting ? (
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
                {/* Secondary/Slate outlined Retest button */}
                <Button
                  variant="outline"
                  className="h-10 rounded-xl text-sm px-5 font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer w-full sm:w-auto flex items-center justify-center gap-2 shadow-xs transition-colors duration-200 disabled:opacity-50 border bg-white"
                  onClick={onTestPrompt}
                  disabled={isRunning}
                  type="button"
                >
                  <Layers className="size-4 shrink-0 text-slate-500" />
                  <span>Retest Prompt</span>
                </Button>

                {/* Brand Color Primary Action Button */}
                <Button
                  className="h-10 rounded-xl text-sm px-6 font-semibold bg-brand hover:bg-brand/90 text-white shadow-sm shadow-brand/10 transition-colors duration-200 cursor-pointer w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50"
                  onClick={onRun}
                  disabled={isRunning}
                  type="button"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="size-4 shrink-0 animate-spin text-white" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="size-4 shrink-0 fill-white text-white" />
                      <span>Run Tool</span>
                    </>
                  )}
                </Button>
              </div>
            ) : (
              /* Single Button Mode (Default / Testing / Not Tested / No Prompt) */
              <Button
                className={cn(
                  "h-10 rounded-xl text-sm px-6 font-semibold transition-colors duration-200 disabled:opacity-50 disabled:pointer-events-none cursor-pointer w-full sm:w-auto flex items-center justify-center gap-2 shadow-xs border border-transparent",
                  buttonClass
                )}
                onClick={buttonAction}
                disabled={buttonDisabled}
                type="button"
              >
                {buttonIcon}
                <span>{buttonLabel}</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading Skeleton during prompt testing */}
      {hasPrompt && isTesting && <PromptTestSkeleton />}

      {/* Preview test result */}
      {hasPrompt && testResult && testResult.success && !isTesting && (
        <PromptTestPreview testResult={testResult} />
      )}
    </div>
  );
}
