"use client";

import { FolderOpen, Edit3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ManagerActionsDropdown } from "@/components/manager-actions-dropdown";
import type { CategoryInfo } from "@/core/interfaces/categories.interface";

interface CategoryTableProps {
  categories: CategoryInfo[];
  isLoading: boolean;
  loadError: string;
  onRetry: () => void;
  onEdit: (category: CategoryInfo) => void;
  onDelete: (category: CategoryInfo) => void;
  openCreate: () => void;
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  return iso.slice(0, 10);
}

function CategoryTableSkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={`skeleton-row-${i}`} className="animate-pulse border-b last:border-0">
          {/* # */}
          <td className="p-3 px-4 align-middle whitespace-nowrap hidden xs:table-cell">
            <div className="h-4 w-4 bg-slate-100 rounded" />
          </td>

          {/* Name */}
          <td className="p-3 align-middle min-w-[200px]">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-slate-100 border border-slate-100/50 shrink-0" />
              <div className="min-w-0 space-y-1.5 flex-1">
                <div className="h-3.5 w-24 bg-slate-100 rounded" />
                <div className="h-2.5 w-16 bg-slate-100 rounded" />
                {/* Mobile-only timestamps skeleton */}
                <div className="flex gap-1.5 mt-1.5 md:hidden">
                  <div className="h-3.5 w-16 bg-slate-100 rounded-sm" />
                  <div className="h-3.5 w-16 bg-slate-100 rounded-sm" />
                </div>
              </div>
            </div>
          </td>

          {/* Created */}
          <td className="p-3 align-middle whitespace-nowrap hidden md:table-cell">
            <div className="h-3.5 w-20 bg-slate-100 rounded" />
          </td>

          {/* Updated */}
          <td className="p-3 align-middle whitespace-nowrap hidden md:table-cell">
            <div className="h-3.5 w-20 bg-slate-100 rounded" />
          </td>

          {/* Actions */}
          <td className="p-3 px-4 align-middle whitespace-nowrap text-right">
            <div className="flex justify-end">
              <div className="h-7 w-7 bg-slate-100 rounded-sm" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

export function CategoryTable({
  categories,
  isLoading,
  loadError,
  onRetry,
  onEdit,
  onDelete,
  openCreate,
}: CategoryTableProps) {
  return (
    <div className="relative w-full overflow-x-auto border border-slate-200 rounded-sm bg-white shadow-3xs">
      <table className="w-full caption-bottom text-xs min-w-full md:min-w-2xl">
        <thead className="[&_tr]:border-b bg-slate-50/50">
          <tr className="border-b transition-colors hover:bg-transparent">
            <th className="text-foreground h-10 text-left align-middle font-semibold whitespace-nowrap p-3 px-4 w-10 hidden xs:table-cell">
              #
            </th>
            <th className="text-foreground h-10 text-left align-middle font-semibold whitespace-nowrap p-3">
              Category Name
            </th>
            <th className="text-foreground h-10 text-left align-middle font-semibold whitespace-nowrap p-3 w-40 hidden md:table-cell">
              Created
            </th>
            <th className="text-foreground h-10 text-left align-middle font-semibold whitespace-nowrap p-3 w-40 hidden md:table-cell">
              Updated
            </th>
            <th className="text-foreground h-10 text-right align-middle font-semibold whitespace-nowrap p-3 px-4 w-12"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {isLoading ? (
            <CategoryTableSkeletonRows />
          ) : loadError ? (
            <tr>
              <td colSpan={5} className="p-8 text-center">
                <div className="flex flex-col items-center gap-3">
                  <p className="text-sm text-slate-500">{loadError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRetry}
                    className="h-8 border-slate-200 cursor-pointer"
                  >
                    Retry
                  </Button>
                </div>
              </td>
            </tr>
          ) : categories.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-16 text-center select-none">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-sm bg-slate-50 border border-slate-100 text-slate-400">
                    <FolderOpen className="size-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-800">
                      No categories found
                    </p>
                    <p className="text-xs text-slate-500">
                      Try creating a new category or changing your search filter
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={openCreate}
                    className="h-8 bg-brand hover:bg-brand/85 text-white text-xs font-semibold px-4.5 rounded-sm cursor-pointer shadow-xs"
                  >
                    Create First Category
                  </Button>
                </div>
              </td>
            </tr>
          ) : (
            categories.map((cat, index) => (
              <tr
                key={cat.id}
                className="hover:bg-slate-50/50 transition-colors border-b last:border-0"
              >
                {/* # */}
                <td className="p-3 px-4 align-middle whitespace-nowrap text-xs font-semibold text-slate-400 hidden xs:table-cell">
                  {index + 1}
                </td>

                {/* Name */}
                <td className="p-3 align-middle min-w-[200px]">
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 shadow-3xs">
                      <FolderOpen className="size-4 text-slate-500 drop-shadow-xs" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-slate-800 tracking-tight block leading-tight">
                        {cat.name}
                      </span>
                      <span className="text-[10px] font-sans text-slate-400 block mt-0.5 leading-none">
                        #{cat.id.slice(0, 8)}
                      </span>
                      {/* Mobile-only timestamps */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5 md:hidden text-[9px] text-slate-400 font-sans">
                        <span>Created: {formatDate(cat.createdAt)}</span>
                        <span>•</span>
                        <span>Updated: {formatDate(cat.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </td>

                {/* Created */}
                <td className="p-3 align-middle whitespace-nowrap text-xs text-slate-500 hidden md:table-cell">
                  {formatDate(cat.createdAt)}
                </td>

                {/* Updated */}
                <td className="p-3 align-middle whitespace-nowrap text-xs text-slate-500 hidden md:table-cell">
                  {formatDate(cat.updatedAt)}
                </td>

                {/* Actions */}
                <td className="p-3 px-4 align-middle whitespace-nowrap text-right">
                  <div className="flex justify-end">
                    <ManagerActionsDropdown
                      triggerClassName="flex size-7 items-center justify-center rounded-sm text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer border-0 shadow-none bg-transparent p-0"
                      actions={[
                        {
                          label: "Edit",
                          icon: Edit3,
                          onClick: () => onEdit(cat),
                        },
                        {
                          label: "Delete",
                          icon: Trash2,
                          onClick: () => onDelete(cat),
                          variant: "destructive",
                          showSeparatorBefore: true,
                        },
                      ]}
                    />
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Footer count */}
      {!isLoading && categories.length > 0 && (
        <div className="border-t border-slate-100 px-4 py-2.5">
          <span className="text-[11px] text-slate-400">
            Showing {categories.length} categories
          </span>
        </div>
      )}
    </div>
  );
}
