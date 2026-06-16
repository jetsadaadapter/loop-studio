"use client";

import { Search, RotateCw, Plus, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TagToolbarProps {
  search: string;
  sortBy: "name-asc" | "newest";
  isLoading: boolean;
  isRefreshing: boolean;
  isDeletingActive: boolean;
  lastUpdatedAt: Date | null;
  onSearchChange: (value: string) => void;
  onSortChange: (value: "name-asc" | "newest") => void;
  onRefresh: () => void;
  onCreate: () => void;
  onOpenFilterSheet: () => void;
}

export function TagToolbar({
  search,
  sortBy,
  isLoading,
  isRefreshing,
  isDeletingActive,
  lastUpdatedAt,
  onSearchChange,
  onSortChange,
  onRefresh,
  onCreate,
  onOpenFilterSheet,
}: TagToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border/70 pb-4 md:gap-4 xl:flex-row xl:items-center xl:justify-between select-none">
      {/* Left: mobile filter toggle + search + sort */}
      <div className="flex flex-col xl:flex-row xl:items-center gap-3 flex-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="lg:hidden shrink-0 size-8 border-slate-200 bg-white"
          onClick={onOpenFilterSheet}
        >
          <SlidersHorizontal className="size-4" />
        </Button>

        <div className="relative w-full xl:w-80 shrink-0">
          <Search className="absolute left-3 top-2 size-4 text-slate-400 pointer-events-none" />
          <input
            id="tags-search"
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tags..."
            className="h-8 w-full rounded-sm border border-slate-200 bg-white pl-9.5 pr-3 text-xs shadow-3xs transition-colors outline-none focus-visible:ring-3 focus-visible:ring-brand/5 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 flex-1 xl:flex-initial">
          <span className="text-xs font-semibold text-slate-500 shrink-0">Sort By</span>
          <div className="flex-1 xl:w-36">
            <Select
              value={sortBy}
              onValueChange={(val) => val && onSortChange(val as "name-asc" | "newest")}
            >
              <SelectTrigger className="h-8 rounded-sm border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 w-full shadow-3xs flex items-center justify-between cursor-pointer">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name A–Z</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Right: timestamp + refresh + create */}
      <div className="flex items-center gap-3 justify-between xl:justify-end shrink-0">
        <div className="flex items-center gap-2">
          {lastUpdatedAt && (
            <span className="text-[10px] font-medium text-slate-400">
              Updated at{" "}
              {lastUpdatedAt.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
              })}
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={isLoading || isRefreshing}
            onClick={onRefresh}
            className="size-8 border-slate-200 bg-white hover:bg-slate-50 cursor-pointer shadow-3xs flex items-center justify-center shrink-0"
            title="Refresh Tags"
          >
            <RotateCw
              className={`size-3.5 text-slate-500 ${isRefreshing ? "animate-spin text-brand" : ""}`}
            />
          </Button>
        </div>

        <Button
          type="button"
          id="tags-create-btn"
          disabled={isDeletingActive}
          onClick={onCreate}
          className="h-8 bg-brand hover:bg-brand/90 text-white text-xs font-semibold px-4.5 rounded-sm flex items-center gap-1.5 cursor-pointer shadow-sm shadow-brand/10 transition-all select-none flex-1 xl:flex-none justify-center"
        >
          <Plus className="size-4 shrink-0" />
          Create Tag
        </Button>
      </div>
    </div>
  );
}
