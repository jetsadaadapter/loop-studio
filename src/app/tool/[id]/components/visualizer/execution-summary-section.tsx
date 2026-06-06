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
    <div className="bg-slate-50/60 p-6 flex-1 min-h-0 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand/5 text-brand rounded-xl border border-brand/10">
                <Sparkles className="size-4 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 tracking-tight font-sans">
                  Execution Summary
                </h3>
                <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5 font-sans">
                  AI-generated overview of the execution result
                </p>
              </div>
            </div>
            {hasMultipleSummaryTabs && (
              <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200/60 self-start sm:self-auto select-none shadow-2xs">
                {uniqueSummaryTabLabels.map((label, idx) => (
                  <button
                    key={`summary-tab-${idx}`}
                    onClick={() => setActiveSummaryTab(idx)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer font-sans",
                      activeSummaryTab === idx
                        ? "bg-white text-slate-850 shadow-xs"
                        : "text-slate-500 hover:text-slate-800",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="text-xs text-slate-700 leading-relaxed font-normal font-sans">
            <Markdown
              components={{
                h1: ({ children, ...props }) => (
                  <h1
                    className="text-base font-bold text-slate-900 mt-4 mb-2 first:mt-0 font-sans"
                    {...props}
                  >
                    {children}
                  </h1>
                ),
                h2: ({ children, ...props }) => (
                  <h2
                    className="text-sm font-bold text-slate-800 mt-3.5 mb-1.5 font-sans"
                    {...props}
                  >
                    {children}
                  </h2>
                ),
                h3: ({ children, ...props }) => (
                  <h3
                    className="text-xs font-bold text-slate-700 mt-3 mb-1 font-sans"
                    {...props}
                  >
                    {children}
                  </h3>
                ),
                p: ({ children, ...props }) => (
                  <p
                    className="text-xs text-slate-650 leading-relaxed mb-3 last:mb-0 font-sans"
                    {...props}
                  >
                    {children}
                  </p>
                ),
                ul: ({ children, ...props }) => (
                  <ul
                    className="list-disc pl-5 mb-3 space-y-1 text-xs text-slate-650 font-sans"
                    {...props}
                  >
                    {children}
                  </ul>
                ),
                ol: ({ children, ...props }) => (
                  <ol
                    className="list-decimal pl-5 mb-3 space-y-1 text-xs text-slate-650 font-sans"
                    {...props}
                  >
                    {children}
                  </ol>
                ),
                li: ({ children, ...props }) => (
                  <li className="leading-relaxed font-sans" {...props}>
                    {children}
                  </li>
                ),
                blockquote: ({ children, ...props }) => (
                  <blockquote
                    className="border-l-3 border-slate-200 pl-3.5 italic text-slate-500 my-3 bg-slate-50/50 py-1 rounded-r-md font-sans"
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
                      className="block overflow-x-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 font-sans my-2"
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    <code
                      className="bg-slate-100 px-1 py-0.5 rounded text-[10.5px] font-sans font-semibold text-slate-800 border border-slate-200/50"
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
                a: ({ children, ...props }) => (
                  <a
                    className="text-brand underline hover:text-brand/80 font-sans"
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
