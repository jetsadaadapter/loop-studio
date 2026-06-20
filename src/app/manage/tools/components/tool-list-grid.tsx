"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ManageToolApiItem, ToolParam } from "@/core/interfaces/tool";
import { ToolRow } from "./tool-row";

// ── SummaryBar Component ─────────────────────────────────────────────────────────

interface SummaryBarProps {
  total: number;
  filtered: number;
  isRefreshing: boolean;
  lastUpdatedAt: Date | null;
  onRefresh: () => void;
}

export function SummaryBar({
  total,
  filtered,
  isRefreshing,
  lastUpdatedAt,
  onRefresh,
}: SummaryBarProps) {
  const label = total === filtered
    ? `${total} ${total === 1 ? "tool" : "tools"}`
    : `${filtered} of ${total} ${total === 1 ? "tool" : "tools"}`;
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/40 bg-slate-50/40 px-4 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold tracking-wide text-slate-600">{label}</span>
        {lastUpdatedAt && (
          <span className="hidden text-[10px] font-medium text-slate-400 sm:inline">
            · updated {lastUpdatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={isRefreshing}
        onClick={onRefresh}
        className="h-7 gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"
      >
        <RefreshCw className={`size-3 ${isRefreshing ? "animate-spin" : ""}`} />
        {isRefreshing ? "Refreshing…" : "Refresh"}
      </Button>
    </div>
  );
}

// ── ToolList Component ───────────────────────────────────────────────────────────

interface ToolListProps {
  tools: ManageToolApiItem[];
  onEdit: (t: ManageToolApiItem) => void;
  onDelete: (t: ManageToolApiItem) => void;
  onToggleActive: (t: ManageToolApiItem) => void;
  onDuplicate: (t: ManageToolApiItem) => void;
  duplicatingId?: string | null;
  onPreviewPrompt: (param: ToolParam) => void;
  onManageParams: (t: ManageToolApiItem) => void;
  onManageScripts: (t: ManageToolApiItem) => void;
}

export function ToolList({
  tools,
  onEdit,
  onDelete,
  onToggleActive,
  onDuplicate,
  duplicatingId,
  onPreviewPrompt,
  onManageParams,
  onManageScripts,
}: ToolListProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {tools.map((tool) => (
        <ToolRow
          key={tool.id}
          tool={tool}
          onEdit={() => onEdit(tool)}
          onDelete={() => onDelete(tool)}
          onToggleActive={() => onToggleActive(tool)}
          onDuplicate={() => onDuplicate(tool)}
          isDuplicating={duplicatingId === tool.id}
          onPreviewPrompt={onPreviewPrompt}
          onManageParams={() => onManageParams(tool)}
          onManageScripts={() => onManageScripts(tool)}
        />
      ))}
    </div>
  );
}
