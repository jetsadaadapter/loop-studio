"use client";

import { useMemo } from "react";
import { ManagerToolbar } from "@/components/manager-toolbar";
import type { ManagerFilter } from "@/components/manager-toolbar/types";
import { ManageRefreshButton } from "@/components/ui/manage-refresh-button";
import { ManageCreateButton } from "@/components/ui/manage-create-button";

interface ToolSearchFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  sortFilter: string;
  onSortFilterChange: (value: string) => void;
  lastUpdatedAt: Date | null;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onCreateTool: () => void;
}

export function ToolSearchFilters({ 
  search, 
  onSearchChange, 
  statusFilter,
  onStatusFilterChange,
  sortFilter,
  onSortFilterChange,
  lastUpdatedAt, 
  isLoading, 
  isRefreshing, 
  onRefresh, 
  onCreateTool 
}: ToolSearchFiltersProps) {
  const filters: ManagerFilter[] = useMemo(() => [
    {
      key: "status",
      label: "Status",
      value: statusFilter,
      onChange: onStatusFilterChange,
      options: [
        { value: "all", label: "All Status" },
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
    {
      key: "sort",
      label: "Sort By",
      value: sortFilter,
      onChange: onSortFilterChange,
      options: [
        { value: "updated-desc", label: "Newest First" },
        { value: "updated-asc", label: "Oldest First" },
        { value: "name-asc", label: "Name (A-Z)" },
        { value: "name-desc", label: "Name (Z-A)" },
        { value: "created-desc", label: "Recently Added" },
      ],
    },
  ], [statusFilter, onStatusFilterChange, sortFilter, onSortFilterChange]);

  return (
    <ManagerToolbar
      searchValue={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search tools by name or description…"
      filters={filters}
      trailing={
        <>
          <ManageRefreshButton lastUpdatedAt={lastUpdatedAt} isLoading={isLoading} isRefreshing={isRefreshing} onRefresh={onRefresh} title="Refresh Tools" />
          <ManageCreateButton onClick={onCreateTool}>New Tool</ManageCreateButton>
        </>
      }
    />
  );
}
