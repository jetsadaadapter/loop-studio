"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ManageSearchInput } from "@/components/ui/manage-search-input";
import { ManageRefreshButton } from "@/components/ui/manage-refresh-button";
import { ManageCreateButton } from "@/components/ui/manage-create-button";

interface ToolSearchFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  lastUpdatedAt: Date | null;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onCreateTool: () => void;
}

export function ToolSearchFilters({ search, onSearchChange, lastUpdatedAt, isLoading, isRefreshing, onRefresh, onCreateTool }: ToolSearchFiltersProps) {
  return (
    <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 mb-6 select-none">
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3 flex-1">
        <ManageSearchInput value={search} onChange={onSearchChange} placeholder="Search tools by name or description…" />
        {search && (
          <Button type="button" variant="ghost" size="icon" onClick={() => onSearchChange("")} className="size-8 rounded-sm border border-slate-200 hover:bg-slate-50 cursor-pointer text-slate-500 shadow-3xs flex items-center justify-center shrink-0" title="Reset Filters">
            <SlidersHorizontal className="size-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-3 justify-between xl:justify-end shrink-0 select-none">
        <ManageRefreshButton lastUpdatedAt={lastUpdatedAt} isLoading={isLoading} isRefreshing={isRefreshing} onRefresh={onRefresh} title="Refresh Tools" />
        <ManageCreateButton onClick={onCreateTool}>New Tool</ManageCreateButton>
      </div>
    </div>
  );
}
