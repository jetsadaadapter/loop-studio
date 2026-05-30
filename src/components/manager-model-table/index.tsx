import { Button } from "../ui/button";
import React from "react";
import { Brain, Star, Edit3, Trash2 } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { ManagerActionsDropdown } from "../manager-actions-dropdown";

export interface ManagerModelTableProps {
  models: Array<{
    id: string;
    modelSlug: string;
    name: string;
    provider: string;
    isDefault: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  isLoading: boolean;
  isSubmitting: boolean;
  settingDefaultId: string | null;
  deletingId: string | null;
  loadError?: boolean;
  hasActiveFilter: boolean;
  onEdit: (modelId: string) => void;
  onSetDefault: (modelId: string) => void;
  onDelete: (modelId: string) => void;
  onRetry: () => void;
  onAdd: () => void;
  onClearFilters: () => void;
}

export function ManagerModelTable({
  models,
  isLoading,
  isSubmitting,
  settingDefaultId,
  deletingId,
  loadError,
  hasActiveFilter,
  onEdit,
  onSetDefault,
  onDelete,
  onRetry,
  onAdd,
  onClearFilters,
}: ManagerModelTableProps) {
  return (
    <div className="relative w-full overflow-x-auto border border-slate-200 rounded-sm bg-white shadow-3xs">
      <table className="w-full caption-bottom text-sm min-w-3xl">
        <thead className="[&_tr]:border-b bg-slate-50/50">
          <tr className="border-b transition-colors hover:bg-transparent">
            <th className="text-foreground h-10 text-left align-middle font-semibold whitespace-nowrap p-3 px-4 w-12">
              #
            </th>
            <th className="text-foreground h-10 text-left align-middle font-semibold whitespace-nowrap p-3">
              Model Name
            </th>
            <th className="text-foreground h-10 text-left align-middle font-semibold whitespace-nowrap p-3 w-40">
              Provider
            </th>
            <th className="text-foreground h-10 text-left align-middle font-semibold whitespace-nowrap p-3 w-36">
              Status
            </th>
            <th className="text-foreground h-10 text-right align-middle font-semibold whitespace-nowrap p-3 px-4 w-12">
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="p-3 px-4">
                  <Skeleton className="h-4 w-4 rounded" />
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <Skeleton className="h-6 w-20 rounded-full" />
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-2 w-2 rounded-full" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </td>
                <td className="p-3 px-4">
                  <Skeleton className="h-8 w-8 rounded" />
                </td>
              </tr>
            ))
          ) : models.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-8 text-center text-slate-400 select-none">
                {loadError
                  ? "Unable to load AI models right now."
                  : "No AI models configured yet. Add one to begin testing."}
                <div className="flex gap-2 justify-center mt-3">
                  {loadError ? (
                    <Button type="button" size="sm" onClick={onRetry} className="h-8 cursor-pointer">
                      Retry
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      disabled={isSubmitting || settingDefaultId !== null || deletingId !== null}
                      onClick={onAdd}
                      className="h-8 cursor-pointer bg-brand hover:bg-brand/90 text-white"
                    >
                      Add Model
                    </Button>
                  )}
                  {hasActiveFilter && !loadError && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={onClearFilters}
                      className="h-8 border-slate-200 cursor-pointer"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ) : (
            models.map((row, index) => {
              return (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/50 transition-colors border-b last:border-0"
                >
                  <td className="p-3 px-4 align-middle whitespace-nowrap text-xs font-semibold text-slate-400">
                    {index + 1}
                  </td>
                  <td className="p-3 align-middle min-w-[240px]">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full flex items-center justify-center bg-indigo-50 border border-indigo-100/50 shrink-0">
                        <Brain className="size-4.5 text-indigo-500" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-slate-800 tracking-tight truncate">
                            {row.name}
                          </span>
                          {row.isDefault && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-sm bg-brand/10 text-[8px] font-bold text-brand font-sans">
                              <Star className="size-2 fill-current" /> DEFAULT
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-sans truncate mt-0.5">
                          {row.modelSlug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 align-middle whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-50 text-[10px] font-bold text-slate-700 border border-slate-200">
                      {row.provider}
                    </span>
                  </td>
                  <td className="p-3 align-middle whitespace-nowrap">
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${row.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm"
                          : "bg-slate-150 text-slate-500 border border-slate-200"
                        }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${row.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}
                        aria-hidden
                      />
                      {row.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3 px-4 align-middle whitespace-nowrap text-right">
                    <div className="flex justify-end">
                      <ManagerActionsDropdown
                        triggerClassName="flex size-7 items-center justify-center rounded-sm text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer border-0 shadow-none bg-transparent p-0"
                        actions={[
                          ...(row.isDefault
                            ? []
                            : [
                              {
                                label: settingDefaultId === row.id ? "Setting..." : "Set Default",
                                icon: Star,
                                onClick: () => onSetDefault(row.id),
                                disabled: isSubmitting || settingDefaultId !== null || deletingId !== null,
                              },
                            ]),
                          {
                            label: "Edit",
                            icon: Edit3,
                            onClick: () => onEdit(row.id),
                            disabled: isSubmitting || settingDefaultId !== null || deletingId !== null,
                          },
                          {
                            label: deletingId === row.id ? "Deleting..." : "Delete",
                            icon: Trash2,
                            onClick: () => onDelete(row.id),
                            disabled: isSubmitting || settingDefaultId !== null || deletingId !== null,
                            variant: "destructive" as const,
                          },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
