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
} from "../../../tool-job-utils";
import { TabJsonView } from "./tab-json-view";
import { TablePagination } from "../table/table-pagination";
import {
  parseSingleTextSummary,
  getAllKeys,
  isCommentScraperItem,
  normalizeCommentItem,
  detectStructuredObjectSummary,
} from "./tab-output-helpers";
import { ExecutionSummarySection } from "../overview/execution-summary-section";
import { StructuredObjectSummary } from "../overview/structured-object-summary";
import { TabOutputOverview } from "./tab-output-overview";
import { AllFieldsTable } from "../table/all-fields-table";
import { DynamicLayoutVisualizer } from "@/components/dynamic-layout-visualizer";
import type { DynamicUIItem } from "@/components/dynamic-layout-visualizer/types";

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

  const structuredObjectData = !isSingleTextSummary
    ? detectStructuredObjectSummary(items)
    : null;

  const isDynamicLayoutResult = Boolean(
    job.result &&
    typeof job.result === "object" &&
    !Array.isArray(job.result) &&
    "items" in job.result &&
    Array.isArray((job.result as Record<string, unknown>).items) &&
    ((job.result as Record<string, unknown>).items as unknown[]).length > 0 &&
    ((job.result as Record<string, unknown>).items as unknown[]).every((item) => {
      const raw = item as Record<string, unknown>;
      return (
        raw !== null &&
        typeof raw === "object" &&
        typeof raw.task_intent === "string" &&
        Array.isArray(raw.sections)
      );
    })
  );

  const isPurchaseIntentAnalysisResult = Boolean(
    job.result &&
    typeof job.result === "object" &&
    !Array.isArray(job.result) &&
    "purchase_intent_analysis" in job.result &&
    job.result.purchase_intent_analysis &&
    typeof job.result.purchase_intent_analysis === "object" &&
    "sections" in (job.result.purchase_intent_analysis as Record<string, unknown>) &&
    Array.isArray((job.result.purchase_intent_analysis as Record<string, unknown>).sections)
  );

  const displayedSummaryText = hasMultipleSummaryTabs
    ? summaryParts[activeSummaryTab] || ""
    : singleTextValue;

  if (process.env.NODE_ENV !== "production") {
    console.debug("[TabOutput] structuredObjectData:", structuredObjectData);
    console.debug("[TabOutput] isSingleTextSummary:", isSingleTextSummary, "| singleTextValue starts:", singleTextValue?.slice(0, 80));
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
    ? groupIntentAnalysisByPost(items, job)
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
        (raw.sourceKeyValue !== "aggregate" && raw.sourceKeyValue !== "flat-result" ? raw.sourceKeyValue : ""),
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
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/30 text-slate-700">
      {/* Visualizer Controls Bar */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-slate-200/60 px-3 py-2.5 sm:px-5 sm:py-3 flex flex-wrap gap-2 items-center justify-between shrink-0 select-none">
        {/* Inner Tabs (Left) */}
        <div className="flex items-center bg-slate-50/80 rounded-xl p-1 border border-slate-200/50">
          <button
            onClick={() => setInnerTab("overview")}
            className={cn(
              "px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer",
              innerTab === "overview"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/50",
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
              "px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer",
              innerTab === "all"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/50",
            )}
          >
            All fields
          </button>
        </div>

        {/* View Toggles (Right) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-50/80 rounded-xl p-1 border border-slate-200/50">
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "p-2 rounded-lg transition-all duration-200 cursor-pointer",
                viewMode === "table"
                  ? "bg-white text-brand shadow-sm"
                  : "text-slate-400 hover:text-slate-600 hover:bg-white/50",
              )}
              title="Table view"
            >
              <Table2 className="size-4" />
            </button>
            <button
              onClick={() => setViewMode("json")}
              className={cn(
                "p-2 rounded-lg transition-all duration-200 cursor-pointer",
                viewMode === "json"
                  ? "bg-white text-brand shadow-sm"
                  : "text-slate-400 hover:text-slate-600 hover:bg-white/50",
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
          isDynamicLayoutResult || isPurchaseIntentAnalysisResult ? (
            <DynamicLayoutVisualizer
              items={
                isPurchaseIntentAnalysisResult
                  ? ([
                      {
                        task_intent: "วิเคราะห์เจตนาซื้อสินค้า (ผลการวิเคราะห์จริง)",
                        task_description: "วิเคราะห์สัดส่วนความคิดเห็นและคอมเมนต์ที่แยกประเภทเจตนาการซื้อสำเร็จ",
                        sections: (job.result as unknown as { purchase_intent_analysis: { sections: unknown[] } }).purchase_intent_analysis.sections,
                        overall_sentiment_focus: "mixed",
                        confidence_note: "สกัดข้อมูลโดยวิเคราะห์คีย์เวิร์ดสัญญาณและการจำแนกเจตนา",
                      }
                    ] as unknown as DynamicUIItem[])
                  : (job.result &&
                    typeof job.result === "object" &&
                    !Array.isArray(job.result) &&
                    "items" in job.result &&
                    Array.isArray((job.result as Record<string, unknown>).items)
                      ? ((job.result as Record<string, unknown>).items as unknown as DynamicUIItem[])
                      : [])
              }
            />
          ) : isPreProcessResult ? (
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
          ) : isSingleTextSummary ? (
            <ExecutionSummarySection
              displayedSummaryText={displayedSummaryText}
              hasMultipleSummaryTabs={hasMultipleSummaryTabs}
              uniqueSummaryTabLabels={uniqueSummaryTabLabels}
              activeSummaryTab={activeSummaryTab}
              setActiveSummaryTab={setActiveSummaryTab}
            />
          ) : structuredObjectData ? (
            <StructuredObjectSummary data={structuredObjectData} />
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
      {viewMode === "table" && !(innerTab === "overview" && (isSingleTextSummary || structuredObjectData || isPreProcessResult || isDynamicLayoutResult || isPurchaseIntentAnalysisResult)) && (
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
