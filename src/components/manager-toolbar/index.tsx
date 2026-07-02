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
    <div className={`flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 mb-6 select-none ${className}`}>
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3 flex-1">
        <ManageSearchInput
          value={searchValue}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />
        {(filters.length > 0 || hasActiveFilter) && (
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
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
                className="size-8 rounded-sm border border-slate-200 hover:bg-slate-50 cursor-pointer text-slate-500 shadow-3xs flex items-center justify-center shrink-0"
                title="Reset Filters"
              >
                <SlidersHorizontal className="size-4" />
              </Button>
            )}
          </div>
        )}
      </div>
      {trailing && (
        <div className="flex items-center gap-3 justify-between xl:justify-end shrink-0">
          {trailing}
        </div>
      )}
    </div>
  );
}
