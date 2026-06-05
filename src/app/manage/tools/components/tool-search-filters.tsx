"use client";

import { Search, Plus, RotateCw, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ToolSearchFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  lastUpdatedAt: Date | null;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onCreateTool: () => void;
}

export function ToolSearchFilters({
  search,
  onSearchChange,
  lastUpdatedAt,
  isLoading,
  isRefreshing,
  onRefresh,
  onCreateTool,
}: ToolSearchFiltersProps) {
  return (
    <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 mb-6 select-none">
      {/* Left Group */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3 flex-1">
        {/* Search Input */}
        <div className="relative w-full xl:w-80 shrink-0">
          <Search className="absolute left-3 top-2 size-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tools by name or description…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 w-full rounded-sm border border-slate-200 bg-white pl-9.5 pr-3 text-xs md:text-xs shadow-3xs transition-colors outline-none focus-visible:ring-3 focus-visible:ring-brand/5 placeholder:text-xs placeholder:text-slate-400"
          />
        </div>

        {/* Reset Filter Icon Button */}
        {search && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onSearchChange("")}
            className="size-8 rounded-sm border border-slate-200 hover:bg-slate-50 cursor-pointer text-slate-500 shadow-3xs flex items-center justify-center shrink-0"
            title="Reset Filters"
          >
            <SlidersHorizontal className="size-4" />
          </Button>
        )}
      </div>

      {/* Right Group */}
      <div className="flex items-center gap-3 justify-between xl:justify-end shrink-0 select-none">
        {/* Last updated timestamp and refresh button */}
        <div className="flex items-center gap-2">
          {lastUpdatedAt && (
            <span className="text-[10px] font-medium text-slate-400">
              อัพเดทเมื่อ {lastUpdatedAt.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={isLoading || isRefreshing}
            onClick={onRefresh}
            className="size-8 border-slate-200 bg-white hover:bg-slate-50 cursor-pointer shadow-3xs flex items-center justify-center shrink-0"
            title="Refresh Tools"
          >
            <RotateCw className={`size-3.5 text-slate-500 ${isRefreshing ? "animate-spin text-brand" : ""}`} />
          </Button>
        </div>

        <Button
          type="button"
          onClick={onCreateTool}
          className="h-8 bg-brand hover:bg-brand/90 text-white text-xs font-semibold px-4.5 rounded-sm flex items-center gap-1.5 cursor-pointer shadow-sm shadow-brand/10 transition-all select-none flex-1 xl:flex-none justify-center"
        >
          <Plus className="size-4 shrink-0" />
          New Tool
        </Button>
      </div>
    </div>
  );
}
