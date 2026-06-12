"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { Sparkles, ChevronDown, ChevronRight } from "lucide-react";
import Markdown from "react-markdown";
import { cn } from "@/lib/utils";

interface ExecutionSummarySectionProps {
  displayedSummaryText: string;
  hasMultipleSummaryTabs: boolean;
  uniqueSummaryTabLabels: string[];
  activeSummaryTab: number;
  setActiveSummaryTab: (idx: number) => void;
}

function extractJsonBody(raw: string): string {
  let s = raw.trim();

  // Strip markdown code fences
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  // Remove BOM and zero-width characters
  s = s.replace(/^﻿/, "").replace(/[​-‍﻿]/g, "");

  // Find the first { and slice from there
  const firstBrace = s.indexOf("{");
  if (firstBrace < 0) return s;
  if (firstBrace > 0) s = s.slice(firstBrace);

  // Replace single quotes if no double quotes present
  if (!s.includes('"') && s.includes("'")) {
    s = s.replace(/'/g, '"');
  }

  // Fix unquoted keys
  s = s.replace(/([{,]\s*)([a-zA-Z_]\w*)\s*:/g, '$1"$2":');

  return s;
}

function closeUnclosedJson(s: string): string {
  let braces = 0;
  let brackets = 0;
  let inString = false;
  let escape = false;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") braces++;
    else if (ch === "}") braces--;
    else if (ch === "[") brackets++;
    else if (ch === "]") brackets--;
  }

  if (inString) s += '"';
  while (brackets > 0) { s += "]"; brackets--; }
  while (braces > 0) { s += "}"; braces--; }

  return s;
}

function iterativeJsonRepair(input: string, maxAttempts = 15): string | null {
  let s = input;

  s = s.replace(/,\s*([}\]])/g, "$1");

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      JSON.parse(s);
      return s;
    } catch (e) {
      const msg = (e as Error).message || "";
      const posMatch = msg.match(/position\s+(\d+)/i) || msg.match(/column\s+(\d+)/i);
      const pos = posMatch ? parseInt(posMatch[1], 10) : -1;

      if (pos < 0) {
        if (msg.includes("Unexpected end")) {
          s = closeUnclosedJson(s);
          continue;
        }
        return null;
      }

      // Trailing junk after valid JSON — truncate at that position
      if (msg.includes("after JSON") || msg.includes("non-whitespace")) {
        s = s.slice(0, pos);
        continue;
      }

      if (msg.includes("]")) {
        s = s.slice(0, pos) + "]" + s.slice(pos);
        continue;
      }
      if (msg.includes("}")) {
        s = s.slice(0, pos) + "}" + s.slice(pos);
        continue;
      }
      if (msg.includes("Unexpected end")) {
        s = closeUnclosedJson(s);
        continue;
      }
      if (msg.includes("Unexpected") || msg.includes("Expected")) {
        s = s.slice(0, pos) + "," + s.slice(pos);
        continue;
      }

      return null;
    }
  }

  try {
    JSON.parse(s);
    return s;
  } catch {
    return null;
  }
}

function tryParseStructuredJson(
  text: string,
): Record<string, unknown> | null {
  const trimmed = text.trim();
  if (!trimmed.includes("{")) return null;

  // Try parsing as-is first
  const directParse = (input: string): Record<string, unknown> | null => {
    try {
      const parsed = JSON.parse(input);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
        return null;
      const hasNested = Object.values(parsed).some(
        (v) =>
          (typeof v === "object" && v !== null) ||
          (Array.isArray(v) && v.length > 0),
      );
      return hasNested ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  };

  // Attempt 1: raw trimmed text
  const r1 = directParse(trimmed);
  if (r1) return r1;

  // Attempt 2: extract JSON body (strip prefix, fix quotes/keys)
  const extracted = extractJsonBody(trimmed);
  const r2 = directParse(extracted);
  if (r2) return r2;

  // Attempt 3: iterative repair
  const repaired = iterativeJsonRepair(extracted);
  if (repaired) {
    const r3 = directParse(repaired);
    if (r3) return r3;
  }

  return null;
}

function formatTabLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractPercentage(title: string): string | null {
  const match = title.match(/\((\d+\.?\d*%[^)]*)\)/);
  return match ? match[1] : null;
}

function cleanTitle(title: string): string {
  return title.replace(/\s*\(\d+\.?\d*%[^)]*\)\s*/, "").trim();
}

function renderItemValue(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (typeof v === "object" && v !== null) {
    if (Array.isArray(v)) {
      return v.map(renderItemValue).filter(Boolean).join(", ");
    }
    const obj = v as Record<string, unknown>;
    if (obj.section_title && typeof obj.section_title === "string") {
      return obj.section_title;
    }
    if (obj.title && typeof obj.title === "string") {
      return obj.title;
    }
    if (obj.name && typeof obj.name === "string") {
      return obj.name;
    }
    const entries = Object.entries(obj)
      .filter(([k]) => !k.startsWith("_"))
      .map(([k, val]) => `${k}: ${renderItemValue(val)}`)
      .filter(Boolean);
    if (entries.length > 0 && entries.length <= 3) {
      return entries.join("; ");
    }
  }
  return String(v);
}

