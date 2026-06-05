"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { AnalysisDisplayEntry } from "../../tool-job-utils";

interface AnalysisBlockEntryProps {
  entry: AnalysisDisplayEntry;
  blockId: string;
}

const formatEntryKey = (key: string): string => {
  let formatted = key
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ");

  if (!formatted.includes(" ")) {
    formatted = formatted
      .replace(/(post|page|summary|analysis|time|date|id|name|text|likes|shares|score|count|ratio|sentiment|intent|purchase)/gi, " $1")
      .trim();
  }

  return formatted
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const isNegativeKey = (key: string): boolean => {
  const norm = key.toLowerCase();
  return ["toxic", "spam", "error", "fail", "opposed", "negative", "hate", "abuse"].some((k) =>
    norm.includes(k)
  );
};

export function AnalysisBlockEntry({ entry, blockId }: AnalysisBlockEntryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const formattedKey = formatEntryKey(entry.key);
  const isMetrics = blockId === "metrics";

  const isLongVal =
    typeof entry.value === "string" && (entry.value.length > 150 || entry.value.includes("\n"));
  const isFullWidth = isLongVal || entry.valueType === "object" || entry.valueType === "array";

  const renderValue = () => {
    // 1. JSON structures
    if (entry.valueType === "object" || entry.valueType === "array") {
      return (
        <pre className="mt-1.5 max-h-56 overflow-auto rounded-xl bg-slate-950 p-4 text-[10.5px] font-sans text-slate-200 leading-relaxed border border-slate-850 shadow-inner select-text">
          {entry.value}
        </pre>
      );
    }

    // 2. Boolean Badges
    if (entry.valueType === "boolean") {
      const isTrue = entry.value.toLowerCase() === "true";
      const isNeg = isNegativeKey(entry.key);

      if (isTrue) {
        if (isNeg) {
          return (
            <div className="mt-1.5 self-start select-none">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black rounded-lg uppercase shadow-3xs">
                <span className="size-1.5 rounded-full bg-rose-500 shrink-0 animate-pulse" />
                <span>{entry.value}</span>
              </span>
            </div>
          );
        } else {
          return (
            <div className="mt-1.5 self-start select-none">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-250/60 text-emerald-700 text-xs font-black rounded-lg uppercase shadow-3xs">
                <span className="size-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                <span>{entry.value}</span>
              </span>
            </div>
          );
        }
      } else {
        return (
          <div className="mt-1.5 self-start select-none">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 text-slate-500 text-xs font-bold rounded-lg uppercase shadow-3xs">
              <span className="size-1.5 rounded-full bg-slate-400 shrink-0" />
              <span>{entry.value}</span>
            </span>
          </div>
        );
      }
    }

    // 3. Numbers
    if (isMetrics && entry.valueType === "number") {
      return (
        <p className="mt-1 text-3xl font-black text-slate-800 tracking-tight select-text leading-none font-sans py-1.5">
          {entry.value}
        </p>
      );
    }

    // 4. Short strings (like categories, sentiments)
    if (entry.valueType === "text" && entry.value.length <= 20) {
      const norm = entry.value.toLowerCase().trim();
      const isPos = ["positive", "interested", "buy", "yes", "success", "active"].includes(norm);
      const isNeg = ["negative", "opposed", "disinterested", "no", "fail", "failed"].includes(norm);

      if (isPos) {
        return (
          <div className="mt-1.5 self-start select-none">
            <span className="inline-flex items-center px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black rounded-lg uppercase">
              {entry.value}
            </span>
          </div>
        );
      }
      if (isNeg) {
        return (
          <div className="mt-1.5 self-start select-none">
            <span className="inline-flex items-center px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black rounded-lg uppercase">
              {entry.value}
            </span>
          </div>
        );
      }
      return (
        <div className="mt-1.5 self-start select-none">
          <span className="inline-flex items-center px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-650 text-xs font-bold rounded-lg capitalize">
            {entry.value}
          </span>
        </div>
      );
    }

    // 5. Expandable / long text values
    if (isLongVal) {
      const limit = 200;
      const needsCollapse = entry.value.length > limit;
      const displayedText = isExpanded ? entry.value : entry.value.slice(0, limit) + "...";

      return (
        <div className="space-y-1.5 mt-1.5">
          <p className="text-xs text-slate-700 leading-relaxed select-text wrap-break-word font-normal bg-slate-50/50 p-3 rounded-lg border border-slate-100/60 animate-fade-in">
            {needsCollapse ? displayedText : entry.value}
          </p>
          {needsCollapse && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[10px] text-brand hover:text-brand-strong font-black mt-1 inline-flex items-center gap-0.5 cursor-pointer transition-colors"
            >
              {isExpanded ? "Show Less" : "Show More"}
            </button>
          )}
        </div>
      );
    }

    // Default basic text value
    return (
      <p className="mt-1 text-xs text-slate-700 leading-relaxed select-text wrap-break-word font-semibold">
        {entry.value}
      </p>
    );
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-150/70 bg-white p-4 transition-all duration-200 hover:border-slate-300 hover:shadow-3xs flex flex-col justify-between gap-2.5",
        isFullWidth ? "sm:col-span-2" : "col-span-1"
      )}
    >
      <div className="space-y-1">
        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 select-none">
          {formattedKey}
        </p>
        {renderValue()}
      </div>
    </div>
  );
}
