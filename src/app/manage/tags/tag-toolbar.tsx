"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ManageSearchInput } from "@/components/ui/manage-search-input";
import { ManageRefreshButton } from "@/components/ui/manage-refresh-button";
import { ManageCreateButton } from "@/components/ui/manage-create-button";
import { ManageFilterSelect } from "@/components/ui/manage-filter-select";

const SORT_OPTIONS = [
  { value: "name-asc", label: "Name A–Z" },
  { value: "newest", label: "Newest" },
];

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

export function TagToolbar({ search, sortBy, isLoading, isRefreshing, isDeletingActive, lastUpdatedAt, onSearchChange, onSortChange, onRefresh, onCreate, onOpenFilterSheet }: TagToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border/70 pb-4 md:gap-4 xl:flex-row xl:items-center xl:justify-between select-none">
      <div className="flex flex-col xl:flex-row xl:items-center gap-3 flex-1">
        <Button type="button" variant="outline" size="icon" className="lg:hidden shrink-0 size-8 border-slate-200 bg-white" onClick={onOpenFilterSheet}>
          <SlidersHorizontal className="size-4" />
        </Button>
        <ManageSearchInput value={search} onChange={onSearchChange} placeholder="Search tags..." />
        <ManageFilterSelect label="Sort By" value={sortBy} options={SORT_OPTIONS} onChange={(v) => onSortChange(v as "name-asc" | "newest")} width="xl:w-36" />
      </div>
      <div className="flex items-center gap-3 justify-between xl:justify-end shrink-0">
        <ManageRefreshButton lastUpdatedAt={lastUpdatedAt} isLoading={isLoading} isRefreshing={isRefreshing} onRefresh={onRefresh} title="Refresh Tags" />
        <ManageCreateButton onClick={onCreate} disabled={isDeletingActive}>Create Tag</ManageCreateButton>
      </div>
    </div>
  );
}
