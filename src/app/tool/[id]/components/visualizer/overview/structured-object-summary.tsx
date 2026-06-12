"use client";

import { useState } from "react";
import { Sparkles, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StructuredObjectSummaryProps {
  data: Record<string, unknown>;
}

type TabEntry = {
  key: string;
  label: string;
  content: Record<string, unknown>;
};

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

function ObjectSection({
  data,
}: {
  data: Record<string, unknown>;
}) {
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

export function StructuredObjectSummary({ data }: StructuredObjectSummaryProps) {
  const topLevelKeys = Object.keys(data);
  const tabs: TabEntry[] = topLevelKeys
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

          {hasTabs && (
            <div className="flex items-center bg-slate-100/70 p-0.5 rounded-lg border border-slate-200/40 select-none">
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
        </div>

        {/* Content Area */}
        <div className="space-y-4">
          {/* Scalar fields at top level (if any) */}
          {scalarEntries.length > 0 && (
            <div className="grid grid-cols-1 gap-3">
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

          {/* Main structured content */}
          {activeContent && (
            <ObjectSection data={activeContent} />
          )}
        </div>
      </div>
    </div>
  );
}
