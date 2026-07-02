"use client";

import { ManagerPagination } from "@/components/manager-pagination";
import type { ManageTagApiItem } from "@/core/interfaces/tags.interface";
import { TagTableSkeletonRows, TagTableRow, TagTableEmpty } from "./tag-table";

interface TagTablePanelProps {
  isLoading: boolean;
  loadError: string;
  tags: ManageTagApiItem[];
  filtered: ManageTagApiItem[];
  pagedTags: ManageTagApiItem[];
  currentPage: number;
  pageSize: number;
  hasActiveFilter: boolean;
  onRetry: () => void;
  onCreateFirst: () => void;
  onClearFilters: () => void;
  onEdit: (tag: ManageTagApiItem) => void;
  onDelete: (tag: ManageTagApiItem) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function TagTablePanel({
  isLoading,
  loadError,
  tags,
  filtered,
  pagedTags,
  currentPage,
  pageSize,
  hasActiveFilter,
  onRetry,
  onCreateFirst,
  onClearFilters,
  onEdit,
  onDelete,
  onPageChange,
  onPageSizeChange,
}: TagTablePanelProps) {
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  return (
    <>
      <div className="relative w-full overflow-x-auto border border-slate-200 rounded-sm bg-white shadow-3xs">
        <table className="w-full caption-bottom text-xs min-w-full md:min-w-2xl">
          <thead className="[&_tr]:border-b bg-slate-50/50">
            <tr className="border-b transition-colors hover:bg-transparent">
              <th className="text-foreground h-10 text-left align-middle font-semibold whitespace-nowrap p-3 px-4 w-10 hidden xs:table-cell">#</th>
              <th className="text-foreground h-10 text-left align-middle font-semibold whitespace-nowrap p-3">Tag Name</th>
              <th className="text-foreground h-10 text-left align-middle font-semibold whitespace-nowrap p-3 w-32 hidden md:table-cell">Color</th>
              <th className="text-foreground h-10 text-left align-middle font-semibold whitespace-nowrap p-3 w-36 hidden md:table-cell">Created</th>
              <th className="text-foreground h-10 text-left align-middle font-semibold whitespace-nowrap p-3 w-36 hidden md:table-cell">Updated</th>
              <th className="text-foreground h-10 text-right align-middle font-semibold whitespace-nowrap p-3 px-4 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <TagTableSkeletonRows />
            ) : filtered.length === 0 ? (
              <TagTableEmpty
                loadError={loadError}
                hasNoTags={tags.length === 0}
                hasActiveFilter={hasActiveFilter}
                onRetry={onRetry}
                onCreateFirst={onCreateFirst}
                onClearFilters={onClearFilters}
              />
            ) : (
              pagedTags.map((tag, index) => (
                <TagTableRow
                  key={tag.id}
                  tag={tag}
                  index={(safeCurrentPage - 1) * pageSize + index}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </tbody>
        </table>

        {!isLoading && filtered.length > 0 && (
          <div className="border-t border-slate-100 px-4 py-2.5">
            <span className="text-[11px] text-slate-400">
              Showing {pagedTags.length} of {filtered.length} tags
              {filtered.length !== tags.length && ` (${tags.length} total)`}
            </span>
          </div>
        )}
      </div>

      {!isLoading && filtered.length > pageSize && (
        <ManagerPagination
          currentPage={safeCurrentPage}
          pageSize={pageSize}
          totalItems={filtered.length}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={[5, 10, 20, 50]}
        />
      )}
    </>
  );
}
