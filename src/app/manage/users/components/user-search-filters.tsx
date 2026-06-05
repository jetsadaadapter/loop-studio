"use client";

import { Search, RotateCw, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserSearchFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: "name-asc" | "name-desc" | "newest" | "department";
  onSortByChange: (value: "name-asc" | "name-desc" | "newest" | "department") => void;
  lastUpdatedAt: Date | null;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function UserSearchFilters({
  search,
  onSearchChange,
  sortBy,
  onSortByChange,
  lastUpdatedAt,
  isLoading,
  isRefreshing,
  onRefresh,
}: UserSearchFiltersProps) {
  const hasActiveFilter = search !== "" || sortBy !== "name-asc";

  return (
    <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 mb-6 select-none">
      {/* Left Group */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3 flex-1">
        {/* Search Input */}
        <div className="relative w-full xl:w-80 shrink-0">
          <Search className="absolute left-3 top-2 size-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search users by name, email, department…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 w-full rounded-sm border border-slate-200 bg-white pl-9.5 pr-3 text-xs md:text-xs shadow-3xs transition-colors outline-none focus-visible:ring-3 focus-visible:ring-brand/5 placeholder:text-xs placeholder:text-slate-400"
          />
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-3 w-full xl:w-auto">
          <div className="flex items-center gap-2 flex-1 xl:flex-initial">
            <span className="text-xs font-semibold text-slate-500 shrink-0">
              Sort
            </span>
            <div className="flex-1 xl:w-40">
              <Select
                value={sortBy}
                onValueChange={(val) => val && onSortByChange(val as typeof sortBy)}
              >
                <SelectTrigger className="h-8 rounded-sm border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 w-full shadow-3xs flex items-center justify-between cursor-pointer">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name A-Z</SelectItem>
                  <SelectItem value="name-desc">Name Z-A</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="department">Department</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reset Filters */}
          {hasActiveFilter && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                onSearchChange("");
                onSortByChange("name-asc");
              }}
              className="size-8 rounded-sm border border-slate-200 hover:bg-slate-50 cursor-pointer text-slate-500 shadow-3xs flex items-center justify-center shrink-0"
              title="Reset Filters"
            >
              <SlidersHorizontal className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Right Group */}
      <div className="flex items-center gap-3 justify-between xl:justify-end shrink-0">
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
            title="Refresh Users"
          >
            <RotateCw className={`size-3.5 text-slate-500 ${isRefreshing ? "animate-spin text-brand" : ""}`} />
          </Button>
        </div>
      </div>
    </div>
  );
}
