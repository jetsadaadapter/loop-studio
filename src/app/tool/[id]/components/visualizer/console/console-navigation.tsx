"use client";

import { cn } from "@/lib/utils";
import { Database, FileText, Sliders, Sparkles } from "lucide-react";

export type VisualizerTab = "output" | "log" | "input" | "preprocess";

interface ConsoleNavigationProps {
  activeTab: VisualizerTab;
  itemCount: number;
  onTabChange: (tab: VisualizerTab) => void;
  hasPreProcess?: boolean;
}

export function ConsoleNavigation({ activeTab, itemCount, onTabChange, hasPreProcess }: ConsoleNavigationProps) {
  const tabs = [
    { id: "output" as VisualizerTab, label: "Output", count: itemCount, icon: Database },
    { id: "log" as VisualizerTab, label: "Log", icon: FileText },
    { id: "input" as VisualizerTab, label: "Input", icon: Sliders },
  ];

  if (hasPreProcess) {
    tabs.push({ id: "preprocess" as VisualizerTab, label: "Pre-processing", icon: Sparkles });
  }

  return (
    <div className="bg-white border-b border-slate-200/80 px-4 flex items-center select-none overflow-x-auto scrollbar-none shrink-0">
      <div className="flex items-center gap-1.5 h-11">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "h-full px-3.5 flex items-center gap-2 text-xs font-semibold relative transition-all duration-150 border-b-2 cursor-pointer select-none outline-none",
                isActive 
                  ? "text-brand border-brand bg-slate-50/50" 
                  : "text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-50/30"
              )}
            >
              <Icon className={cn("size-3.5", isActive ? "text-brand" : "text-slate-400")} />
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span className={cn(
                  "px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-tight shrink-0 scale-90",
                  isActive 
                    ? "bg-brand/10 text-brand border border-brand/20" 
                    : "bg-slate-100 text-slate-500 border border-slate-200"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
