import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

type ManagerPaginationProps = {
  currentPage: number;
  totalPages: number;
  pageNumbers: number[];
  start: number;
  end: number;
  total: number;
  onPageChange: (page: number) => void;
};

export function ManagerPagination({
  currentPage,
  totalPages,
  pageNumbers,
  start,
  end,
  total,
  onPageChange,
}: ManagerPaginationProps) {
  return (
    <div className="flex flex-col items-center justify-between gap-3 rounded-xl border bg-card p-3 text-sm sm:flex-row">
      <p className="text-muted-foreground">
        Showing {start}-{end} of {total}
      </p>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          <ChevronLeft className="size-4" />
        </Button>

        {pageNumbers.map((page) => (
          <Button
            key={page}
            type="button"
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            className="min-w-9"
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ))}

        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
