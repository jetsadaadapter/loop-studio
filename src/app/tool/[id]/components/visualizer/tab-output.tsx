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
import { TablePagination } from "./table-pagination";
import {
  parseSingleTextSummary,
  getAllKeys,
  isCommentScraperItem,
  normalizeCommentItem,
} from "./tab-output-helpers";
import { ExecutionSummarySection } from "./execution-summary-section";
import { TabOutputOverview } from "./tab-output-overview";
import { AllFieldsTable } from "./all-fields-table";

interface TabOutputProps {
  job: ToolJob;
}

export function TabOutput({ job }: TabOutputProps) {
  const [innerTab, setInnerTab] = useState<"overview" | "all">("overview");
  const [viewMode, setViewMode] = useState<"table" | "json">("table");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [activeSummaryTab, setActiveSummaryTab] = useState(0);

  const rawItems = getMergedGeminiItems(job);

  const isCommentScraper = rawItems.some(isCommentScraperItem);
  const isExportCommentsJob = rawItems.some((item) => {
    const raw = item as Record<string, unknown>;
    return (
      Array.isArray(raw.ecGuids) ||
      Boolean(
        job.plugin &&
        job.plugin.toLowerCase().includes("exportcomments") &&
        !isCommentScraper
      )
    );
  });

  const isExportCommentsFetchJob = Boolean(
    job.plugin &&
    job.plugin.toLowerCase().includes("exportcomments") &&
    isCommentScraper
  );

  const isGeminiSummaryJob = Boolean(
    job.plugin &&
    job.plugin.toLowerCase().includes("gemini") &&
    !(
      job.result &&
      (Array.isArray(job.result) ||
        (typeof job.result === "object" &&
          ("items" in job.result || "itemCount" in job.result)))
    )
  );

  const isPreProcessResult = Boolean(
    job.result &&
    typeof job.result === "object" &&
    !Array.isArray(job.result) &&
    ("preview" in job.result || "config" in job.result)
  );

  const items = isCommentScraper
    ? (rawItems
        .map((item) => normalizeCommentItem(item as Record<string, unknown>))
        .filter((item) => {
          const pId = item.profileId || item.profile_id;
          const fId = item.facebookId || item.facebook_id;
          return Boolean(
            (pId !== undefined && pId !== null && String(pId).trim() !== "" && String(pId) !== "null" && String(pId) !== "undefined") ||
            (fId !== undefined && fId !== null && String(fId).trim() !== "" && String(fId) !== "null" && String(fId) !== "undefined")
          );
        }) as unknown as ScrapedJobItem[])
    : rawItems;

  const {
    isSingleTextSummary,
    singleTextValue,
    summaryParts,
    hasMultipleSummaryTabs,
    uniqueSummaryTabLabels,
  } = parseSingleTextSummary(items);

  const displayedSummaryText = hasMultipleSummaryTabs
    ? summaryParts[activeSummaryTab] || ""
    : singleTextValue;

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
      items.length,
      "| previousItems:",
      (job.input?.previousResults as { items?: unknown[] } | undefined)?.items
        ?.length ?? 0,
    );
  }


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

  const allKeys = getAllKeys(items, schemaHintKeys);

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
            {isPreProcessResult
              ? "Pre-processing"
              : isGeminiSummaryJob
                ? "Summary"
                : isExportCommentsFetchJob
                  ? "Overview"
                  : isAnalysisOverview
                    ? "Analysis"
                    : isCommentScraper
                      ? "Comments"
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
          isSingleTextSummary ? (
            <ExecutionSummarySection
              displayedSummaryText={displayedSummaryText}
              hasMultipleSummaryTabs={hasMultipleSummaryTabs}
              uniqueSummaryTabLabels={uniqueSummaryTabLabels}
              activeSummaryTab={activeSummaryTab}
              setActiveSummaryTab={setActiveSummaryTab}
            />
          ) : (
            <TabOutputOverview
              items={items}
              paginatedItems={paginatedItems}
              startIndex={startIndex}
              isAnalysisOverview={isAnalysisOverview}
              isCommentScraper={isCommentScraper}
              showIntentSummary={showIntentSummary}
              intentGroups={intentGroups}
              schemaHintKeys={schemaHintKeys}
              analysisDisplayPreset={analysisDisplayPreset}
              hasSourceUrls={hasSourceUrls}
              isExportCommentsJob={isExportCommentsJob}
              isExportCommentsFetchJob={isExportCommentsFetchJob}
              job={job}
            />
          )
        ) : (
          <AllFieldsTable
            paginatedItems={paginatedItems}
            allKeys={allKeys}
            startIndex={startIndex}
          />
        )}
      </div>

      {/* Pagination Footer */}
      {viewMode === "table" && !(innerTab === "overview" && isSingleTextSummary) && (
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
