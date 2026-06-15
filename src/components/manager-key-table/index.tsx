"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { KeyRound, Edit3, Trash2, ToggleLeft, ToggleRight, Link2, Copy, Check, BookOpen } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { ManagerActionsDropdown } from "../manager-actions-dropdown";

const CopyableAppIdBadge = ({ appId }: { appId: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(appId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <span
      onClick={handleCopy}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-[8px] font-bold text-slate-500 font-sans cursor-pointer hover:bg-slate-200 hover:text-slate-700 transition-colors select-none"
      title={`Copy App ID: ${appId}`}
    >
      <span>ID: {appId.slice(0, 8)}...</span>
      {copied ? (
        <Check className="size-2 shrink-0 text-emerald-600" />
      ) : (
        <Copy className="size-2 shrink-0 opacity-60" />
      )}
    </span>
  );
};

export interface ApiKeyRecord {
  id: string;
  appId: string;
  name: string;
  ownerId: string;
  isActive: boolean;
  webhookUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ManagerKeyTableProps {
  keys: ApiKeyRecord[];
  isLoading: boolean;
  isSubmitting: boolean;
  deletingId: string | null;
  loadError?: boolean;
  hasActiveFilter: boolean;
  onEdit: (appId: string) => void;
  onToggleStatus: (appId: string) => void;
  onDelete: (appId: string) => void;
  onRetry: () => void;
  onAdd: () => void;
  onClearFilters: () => void;
  onReadGuide?: (appId: string) => void;
}

export function ManagerKeyTable({
  keys,
  isLoading,
  isSubmitting,
  deletingId,
  loadError,
  hasActiveFilter,
  onEdit,
  onToggleStatus,
  onDelete,
  onRetry,
  onAdd,
  onClearFilters,
  onReadGuide,
}: ManagerKeyTableProps) {
  return (
    <div className="relative w-full overflow-x-auto border border-slate-200/60 rounded-2xl bg-white shadow-xs">
      <table className="w-full caption-bottom text-xs min-w-full md:min-w-3xl">
        <thead className="[&_tr]:border-b bg-slate-50/50">
          <tr className="border-b transition-colors hover:bg-transparent">
            <th className="text-foreground h-10 text-left align-middle font-semibold whitespace-nowrap p-3 px-4 w-12 hidden xs:table-cell">
              #
            </th>
            <th className="text-foreground h-10 text-left align-middle font-semibold whitespace-nowrap p-3">
              API Key Name / App ID
            </th>
            <th className="text-foreground h-10 text-left align-middle font-semibold whitespace-nowrap p-3 w-80 hidden md:table-cell">
              Webhook URL
            </th>
            <th className="text-foreground h-10 text-left align-middle font-semibold whitespace-nowrap p-3 w-36 hidden md:table-cell">
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
                <td className="p-3 px-4 hidden xs:table-cell">
                  <Skeleton className="h-4 w-4 rounded" />
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                </td>
                <td className="p-3 hidden md:table-cell">
                  <Skeleton className="h-4 w-48" />
                </td>
                <td className="p-3 hidden md:table-cell">
                  <Skeleton className="h-6 w-16 rounded-full" />
                </td>
                <td className="p-3 px-4">
                  <Skeleton className="h-8 w-8 rounded" />
                </td>
              </tr>
            ))
          ) : keys.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-8 text-center text-slate-400 select-none animate-in fade-in duration-300">
                {loadError
                  ? "Unable to load API Keys right now."
                  : "No API Keys configured yet. Create one to begin authentication."}
                <div className="flex gap-2 justify-center mt-3">
                  {loadError ? (
                    <Button type="button" size="sm" onClick={onRetry} className="h-8 cursor-pointer">
                      Retry
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      disabled={isSubmitting || deletingId !== null}
                      onClick={onAdd}
                      className="h-8 cursor-pointer bg-brand hover:bg-brand/90 text-white font-sans"
                    >
                      Create API Key
                    </Button>
                  )}
                  {hasActiveFilter && !loadError && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={onClearFilters}
                      className="h-8 border-slate-200/60 cursor-pointer font-sans"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ) : (
            keys.map((row, index) => {
              return (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/50 transition-colors border-b last:border-0"
                >
                  {/* Index */}
                  <td className="p-3 px-4 align-middle whitespace-nowrap text-xs font-semibold text-slate-400 hidden xs:table-cell">
                    {index + 1}
                  </td>
                  
                  {/* Name and App ID */}
                  <td className="p-3 align-middle min-w-[240px]">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 border bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200/60 text-slate-500 shadow-3xs">
                        <KeyRound className="size-4.5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-semibold text-slate-800 tracking-tight truncate block">
                          {row.name}
                        </span>
                        <div className="mt-1">
                          <CopyableAppIdBadge appId={row.appId} />
                        </div>
                        
                        {/* Mobile-only inline attributes */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5 md:hidden">
                          {row.webhookUrl && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-slate-50 text-[8px] font-bold text-slate-600 border border-slate-200/60 font-sans truncate max-w-[160px]">
                              <Link2 className="size-2 shrink-0" />
                              {row.webhookUrl}
                            </span>
                          )}
                          <span
                            className={`inline-flex shrink-0 items-center gap-1 rounded-sm px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${row.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-xs"
                              : "bg-slate-150 text-slate-500 border border-slate-200/60"
                              }`}
                          >
                            <span
                              className={`size-1 rounded-full ${row.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}
                              aria-hidden
                            />
                            {row.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  {/* Webhook URL */}
                  <td className="p-3 align-middle hidden md:table-cell max-w-xs font-sans text-xs text-slate-500 truncate">
                    {row.webhookUrl || <span className="text-slate-400 italic font-sans">None configured</span>}
                  </td>
                  
                  {/* Status Badge */}
                  <td className="p-3 align-middle whitespace-nowrap hidden md:table-cell">
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${row.isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-xs"
                        : "bg-slate-150 text-slate-500 border border-slate-200/60"
                        }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${row.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}
                        aria-hidden
                      />
                      {row.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  
                  {/* Row Actions */}
                  <td className="p-3 px-4 align-middle whitespace-nowrap text-right">
                    <div className="flex justify-end">
                      <ManagerActionsDropdown
                        triggerClassName="flex size-7 items-center justify-center rounded-sm text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer border-0 shadow-none bg-transparent p-0"
                        actions={[
                          {
                            label: "Read Guide",
                            icon: BookOpen,
                            onClick: () => onReadGuide?.(row.appId),
                            disabled: isSubmitting || deletingId !== null,
                          },
                          {
                            label: "Edit",
                            icon: Edit3,
                            onClick: () => onEdit(row.appId),
                            disabled: isSubmitting || deletingId !== null,
                          },
                          {
                            label: row.isActive ? "Deactivate" : "Activate",
                            icon: row.isActive ? ToggleLeft : ToggleRight,
                            onClick: () => onToggleStatus(row.appId),
                            disabled: isSubmitting || deletingId !== null,
                          },
                          {
                            label: deletingId === row.appId ? "Deleting..." : "Delete",
                            icon: Trash2,
                            onClick: () => onDelete(row.appId),
                            disabled: isSubmitting || deletingId !== null,
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
