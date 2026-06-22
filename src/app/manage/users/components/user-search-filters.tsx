"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ManageSearchInput } from "@/components/ui/manage-search-input";
import { ManageRefreshButton } from "@/components/ui/manage-refresh-button";
import { ManageFilterSelect } from "@/components/ui/manage-filter-select";

const SORT_OPTIONS = [
  { value: "name-asc", label: "Name A-Z" },
  { value: "name-desc", label: "Name Z-A" },
  { value: "newest", label: "Newest" },
  { value: "department", label: "Department" },
];

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

export function UserSearchFilters({ search, onSearchChange, sortBy, onSortByChange, lastUpdatedAt, isLoading, isRefreshing, onRefresh }: UserSearchFiltersProps) {
  const hasActiveFilter = search !== "" || sortBy !== "name-asc";

  return (
    <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 mb-6 select-none">
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3 flex-1">
        <ManageSearchInput value={search} onChange={onSearchChange} placeholder="Search users by name, email, department…" />
        <div className="flex items-center gap-3 w-full xl:w-auto">
          <ManageFilterSelect label="Sort" value={sortBy} options={SORT_OPTIONS} onChange={(v) => onSortByChange(v as typeof sortBy)} width="xl:w-40" />
          {hasActiveFilter && (
            <Button type="button" variant="ghost" size="icon" onClick={() => { onSearchChange(""); onSortByChange("name-asc"); }} className="size-8 rounded-sm border border-slate-200 hover:bg-slate-50 cursor-pointer text-slate-500 shadow-3xs flex items-center justify-center shrink-0" title="Reset Filters">
              <SlidersHorizontal className="size-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 justify-between xl:justify-end shrink-0">
        <ManageRefreshButton lastUpdatedAt={lastUpdatedAt} isLoading={isLoading} isRefreshing={isRefreshing} onRefresh={onRefresh} title="Refresh Users" />
      </div>
    </div>
  );
}
