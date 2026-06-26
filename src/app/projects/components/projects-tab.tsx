import { useState, useMemo } from "react";
import { Coins, Sparkles, LayoutGrid, KeyRound, Link2, Edit3, Trash2, Clock, Loader2 } from "lucide-react";
import { ManagerActionsDropdown } from "@/components/manager-actions-dropdown";
import { ManagerToolbar } from "@/components/manager-toolbar";
import { ManagerDataTable } from "@/components/manager-data-table";
import { ManagerPagination } from "@/components/manager-pagination";
import { ManageRefreshButton } from "@/components/ui/manage-refresh-button";
import type { ManagerTableColumn } from "@/components/manager-data-table/types";
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
  onConnectClick: (project: ProjectItem) => void;
  onDeleteClick: (project: ProjectItem) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastUpdatedAt?: Date | null;
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
  onConnectClick,
  onDeleteClick,
  onRefresh,
  isRefreshing,
  lastUpdatedAt,
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

  const columns: Array<ManagerTableColumn<ProjectItem>> = [
    {
      key: "name",
      header: "Project Name",
      render: (row) => (
        <div className="flex flex-col gap-0.5 select-text">
          <span className="font-semibold text-slate-800 text-sm select-all">{row.name}</span>
          <span className="text-[9px] font-sans font-semibold bg-slate-100 text-slate-500 border border-slate-200/40 px-1 py-0.2 rounded select-all w-fit uppercase tracking-wider">
            #{row.id.slice(0, 8)}
          </span>
        </div>
      ),
    },
    {
      key: "credits",
      header: "Credits",
      className: "w-28",
      render: (row) => (
        <div className="flex items-center gap-1.5 text-slate-700 font-semibold select-none text-sm">
          <Coins className="size-4 text-amber-500" />
          <span>{row.credits.toLocaleString()}</span>
        </div>
      ),
    },
    {
      key: "connections",
      header: "Connected Assets",
      className: "hidden md:table-cell w-48 select-none",
      render: (row) => (
        <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-400">
          <span className="flex items-center gap-0.5" title="Connected Apps">
            <LayoutGrid className="size-3 text-slate-400" />
            {row.connectedAppIds?.length ?? 0}
          </span>
          <span className="flex items-center gap-0.5" title="Connected Tools">
            <Sparkles className="size-3 text-slate-400" />
            {row.connectedToolIds?.length ?? 0}
          </span>
          <span className="flex items-center gap-0.5" title="Connected API Keys">
            <KeyRound className="size-3 text-slate-400" />
            {row.connectedApiKeyIds?.length ?? 0}
          </span>
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Created At",
      className: "hidden lg:table-cell w-36",
      render: (row) => (
        <span className="text-xs text-slate-500 select-none">
          {new Date(row.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "w-20 text-right",
      render: (row) => (
        <div className="flex justify-end select-none">
          <ManagerActionsDropdown
            triggerClassName="flex size-7 items-center justify-center rounded-sm text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer border-0 shadow-none bg-transparent p-0"
            actions={[
              {
                label: "Connect",
                icon: Link2,
                onClick: () => onConnectClick(row),
              },
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
      ),
    },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
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
          onRefresh && (
            <ManageRefreshButton
              lastUpdatedAt={lastUpdatedAt ?? null}
              isLoading={isLoading}
              isRefreshing={isRefreshing ?? isLoading}
              onRefresh={onRefresh}
              title="Refresh Projects"
            />
          )
        }
      />

      {/* Desktop view */}
      <div className="hidden md:block">
        <ManagerDataTable
          rows={sortedProjects}
          getRowId={(row) => row.id}
          columns={columns}
          isLoading={isLoading}
          emptyText="No projects found. Create your first project to get started!"
        />
      </div>

      {/* Mobile view */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 py-12 text-center text-slate-450 shadow-3xs select-none">
            <Loader2 className="size-5 animate-spin mx-auto text-slate-400" />
          </div>
        ) : sortedProjects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 p-6 text-center select-none shadow-3xs">
            <p className="text-slate-700 font-semibold text-sm">No projects found</p>
            <p className="text-slate-400 text-xs mt-1">Create your first project to get started!</p>
          </div>
        ) : (
          sortedProjects.map((row) => (
            <div key={row.id} className="bg-white rounded-xl border border-slate-200/60 p-4 space-y-2.5 shadow-3xs select-text">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-semibold text-slate-800 text-sm truncate select-all">{row.name}</span>
                  <span className="text-[9px] font-sans font-semibold bg-slate-100 text-slate-500 border border-slate-200/40 px-1 py-0.2 rounded select-all w-fit uppercase tracking-wider">
                    #{row.id.slice(0, 8)}
                  </span>
                </div>
                <div className="flex justify-end select-none shrink-0">
                  <ManagerActionsDropdown
                    triggerClassName="flex size-7 items-center justify-center rounded-sm text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer border-0 shadow-none bg-transparent p-0"
                    actions={[
                      {
                        label: "Connect",
                        icon: Link2,
                        onClick: () => onConnectClick(row),
                      },
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
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <Coins className="size-4 text-amber-500" />
                  <span>{row.credits.toLocaleString()} credits</span>
                </div>
                <span className="text-slate-400 select-none text-[11px] flex items-center gap-1">
                  <Clock className="size-3 text-slate-350" />
                  {new Date(row.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2.5 border-t border-slate-100 text-[10px] font-semibold text-slate-450 select-none">
                <span className="flex items-center gap-0.5" title="Connected Apps">
                  <LayoutGrid className="size-3 text-slate-400" />
                  App: {row.connectedAppIds?.length ?? 0}
                </span>
                <span className="flex items-center gap-0.5" title="Connected Tools">
                  <Sparkles className="size-3 text-slate-400" />
                  Tool: {row.connectedToolIds?.length ?? 0}
                </span>
                <span className="flex items-center gap-0.5" title="Connected API Keys">
                  <KeyRound className="size-3 text-slate-400" />
                  Key: {row.connectedApiKeyIds?.length ?? 0}
                </span>
              </div>
            </div>
          ))
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
