"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Quote, Check, X, FileText, BarChart3, TrendingUp, TrendingDown, AlertCircle, Minus, Activity } from "lucide-react";
import type { AnalysisDisplayEntry } from "../../../tool-job-utils";

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
  const isEvidence = blockId === "evidence";

  const isLongVal =
    typeof entry.value === "string" && (entry.value.length > 150 || entry.value.includes("\n"));
  const isFullWidth = isLongVal || entry.valueType === "object" || entry.valueType === "array";

  const renderValue = () => {
    // 1. JSON structures
    if (entry.valueType === "object" || entry.valueType === "array") {
      return (
        <pre className="mt-1.5 max-h-56 overflow-auto rounded-xl bg-slate-900/90 backdrop-blur-xs p-4 text-[10.5px] font-sans text-slate-300 leading-relaxed border border-slate-800 shadow-inner select-text">
          {entry.value}
        </pre>
      );
    }

    // 2. Boolean Badges
    if (entry.valueType === "boolean") {
      const isTrue = entry.value.toLowerCase() === "true";
      const isNeg = isNegativeKey(entry.key);

      return (
        <div className="mt-1.5 self-start select-none">
          {isTrue ? (
            isNeg ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500 text-white text-[10.5px] font-extrabold rounded-full uppercase shadow-xs shadow-rose-500/25 border border-rose-450 animate-fade-in">
                <X className="size-3 text-white stroke-[3px]" />
                <span>{entry.value}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-white text-[10.5px] font-extrabold rounded-full uppercase shadow-xs shadow-emerald-500/25 border border-emerald-450 animate-fade-in">
                <Check className="size-3 text-white stroke-[3px]" />
                <span>{entry.value}</span>
              </span>
            )
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 text-[10.5px] font-extrabold rounded-full uppercase border border-slate-200 shadow-3xs animate-fade-in">
              <X className="size-3 text-slate-450 stroke-[3px]" />
              <span>{entry.value}</span>
            </span>
          )}
        </div>
      );
    }

    // 3. Numbers
    if (isMetrics && entry.valueType === "number") {
      const numVal = parseFloat(entry.value);
      const hasPercentage = !isNaN(numVal);
      const percentage = hasPercentage
        ? numVal <= 1 && numVal >= 0
          ? numVal * 100
          : numVal > 1 && numVal <= 100
            ? numVal
            : 0
        : 0;

      // Determine color based on percentage value
      const getBarColor = () => {
        const keyLower = entry.key.toLowerCase();
        if (keyLower.includes('want_to_buy') || keyLower.includes('buy')) {
          if (percentage >= 70) return 'from-emerald-400 via-emerald-500 to-emerald-600';
          if (percentage >= 40) return 'from-amber-400 via-amber-500 to-amber-600';
          return 'from-orange-400 via-orange-500 to-orange-600';
        }
        if (keyLower.includes('negative')) {
          if (percentage > 20) return 'from-rose-400 via-rose-500 to-rose-600';
          return 'from-slate-300 via-slate-400 to-slate-500';
        }
        if (keyLower.includes('indifferent')) {
          return 'from-blue-300 via-blue-400 to-blue-500';
        }
        return 'from-amber-400 via-amber-500 to-brand-strong';
      };

      return (
        <div className="mt-1.5 space-y-2.5 animate-fade-in">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black tracking-tight select-text leading-none font-sans bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent drop-shadow-sm">
              {entry.value}
            </span>
          </div>
          {hasPercentage && percentage > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[9px] font-bold text-slate-500">
                <span>Intent Level</span>
                <span className="tabular-nums">{percentage.toFixed(0)}%</span>
              </div>
              <div className="relative w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/40 shadow-inner">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700 ease-out shadow-sm",
                    `bg-gradient-to-r ${getBarColor()}`
                  )}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
      );
    }

    // 4. Short strings (like categories, sentiments)
    if (entry.valueType === "text" && entry.value.length <= 20) {
      const norm = entry.value.toLowerCase().trim();
      const isPos = ["positive", "interested", "buy", "yes", "success", "active"].some((t) => norm.includes(t));
      const isNeg = ["negative", "opposed", "disinterested", "no", "fail", "failed"].some((t) => norm.includes(t));

      if (isPos) {
        return (
          <div className="mt-1.5 self-start select-none">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-white text-[10.5px] font-extrabold rounded-full uppercase border border-emerald-450 shadow-xs shadow-emerald-500/20">
              <span className="size-1.5 rounded-full bg-white shrink-0 animate-ping" />
              <span>{entry.value}</span>
            </span>
          </div>
        );
      }
      if (isNeg) {
        return (
          <div className="mt-1.5 self-start select-none">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500 text-white text-[10.5px] font-extrabold rounded-full uppercase border border-rose-450 shadow-xs shadow-rose-500/20">
              <span className="size-1.5 rounded-full bg-white shrink-0 animate-ping" />
              <span>{entry.value}</span>
            </span>
          </div>
        );
      }
      return (
        <div className="mt-1.5 self-start select-none">
          <span className="inline-flex items-center px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-[10.5px] font-extrabold rounded-full capitalize">
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
        <div className="space-y-2 mt-2 select-text">
          <div className="relative overflow-hidden rounded-xl bg-slate-50/70 p-4 border border-slate-100/60 shadow-2xs">
            {/* Background quote mark watermark */}
            <div className="absolute right-2 top-2 text-slate-200 opacity-20 pointer-events-none select-none">
              <Quote className="size-8 transform rotate-180" />
            </div>

            <div className="flex gap-2">
              <div className={cn(
                "w-1 shrink-0 rounded-full",
                blockId === "evidence" ? "bg-emerald-500" :
                blockId === "summary" ? "bg-violet-500" : "bg-slate-350"
              )} />
              <p className="text-[11.5px] text-slate-700 leading-relaxed font-medium pl-1 italic font-sans">
                &ldquo;{needsCollapse ? displayedText : entry.value}&rdquo;
              </p>
            </div>

            {needsCollapse && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-[10.5px] text-brand hover:text-brand-strong font-extrabold mt-3 inline-flex items-center gap-0.5 cursor-pointer transition-colors relative z-10"
              >
                {isExpanded ? "Show Less" : "Show More"}
              </button>
            )}
          </div>
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

  // Determine visual theme based on metric type and value
  const getMetricTheme = () => {
    if (!isMetrics) return null;

    const keyLower = entry.key.toLowerCase();
    const value = entry.value;
    const numValue = typeof value === 'string' ? parseFloat(value.replace('%', '')) : 0;

    // Buy intent / positive metrics
    if (keyLower.includes('want_to_buy') || keyLower.includes('buy') || keyLower.includes('purchase')) {
      if (numValue >= 70) return { bg: 'bg-emerald-50/50', border: 'border-emerald-200/60', text: 'text-emerald-700', Icon: TrendingUp };
      if (numValue >= 40) return { bg: 'bg-amber-50/50', border: 'border-amber-200/60', text: 'text-amber-700', Icon: BarChart3 };
      return { bg: 'bg-orange-50/50', border: 'border-orange-200/60', text: 'text-orange-700', Icon: TrendingDown };
    }

    // Negative metrics
    if (keyLower.includes('negative') || keyLower.includes('opposed')) {
      if (numValue > 20) return { bg: 'bg-rose-50/50', border: 'border-rose-200/60', text: 'text-rose-700', Icon: AlertCircle };
      return { bg: 'bg-slate-50/50', border: 'border-slate-200/60', text: 'text-slate-600', Icon: Minus };
    }

    // Neutral / indifferent
    if (keyLower.includes('indifferent') || keyLower.includes('neutral')) {
      return { bg: 'bg-blue-50/50', border: 'border-blue-200/60', text: 'text-blue-700', Icon: Minus };
    }

    return { bg: 'bg-slate-50/50', border: 'border-slate-200/60', text: 'text-slate-600', Icon: Activity };
  };

  const metricTheme = isMetrics ? getMetricTheme() : null;

  return (
    <div
      className={cn(
        "rounded-xl border transition-all duration-300 flex flex-col justify-between gap-2 relative overflow-hidden group",
        isFullWidth ? "sm:col-span-2 p-4" : "col-span-1 p-3",
        metricTheme ?
          `${metricTheme.bg} ${metricTheme.border} hover:shadow-md hover:scale-[1.01]` :
          "bg-white border-slate-200/60 hover:border-slate-300 hover:shadow-sm"
      )}
    >
      {/* Decorative corner element for metrics */}
      {metricTheme && (
        <div className="absolute top-0 right-0 w-16 h-16 opacity-10">
          <div className={cn("absolute inset-0 rotate-45 translate-x-8 -translate-y-8", metricTheme.bg.replace('/50', ''))} />
        </div>
      )}

      <div className="space-y-2 relative z-10">
        <div className="flex items-center gap-1.5 select-none min-w-0">
          {metricTheme && (() => {
            const { Icon } = metricTheme;
            return <Icon className={cn("size-3 shrink-0", metricTheme.text)} />;
          })()}
          <p className={cn(
            "text-[10px] font-extrabold uppercase tracking-wider truncate",
            metricTheme ? metricTheme.text : "text-slate-500"
          )}>
            {formattedKey}
          </p>
        </div>
        {isEvidence && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-650 text-[8.5px] font-extrabold rounded-md border border-emerald-100">
            <FileText className="size-2" />
            <span>Source</span>
          </span>
        )}
        {renderValue()}
      </div>
    </div>
  );
}
