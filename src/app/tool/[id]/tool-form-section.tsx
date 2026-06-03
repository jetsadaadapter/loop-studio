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
import {
  Play,
  Loader2,
  Sparkles,
  AlertCircle,
  Layers,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FormParamField } from "./components/form/form-param-field";
import { PromptTestSkeleton } from "./components/prompt-test-skeleton";
import { PromptTestPreviewModal } from "./components/prompt-test-preview-modal";

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
  onClearTestResult?: () => void;
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
    onClearTestResult,
  } = props;

  const [advancedExpanded, setAdvancedExpanded] = useState(false);
  const [placeholderText, setPlaceholderText] = useState("");
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  useEffect(() => {
    const PROMPTS = [
      "อยากให้ช่วยวิเคราะห์ข้อมูลแบบไหน บอกได้เลยนะครับ...\n\nตัวอย่าง:\n1. https://facebook.com/share/p/1/\n2. https://facebook.com/share/p/2/\n3. https://facebook.com/share/p/3/\n\nช่วยวิเคราะห์ให้หน่อยครับว่า โพสต์ไหนมีแนวโน้มที่คนสนใจจะซื้อสินค้ามากที่สุด? โดยแบ่งกลุ่มคนที่เข้ามาคอมเมนต์ออกเป็น 3 กลุ่มหลัก คือ: 1. กลุ่มที่สนใจซื้อสินค้า 2. กลุ่มที่ไม่สนใจ/ถามเฉยๆ 3. กลุ่มเชิงลบหรือต่อต้าน และช่วยเปรียบเทียบสัดส่วนของแต่ละโพสต์ให้เห็นภาพง่ายที่สุดครับ",
      "อยากให้ช่วยวิเคราะห์ข้อมูลแบบไหน บอกได้เลยนะครับ...\n\nตัวอย่าง:\n- https://facebook.com/share/p/1/\n- https://facebook.com/share/p/2/\n- https://facebook.com/share/p/3/\n\nช่วยวิเคราะห์ทัศนคติ (Sentiment) ของแต่ละคอมเมนต์ และแยกหัวข้อที่มีการพูดถึงบ่อยที่สุด"
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
    "bg-brand hover:bg-brand/90 text-white shadow-sm hover:shadow-[0_8px_20px_rgba(79,70,229,0.25)] hover:-translate-y-0.5 active:scale-95 duration-200 transition-all border border-transparent";

  if (hasPrompt) {
    if (isTesting) {
      buttonLabel = "Testing...";
      buttonIcon = <Loader2 className="size-4 shrink-0 animate-spin text-white" />;
      buttonAction = undefined;
    } else if (testResult?.success) {
      buttonLabel = "Review & Run";
      buttonIcon = <Play className="size-4 shrink-0 fill-white text-white" />;
      buttonAction = () => setIsPreviewModalOpen(true);
      buttonDisabled = isRunning;
      buttonClass =
        "bg-emerald-600 hover:bg-emerald-600/90 text-white shadow-sm hover:shadow-[0_8px_20px_rgba(16,185,129,0.25)] hover:-translate-y-0.5 active:scale-95 duration-200 transition-all border border-transparent";
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

  // Segment required and advanced parameters
  const requiredParams = params.filter((param) => param.required || param.key === "prompt");
  const advancedParams = params.filter((param) => !param.required && param.key !== "prompt");

  return (
    <div className="space-y-6">
      <Card className="bg-white/70 backdrop-blur-md border border-slate-200/60 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(15,23,42,0.02),0_1px_3px_rgba(15,23,42,0.01)] transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(15,23,42,0.04)]">
        <div className="bg-linear-to-r from-slate-50/80 via-white/40 to-slate-50/20 border-b border-slate-100/60 px-6 py-5 flex items-center gap-3">
          <div className="p-2.5 border border-indigo-100/60 bg-linear-to-br from-indigo-50 to-indigo-100/30 text-brand rounded-xl shrink-0 shadow-2xs">
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
            <CardDescription className="mt-1 text-[11px] text-slate-400 font-semibold">
              {hasPrompt
                ? "Configure parameters and test your prompt before running."
                : "Configure the required parameters to start processing."}
            </CardDescription>
          </div>
        </div>

        <CardContent className="space-y-7 p-6 sm:p-4">
          <div className="space-y-7 relative">
            {(isTesting || isRunning) && (
              <div className="absolute -inset-2 bg-white/45 backdrop-blur-[0.5px] z-30 pointer-events-auto cursor-not-allowed rounded-2xl transition-all duration-300" />
            )}

            {/* Required and Primary parameters */}
            {requiredParams.map((param) => (
              <FormParamField
                key={param.id}
                param={param}
                value={formData[param.key]}
                error={errors[param.key]}
                placeholderText={placeholderText}
                onChange={onChange}
                onSend={param.key === "prompt" ? buttonAction : undefined}
                isSendLoading={param.key === "prompt" ? (isTesting || isRunning) : undefined}
                testResult={param.key === "prompt" ? testResult : undefined}
              />
            ))}

            {/* Advanced Settings Accordion */}
            {advancedParams.length > 0 && (
              <div className="pt-4 border-t border-slate-100 mt-2 select-none">
                <button
                  type="button"
                  onClick={() => setAdvancedExpanded(!advancedExpanded)}
                  className="w-full flex items-center justify-between py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <span>Advanced Settings ({advancedParams.length})</span>
                  <ChevronDown
                    className={cn(
                      "size-4 text-slate-450 transition-transform duration-300",
                      advancedExpanded && "rotate-180"
                    )}
                  />
                </button>

                <div
                  className={cn(
                    "grid transition-all duration-300 ease-in-out",
                    advancedExpanded
                      ? "grid-rows-[1fr] opacity-100 mt-5"
                      : "grid-rows-[0fr] opacity-0 overflow-hidden"
                  )}
                >
                  <div className="overflow-hidden space-y-7">
                    {advancedParams.map((param) => (
                      <FormParamField
                        key={param.id}
                        param={param}
                        value={formData[param.key]}
                        error={errors[param.key]}
                        placeholderText={placeholderText}
                        onChange={onChange}
                        onSend={param.key === "prompt" ? buttonAction : undefined}
                        isSendLoading={param.key === "prompt" ? (isTesting || isRunning) : undefined}
                        testResult={param.key === "prompt" ? testResult : undefined}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {((hasPrompt && testResult && testResult.error) || !hasPrompt) && (
            <div className="pt-6 mt-6 border-t border-slate-100 flex flex-col gap-4 sm:flex-row sm:justify-end items-center select-none">
              {hasPrompt && testResult && testResult.error && (
                <div className="w-full sm:w-auto mr-auto py-1.5 px-3 text-xs font-bold flex items-center gap-1.5 select-none transition-all duration-200 text-rose-500 bg-rose-50 rounded-xl border border-rose-100">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{testResult.error}</span>
                </div>
              )}

              {!hasPrompt && (
                <Button
                  className={cn(
                    "h-10 rounded-xl text-xs font-bold px-6 disabled:opacity-50 disabled:pointer-events-none cursor-pointer w-full sm:w-auto flex items-center justify-center gap-2 shadow-xs border border-transparent",
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
          )}

          {hasPrompt && isTesting && (
            <div className="pt-6 mt-6 border-t border-slate-100">
              <PromptTestSkeleton />
            </div>
          )}

          {hasPrompt && testResult && testResult.success && !isTesting && (
            <div className="pt-6 mt-6 border-t border-slate-100">
              <button
                onClick={() => setIsPreviewModalOpen(true)}
                className="w-full px-6 py-4 rounded-2xl bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200/60 hover:border-emerald-300/80 transition-all hover:shadow-[0_8px_20px_rgba(16,185,129,0.15)] active:scale-95"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100/60 rounded-lg">
                      <Sparkles className="size-4 text-emerald-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-emerald-900">Review Prompt Configuration</p>
                      <p className="text-xs text-emerald-700/70">✓ Successfully tested • Click to view details</p>
                    </div>
                  </div>
                  <ChevronDown className="size-5 text-emerald-600 rotate-180" />
                </div>
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      <PromptTestPreviewModal
        testResult={testResult || { success: false }}
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        onRetry={() => {
          setIsPreviewModalOpen(false);
          onClearTestResult?.();
        }}
        onRun={() => {
          setIsPreviewModalOpen(false);
          onClearTestResult?.();
          onRun();
        }}
      />
    </div>
  );
}
