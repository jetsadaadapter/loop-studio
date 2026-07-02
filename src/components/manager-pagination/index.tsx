import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ManagerPaginationProps = {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
};

export function ManagerPagination({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
}: ManagerPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const resultStart = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const resultEnd = Math.min(safeCurrentPage * pageSize, totalItems);

  // Generate page numbers with elegant ellipsis logic
  const pageRange = useMemo(() => {
    const range: number[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) range.push(i);
    } else {
      if (safeCurrentPage <= 3) {
        range.push(1, 2, 3, 4, -1, totalPages);
      } else if (safeCurrentPage >= totalPages - 2) {
        range.push(1, -1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        range.push(1, -1, safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, -1, totalPages);
      }
    }
    // Deduplicate array values
    return range.filter((v, i, arr) => v !== arr[i - 1]);
  }, [safeCurrentPage, totalPages]);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 select-none">
      {/* Left side: Results descriptor and Page Size dropdown */}
      <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
        <span>
          Results: {resultStart} - {resultEnd} of {totalItems}
        </span>
        <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
          <span className="font-normal text-slate-400">Page size:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => val && onPageSizeChange(Number(val))}
          >
            <SelectTrigger className="h-8 w-16 rounded-sm border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 shadow-3xs cursor-pointer focus:ring-0 focus:ring-offset-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((opt) => (
                <SelectItem key={opt} value={String(opt)}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Right side: Modern Pagination Controls */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={safeCurrentPage <= 1}
          onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
          className="size-8 rounded-sm border border-slate-200/60 hover:bg-slate-50 cursor-pointer text-slate-500 transition-colors shadow-3xs flex items-center justify-center bg-white"
        >
          <ChevronLeft className="size-4" />
        </Button>

        {pageRange.map((page, idx) => {
          if (page === -1) {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 text-slate-400 font-semibold select-none text-xs"
              >
                ...
              </span>
            );
          }
          return (
            <Button
              key={`page-${page}`}
              type="button"
              onClick={() => onPageChange(page)}
              className={`size-8 text-xs font-bold rounded-sm transition-all flex items-center justify-center cursor-pointer ${
                page === safeCurrentPage
                  ? "bg-brand text-white shadow-sm shadow-brand/10 hover:bg-brand/90 hover:text-white"
                  : "border border-slate-200/60 text-slate-600 hover:bg-slate-50 hover:text-slate-800 shadow-3xs bg-white"
              }`}
            >
              {page}
            </Button>
          );
        })}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={safeCurrentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, safeCurrentPage + 1))}
          className="size-8 rounded-sm border border-slate-200/60 hover:bg-slate-50 cursor-pointer text-slate-500 transition-colors shadow-3xs flex items-center justify-center bg-white"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
