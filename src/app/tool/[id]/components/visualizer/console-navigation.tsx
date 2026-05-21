"use client";

import { cn } from "@/lib/utils";
import { Database, FileText, Sliders } from "lucide-react";

export type VisualizerTab = "output" | "log" | "input";

interface ConsoleNavigationProps {
  activeTab: VisualizerTab;
  itemCount: number;
  onTabChange: (tab: VisualizerTab) => void;
}

export function ConsoleNavigation({ activeTab, itemCount, onTabChange }: ConsoleNavigationProps) {
  const tabs = [
    { id: "output" as VisualizerTab, label: "Output", count: itemCount, icon: Database },
    { id: "log" as VisualizerTab, label: "Log", icon: FileText },
    { id: "input" as VisualizerTab, label: "Input", icon: Sliders },
  ];

  return (
    <div className="bg-[#0b0c0e] border-b border-zinc-800 px-4 flex items-center select-none overflow-x-auto scrollbar-none shrink-0">
      <div className="flex items-center gap-1.5 h-11">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "h-full px-3.5 flex items-center gap-2 text-xs font-semibold relative transition-all duration-150 border-b-2 cursor-pointer select-none",
                isActive 
                  ? "text-white border-blue-500 bg-zinc-900/60" 
                  : "text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-900/20"
              )}
            >
              <Icon className={cn("size-3.5", isActive ? "text-blue-400" : "text-zinc-500")} />
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span className={cn(
                  "px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-tight shrink-0 scale-90",
                  isActive 
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/20" 
                    : "bg-zinc-800 text-zinc-500 border border-zinc-700/50"
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
