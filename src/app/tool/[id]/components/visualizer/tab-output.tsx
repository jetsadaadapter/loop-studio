"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Table2, FileCode } from "lucide-react";
import type { ToolJob } from "@/core/interfaces/tools.interface";
import {
  getAnalysisDisplayPresetForJob,
  type ScrapedJobItem,
  getSchemaHintKeysFromJob,
  getMergedGeminiItems,
  groupIntentAnalysisByPost,
  isPurchaseIntentAnalysis,
} from "../../tool-job-utils";
import { TabJsonView } from "./tab-json-view";
import { OutputCell, getHeaderLabel } from "./cell-renderer";
import { TablePagination } from "./table-pagination";
import { OutputOverviewTable } from "./output-overview-table";
import { CommentThreadCard, type CommentItem } from "./comment-thread-card";
import {
  IntentAnalysisCard,
  type IntentAnalysisItem,
} from "./intent-analysis-card";
import { IntentAnalysisSummary } from "./intent-analysis-summary";

interface TabOutputProps {
  job: ToolJob;
}

export function TabOutput({ job }: TabOutputProps) {
  const [innerTab, setInnerTab] = useState<"overview" | "all">("overview");
  const [viewMode, setViewMode] = useState<"table" | "json">("table");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const items = getMergedGeminiItems(job);

  if (process.env.NODE_ENV !== "production") {
    console.debug("[TabOutput] items count:", items.length);
    console.debug(
      "[TabOutput] first item keys:",
      items[0] ? Object.keys(items[0] as Record<string, unknown>) : [],
    );
    console.debug(
      "[TabOutput] first item.analysis:",
      items[0] ? (items[0] as Record<string, unknown>).analysis : undefined,
    );
    console.debug(
      "[TabOutput] job.plugin:",
      job.plugin,
      "| result items:",
      job.result?.items?.length ?? 0,
      "| previousItems:",
      (job.input?.previousResults as { items?: unknown[] } | undefined)?.items
        ?.length ?? 0,
    );
  }

  const isCommentScraper = items.some(
    (item) =>
      (item as Record<string, unknown>).commentId ||
      (item as Record<string, unknown>).profileName,
  );
  const hasAnyAnalysis = items.some((item) => {
    const a = (item as Record<string, unknown>).analysis as
      | Record<string, unknown>
      | undefined;
    return (
      a !== null &&
      a !== undefined &&
      typeof a === "object" &&
      Object.keys(a).length > 0
    );
  });
  const hasPurchaseIntentShape = items.some((item) =>
    isPurchaseIntentAnalysis(item.analysis),
  );
  const isAnalysisOverview = hasAnyAnalysis;
  const intentGroups = hasPurchaseIntentShape
    ? groupIntentAnalysisByPost(items)
    : [];
  const showIntentSummary = hasPurchaseIntentShape && intentGroups.length > 0;
  const hasSourceUrls = items.some((item) => {
    const raw = item as Record<string, unknown>;
    return Boolean(
      raw.postUrl ||
        raw.facebookUrl ||
        raw.url ||
        raw.inputUrl ||
        raw.permalink_url ||
        raw.sourceKeyValue,
    );
  });
  const schemaHintKeys = getSchemaHintKeysFromJob(job);
  const analysisDisplayPreset = getAnalysisDisplayPresetForJob(job);

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 bg-white select-none h-full">
        <Table2 className="size-12 text-slate-300 mb-3" />
        <p className="text-sm font-bold text-slate-700">
          No output dataset items found
        </p>
        <p className="text-xs text-slate-450 mt-1.5 max-w-xs text-center leading-normal">
          This run did not produce any dataset entries. Check the execution logs
          to diagnose potential issues.
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
  const baseKeys = Array.from(
    new Set(items.flatMap((item) => Object.keys(item))),
  ).filter((k) => {
    if (k === "analysis") return false; // Filter out analysis object to keep table clean
    if (k === "media") return true; // Explicitly preserve media because we have a premium interactive popover for it

    // Show only primitive fields that are NOT object/array children (null counts as primitive)
    return !items.some((item) => {
      const val = (item as Record<string, unknown>)[k];
      return val !== null && typeof val === "object";
    });
  });

  // Inject AI analysis columns if at least one item has AI analysis results
  const hasAnalysis = items.some((item) => item.analysis);
  const analysisKeys = Array.from(
    new Set(
      items.flatMap((item) => {
        const analysis = (item as Record<string, unknown>).analysis as
          | Record<string, unknown>
          | undefined;
        if (!analysis || typeof analysis !== "object") return [];
        return Object.keys(analysis).filter((key) => {
          const value = analysis[key];
          if (value === null || value === undefined) return false;
          if (Array.isArray(value)) return true;
          if (typeof value === "object") {
            return schemaHintKeys.includes(key.toLowerCase());
          }
          return true;
        });
      }),
    ),
  );

  const prioritizedAnalysisKeys = [
    "classification",
    "confidence_score",
    "purchase_intent_signal",
    "sentiment",
    "summary_of_intent",
    "summary",
    "keywords",
  ];

  const orderedAnalysisKeys = [
    ...prioritizedAnalysisKeys.filter((key) => analysisKeys.includes(key)),
    ...schemaHintKeys.filter(
      (key) =>
        analysisKeys.includes(key) && !prioritizedAnalysisKeys.includes(key),
    ),
    ...analysisKeys.filter(
      (key) =>
        !prioritizedAnalysisKeys.includes(key) && !schemaHintKeys.includes(key),
    ),
  ];

  const allKeys = Array.from(
    new Set(
      hasAnalysis
        ? [
            ...baseKeys.filter(
              (k) =>
                k !== "likes" &&
                k !== "likesCount" &&
                k !== "comments" &&
                k !== "commentsCount" &&
                k !== "shares",
            ),
            ...orderedAnalysisKeys,
            ...baseKeys.filter(
              (k) =>
                k === "likes" ||
                k === "likesCount" ||
                k === "comments" ||
                k === "commentsCount" ||
                k === "shares",
            ),
          ]
        : baseKeys
    )
  );

  const getValue = (item: ScrapedJobItem, key: string) => {
    const rawItem = item as Record<string, unknown>;
    if (rawItem[key] !== undefined) return rawItem[key];

    const analysis = rawItem.analysis as Record<string, unknown> | undefined;
    if (analysis && analysis[key] !== undefined) return analysis[key];

    return rawItem[key];
  };

  const isLongTextKey = (key: string) => {
    const normalized = key.toLowerCase();
    return (
      normalized === "text" ||
      normalized === "summary" ||
      normalized === "summary_of_intent" ||
      normalized === "caption" ||
      normalized === "message" ||
      normalized === "posttitle" ||
      normalized === "previewtitle" ||
      normalized === "previewdescription"
    );
  };

  const isUrlKey = (key: string) => {
    const normalized = key.toLowerCase();
    return (
      normalized === "url" ||
      normalized === "facebookurl" ||
      normalized === "commenturl" ||
      normalized === "inputurl" ||
      normalized === "posturl" ||
      normalized === "permalink_url"
    );
  };

  const isCompactMetaKey = (key: string) => {
    const normalized = key.toLowerCase();
    return (
      normalized === "classification" ||
      normalized === "sentiment" ||
      normalized === "confidence_score" ||
      normalized === "purchase_intent_signal" ||
      normalized === "likes" ||
      normalized === "likescount" ||
      normalized === "comments" ||
      normalized === "commentscount" ||
      normalized === "shares" ||
      normalized === "viewscount"
    );
  };

  const getHeaderColClass = (key: string) => {
    if (isLongTextKey(key)) return "min-w-72";
    if (isUrlKey(key)) return "min-w-56";
    if (key.toLowerCase() === "keywords") return "min-w-44";
    if (isCompactMetaKey(key)) return "min-w-36";
    return "min-w-36";
  };

  const getCellColClass = (key: string) => {
    if (isLongTextKey(key)) return "whitespace-normal align-top";
    if (isUrlKey(key)) return "whitespace-nowrap align-top";
    return "whitespace-nowrap";
  };

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
              innerTab === "overview"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800",
            )}
          >
            {isAnalysisOverview
              ? "Analysis"
              : isCommentScraper
                ? "Thread view"
                : "Overview"}
          </button>
          <button
            onClick={() => setInnerTab("all")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer",
              innerTab === "all"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800",
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
                viewMode === "table"
                  ? "bg-white text-brand shadow-xs"
                  : "text-slate-400 hover:text-slate-600",
              )}
              title="Table view"
            >
              <Table2 className="size-4" />
            </button>
            <button
              onClick={() => setViewMode("json")}
              className={cn(
                "p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer",
                viewMode === "json"
                  ? "bg-white text-brand shadow-xs"
                  : "text-slate-400 hover:text-slate-600",
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
          isAnalysisOverview ? (
            <div className="bg-slate-50/60 p-6 flex-1 min-h-0 overflow-y-auto">
              <div className="max-w-5xl mx-auto space-y-5">
                {showIntentSummary && (
                  <IntentAnalysisSummary
                    groups={intentGroups}
                    totalItems={items.length}
                  />
                )}
                {paginatedItems.map((item, idx) => (
                  <IntentAnalysisCard
                    key={`analysis-${startIndex + idx}`}
                    item={item as unknown as IntentAnalysisItem}
                    index={startIndex + idx}
                    schemaHintKeys={schemaHintKeys}
                    analysisDisplayPreset={analysisDisplayPreset}
                    isGenericMode={!hasSourceUrls}
                  />
                ))}
              </div>
            </div>
          ) : isCommentScraper ? (
            <div className="bg-slate-50 p-6 flex-1 min-h-0 overflow-y-auto">
              <div className="max-w-4xl mx-auto space-y-6">
                {paginatedItems.map((item, idx) => (
                  <CommentThreadCard
                    key={`comment-${(item as Record<string, unknown>).id || idx}`}
                    comment={item as unknown as CommentItem}
                  />
                ))}
              </div>
            </div>
          ) : (
            <OutputOverviewTable
              items={paginatedItems}
              startIndex={startIndex}
            />
          )
        ) : (
          /* All Fields View */
          <div className="min-w-full inline-block align-middle overflow-x-auto bg-white">
            <table className="min-w-full divide-y divide-slate-100 border-b border-slate-200">
              <thead className="bg-slate-50/80 sticky top-0 z-10 text-[10.5px] font-bold text-slate-500 tracking-wider uppercase border-b border-slate-200">
                <tr>
                  <th
                    scope="col"
                    className="w-12 px-4 py-3 text-slate-400 text-center"
                  >
                    #
                  </th>
                  {allKeys.map((key) => (
                    <th
                      key={`all-header-${key}`}
                      scope="col"
                      className={cn("px-4 py-3", getHeaderColClass(key))}
                    >
                      <div className="flex flex-col">
                        <span className="text-slate-650">
                          {getHeaderLabel(key)}
                        </span>
                        <span className="text-slate-400 text-[9px] font-sans lowercase tracking-normal">
                          {key}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-xs font-semibold text-slate-700">
                {paginatedItems.map((item, idx) => (
                  <tr
                    key={`all-row-${idx}`}
                    className="hover:bg-slate-50/60 transition-colors even:bg-slate-50/20"
                  >
                    <td className="px-4 py-3.5 text-slate-400 font-bold text-center border-r border-slate-150 bg-slate-50/30 select-none">
                      {startIndex + idx + 1}
                    </td>
                    {allKeys.map((key) => (
                      <td
                        key={`all-cell-${idx}-${key}`}
                        className={cn("px-4 py-3.5", getCellColClass(key))}
                      >
                        <OutputCell
                          value={getValue(item, key)}
                          columnKey={key}
                        />
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
