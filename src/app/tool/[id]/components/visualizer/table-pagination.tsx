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
    <div className="bg-[#121316] border-t border-zinc-850 px-4 py-2.5 flex items-center justify-between shrink-0 select-none text-xs text-zinc-400">
      {/* Left Side: Items Per Page */}
      <div className="flex items-center gap-2">
        <span>Items per page:</span>
        <div className="relative">
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="appearance-none bg-[#0b0c0e] border border-zinc-800 rounded-md text-zinc-200 text-xs px-2.5 py-1.5 pr-8 hover:bg-zinc-900 cursor-pointer outline-none transition-colors"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-zinc-500">
            <ChevronRight className="size-3.5 rotate-90" />
          </div>
        </div>
        <span className="text-zinc-600 ml-1">
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
            className="w-10 h-7 bg-[#0b0c0e] border border-zinc-800 focus:border-zinc-700 rounded text-center text-zinc-200 text-xs outline-none transition-colors"
            placeholder=""
          />
          <button
            onClick={handleGoToPage}
            className="h-7 px-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded text-xs font-semibold cursor-pointer active:scale-95 transition-all"
          >
            Go
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-md hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="w-7 h-7 bg-zinc-900 border border-zinc-800 text-zinc-200 rounded flex items-center justify-center text-xs font-bold shadow-sm">
            {currentPage}
          </div>
          <span className="text-zinc-600">of</span>
          <span className="text-zinc-400 font-bold">{totalPages}</span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-md hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
