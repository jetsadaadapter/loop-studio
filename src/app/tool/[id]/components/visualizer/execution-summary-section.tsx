"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import Markdown from "react-markdown";
import { cn } from "@/lib/utils";

interface ExecutionSummarySectionProps {
  displayedSummaryText: string;
  hasMultipleSummaryTabs: boolean;
  uniqueSummaryTabLabels: string[];
  activeSummaryTab: number;
  setActiveSummaryTab: (idx: number) => void;
}

export function ExecutionSummarySection({
  displayedSummaryText,
  hasMultipleSummaryTabs,
  uniqueSummaryTabLabels,
  activeSummaryTab,
  setActiveSummaryTab,
}: ExecutionSummarySectionProps) {
  return (
    <div className="relative bg-gradient-to-b from-slate-50/50 via-white/80 to-slate-50/50 p-3 xs:p-4 sm:p-6 md:p-8 flex-1 min-h-0 overflow-y-auto">
      {/* Ambient Glassmorphism Bubbles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 opacity-70">
        <div className="about-bubble-1 animate-blob rounded-full blur-3xl absolute" />
        <div className="about-bubble-2 animate-blob-reverse rounded-full blur-3xl absolute" />
      </div>

      <div className="max-w-4xl mx-auto motion-enter-1">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/50 shadow-sm p-4 sm:p-6 md:p-8 hover:shadow-md hover:border-slate-200 transition-all duration-300 space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100/80 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-gradient-to-tr from-brand/10 to-brand/5 text-brand rounded-xl border border-brand/20 shadow-2xs shadow-brand/5">
                <Sparkles className="size-4.5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight font-sans">
                  Execution Summary
                </h3>
                <p className="text-[11px] text-slate-500 font-medium leading-none mt-1.5 font-sans">
                  AI-generated overview of the execution result
                </p>
              </div>
            </div>
            {hasMultipleSummaryTabs && (
              <div className="flex items-center bg-slate-100/80 backdrop-blur-xs rounded-xl p-1 border border-slate-200/50 w-full sm:w-auto justify-center select-none shadow-2xs">
                {uniqueSummaryTabLabels.map((label, idx) => (
                  <button
                    key={`summary-tab-${idx}`}
                    onClick={() => setActiveSummaryTab(idx)}
                    className={cn(
                      "flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer font-sans text-center",
                      activeSummaryTab === idx
                        ? "bg-white text-slate-900 shadow-sm border border-slate-200/50 scale-[1.02]"
                        : "text-slate-500 hover:text-slate-800 hover:bg-white/40",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="text-[13.5px] sm:text-sm text-slate-650 leading-relaxed font-normal font-sans">
            <Markdown
              components={{
                h1: ({ children, ...props }) => (
                  <h1
                    className="text-base font-bold text-slate-900 mt-6 mb-3 first:mt-0 pb-1.5 border-b border-slate-100 font-sans tracking-tight"
                    {...props}
                  >
                    {children}
                  </h1>
                ),
                h2: ({ children, ...props }) => (
                  <h2
                    className="text-[15px] font-bold text-slate-850 mt-5 mb-2 font-sans tracking-tight"
                    {...props}
                  >
                    {children}
                  </h2>
                ),
                h3: ({ children, ...props }) => (
                  <h3
                    className="text-sm font-semibold text-slate-800 mt-4 mb-2 font-sans tracking-tight"
                    {...props}
                  >
                    {children}
                  </h3>
                ),
                p: ({ children, ...props }) => (
                  <p
                    className="text-[13.5px] sm:text-sm text-slate-600 leading-relaxed mb-3 sm:mb-4 last:mb-0 font-sans"
                    {...props}
                  >
                    {children}
                  </p>
                ),
                ul: ({ children, ...props }) => (
                  <ul
                    className="list-none pl-0 mb-4 space-y-3 text-[13.5px] sm:text-sm text-slate-600 font-sans [&>li]:relative [&>li]:pl-5 sm:[&>li]:pl-6 [&>li]:before:content-[''] [&>li]:before:absolute [&>li]:before:left-1 [&>li]:before:top-[8px] [&>li]:before:w-1.5 [&>li]:before:h-1.5 [&>li]:before:rounded-full [&>li]:before:bg-brand/50"
                    {...props}
                  >
                    {children}
                  </ul>
                ),
                ol: ({ children, ...props }) => (
                  <ol
                    className="list-decimal pl-5 mb-4 space-y-2 text-[13.5px] sm:text-sm text-slate-600 font-sans"
                    {...props}
                  >
                    {children}
                  </ol>
                ),
                li: ({ children, ...props }) => (
                  <li className="leading-relaxed font-sans text-[13.5px] sm:text-sm" {...props}>
                    {children}
                  </li>
                ),
                strong: ({ children, ...props }) => (
                  <strong className="font-bold text-slate-900 font-sans" {...props}>
                    {children}
                  </strong>
                ),
                blockquote: ({ children, ...props }) => (
                  <blockquote
                    className="border-l-4 border-brand/30 pl-4 py-2.5 my-4 bg-brand/[0.02] text-slate-600 rounded-r-lg italic font-sans text-[13.5px] sm:text-sm"
                    {...props}
                  >
                    {children}
                  </blockquote>
                ),
                code: ({
                  className,
                  children,
                  ...props
                }: React.HTMLAttributes<HTMLElement>) => {
                  const isBlock =
                    className?.includes("language-") ||
                    (children && String(children).includes("\n"));
                  return isBlock ? (
                    <code
                      className="block overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-xs text-slate-800 font-mono my-3 shadow-2xs"
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    <code
                      className="bg-slate-100/80 px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold text-slate-800 border border-slate-200/50"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                pre: ({ children, ...props }) => (
                  <pre className="bg-transparent p-0 my-0 font-sans" {...props}>
                    {children}
                  </pre>
                ),
                hr: ({ ...props }) => (
                  <hr className="border-t border-slate-100 my-5" {...props} />
                ),
                a: ({ children, ...props }) => (
                  <a
                    className="text-brand hover:text-brand-strong font-medium underline underline-offset-4 decoration-brand/30 hover:decoration-brand-strong transition-colors duration-150 font-sans"
                    {...props}
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {displayedSummaryText}
            </Markdown>
          </div>
        </div>
      </div>
    </div>
  );
}
