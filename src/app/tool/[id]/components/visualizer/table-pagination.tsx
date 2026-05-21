"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TablePaginationProps {
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
}

export function TablePagination({
  pageSize,
  onPageSizeChange,
  currentPage,
  onPageChange,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
}: TablePaginationProps) {
  const [goToInput, setGoToInput] = useState("");

  // Reset the "Go to" input when page changes
  useEffect(() => {
    setGoToInput("");
  }, [currentPage]);

  const handleGoToPage = () => {
    const pageNum = parseInt(goToInput, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
      setGoToInput("");
    }
  };

  return (
    <div className="bg-white border-t border-slate-200/80 px-4 py-2.5 flex items-center justify-between shrink-0 select-none text-xs text-slate-500">
      {/* Left Side: Items Per Page */}
      <div className="flex items-center gap-2">
        <span>Items per page:</span>
        <div className="relative">
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="appearance-none bg-slate-50 border border-slate-200 rounded-md text-slate-750 text-xs px-2.5 py-1.5 pr-8 hover:bg-slate-100 cursor-pointer outline-none transition-colors"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
            <ChevronRight className="size-3.5 rotate-90" />
          </div>
        </div>
        <span className="text-slate-400 ml-1">
          Showing {startIndex + 1}–{Math.min(endIndex, totalItems)} of {totalItems}
        </span>
      </div>

      {/* Right Side: Page Navigation */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span>Go to page:</span>
          <input
            type="text"
            value={goToInput}
            onChange={(e) => setGoToInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGoToPage()}
            className="w-10 h-7 bg-slate-50 border border-slate-200 focus:border-brand/40 focus:ring-2 focus:ring-brand/10 rounded text-center text-slate-700 text-xs outline-none transition-colors"
            placeholder=""
          />
          <button
            onClick={handleGoToPage}
            className="h-7 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-650 hover:text-slate-800 rounded text-xs font-semibold cursor-pointer active:scale-95 transition-all shadow-xs"
          >
            Go
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-850 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="w-7 h-7 bg-white border border-slate-200 text-slate-750 rounded flex items-center justify-center text-xs font-bold shadow-xs">
            {currentPage}
          </div>
          <span className="text-slate-400">of</span>
          <span className="text-slate-500 font-bold">{totalPages}</span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-850 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
