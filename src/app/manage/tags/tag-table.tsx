"use client";

import { Tag, Edit3, Trash2 } from "lucide-react";
import { ManagerActionsDropdown } from "@/components/manager-actions-dropdown";
import { Button } from "@/components/ui/button";
import type { ManageTagApiItem } from "@/core/interfaces/tags.interface";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return iso.slice(0, 10);
}

function resolveColor(color: string): string | undefined {
  return color && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────

export function TagTableSkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={`skeleton-row-${i}`} className="animate-pulse">
          <td className="p-3 px-4 hidden xs:table-cell">
            <div className="h-4 w-4 bg-slate-100 rounded" />
          </td>
          <td className="p-3">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-slate-100 shrink-0" />
              <div className="min-w-0 space-y-1.5 flex-1">
                <div className="h-3.5 w-32 bg-slate-100 rounded" />
                <div className="h-2.5 w-16 bg-slate-100 rounded" />
                <div className="flex gap-1.5 mt-1.5 md:hidden">
                  <div className="h-3.5 w-12 bg-slate-100 rounded-sm" />
                  <div className="h-3.5 w-16 bg-slate-100 rounded-sm" />
                </div>
              </div>
            </div>
          </td>
          <td className="p-3 hidden md:table-cell">
            <div className="h-5.5 w-20 bg-slate-100 rounded-full" />
          </td>
          <td className="p-3 hidden md:table-cell">
            <div className="h-3.5 w-20 bg-slate-100 rounded" />
          </td>
          <td className="p-3 hidden md:table-cell">
            <div className="h-3.5 w-20 bg-slate-100 rounded" />
          </td>
          <td className="p-3 pr-4">
            <div className="flex justify-end pr-1">
              <div className="h-7 w-7 bg-slate-100 rounded-sm" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tag Row
// ─────────────────────────────────────────────────────────────────────────────

interface TagTableRowProps {
  tag: ManageTagApiItem;
  index: number;
  onEdit: (tag: ManageTagApiItem) => void;
  onDelete: (tag: ManageTagApiItem) => void;
}

export function TagTableRow({ tag, index, onEdit, onDelete }: TagTableRowProps) {
  const tagColor = resolveColor(tag.color);

  return (
    <tr className="hover:bg-slate-50/50 transition-colors border-b last:border-0">
      {/* # */}
      <td className="p-3 px-4 align-middle whitespace-nowrap text-xs font-semibold text-slate-400 hidden xs:table-cell">
        {index + 1}
      </td>

      {/* Name */}
      <td className="p-3 align-middle min-w-[200px]">
        <div className="flex items-center gap-3">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/15 shadow-2xs"
            style={{ backgroundColor: tagColor ?? "#cbd5e1" }}
          >
            <Tag className="size-4 text-white drop-shadow-xs" />
          </span>
          <div className="min-w-0">
            <span className="text-sm font-semibold text-slate-800 tracking-tight block leading-tight">
              {tag.name}
            </span>
            <span className="text-[10px] font-sans text-slate-400 block mt-0.5 leading-none">
              #{tag.id.slice(0, 8)}
            </span>
            {/* Mobile-only inline attributes */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5 md:hidden">
              {tagColor ? (
                <span
                  className="inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-[8px] font-bold border"
                  style={{
                    backgroundColor: `${tagColor}18`,
                    color: tagColor,
                    borderColor: `${tagColor}30`,
                  }}
                >
                  {tag.color.toUpperCase()}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-slate-50 text-[8px] font-bold text-slate-400 border border-slate-200/60">
                  No color
                </span>
              )}
              <span className="text-[9px] text-slate-400 font-sans">
                Created: {formatDate(tag.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </td>

      {/* Color badge */}
      <td className="p-3 align-middle whitespace-nowrap hidden md:table-cell">
        {tagColor ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border"
            style={{
              backgroundColor: `${tagColor}18`,
              color: tagColor,
              borderColor: `${tagColor}30`,
            }}
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: tagColor }}
            />
            {tag.color.toUpperCase()}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 text-[10px] font-bold text-slate-400 border border-slate-200/60">
            No color
          </span>
        )}
      </td>

      {/* Created */}
      <td className="p-3 align-middle whitespace-nowrap text-xs text-slate-500 hidden md:table-cell">
        {formatDate(tag.createdAt)}
      </td>

      {/* Updated */}
      <td className="p-3 align-middle whitespace-nowrap text-xs text-slate-500 hidden md:table-cell">
        {formatDate(tag.updatedAt)}
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
                onClick: () => onEdit(tag),
              },
              {
                label: "Delete",
                icon: Trash2,
                onClick: () => onDelete(tag),
                variant: "destructive",
                showSeparatorBefore: true,
              },
            ]}
          />
        </div>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────────────────────────────────────

interface TagTableEmptyProps {
  loadError: string;
  hasNoTags: boolean;
  hasActiveFilter: boolean;
  onRetry: () => void;
  onCreateFirst: () => void;
  onClearFilters: () => void;
}

export function TagTableEmpty({
  loadError,
  hasNoTags,
  hasActiveFilter,
  onRetry,
  onCreateFirst,
  onClearFilters,
}: TagTableEmptyProps) {
  return (
    <tr>
      <td colSpan={6} className="py-16 text-center select-none">
        <div className="flex flex-col items-center gap-4">
          {loadError ? (
            <>
              <div className="flex size-12 items-center justify-center rounded-xl bg-red-50 border border-red-100 text-red-400">
                <Tag className="size-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800">Unable to load tags</p>
                <p className="text-xs text-slate-500">{loadError}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="h-8 border-slate-200 cursor-pointer"
              >
                Retry
              </Button>
            </>
          ) : (
            <>
              <div className="flex size-12 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-400">
                <Tag className="size-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800">
                  {hasNoTags ? "No tags yet" : "No tags found"}
                </p>
                <p className="text-xs text-slate-500">
                  {hasNoTags
                    ? "Click the button above to add your first tag"
                    : "Try changing your search query or filters"}
                </p>
              </div>
              {hasNoTags ? (
                <Button
                  type="button"
                  onClick={onCreateFirst}
                  className="h-8 bg-brand hover:bg-brand/80 text-white text-xs font-semibold px-4.5 rounded-sm cursor-pointer"
                >
                  Create First Tag
                </Button>
              ) : hasActiveFilter ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClearFilters}
                  className="h-8 border-slate-200 cursor-pointer"
                >
                  Clear Filters
                </Button>
              ) : null}
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

