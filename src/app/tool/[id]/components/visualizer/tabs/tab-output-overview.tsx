"use client";

import type { ToolJob } from "@/core/interfaces/tools.interface";
import type { ScrapedJobItem } from "../../../tool-job-utils";
import { CommentThreadCard, type CommentItem } from "../comments/comment-thread-card";
import {
  IntentAnalysisCard,
  type IntentAnalysisItem,
} from "../analysis/intent-analysis-card";
import { IntentAnalysisSummary } from "../analysis/intent-analysis-summary";
import { OutputOverviewTable } from "../overview/output-overview-table";
import { ExportCommentsCreateOverview } from "../tool-specific/exportcomments-create-overview";
import { ExportCommentsFetchOverview } from "../tool-specific/exportcomments-fetch-overview";
import { PreProcessOverview, type PreProcessResult } from "../overview/preprocess-overview";
import { FacebookAnalystVisualizer } from "../tool-specific/facebook-analyst-visualizer";

interface TabOutputOverviewProps {
  items: ScrapedJobItem[];
  paginatedItems: ScrapedJobItem[];
  startIndex: number;
  isAnalysisOverview: boolean;
  isCommentScraper: boolean;
  showIntentSummary: boolean;
  intentGroups: ReturnType<typeof import("../../../tool-job-utils").groupIntentAnalysisByPost>;
  schemaHintKeys: string[];
  analysisDisplayPreset: ReturnType<typeof import("../../../tool-job-utils").getAnalysisDisplayPresetForJob>;
  hasSourceUrls: boolean;
  isExportCommentsJob: boolean;
  isExportCommentsFetchJob: boolean;
  job: ToolJob;
}

export function TabOutputOverview({
  items,
  paginatedItems,
  startIndex,
  isAnalysisOverview,
  isCommentScraper,
  showIntentSummary,
  intentGroups,
  schemaHintKeys,
  analysisDisplayPreset,
  hasSourceUrls,
  isExportCommentsJob,
  isExportCommentsFetchJob,
  job,
}: TabOutputOverviewProps) {
  const isPreProcessResult = Boolean(
    job.result &&
    typeof job.result === "object" &&
    !Array.isArray(job.result) &&
    ("preview" in job.result || "config" in job.result)
  );

  // Check if this is a Social Media Analyst result (posts-based analysis)
  const isSocialAnalystResult = Boolean(
    job.result &&
    typeof job.result === "object" &&
    !Array.isArray(job.result) &&
    "posts" in job.result &&
    Array.isArray((job.result as Record<string, unknown>).posts)
  );

  if (isSocialAnalystResult) {
    return <FacebookAnalystVisualizer job={job} />;
  }

  if (isPreProcessResult) {
    return <PreProcessOverview result={job.result as unknown as PreProcessResult} />;
  }

  if (isExportCommentsFetchJob) {
    return (
      <ExportCommentsFetchOverview
        job={job}
        items={items}
        paginatedItems={paginatedItems}
        startIndex={startIndex}
      />
    );
  }

  if (isExportCommentsJob) {
    return <ExportCommentsCreateOverview items={items} />;
  }

  if (isAnalysisOverview) {
    return (
      <div className="bg-slate-50/30 p-6 flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-6">
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
    );
  }

  if (isCommentScraper) {
    return (
      <div className="bg-slate-50/30 p-6 flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {paginatedItems.map((item, idx) => (
            <CommentThreadCard
              key={`comment-${(item as Record<string, unknown>).id || idx}`}
              comment={item as unknown as CommentItem}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <OutputOverviewTable
      items={paginatedItems}
      startIndex={startIndex}
    />
  );
}
