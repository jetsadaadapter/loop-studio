import { Button } from "../ui/button";
import React from "react";
import { Brain, Star, Edit3, Trash2 } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { ManagerActionsDropdown } from "../manager-actions-dropdown";

// ── Resolves brand SVG logo + background for each AI provider ─────────────────

function getModelIconData(name: string, provider: string, modelSlug: string): {
  imgSrc: string | null;
  fallbackIcon?: typeof Brain;
  bgCls: string;
} {
  const prov = provider.toLowerCase();
  const lowerName = name.toLowerCase();
  const slug = modelSlug.toLowerCase();

  if (prov.includes("google") || prov.includes("gemini") || lowerName.includes("gemini") || slug.includes("gemini")) {
    return {
      imgSrc: "/images/icons/gemini-color.svg",
      bgCls: "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100/60 shadow-3xs",
    };
  }
  if (prov.includes("anthropic") || prov.includes("claude") || lowerName.includes("claude") || slug.includes("claude")) {
    return {
      imgSrc: "/images/icons/claude-color.svg",
      bgCls: "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100/60 shadow-3xs",
    };
  }
  if (prov.includes("openai") || prov.includes("gpt") || lowerName.includes("gpt") || slug.includes("gpt")) {
    return {
      imgSrc: null,
      fallbackIcon: Brain,
      bgCls: "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100/60 text-emerald-600 shadow-3xs",
    };
  }
  if (prov.includes("meta") || prov.includes("llama") || lowerName.includes("llama") || slug.includes("llama")) {
    return {
      imgSrc: null,
      fallbackIcon: Brain,
      bgCls: "bg-gradient-to-br from-sky-50 to-blue-50 border-sky-100/60 text-sky-600 shadow-3xs",
    };
  }
  // Default brain fallback
  return {
    imgSrc: null,
    fallbackIcon: Brain,
    bgCls: "bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-100/60 text-indigo-500 shadow-3xs",
  };
}

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
      <table className="w-full caption-bottom text-xs min-w-3xl">
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
              const { imgSrc, fallbackIcon: FallbackIcon, bgCls } = getModelIconData(row.name, row.provider, row.modelSlug);
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
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 border ${bgCls}`}>
                        {imgSrc ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imgSrc} alt="" className="size-4.5 object-contain" aria-hidden="true" />
                        ) : FallbackIcon ? (
                          <FallbackIcon className="size-4.5" aria-hidden="true" />
                        ) : (
                          <Brain className="size-4.5 text-indigo-500" aria-hidden="true" />
                        )}
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
