"use client";

import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { ToolJob } from "@/core/interfaces/tools.interface";
import { ConsoleHeader } from "./visualizer/console/console-header";
import { ConsoleNavigation, type VisualizerTab } from "./visualizer/console/console-navigation";
import { TabOutput } from "./visualizer/tabs/tab-output";
import { TabLog } from "./visualizer/tabs/tab-log";
import { TabInputStorage } from "./visualizer/tabs/tab-input-storage";
import { TabPreProcess } from "./visualizer/tabs/tab-preprocess";
import { Loader2 } from "lucide-react";
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
        className="!w-screen h-screen m-0 p-0 border-none bg-white text-slate-800 flex flex-col focus:outline-none transition-all duration-300 overflow-hidden shadow-2xl !max-w-none [&_[data-slot=sheet-close]]:hidden border-l border-slate-200"
      >
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-white text-slate-400 select-none">
            <Loader2 className="size-10 text-brand animate-spin" />
            <p className="text-sm font-bold text-slate-700">Loading Actor Console workspace...</p>
            <p className="text-xs text-slate-450">Fetching job run dataset logs and memory instances...</p>
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
              hasPreProcess={!!job?.input?._preProcessConfig || !!(job?.result as Record<string, unknown> | undefined)?.config}
            />

            {/* Main Active Tab Content */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {activeTab === "output" && <TabOutput job={job} />}
              {activeTab === "log" && <TabLog job={job} />}
              {activeTab === "input" && <TabInputStorage job={job} mode="input" />}
              {activeTab === "preprocess" && <TabPreProcess job={job} />}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-white text-slate-400 select-none">
            <p className="text-sm font-semibold">Workspace unavailable. Select a valid run from historical logs.</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