function SectionCard({
  title,
  items,
  defaultOpen = true,
}: {
  title: string;
  items: unknown[];
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const percentage = extractPercentage(title);
  const displayTitle = cleanTitle(title);

  const renderedItems = items.map(renderItemValue).filter(Boolean);

  return (
    <div className="rounded-xl border border-slate-200/60 bg-white shadow-xs hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300/60 transition-all duration-300">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isOpen ? (
            <ChevronDown className="size-3.5 text-slate-400 shrink-0" />
          ) : (
            <ChevronRight className="size-3.5 text-slate-400 shrink-0" />
          )}
          <h4 className="text-xs font-bold text-slate-900 truncate font-sans">
            {displayTitle}
          </h4>
        </div>
        {percentage && (
          <span className="shrink-0 rounded-full border border-brand/20 bg-brand/5 px-2 py-0.5 text-[10px] font-bold text-brand tabular-nums">
            {percentage}
          </span>
        )}
      </button>

      {isOpen && renderedItems.length > 0 && (
        <div className="px-4 pb-3 pt-0">
          <ul className="space-y-1.5 pl-5">
            {renderedItems.map((item, idx) => (
              <li
                key={idx}
                className="relative pl-3 text-xs text-slate-700 leading-relaxed font-sans before:content-[''] before:absolute before:left-0 before:top-[7px] before:w-1.5 before:h-1.5 before:rounded-full before:bg-brand/60"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ObjectSection({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data);

  return (
    <div className="space-y-4">
      {entries.map(([key, value]) => {
        if (Array.isArray(value)) {
          return (
            <SectionCard
              key={key}
              title={formatTabLabel(key)}
              items={value}
            />
          );
        }
        if (typeof value === "object" && value !== null) {
          return (
            <div key={key} className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 font-sans uppercase tracking-wider pl-1">
                {formatTabLabel(key)}
              </h3>
              <ObjectSection data={value as Record<string, unknown>} />
            </div>
          );
        }
        return (
          <div
            key={key}
            className="rounded-xl border border-slate-200/60 bg-white p-3.5 sm:p-4 shadow-xs hover:-translate-y-0.5 hover:shadow-md hover:border-slate-350 transition-all duration-300"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans mb-1">
              {formatTabLabel(key)}
            </p>
            <p className="text-xs text-slate-700 font-sans leading-relaxed">
              {renderItemValue(value)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

type StructuredTab = {
  key: string;
  label: string;
  content: Record<string, unknown>;
};

function StructuredView({ data }: { data: Record<string, unknown> }) {
  const topLevelKeys = Object.keys(data);
  const tabs: StructuredTab[] = topLevelKeys
    .filter((key) => {
      const val = data[key];
      return val !== null && typeof val === "object" && !Array.isArray(val);
    })
    .map((key) => ({
      key,
      label: formatTabLabel(key),
      content: data[key] as Record<string, unknown>,
    }));

  const scalarEntries = topLevelKeys.filter((key) => {
    const val = data[key];
    return val === null || typeof val !== "object" || Array.isArray(val);
  });

  const hasTabs = tabs.length > 1;
  const [activeTab, setActiveTab] = useState(0);

  const activeContent = hasTabs
    ? tabs[activeTab]?.content
    : tabs.length === 1
      ? tabs[0].content
      : data;

  return (
    <>
      {hasTabs && (
        <div className="flex items-center bg-slate-100/70 p-0.5 rounded-lg border border-slate-200/40 w-fit ml-auto select-none mb-3">
          {tabs.map((tab, idx) => (
            <button
              type="button"
              key={tab.key}
              onClick={() => setActiveTab(idx)}
              className={cn(
                "px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer font-sans whitespace-nowrap",
                activeTab === idx
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/30"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/40",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {scalarEntries.length > 0 && (
        <div className="grid grid-cols-1 gap-3 mb-4">
          {scalarEntries.map((key) => {
            const val = data[key];
            if (Array.isArray(val)) {
              return (
                <SectionCard
                  key={key}
                  title={formatTabLabel(key)}
                  items={val}
                />
              );
            }
            return (
              <div
                key={key}
                className="rounded-xl border border-slate-200/60 bg-white p-3.5 sm:p-4 shadow-xs hover:-translate-y-0.5 hover:shadow-md hover:border-slate-350 transition-all duration-300"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans mb-1">
                  {formatTabLabel(key)}
                </p>
                <p className="text-xs text-slate-700 font-sans leading-relaxed">
                  {renderItemValue(val)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {activeContent && <ObjectSection data={activeContent} />}
    </>
  );
}

export function ExecutionSummarySection({
  displayedSummaryText,
  hasMultipleSummaryTabs,
  uniqueSummaryTabLabels,
  activeSummaryTab,
  setActiveSummaryTab,
}: ExecutionSummarySectionProps) {
  const structuredData = useMemo(
    () => tryParseStructuredJson(displayedSummaryText),
    [displayedSummaryText],
  );

  return (
    <div className="relative bg-slate-50/30 p-4 sm:p-5 flex-1 min-h-0 overflow-y-auto select-none">
      <div className="max-w-4xl mx-auto space-y-5 motion-enter-1">
        {/* Compact Header */}
        <div className="flex flex-row flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200/60">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-linear-to-br from-brand/10 to-brand/5 text-brand rounded-lg border border-brand/20">
              <Sparkles className="size-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 leading-none">
                Execution Summary
              </h3>
              <p className="text-[10px] text-slate-450 font-semibold mt-1.5 leading-none">
                AI-generated overview of the execution result
              </p>
            </div>
          </div>
          {!structuredData && hasMultipleSummaryTabs && (
            <div className="flex items-center bg-slate-100/70 p-0.5 rounded-lg border border-slate-200/40 select-none">
              {uniqueSummaryTabLabels.map((label, idx) => (
                <button
                  type="button"
                  key={`summary-tab-${idx}`}
                  onClick={() => setActiveSummaryTab(idx)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer font-sans whitespace-nowrap",
                    activeSummaryTab === idx
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200/30"
                      : "text-slate-500 hover:text-slate-800 hover:bg-white/40",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="space-y-4">
          {structuredData ? (
            <StructuredView data={structuredData} />
          ) : (
            <div className="rounded-xl border border-slate-200/60 bg-white p-4 sm:p-5 shadow-xs text-xs text-slate-700 leading-relaxed font-normal font-sans">
              <Markdown
                components={{
                  h1: ({ children, ...props }) => (
                    <h1
                      className="text-sm font-bold text-slate-900 mt-5 mb-3 first:mt-0 pb-1.5 border-b border-slate-200/60 font-sans"
                      {...props}
                    >
                      {children}
                    </h1>
                  ),
                  h2: ({ children, ...props }) => (
                    <h2
                      className="text-xs font-bold text-slate-900 mt-4 mb-2 font-sans"
                      {...props}
                    >
                      {children}
                    </h2>
                  ),
                  h3: ({ children, ...props }) => (
                    <h3
                      className="text-xs font-bold text-slate-800 mt-3 mb-1.5 font-sans"
                      {...props}
                    >
                      {children}
                    </h3>
                  ),
                  p: ({ children, ...props }) => (
                    <p
                      className="text-xs text-slate-700 leading-relaxed mb-3 last:mb-0 font-sans"
                      {...props}
                    >
                      {children}
                    </p>
                  ),
                  ul: ({ children, ...props }) => (
                    <ul
                      className="list-none pl-0 mb-3 space-y-1.5 text-xs text-slate-700 font-sans [&>li]:relative [&>li]:pl-5 [&>li]:before:content-[''] [&>li]:before:absolute [&>li]:before:left-1 [&>li]:before:top-[7px] [&>li]:before:w-1.5 [&>li]:before:h-1.5 [&>li]:before:rounded-full [&>li]:before:bg-brand/60"
                      {...props}
                    >
                      {children}
                    </ul>
                  ),
                  ol: ({ children, ...props }) => (
                    <ol
                      className="list-decimal pl-5 mb-3 space-y-1.5 text-xs text-slate-700 font-sans"
                      {...props}
                    >
                      {children}
                    </ol>
                  ),
                  li: ({ children, ...props }) => (
                    <li
                      className="leading-relaxed font-sans text-xs"
                      {...props}
                    >
                      {children}
                    </li>
                  ),
                  strong: ({ children, ...props }) => (
                    <strong
                      className="font-bold text-slate-900 font-sans"
                      {...props}
                    >
                      {children}
                    </strong>
                  ),
                  blockquote: ({ children, ...props }) => (
                    <blockquote
                      className="border-l-2 border-brand/40 pl-3 py-2 my-3 bg-brand/[0.02] text-slate-700 rounded-r-lg italic font-sans text-xs"
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
                        className="block overflow-x-auto rounded-lg border border-slate-200/60 bg-slate-50/50 p-3 text-[11px] text-slate-800 font-sans my-3"
                        {...props}
                      >
                        {children}
                      </code>
                    ) : (
                      <code
                        className="bg-slate-100/80 px-1.5 py-0.5 rounded text-[11px] font-sans font-semibold text-slate-800 border border-slate-200/60"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children, ...props }) => (
                    <pre
                      className="bg-transparent p-0 my-0 font-sans"
                      {...props}
                    >
                      {children}
                    </pre>
                  ),
                  hr: ({ ...props }) => (
                    <hr
                      className="border-t border-slate-200/60 my-4"
                      {...props}
                    />
                  ),
                  a: ({ children, ...props }) => (
                    <a
                      className="text-brand hover:text-brand-strong font-semibold underline underline-offset-2 decoration-brand/40 hover:decoration-brand transition-colors duration-200 font-sans"
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
          )}
        </div>
      </div>
    </div>
  );
}
