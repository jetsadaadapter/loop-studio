import { useState, useMemo } from "react";
import { Coins, Edit3, Trash2, Clock, Folder, Plus } from "lucide-react";
import { ManagerActionsDropdown } from "@/components/manager-actions-dropdown";
import { ManagerToolbar } from "@/components/manager-toolbar";
import { ManagerPagination } from "@/components/manager-pagination";
import { ManageRefreshButton } from "@/components/ui/manage-refresh-button";
import { Button } from "@/components/ui/button";
import type { ProjectItem } from "@/core/interfaces/projects.interface";

interface ProjectsTabProps {
  projects: ProjectItem[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onTopUpClick: (project: ProjectItem) => void;
  onRenameClick: (project: ProjectItem) => void;
  onDeleteClick: (project: ProjectItem) => void;
  onCreateClick?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastUpdatedAt?: Date | null;
  userContext?: { userId?: string; userName?: string; userAvatar?: string };
  usersMap?: Record<string, { name: string; avatar?: string }>;
}

export function ProjectsTab({
  projects,
  isLoading,
  searchQuery,
  onSearchChange,
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  onTopUpClick,
  onRenameClick,
  onDeleteClick,
  onCreateClick,
  onRefresh,
  isRefreshing,
  lastUpdatedAt,
  userContext,
  usersMap,
}: ProjectsTabProps) {
  const [sortBy, setSortBy] = useState<string>("name-asc");

  // Client-side sorting logic
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name);
      }
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "credits-desc") {
        return b.credits - a.credits;
      }
      if (sortBy === "credits-asc") {
        return a.credits - b.credits;
      }
      return 0;
    });
  }, [projects, sortBy]);

  const SORT_OPTIONS = [
    { value: "name-asc", label: "Name A-Z" },
    { value: "name-desc", label: "Name Z-A" },
    { value: "newest", label: "Newest" },
    { value: "credits-desc", label: "Credits High-Low" },
    { value: "credits-asc", label: "Credits Low-High" },
  ];

  const getIconColor = (name: string) => {
    const colors = [
      "bg-indigo-100 text-indigo-600 border-indigo-200/60",
      "bg-violet-100 text-violet-600 border-violet-200/60",
      "bg-emerald-100 text-emerald-600 border-emerald-200/60",
      "bg-amber-100 text-amber-600 border-amber-200/60",
      "bg-rose-100 text-rose-600 border-rose-200/60",
      "bg-sky-100 text-sky-600 border-sky-200/60",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="space-y-5 animate-fade-in font-sans">
      <ManagerToolbar
        searchValue={searchQuery}
        onSearchChange={onSearchChange}
        searchPlaceholder="Search projects..."
        filters={[
          {
            key: "sort",
            label: "Sort By",
            value: sortBy,
            onChange: setSortBy,
            options: SORT_OPTIONS,
            width: "xl:w-44",
          },
        ]}
        onResetFilters={() => setSortBy("name-asc")}
        trailing={
          <div className="flex items-center gap-3">
            {onRefresh && (
              <ManageRefreshButton
                lastUpdatedAt={lastUpdatedAt ?? null}
                isLoading={isLoading}
                isRefreshing={isRefreshing ?? isLoading}
                onRefresh={onRefresh}
                title="Refresh Projects"
              />
            )}
            {onCreateClick && (
              <Button
                onClick={onCreateClick}
                className="h-9 px-4 text-xs font-bold bg-brand text-white shadow-sm hover:bg-brand-strong cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Plus className="size-4" />
                Create Project
              </Button>
            )}
          </div>
        }
      />

      {/* Responsive Grid layout */}
      <div className="w-full">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: pageSize }).map((_, idx) => (
              <div key={`skeleton-${idx}`} className="bg-white rounded-2xl border border-slate-200/60 p-5 space-y-4 shadow-3xs animate-pulse min-h-[220px]">
                <div className="flex items-center justify-between">
                  <div className="size-8 bg-slate-100 rounded-lg" />
                  <div className="w-16 h-5 bg-slate-100 rounded-full" />
                </div>
                <div className="space-y-2">
                  <div className="w-3/4 h-5 bg-slate-100 rounded" />
                  <div className="w-1/2 h-3.5 bg-slate-100 rounded" />
                </div>
                <div className="space-y-2.5 pt-4 border-t border-slate-100">
                  <div className="w-full h-3 bg-slate-100 rounded" />
                  <div className="w-2/3 h-3 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedProjects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 p-8 text-center select-none shadow-3xs py-16">
            <Folder className="size-8 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-700 font-semibold text-sm">No projects found</p>
            <p className="text-slate-400 text-xs mt-1">Create your first project to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedProjects.map((row) => {
              return (
                <div
                  key={row.id}
                  className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-3xs flex flex-col gap-3 hover:shadow-sm hover:border-slate-300 transition-all duration-200 select-text"
                >
                  {/* Top Row: Folder Icon + Actions */}
                  <div className="flex items-start justify-between select-none">
                    <div className={`p-1.5 rounded-lg border ${getIconColor(row.name)}`}>
                      <Folder className="size-4" />
                    </div>
                    <ManagerActionsDropdown
                      triggerClassName="flex size-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200/60 bg-transparent p-0 shadow-3xs"
                      actions={[
                        {
                          label: "Top-up",
                          icon: Coins,
                          onClick: () => onTopUpClick(row),
                        },
                        {
                          label: "Rename",
                          icon: Edit3,
                          onClick: () => onRenameClick(row),
                        },
                        {
                          label: "Delete",
                          icon: Trash2,
                          onClick: () => onDeleteClick(row),
                          variant: "destructive",
                          showSeparatorBefore: true,
                        },
                      ]}
                    />
                  </div>

                  <div className="space-y-0">
                    <h3 className="text-[13px] font-bold text-slate-900 leading-tight tracking-tight select-all">
                      {row.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium select-all font-sans mt-0.5">
                      {row.id.slice(0, 12).toUpperCase()}
                    </p>
                  </div>

                  {/* Credits + Date */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md">
                      <Coins className="size-3 text-amber-500 shrink-0" />
                      <span className="text-[11px] font-bold text-amber-700 font-sans">{row.credits.toLocaleString()}</span>
                      <span className="text-[10px] text-amber-400 font-medium font-sans">cr</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 select-none">
                      <Clock className="size-3 shrink-0" />
                      <span>
                        {new Date(row.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ManagerPagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
