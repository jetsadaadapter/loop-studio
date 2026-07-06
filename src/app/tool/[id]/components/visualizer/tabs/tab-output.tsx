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
  tryRepairAndParseJson,
} from "./tab-output-helpers";
import { ExecutionSummarySection } from "../overview/execution-summary-section";
import { StructuredObjectSummary } from "../overview/structured-object-summary";
import { TabOutputOverview } from "./tab-output-overview";
import { AllFieldsTable } from "../table/all-fields-table";
import { DynamicLayoutVisualizer } from "@/components/dynamic-layout-visualizer";
import type { DynamicUIItem, DynamicUISection } from "@/components/dynamic-layout-visualizer/types";
import {
  getFunctionDeclarationsFromJob,
  generateDynamicLayoutFromSchema,
} from "./tab-output-dynamic-schema";
import { SentimentAnalysisOverview } from "../tool-specific/sentiment-analysis-overview";

interface TabOutputProps {
  job: ToolJob;
}

export function TabOutput({ job }: TabOutputProps) {
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

  const actualResult = (Array.isArray(job.result) && job.result.length === 1 && job.result[0] !== null && typeof job.result[0] === 'object')
    ? job.result[0]
    : job.result;

  const isPreProcessResult = Boolean(
    actualResult &&
    typeof actualResult === "object" &&
    !Array.isArray(actualResult) &&
    ("preview" in actualResult || "config" in actualResult)
  );

  // Note: we can't fully evaluate isSocialAnalystResult until structuredObjectData is available.
  // But we need isSocialAnalystResult for allFieldsItems. We will evaluate it properly after.
  // For now, let's keep it here but we'll re-evaluate it after structuredObjectData.

  const isSentimentAnalysisResult = Boolean(
    actualResult &&
    typeof actualResult === "object" &&
    !Array.isArray(actualResult) &&
    "items" in actualResult &&
    Array.isArray((actualResult as Record<string, unknown>).items) &&
    ((actualResult as Record<string, unknown>).items as unknown[]).length > 0 &&
    ((actualResult as Record<string, unknown>).items as unknown[]).every((item) => {
      const raw = item as Record<string, unknown>;
      const analysis = raw.analysis as Record<string, unknown> | undefined;
      return (
        typeof raw.sentiment === "string" ||
        typeof analysis?.sentiment === "string" ||
        ("error" in raw && typeof raw.error === "string") ||
        (analysis && "error" in analysis && typeof analysis.error === "string")
      );
    })
  );

  const items = isCommentScraper
    ? (rawItems
        .map((item) => normalizeCommentItem(item as Record<string, unknown>))
        .filter((item) => {
          // Keep any item that has a usable identity: Facebook ID, YouTube channel ID,
          // comment_id, or at minimum a non-empty author name + comment text
          const pId = item.profileId || item.profile_id;
          const fId = item.facebookId || item.facebook_id;
          const cId = item.commentId || item.comment_id;
          const hasName = item.profileName && String(item.profileName).trim() !== "" && String(item.profileName) !== "User";
          const hasText = item.text && String(item.text).trim() !== "";
          const isValidId = (v: unknown) => v !== undefined && v !== null && String(v).trim() !== "" && String(v) !== "null" && String(v) !== "undefined";
          return Boolean(
            isValidId(pId) || isValidId(fId) || isValidId(cId) || (hasName && hasText)
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

  let structuredObjectData = !isSingleTextSummary
    ? detectStructuredObjectSummary(items)
    : null;

  if (isSingleTextSummary && singleTextValue && !structuredObjectData) {
    const parsed = tryRepairAndParseJson(singleTextValue);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      structuredObjectData = parsed;
    }
  }

  const isSocialAnalystResult = Boolean(
    (actualResult &&
      typeof actualResult === "object" &&
      !Array.isArray(actualResult) &&
      "posts" in actualResult &&
      Array.isArray((actualResult as Record<string, unknown>).posts)) ||
    (structuredObjectData &&
      "posts" in structuredObjectData &&
      Array.isArray(structuredObjectData.posts))
  );

  const isDynamicLayoutResult = Boolean(
    actualResult &&
    typeof actualResult === "object" &&
    !Array.isArray(actualResult) &&
    "items" in actualResult &&
    Array.isArray((actualResult as Record<string, unknown>).items) &&
    ((actualResult as Record<string, unknown>).items as unknown[]).length > 0 &&
    ((actualResult as Record<string, unknown>).items as unknown[]).every((item) => {
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
    actualResult &&
    typeof actualResult === "object" &&
    !Array.isArray(actualResult) &&
    "purchase_intent_analysis" in actualResult &&
    actualResult.purchase_intent_analysis &&
    typeof actualResult.purchase_intent_analysis === "object" &&
    "sections" in (actualResult.purchase_intent_analysis as Record<string, unknown>) &&
    Array.isArray((actualResult.purchase_intent_analysis as Record<string, unknown>).sections)
  );

  const isStructuredReportResult = Boolean(
    job.result &&
    typeof job.result === "object" &&
    !Array.isArray(job.result) &&
    "section_meta" in job.result &&
    Array.isArray((job.result as Record<string, unknown>).section_meta) &&
    "section_rows" in job.result &&
    Array.isArray((job.result as Record<string, unknown>).section_rows)
  );

  const isBrandPreferenceAnalysisResult = Boolean(
    (actualResult &&
      typeof actualResult === "object" &&
      !Array.isArray(actualResult) &&
      "task_intent" in actualResult &&
      (actualResult as Record<string, unknown>).task_intent === "brand_preference_and_interest_analysis" &&
      "metrics" in actualResult &&
      "segments" in actualResult) ||
    (structuredObjectData &&
      "task_intent" in structuredObjectData &&
      structuredObjectData.task_intent === "brand_preference_and_interest_analysis" &&
      "metrics" in structuredObjectData &&
      "segments" in structuredObjectData)
  );

  const brandPreferenceData = (isBrandPreferenceAnalysisResult && structuredObjectData && "task_intent" in structuredObjectData && structuredObjectData.task_intent === "brand_preference_and_interest_analysis")
    ? structuredObjectData
    : actualResult;

  const dynamicSchemaDeclarations = getFunctionDeclarationsFromJob(job);
  const isDynamicSchemaResult = dynamicSchemaDeclarations.length > 0 && items.length > 0;

  const showDashboardTab = isDynamicLayoutResult || isPurchaseIntentAnalysisResult || isDynamicSchemaResult || isStructuredReportResult || isBrandPreferenceAnalysisResult;
  const defaultTab = (isDynamicLayoutResult || isPurchaseIntentAnalysisResult || isBrandPreferenceAnalysisResult) ? "dashboard" : "overview";

  const jobId = job.jobId || job.id || job._id || "";
  const [prevJobId, setPrevJobId] = useState(jobId);
  const [innerTab, setInnerTab] = useState<"overview" | "dashboard" | "all">(defaultTab);

  if (jobId !== prevJobId) {
    setPrevJobId(jobId);
    setInnerTab(defaultTab);
  }

  const showAllFieldsTab = true;
  const [prevShowAllFieldsTab, setPrevShowAllFieldsTab] = useState(showAllFieldsTab);

  if (showAllFieldsTab !== prevShowAllFieldsTab) {
    setPrevShowAllFieldsTab(showAllFieldsTab);
    if (!showAllFieldsTab && innerTab === "all") {
      setInnerTab("overview");
    }
  }

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

  // Raw result-only items fallback
  const resultOnlyItems = (() => {
    const dataToUse = structuredObjectData || actualResult;
    if (!dataToUse) return [];
    if (Array.isArray(dataToUse)) return dataToUse as unknown as ScrapedJobItem[];
    if (typeof dataToUse === "object") {
      if (Array.isArray((dataToUse as Record<string, unknown>).items)) {
        return (dataToUse as Record<string, unknown>).items as unknown as ScrapedJobItem[];
      }
      return [dataToUse] as unknown as ScrapedJobItem[];
    }
    if (typeof dataToUse === "string") {
      return [{ Output: dataToUse }] as unknown as ScrapedJobItem[];
    }
    return [dataToUse] as unknown as ScrapedJobItem[];
  })();

  // All Fields Tab pulls data from result only.
  // Sentiment results and comment scrapers use their own normalized item arrays.
  const allFieldsItems = (() => {
    if (isSocialAnalystResult) {
      // Flatten all social analyst sections into rows with a _section label
      const r = (structuredObjectData || actualResult) as Record<string, unknown>;
      const sections: string[] = ["posts", "metrics", "segments", "comments", "insights"];
      const rows: ScrapedJobItem[] = [];
      for (const sec of sections) {
        const arr = r[sec];
        if (Array.isArray(arr)) {
          for (const item of arr as Record<string, unknown>[]) {
            rows.push({ _section: sec, ...item } as unknown as ScrapedJobItem);
          }
        }
      }
      return rows;
    }
    if (isSentimentAnalysisResult) {
      return resultOnlyItems; // already actualResult.items — all columns intact
    }
    if (isCommentScraper) {
      return resultOnlyItems.map((item) =>
        normalizeCommentItem(item as Record<string, unknown>)
      ) as unknown as ScrapedJobItem[];
    }
    return resultOnlyItems;
  })();

  // Pagination Math
  const activeItems = innerTab === "overview" ? items : allFieldsItems;
  const totalPages = Math.ceil(activeItems.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedItems = items.slice(startIndex, endIndex);
  const paginatedAllFieldsItems = allFieldsItems.slice(startIndex, endIndex);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const allFieldsKeys = getAllKeys(allFieldsItems, schemaHintKeys);

  const hasStandardOverviewKeys = items.some(item => {
    const r = item as Record<string, unknown>;
    return r.media !== undefined || r.url !== undefined || r.text !== undefined || r.sentiment !== undefined || r.summary !== undefined || r.facebookUrl !== undefined || r.profilePicture !== undefined;
  });

  const tabOverviewLabel = (() => {
    if (isPreProcessResult) return "ตั้งค่า (Overview)";
    if (isSentimentAnalysisResult) return "ผลวิเคราะห์ Sentiment";
    if (isSingleTextSummary || structuredObjectData || isGeminiSummaryJob) return "สรุปผล AI (Summary)";
    if (isDynamicLayoutResult) return "สรุปการทำงาน (Summary)";
    if (isStructuredReportResult) return "สรุปรายงาน (Summary)";
    if (isCommentScraper) return "ความคิดเห็น (Comments)";
    if (isExportCommentsJob) return "โพสต์ (Posts)";
    if (isAnalysisOverview) return "ผลวิเคราะห์ (Analysis)";
    return "ภาพรวม (Overview)";
  })();

  const tabDashboardLabel = (() => {
    if (isPurchaseIntentAnalysisResult) return "เจตนาซื้อ (Dashboard)";
    if (isStructuredReportResult) return "สรุปแดชบอร์ด (Dashboard)";
    return "แดชบอร์ด (Dashboard)";
  })();

  const tabAllFieldsLabel = (() => {
    if (isCommentScraper || isPurchaseIntentAnalysisResult) return "คอมเมนต์ทั้งหมด (All Fields)";
    if (isExportCommentsJob) return "โพสต์ทั้งหมด (All Fields)";
    return "ตารางข้อมูล (All Fields)";
  })();

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
            {tabOverviewLabel}
          </button>
          {showDashboardTab && (
            <button
              onClick={() => setInnerTab("dashboard")}
              className={cn(
                "px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer",
                innerTab === "dashboard"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/50",
              )}
            >
              {tabDashboardLabel}
            </button>
          )}
          {showAllFieldsTab && (
            <button
              onClick={() => setInnerTab("all")}
              className={cn(
                "px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer",
                innerTab === "all"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/50",
              )}
            >
              {tabAllFieldsLabel}
            </button>
          )}
        </div>

        {/* View Toggles (Right) */}
        {showAllFieldsTab && (
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
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto min-h-0">
        {viewMode === "json" ? (
          <TabJsonView items={isSingleTextSummary && structuredObjectData ? [structuredObjectData] : job.result} />
        ) : innerTab === "dashboard" ? (
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
                  : isBrandPreferenceAnalysisResult
                    ? ([
                        {
                          task_intent: "วิเคราะห์ความชอบแบรนด์และความสนใจ (Brand Preference)",
                          task_description: "วิเคราะห์สัดส่วนความคิดเห็นแบ่งตามความสนใจและแบรนด์ที่ชื่นชอบจากผู้บริโภค",
                          sections: transformBrandPreferenceToDynamicLayoutSections(brandPreferenceData),
                          overall_sentiment_focus: "mixed",
                          confidence_note: "สกัดข้อมูลโดยวิเคราะห์คีย์เวิร์ดและแบ่ง Segment",
                        }
                      ] as unknown as DynamicUIItem[])
                    : isDynamicSchemaResult || isStructuredReportResult
                      ? generateDynamicLayoutFromSchema(job, items as unknown as Record<string, unknown>[])
                      : (job.result &&
                        typeof job.result === "object" &&
                        !Array.isArray(job.result) &&
                        "items" in job.result &&
                        Array.isArray((job.result as Record<string, unknown>).items)
                          ? ((job.result as Record<string, unknown>).items as unknown as DynamicUIItem[])
                          : [])
            }
          />
        ) : innerTab === "overview" ? (
          (isPreProcessResult || isSocialAnalystResult) ? (
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
              structuredObjectData={structuredObjectData}
            />
          ) : isSentimentAnalysisResult ? (
            <SentimentAnalysisOverview
              job={job}
              items={items}
              paginatedItems={paginatedItems}
              startIndex={startIndex}
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
          ) : !hasStandardOverviewKeys && items.length > 0 && !isAnalysisOverview && !isCommentScraper && !isExportCommentsJob && !isExportCommentsFetchJob ? (
            <AllFieldsTable
              paginatedItems={paginatedAllFieldsItems}
              allKeys={allFieldsKeys}
              startIndex={startIndex}
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
              structuredObjectData={structuredObjectData}
            />
          )
        ) : (
          <AllFieldsTable
            paginatedItems={paginatedAllFieldsItems}
            allKeys={allFieldsKeys}
            startIndex={startIndex}
          />
        )}
      </div>

      {/* Pagination Footer */}
      {viewMode === "table" && innerTab !== "dashboard" && !(innerTab === "overview" && (isSingleTextSummary || structuredObjectData || isPreProcessResult || isDynamicLayoutResult || isPurchaseIntentAnalysisResult)) && (
        <TablePagination
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          totalPages={totalPages}
          totalItems={activeItems.length}
          startIndex={startIndex}
          endIndex={startIndex + (innerTab === "overview" ? paginatedItems.length : paginatedAllFieldsItems.length)}
        />
      )}
    </div>
  );
}

interface BrandPreferenceMetric {
  metric_key?: string;
  metric_value?: number | string;
  metric_type?: string;
}

interface BrandPreferenceSegment {
  segment_type?: string;
  segment_key?: string;
  count?: number;
  percent?: number;
}

interface BrandPreferenceInsight {
  insight_text?: string;
}

interface BrandPreferenceComment {
  comment_text?: string;
  tags?: string;
}

interface BrandPreferenceResult {
  metrics?: BrandPreferenceMetric[];
  segments?: BrandPreferenceSegment[];
  insights?: BrandPreferenceInsight[];
  comments?: BrandPreferenceComment[];
}

// Helper to transform Brand Preference result into DynamicUIItem sections
function transformBrandPreferenceToDynamicLayoutSections(
  result: BrandPreferenceResult,
): DynamicUISection[] {
  const sections: DynamicUISection[] = [];
  const formatKey = (key: string) => key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  if (Array.isArray(result.metrics) && result.metrics.length > 0) {
    sections.push({
      section_id: "metrics",
      section_title: "สัดส่วนความสนใจ (Metrics)",
      section_type: "scorecard",
      data: result.metrics.map((m) => ({
        label: formatKey(m.metric_key || ""),
        value: typeof m.metric_value === "number" && m.metric_type === "percentage" ? `${m.metric_value}%` : m.metric_value
      }))
    });
  }

  if (Array.isArray(result.segments) && result.segments.length > 0) {
    const userInterest = result.segments.filter((s) => s.segment_type === "user_interest");
    const brandPref = result.segments.filter((s) => s.segment_type === "brand_preference");

    if (userInterest.length > 0) {
      sections.push({
        section_id: "segment_user_interest",
        section_title: "ความสนใจของผู้ใช้ (User Interest)",
        section_type: "pie_chart",
        data: userInterest.map((s) => ({
          label: formatKey(s.segment_key || ""),
          value: s.count,
          percent: s.percent
        }))
      });
    }

    if (brandPref.length > 0) {
      sections.push({
        section_id: "segment_brand_preference",
        section_title: "แบรนด์ที่ได้รับความนิยม (Brand Preference)",
        section_type: "bar_chart",
        data: brandPref.map((s) => ({
          label: formatKey(s.segment_key || ""),
          value: s.count
        }))
      });
    }
  }

  if (Array.isArray(result.insights) && result.insights.length > 0) {
    sections.push({
      section_id: "insights",
      section_title: "ข้อมูลเชิงลึก (Insights)",
      section_type: "list",
      data: result.insights.map((i) => ({
        comment: i.insight_text
      }))
    });
  }

  if (Array.isArray(result.comments) && result.comments.length > 0) {
    sections.push({
      section_id: "comments",
      section_title: "ความคิดเห็นที่น่าสนใจ (Comments)",
      section_type: "list",
      data: result.comments.map((c) => ({
        comment: c.comment_text,
        keywords_mentioned: c.tags ? c.tags.split(",") : []
      }))
    });
  }

  return sections;
}
