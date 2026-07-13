"use client";

import type { ReactNode } from "react";
import { ManageSearchInput } from "@/components/ui/manage-search-input";
import { ManageFilterSelect } from "@/components/ui/manage-filter-select";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import type { ManagerFilter } from "./types";

type ManagerToolbarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ManagerFilter[];
  trailing?: ReactNode;
  className?: string;
  onResetFilters?: () => void;
};

export function ManagerToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search…",
  filters = [],
  trailing,
  className = "",
  onResetFilters,
}: ManagerToolbarProps) {
  // Determine if there is any active filter to show the reset button
  const hasActiveFilter = searchValue !== "" || filters.some((f) => f.value !== "" && f.value !== "all");

  const handleReset = () => {
    onSearchChange("");
    filters.forEach((f) => f.onChange("all"));
    if (onResetFilters) onResetFilters();
  };

  return (
    // flex-wrap at the top level, with the search+filters group set to
    // grow-but-never-shrink (shrink-0): if trailing content (e.g. 4 action
    // buttons) doesn't leave enough room, TRAILING wraps to its own new line
    // rather than squeezing this group below its natural content width —
    // that squeeze was what caused the filters to wrap into two mismatched
    // sub-rows, with the search box centered between them and every icon
    // (search, chevrons, reset) landing at a different height.
    <div className={`flex flex-wrap items-start justify-between gap-4 mb-6 select-none ${className}`}>
      <div className="flex flex-wrap items-center gap-3 grow shrink-0 basis-auto">
        <ManageSearchInput
          value={searchValue}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />
        {(filters.length > 0 || hasActiveFilter) && (
          <div className="flex flex-wrap items-center gap-3">
            {filters.map((filter) => (
              <ManageFilterSelect
                key={filter.key}
                label={filter.label}
                value={filter.value}
                options={filter.options}
                onChange={filter.onChange}
                width={filter.width}
              />
            ))}
            {hasActiveFilter && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleReset}
                className="size-8 rounded-lg border border-slate-200 hover:border-brand/30 hover:bg-brand/5 hover:text-brand cursor-pointer text-slate-500 shadow-3xs transition-colors flex items-center justify-center shrink-0"
                title="Reset Filters"
              >
                <SlidersHorizontal className="size-4" />
              </Button>
            )}
          </div>
        )}
      </div>
      {trailing && (
        <div className="flex items-center gap-3 shrink-0">
          {trailing}
        </div>
      )}
    </div>
  );
}
