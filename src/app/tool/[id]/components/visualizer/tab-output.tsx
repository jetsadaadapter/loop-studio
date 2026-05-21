"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Table2, FileCode } from "lucide-react";
import type { ToolJob } from "@/core/interfaces/tools.interface";
import type { ScrapedJobItem } from "../../tool-job-utils";
import { TabJsonView } from "./tab-json-view";
import { OutputCell, getHeaderLabel } from "./cell-renderer";
import { TablePagination } from "./table-pagination";

interface TabOutputProps {
  job: ToolJob;
}

export function TabOutput({ job }: TabOutputProps) {
  const [innerTab, setInnerTab] = useState<"overview" | "all">("overview");
  const [viewMode, setViewMode] = useState<"table" | "json">("table");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const items = (job.result?.items || []) as ScrapedJobItem[];

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-zinc-500 bg-[#0f1013] select-none h-full">
        <Table2 className="size-12 text-zinc-700 mb-3 animate-pulse" />
        <p className="text-sm font-bold text-zinc-400">No output dataset items found</p>
        <p className="text-xs text-zinc-600 mt-1 max-w-xs text-center leading-normal">
          This run did not produce any dataset entries. Check the execution logs to diagnose potential issues.
        </p>
      </div>
    );
  }

  // Pagination Math
  const totalPages = Math.ceil(items.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedItems = items.slice(startIndex, endIndex);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  // Collect all unique keys for "All Fields"
  // Filter out analysis object and keys whose values contain nested objects/arrays (not primitive data)
  const allKeys = Array.from(
    new Set(items.flatMap((item) => Object.keys(item)))
  ).filter((k) => {
    if (k === "analysis") return false; // Filter out analysis object to keep table clean
    if (k === "media") return true; // Explicitly preserve media because we have a premium interactive popover for it
    
    // Show only primitive fields that are NOT object/array children (null counts as primitive)
    return !items.some((item) => {
      const val = (item as Record<string, unknown>)[k];
      return val !== null && typeof val === "object";
    });
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0f1013] text-zinc-300">
      {/* Visualizer Controls Bar */}
      <div className="bg-[#121316] border-b border-zinc-850 px-4 py-2 flex items-center justify-between shrink-0 select-none">
        {/* Inner Tabs (Left) */}
        <div className="flex items-center bg-[#0b0c0e] rounded-lg p-0.5 border border-zinc-800">
          <button
            onClick={() => setInnerTab("overview")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer",
              innerTab === "overview" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            Overview
          </button>
          <button
            onClick={() => setInnerTab("all")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer",
              innerTab === "all" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            All fields
          </button>
        </div>

        {/* View Toggles (Right) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#0b0c0e] rounded-lg p-0.5 border border-zinc-800">
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer",
                viewMode === "table" ? "bg-zinc-800 text-blue-400 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
              )}
              title="Table view"
            >
              <Table2 className="size-4" />
            </button>
            <button
              onClick={() => setViewMode("json")}
              className={cn(
                "p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer",
                viewMode === "json" ? "bg-zinc-800 text-blue-400 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
              )}
              title="JSON view"
            >
              <FileCode className="size-4" />
            </button>
          </div>


        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto min-h-0">
        {viewMode === "json" ? (
          <TabJsonView items={items} />
        ) : innerTab === "overview" ? (
          <div className="min-w-full inline-block align-middle">
            <table className="min-w-full divide-y divide-zinc-800 border-b border-zinc-850">
              <thead className="bg-[#121316] sticky top-0 z-10 text-[10.5px] font-bold text-zinc-450 tracking-wider uppercase border-b border-zinc-800">
                <tr>
                  <th scope="col" className="w-12 px-4 py-3 text-zinc-500 text-center">#</th>
                  <th scope="col" className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-zinc-350">Media</span>
                      <span className="text-zinc-600 text-[9px] font-mono lowercase tracking-normal">media</span>
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-zinc-350">Post url</span>
                      <span className="text-zinc-600 text-[9px] font-mono lowercase tracking-normal">url</span>
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 min-w-[280px]">
                    <div className="flex flex-col">
                      <span className="text-zinc-350">Post text</span>
                      <span className="text-zinc-600 text-[9px] font-mono lowercase tracking-normal">text</span>
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-zinc-350">Likes</span>
                      <span className="text-zinc-600 text-[9px] font-mono lowercase tracking-normal">likes</span>
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-zinc-350">Comments</span>
                      <span className="text-zinc-600 text-[9px] font-mono lowercase tracking-normal">comments</span>
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-zinc-350">Shares</span>
                      <span className="text-zinc-600 text-[9px] font-mono lowercase tracking-normal">shares</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 bg-[#0f1013] text-xs font-semibold text-zinc-300">
                {paginatedItems.map((item, idx) => (
                  <tr key={`ov-row-${idx}`} className="hover:bg-zinc-900/30 transition-colors even:bg-zinc-900/10">
                    <td className="px-4 py-3.5 text-zinc-500 font-bold text-center border-r border-zinc-850/50 bg-[#121316]/10 select-none">
                      {startIndex + idx + 1}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <OutputCell value={item.media} columnKey="media" />
                    </td>
                    <td className="px-4 py-3.5">
                      <OutputCell value={item.url || item.facebookUrl} columnKey="url" />
                    </td>
                    <td className="px-4 py-3.5">
                      <OutputCell
                        value={item.text || (item as Record<string, unknown>).message || (item as Record<string, unknown>).caption}
                        columnKey="text"
                      />
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-zinc-100 font-bold">
                      {item.likes !== undefined ? item.likes.toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-zinc-100 font-bold">
                      {(() => {
                        const count = item.commentsCount !== undefined
                          ? item.commentsCount
                          : typeof item.comments === "number"
                            ? item.comments
                            : Array.isArray(item.comments)
                              ? item.comments.length
                              : undefined;
                        return count !== undefined ? count.toLocaleString() : "-";
                      })()}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-zinc-100 font-bold">
                      {item.shares !== undefined ? item.shares.toLocaleString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* All Fields View */
          <div className="min-w-full inline-block align-middle overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-800 border-b border-zinc-850">
              <thead className="bg-[#121316] sticky top-0 z-10 text-[10.5px] font-bold text-zinc-450 tracking-wider uppercase border-b border-zinc-800">
                <tr>
                  <th scope="col" className="w-12 px-4 py-3 text-zinc-500 text-center">#</th>
                  {allKeys.map((key) => (
                    <th key={`all-header-${key}`} scope="col" className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-zinc-350">{getHeaderLabel(key)}</span>
                        <span className="text-zinc-655 text-[9px] font-mono lowercase tracking-normal">{key}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 bg-[#0f1013] text-xs font-semibold text-zinc-300">
                {paginatedItems.map((item, idx) => (
                  <tr key={`all-row-${idx}`} className="hover:bg-zinc-900/30 transition-colors even:bg-zinc-900/10">
                    <td className="px-4 py-3.5 text-zinc-500 font-bold text-center border-r border-zinc-850/50 bg-[#121316]/10 select-none">
                      {startIndex + idx + 1}
                    </td>
                    {allKeys.map((key) => (
                      <td key={`all-cell-${idx}-${key}`} className="px-4 py-3.5 whitespace-nowrap">
                        <OutputCell value={(item as Record<string, unknown>)[key]} columnKey={key} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {viewMode === "table" && (
        <TablePagination
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          totalPages={totalPages}
          totalItems={items.length}
          startIndex={startIndex}
          endIndex={endIndex}
        />
      )}
    </div>
  );
}
