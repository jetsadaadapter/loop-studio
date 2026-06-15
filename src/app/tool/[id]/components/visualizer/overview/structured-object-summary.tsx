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

      {isOpen && items.length > 0 && (
        <div className="px-4 pb-3.5 pt-0">
          <div className="space-y-2">
            {items.map((item, idx) => {
              if (item === null || item === undefined) return null;

              // If it's a scalar value, render as a bullet list item
              if (typeof item === "string" || typeof item === "number" || typeof item === "boolean") {
                return (
                  <div
                    key={idx}
                    className="relative pl-4 text-xs text-slate-700 leading-relaxed font-sans before:content-[''] before:absolute before:left-1 before:top-[7px] before:w-1.5 before:h-1.5 before:rounded-full before:bg-brand/60"
                  >
                    {String(item)}
                  </div>
                );
              }

              // If it's an array, render inline list
              if (Array.isArray(item)) {
                return (
                  <div key={idx} className="flex flex-wrap gap-1.5 pl-1">
                    {item.map((sub, sIdx) => (
                      <span key={sIdx} className="bg-slate-50 border border-slate-200 text-slate-600 rounded px-1.5 py-0.5 text-[10.5px] font-medium">
                        {String(sub)}
                      </span>
                    ))}
                  </div>
                );
              }

              // If it's a structured object, render a beautiful card
              if (typeof item === "object") {
                const obj = item as Record<string, unknown>;
                
                // Extract primary display fields
                let primaryText = "";
                if (typeof obj.label === "string" || typeof obj.label === "number") {
                  primaryText = String(obj.label);
                } else if (typeof obj.title === "string") {
                  primaryText = obj.title;
                } else if (typeof obj.section_title === "string") {
                  primaryText = obj.section_title;
                } else if (typeof obj.comment === "string") {
                  primaryText = obj.comment;
                }

                // Filter out primary text and metadata fields
                const otherEntries = Object.entries(obj).filter(
                  ([k]) => k !== "label" && k !== "title" && k !== "section_title" && k !== "comment" && k !== "section_id" && k !== "row_id" && !k.startsWith("_")
                );

                return (
                  <div key={idx} className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200/50 rounded-xl p-3 space-y-1.5 transition-all duration-200 hover:shadow-3xs">
                    {primaryText && (
                      <div className="font-extrabold text-slate-800 leading-snug text-xs flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-brand/60 shrink-0" />
                        {primaryText}
                      </div>
                    )}
                    {otherEntries.length > 0 && (
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 pl-3 pt-0.5">
                        {otherEntries.map(([k, val]) => {
                          const cleanVal = String(val);
                          const isUrl = cleanVal.startsWith("http://") || cleanVal.startsWith("https://");
                          let displayVal = cleanVal;
                          if (isUrl) {
                            try {
                              const u = new URL(cleanVal);
                              displayVal = u.hostname.replace("www.", "") + (u.pathname.length > 15 ? u.pathname.slice(0, 15) + "..." : u.pathname);
                            } catch {
                              displayVal = cleanVal.slice(0, 25) + "...";
                            }
                          }

                          return (
                            <div key={k} className="flex items-center gap-1 text-[11px] font-medium">
                              <span className="text-slate-400 capitalize">{k.replace(/_/g, " ")}:</span>
                              {isUrl ? (
                                <a
                                  href={cleanVal}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-brand hover:text-brand/80 hover:underline font-bold flex items-center gap-0.5"
                                >
                                  <span>{displayVal}</span>
                                  <span className="text-[9px] text-slate-400">↗</span>
                                </a>
                              ) : (
                                <span className="font-bold text-slate-655">{cleanVal}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function isScalarLike(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === "number" || typeof v === "boolean") return true;
  if (typeof v === "string") return v.length <= 60;
  return false;
}

function isScalarObject(obj: Record<string, unknown>): boolean {
  const vals = Object.values(obj);
  return vals.length > 0 && vals.every(isScalarLike);
}

function MetricChip({ label, value }: { label: string; value: unknown }) {
  const isNum = typeof value === "number";
  const isBool = typeof value === "boolean";
  const display = isBool ? (value ? "✓ Yes" : "✗ No") : renderItemValue(value);
  const boolColor = isBool
    ? value
      ? "text-emerald-700 bg-emerald-50 border-emerald-200/60"
      : "text-rose-600 bg-rose-50 border-rose-200/60"
    : "";

  return (
    <div className={`flex flex-col gap-0.5 px-3 py-2 rounded-lg border ${isBool ? boolColor : "bg-white border-slate-200/60"} shadow-xs`}>
      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-sans leading-none">
        {label}
      </span>
      <span className={`text-sm font-bold font-sans leading-tight ${isNum ? "text-slate-900 tabular-nums" : isBool ? "inherit" : "text-slate-700"}`}>
        {display}
      </span>
    </div>
  );
}

function ObjectSection({
  data,
}: {
  data: Record<string, unknown>;
}) {
  const entries = Object.entries(data);

  if (isScalarObject(data)) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {entries.map(([key, value]) => (
          <MetricChip key={key} label={formatTabLabel(key)} value={value} />
        ))}
      </div>
    );
  }

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
          const nested = value as Record<string, unknown>;
          if (isScalarObject(nested)) {
            return (
              <div key={key} className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-500 font-sans uppercase tracking-wider">
                  {formatTabLabel(key)}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(nested).map(([k, v]) => (
                    <MetricChip key={k} label={formatTabLabel(k)} value={v} />
                  ))}
                </div>
              </div>
            );
          }
          return (
            <div key={key} className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 font-sans uppercase tracking-wider pl-1">
                {formatTabLabel(key)}
              </h3>
              <ObjectSection data={nested} />
            </div>
          );
        }
        if (isScalarLike(value)) {
          return (
            <MetricChip key={key} label={formatTabLabel(key)} value={value} />
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
          {scalarEntries.length > 0 && (() => {
            const arrays = scalarEntries.filter(k => Array.isArray(data[k]));
            const scalars = scalarEntries.filter(k => !Array.isArray(data[k]) && isScalarLike(data[k]));
            const other = scalarEntries.filter(k => !Array.isArray(data[k]) && !isScalarLike(data[k]));
            return (
              <div className="space-y-3">
                {arrays.map(key => (
                  <SectionCard key={key} title={formatTabLabel(key)} items={data[key] as unknown[]} />
                ))}
                {scalars.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {scalars.map(key => (
                      <MetricChip key={key} label={formatTabLabel(key)} value={data[key]} />
                    ))}
                  </div>
                )}
                {other.map(key => (
                  <div
                    key={key}
                    className="rounded-xl border border-slate-200/60 bg-white p-3.5 sm:p-4 shadow-xs"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans mb-1">
                      {formatTabLabel(key)}
                    </p>
                    <p className="text-xs text-slate-700 font-sans leading-relaxed">
                      {renderItemValue(data[key])}
                    </p>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Main structured content */}
          {activeContent && (
            <ObjectSection data={activeContent} />
          )}
        </div>
      </div>
    </div>
  );
}
