"use client";

import { Coins, Sparkles, LayoutGrid, KeyRound, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ManagerToolbar } from "@/components/manager-toolbar";
import { ManagerDataTable } from "@/components/manager-data-table";
import { ManagerPagination } from "@/components/manager-pagination";
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
}: ProjectsTabProps) {
  const columns: Array<ManagerTableColumn<ProjectItem>> = [
    {
      key: "name",
      header: "Project Name",
      render: (row) => (
        <div className="flex flex-col gap-0.5 select-text">
          <span className="font-bold text-slate-800 text-sm select-all">{row.name}</span>
          <span className="text-[9px] font-sans font-bold bg-slate-100 text-slate-500 border border-slate-200/40 px-1 py-0.2 rounded select-all w-fit uppercase tracking-wider">
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
        <div className="flex items-center gap-1.5 text-slate-700 font-bold select-none text-sm">
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
        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
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
        <span className="text-xs text-slate-500 font-medium select-none">
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
      className: "w-56 text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5 select-none">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onConnectClick(row)}
            className="h-8 text-xs font-bold text-slate-650 border-slate-200 hover:bg-slate-50 cursor-pointer"
          >
            <Link2 className="size-3.5 mr-1" />
            Connect
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onTopUpClick(row)}
            className="h-8 text-xs font-bold text-slate-600 border-slate-200 hover:bg-slate-50 cursor-pointer"
          >
            <Coins className="size-3.5 mr-1 text-amber-500" />
            Top-up
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRenameClick(row)}
            className="h-8 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            Rename
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDeleteClick(row)}
            className="h-8 text-xs font-bold text-red-650 hover:bg-red-50 cursor-pointer"
          >
            Delete
          </Button>
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
      />

      <ManagerDataTable
        rows={projects}
        getRowId={(row) => row.id}
        columns={columns}
        isLoading={isLoading}
        emptyText="No projects found. Create your first project to get started!"
      />

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
