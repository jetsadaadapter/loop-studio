"use client";

import { useState } from "react";
import { Sparkles, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DynamicLayoutVisualizerProps } from "./types";
import { SectionWrapper } from "./section-renderer";

export function DynamicLayoutVisualizer({ items }: DynamicLayoutVisualizerProps) {
  const [activeItemIdx, setActiveItemIdx] = useState(0);
  const activeItem = items[activeItemIdx] || items[0];

  if (!activeItem) return null;

  // Normalize all string fields to prevent app crashes if objects are supplied
  const taskIntent = typeof activeItem.task_intent === "string" 
    ? activeItem.task_intent 
    : String((activeItem.task_intent as Record<string, unknown>)?.name || "");
    
  const taskDescription = typeof activeItem.task_description === "string" 
    ? activeItem.task_description 
    : "";

  const sortedSections = [...(activeItem.sections || [])].sort(
    (a, b) => (a.priority || 0) - (b.priority || 0)
  );

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-slate-50/20 text-slate-700 font-sans">
      {/* Sidebar Selector (Tabs) */}
      <div className="w-full md:w-56 shrink-0 bg-white border-b md:border-b-0 md:border-r border-slate-200/60 p-2.5 flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto select-none scrollbar-none pb-2 md:pb-3">
        <div className="px-2 pb-1.5 shrink-0 hidden md:block">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            วิเคราะห์เจตนา ({items.length} รายการ)
          </p>
        </div>
        {items.map((item, idx) => {
          const itemIntent = typeof item.task_intent === "string"
            ? item.task_intent
            : String((item.task_intent as Record<string, unknown>)?.name || "");

          return (
            <button
              key={idx}
              onClick={() => setActiveItemIdx(idx)}
              className={cn(
                "w-auto md:w-full shrink-0 text-left px-2.5 py-2 rounded-lg border text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center justify-between gap-2",
                activeItemIdx === idx
                  ? "bg-brand/5 border-brand/20 text-brand shadow-xs"
                  : "bg-white border-slate-100 hover:bg-slate-50/50 hover:border-slate-200 text-slate-500 hover:text-slate-800"
              )}
            >
              <span className="truncate text-xs max-w-[120px] xs:max-w-[150px] sm:max-w-none">
                {idx + 1}. {itemIntent.replace(/_/g, " ")}
              </span>
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0",
                  activeItemIdx === idx
                    ? "bg-brand/10 text-brand"
                    : "bg-slate-100 text-slate-400"
                )}
              >
                s{item.sections?.length || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Workspace Dashboard */}
      <div className="flex-1 p-2.5 xs:p-4 overflow-y-auto min-h-0 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 opacity-30">
          <div className="about-bubble-1 animate-blob rounded-full blur-3xl absolute" />
          <div className="about-bubble-2 animate-blob-reverse rounded-full blur-3xl absolute" />
        </div>

        <div className="max-w-4xl mx-auto space-y-3">
          {/* Header Card */}
          <div className="bg-white/90 backdrop-blur-xs rounded-xl border border-slate-200/60 shadow-xs p-3.5 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1 bg-linear-to-br from-brand/10 to-brand/5 text-brand rounded-lg border border-brand/20 shrink-0">
                    <Sparkles className="size-3.5" />
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                    {taskIntent.replace(/_/g, " ")}
                  </h3>
                </div>
                <p className="text-xs text-slate-505 font-medium leading-relaxed">
                  {taskDescription}
                </p>
              </div>

              <div className="flex gap-2">
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-bold text-slate-500 select-none">
                  Focus: {typeof activeItem.overall_sentiment_focus === "string" ? activeItem.overall_sentiment_focus : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Render Sections (Sorted by Priority) */}
          <div className="grid grid-cols-1 gap-3">
            {sortedSections.map((section) => (
              <SectionWrapper key={section.section_id} section={section} />
            ))}
          </div>

          {/* Confidence Alert Card */}
          {activeItem.confidence_note && (
            <div className="rounded-xl border border-amber-200/60 bg-amber-500/5 p-3 flex gap-2.5">
              <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-amber-800">
                  ข้อพิจารณาความแม่นยำ (Confidence Notes)
                </h4>
                <p className="text-xs text-amber-700/90 leading-relaxed font-sans">
                  {typeof activeItem.confidence_note === "string" ? activeItem.confidence_note : ""}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
