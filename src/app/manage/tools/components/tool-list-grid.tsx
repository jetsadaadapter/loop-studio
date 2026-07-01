"use client";

import type { ManageToolApiItem, ToolParam } from "@/core/interfaces/tool";
import { ToolRow } from "./tool-row";

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
