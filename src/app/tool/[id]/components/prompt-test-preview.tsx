import { useState, useEffect, useRef } from "react";
import { Sparkles, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolTestPromptResult } from "@/core/interfaces/tools.interface";

interface PromptTestPreviewProps {
  testResult: ToolTestPromptResult;
}

export function PromptTestPreview({ testResult }: PromptTestPreviewProps) {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const element = containerRef.current;
      const headerOffset = 96; // Spacious offset to clear the sticky navbar beautifully
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  }, []);

  if (!testResult.success || !testResult.result) return null;

  const { result } = testResult;

  return (
    <div
      ref={containerRef}
      className="mt-6 p-6 rounded-2xl bg-white border border-slate-200/60 shadow-xs relative overflow-hidden transition-all duration-300 hover:shadow-sm hover:border-slate-300 space-y-6"
    >
      {/* Left Stripe Accent */}
      <div className="bg-gradient-to-b from-brand to-indigo-650 absolute left-0 top-0 bottom-0 w-1.5" />

      {/* Header */}
      <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 pl-2">
        <Sparkles className="size-4.5 text-brand animate-pulse" />
        <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
          Generated Prompt Preview
        </h4>
        <span className="ml-auto rounded-full bg-emerald-500 text-white text-[9px] font-bold px-2.5 py-0.5 shadow-sm shadow-emerald-500/20 uppercase select-none">
          SUCCESSFULLY TESTED
        </span>
      </div>

      <div className="space-y-5 pl-2">
        {/* Target URLs Section */}
        {result.preview?.startUrls && result.preview.startUrls.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
              Target URLs
            </span>
            <ul className="space-y-1.5 pl-4 border-l-2 border-slate-200/80">
              {result.preview.startUrls.map((url: string, i: number) => (
                <li
                  key={i}
                  className="text-xs font-semibold text-slate-650 truncate hover:text-brand transition-colors"
                >
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline flex items-center gap-1"
                  >
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Goal Section */}
        {typeof result.preview.goal === "string" && (
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
              Goal Analysis
            </span>
            <p className="text-xs font-semibold text-slate-700 leading-relaxed bg-slate-50/50 p-3.5 rounded-xl border border-slate-150/60 shadow-inner shadow-slate-100/50">
              {result.preview.goal as string}
            </p>
          </div>
        )}

        {/* System Prompt Section */}
        {typeof result.preview.generatedSystemPrompt === "string" && (
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
              Generated System Prompt
            </span>
            <div className="relative group/prompt rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 transition-all duration-200 shadow-xs hover:border-slate-350">
              <pre className="p-4 pr-24 text-xs font-sans font-semibold text-slate-700 leading-relaxed overflow-x-auto whitespace-pre-wrap select-text max-h-60 overflow-y-auto">
                {result.preview.generatedSystemPrompt as string}
              </pre>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    String(result.preview.generatedSystemPrompt || ""),
                  );
                  setCopiedPrompt(true);
                  setTimeout(() => setCopiedPrompt(false), 2000);
                }}
                className={cn(
                  "absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all active:scale-95 cursor-pointer shadow-xs",
                  copiedPrompt
                    ? "bg-emerald-50 border-emerald-250 text-emerald-700 font-extrabold"
                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800",
                )}
              >
                {copiedPrompt ? (
                  <>
                    <Check className="size-3 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3 text-slate-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Expected Output Schema Section */}
        {result.preview.expectedOutputSchema !== undefined &&
          result.preview.expectedOutputSchema !== null &&
          (() => {
            const schema = result.preview.expectedOutputSchema;
            const hasDescription =
              typeof schema === "object" &&
              schema !== null &&
              "description" in schema;
            const descriptionText = hasDescription
              ? String((schema as { description?: unknown }).description || "")
              : "";

            return (
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                  Expected Output Schema
                </span>
                {hasDescription ? (
                  <p className="text-xs font-semibold text-slate-700 leading-relaxed bg-slate-50/50 p-3.5 rounded-xl border border-slate-150/60 shadow-inner shadow-slate-100/50">
                    {descriptionText}
                  </p>
                ) : (
                  <pre className="bg-slate-50 border border-slate-150 rounded-xl p-4 font-sans text-xs text-slate-650 leading-relaxed overflow-x-auto max-h-60 overflow-y-auto shadow-inner">
                    {typeof schema === "object"
                      ? JSON.stringify(schema, null, 2)
                      : String(schema)}
                  </pre>
                )}
              </div>
            );
          })()}
      </div>
    </div>
  );
}
