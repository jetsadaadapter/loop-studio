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
    <div className="relative bg-slate-50/30 p-6 sm:p-8 md:p-10 flex-1 min-h-0 overflow-y-auto">
      {/* Ambient Glassmorphism Bubbles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 opacity-40">
        <div className="about-bubble-1 animate-blob rounded-full blur-3xl absolute" />
        <div className="about-bubble-2 animate-blob-reverse rounded-full blur-3xl absolute" />
      </div>

      <div className="max-w-4xl mx-auto motion-enter-1">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-xs p-6 sm:p-8 md:p-10 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300/60 transition-all duration-300 space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200/60">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-brand/10 to-brand/5 text-brand rounded-xl border border-brand/20">
                <Sparkles className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-sans">
                  Execution Summary
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1 font-sans">
                  AI-generated overview of the execution result
                </p>
              </div>
            </div>
            {hasMultipleSummaryTabs && (
              <div className="flex items-center bg-slate-50/80 rounded-xl p-1 border border-slate-200/50 w-full sm:w-auto justify-center select-none">
                {uniqueSummaryTabLabels.map((label, idx) => (
                  <button
                    key={`summary-tab-${idx}`}
                    onClick={() => setActiveSummaryTab(idx)}
                    className={cn(
                      "flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer font-sans text-center",
                      activeSummaryTab === idx
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-800 hover:bg-white/50",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="text-sm text-slate-700 leading-relaxed font-normal font-sans">
            <Markdown
              components={{
                h1: ({ children, ...props }) => (
                  <h1
                    className="text-lg font-bold text-slate-900 mt-8 mb-4 first:mt-0 pb-2 border-b border-slate-200/60 font-sans"
                    {...props}
                  >
                    {children}
                  </h1>
                ),
                h2: ({ children, ...props }) => (
                  <h2
                    className="text-base font-bold text-slate-900 mt-6 mb-3 font-sans"
                    {...props}
                  >
                    {children}
                  </h2>
                ),
                h3: ({ children, ...props }) => (
                  <h3
                    className="text-sm font-bold text-slate-800 mt-5 mb-2 font-sans"
                    {...props}
                  >
                    {children}
                  </h3>
                ),
                p: ({ children, ...props }) => (
                  <p
                    className="text-sm text-slate-700 leading-relaxed mb-4 last:mb-0 font-sans"
                    {...props}
                  >
                    {children}
                  </p>
                ),
                ul: ({ children, ...props }) => (
                  <ul
                    className="list-none pl-0 mb-4 space-y-2.5 text-sm text-slate-700 font-sans [&>li]:relative [&>li]:pl-6 [&>li]:before:content-[''] [&>li]:before:absolute [&>li]:before:left-1.5 [&>li]:before:top-[9px] [&>li]:before:w-1.5 [&>li]:before:h-1.5 [&>li]:before:rounded-full [&>li]:before:bg-brand/60"
                    {...props}
                  >
                    {children}
                  </ul>
                ),
                ol: ({ children, ...props }) => (
                  <ol
                    className="list-decimal pl-6 mb-4 space-y-2.5 text-sm text-slate-700 font-sans"
                    {...props}
                  >
                    {children}
                  </ol>
                ),
                li: ({ children, ...props }) => (
                  <li className="leading-relaxed font-sans text-sm" {...props}>
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
                    className="border-l-3 border-brand/40 pl-4 py-3 my-4 bg-brand/[0.02] text-slate-700 rounded-r-xl italic font-sans text-sm"
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
                      className="block overflow-x-auto rounded-xl border border-slate-200/60 bg-slate-50/50 p-4 text-xs text-slate-800 font-sans my-4"
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    <code
                      className="bg-slate-100/80 px-2 py-0.5 rounded-md text-xs font-sans font-semibold text-slate-800 border border-slate-200/60"
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
                  <hr className="border-t border-slate-200/60 my-6" {...props} />
                ),
                a: ({ children, ...props }) => (
                  <a
                    className="text-brand hover:text-brand-strong font-semibold underline underline-offset-4 decoration-brand/40 hover:decoration-brand transition-colors duration-200 font-sans"
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
