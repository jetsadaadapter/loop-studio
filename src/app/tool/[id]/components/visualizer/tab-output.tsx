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
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 bg-white select-none h-full">
        <Table2 className="size-12 text-slate-300 mb-3" />
        <p className="text-sm font-bold text-slate-700">No output dataset items found</p>
        <p className="text-xs text-slate-450 mt-1.5 max-w-xs text-center leading-normal">
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
    <div className="flex-1 flex flex-col min-h-0 bg-white text-slate-700">
      {/* Visualizer Controls Bar */}
      <div className="bg-white border-b border-slate-200/80 px-4 py-2 flex items-center justify-between shrink-0 select-none shadow-xs">
        {/* Inner Tabs (Left) */}
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200/60">
          <button
            onClick={() => setInnerTab("overview")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer",
              innerTab === "overview" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
            )}
          >
            Overview
          </button>
          <button
            onClick={() => setInnerTab("all")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer",
              innerTab === "all" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
            )}
          >
            All fields
          </button>
        </div>

        {/* View Toggles (Right) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200/60">
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer",
                viewMode === "table" ? "bg-white text-brand shadow-xs" : "text-slate-400 hover:text-slate-600"
              )}
              title="Table view"
            >
              <Table2 className="size-4" />
            </button>
            <button
              onClick={() => setViewMode("json")}
              className={cn(
                "p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer",
                viewMode === "json" ? "bg-white text-brand shadow-xs" : "text-slate-400 hover:text-slate-600"
              )}
              title="JSON view"
            >
              <FileCode className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto min-h-0 bg-white">
        {viewMode === "json" ? (
          <TabJsonView items={items} />
        ) : innerTab === "overview" ? (
          <div className="min-w-full inline-block align-middle">
            <table className="min-w-full divide-y divide-slate-100 border-b border-slate-200">
              <thead className="bg-slate-50/80 sticky top-0 z-10 text-[10.5px] font-bold text-slate-500 tracking-wider uppercase border-b border-slate-200">
                <tr>
                  <th scope="col" className="w-12 px-4 py-3 text-slate-400 text-center">#</th>
                  <th scope="col" className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-slate-650">Media</span>
                      <span className="text-slate-400 text-[9px] font-mono lowercase tracking-normal">media</span>
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-slate-650">Post url</span>
                      <span className="text-slate-400 text-[9px] font-mono lowercase tracking-normal">url</span>
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 min-w-[280px]">
                    <div className="flex flex-col">
                      <span className="text-slate-650">Post text</span>
                      <span className="text-slate-400 text-[9px] font-mono lowercase tracking-normal">text</span>
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-slate-650">Likes</span>
                      <span className="text-slate-400 text-[9px] font-mono lowercase tracking-normal">likes</span>
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-slate-650">Comments</span>
                      <span className="text-slate-400 text-[9px] font-mono lowercase tracking-normal">comments</span>
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-slate-650">Shares</span>
                      <span className="text-slate-400 text-[9px] font-mono lowercase tracking-normal">shares</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-xs font-semibold text-slate-700">
                {paginatedItems.map((item, idx) => (
                  <tr key={`ov-row-${idx}`} className="hover:bg-slate-50/60 transition-colors even:bg-slate-50/20">
                    <td className="px-4 py-3.5 text-slate-400 font-bold text-center border-r border-slate-150 bg-slate-50/30 select-none">
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
                    <td className="px-4 py-3.5 text-right font-mono text-slate-900 font-bold">
                      {item.likes !== undefined ? item.likes.toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-slate-900 font-bold">
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
                    <td className="px-4 py-3.5 text-right font-mono text-slate-900 font-bold">
                      {item.shares !== undefined ? item.shares.toLocaleString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* All Fields View */
          <div className="min-w-full inline-block align-middle overflow-x-auto bg-white">
            <table className="min-w-full divide-y divide-slate-100 border-b border-slate-200">
              <thead className="bg-slate-50/80 sticky top-0 z-10 text-[10.5px] font-bold text-slate-500 tracking-wider uppercase border-b border-slate-200">
                <tr>
                  <th scope="col" className="w-12 px-4 py-3 text-slate-400 text-center">#</th>
                  {allKeys.map((key) => (
                    <th key={`all-header-${key}`} scope="col" className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-slate-650">{getHeaderLabel(key)}</span>
                        <span className="text-slate-400 text-[9px] font-mono lowercase tracking-normal">{key}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-xs font-semibold text-slate-700">
                {paginatedItems.map((item, idx) => (
                  <tr key={`all-row-${idx}`} className="hover:bg-slate-50/60 transition-colors even:bg-slate-50/20">
                    <td className="px-4 py-3.5 text-slate-400 font-bold text-center border-r border-slate-150 bg-slate-50/30 select-none">
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
