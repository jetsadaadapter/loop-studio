"use client";

import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { ToolJob } from "@/core/interfaces/tools.interface";
import { ConsoleHeader } from "./visualizer/console-header";
import { ConsoleNavigation, type VisualizerTab } from "./visualizer/console-navigation";
import { TabOutput } from "./visualizer/tab-output";
import { TabLog } from "./visualizer/tab-log";
import { TabInputStorage } from "./visualizer/tab-input-storage";
import { Loader2, MonitorPlay, Network } from "lucide-react";
import { getItemCount } from "../tool-job-utils";

interface ToolJobVisualizerProps {
  open: boolean;
  isLoading: boolean;
  job: ToolJob | null;
  toolName: string;
  onOpenChange: (open: boolean) => void;
}

export function ToolJobVisualizer({ open, isLoading, job, toolName, onOpenChange }: ToolJobVisualizerProps) {
  const [activeTab, setActiveTab] = useState<VisualizerTab>("output");
  const itemCount = job ? getItemCount(job) : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-screen h-screen sm:w-[90vw] m-0 p-0 border-none bg-[#0f1013] text-zinc-100 flex flex-col focus:outline-none transition-all duration-300 overflow-hidden shadow-2xl data-[side=right]:max-w-full data-[side=right]:sm:max-w-[90vw] sm:max-w-[90vw] max-w-full [&_[data-slot=sheet-close]]:hidden"
      >
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-[#0b0c0e] text-zinc-400 select-none">
            <Loader2 className="size-10 text-blue-500 animate-spin" />
            <p className="text-sm font-bold text-zinc-300">Loading Actor Console workspace...</p>
            <p className="text-xs text-zinc-650">Fetching job run dataset logs and memory instances...</p>
          </div>
        ) : job ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header */}
            <ConsoleHeader 
              job={job} 
              toolName={toolName} 
              onClose={() => onOpenChange(false)} 
            />

            {/* Navigation Tabs */}
            <ConsoleNavigation 
              activeTab={activeTab} 
              itemCount={itemCount} 
              onTabChange={setActiveTab} 
            />

            {/* Main Active Tab Content */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {activeTab === "output" && <TabOutput job={job} />}
              {activeTab === "log" && <TabLog job={job} />}
              {activeTab === "input" && <TabInputStorage job={job} mode="input" />}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-[#0b0c0e] text-zinc-500 select-none">
            <p className="text-sm">Workspace unavailable. Select a valid run from historical logs.</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
