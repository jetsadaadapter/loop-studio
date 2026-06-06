"use client";

import type { ToolJob } from "@/core/interfaces/tools.interface";
import type { ScrapedJobItem } from "../../tool-job-utils";
import { CommentThreadCard, type CommentItem } from "./comment-thread-card";
import {
  IntentAnalysisCard,
  type IntentAnalysisItem,
} from "./intent-analysis-card";
import { IntentAnalysisSummary } from "./intent-analysis-summary";
import { OutputOverviewTable } from "./output-overview-table";
import { ExportCommentsCreateOverview } from "./exportcomments-create-overview";
import { ExportCommentsFetchOverview } from "./exportcomments-fetch-overview";

interface TabOutputOverviewProps {
  items: ScrapedJobItem[];
  paginatedItems: ScrapedJobItem[];
  startIndex: number;
  isAnalysisOverview: boolean;
  isCommentScraper: boolean;
  showIntentSummary: boolean;
  intentGroups: ReturnType<typeof import("../../tool-job-utils").groupIntentAnalysisByPost>;
  schemaHintKeys: string[];
  analysisDisplayPreset: ReturnType<typeof import("../../tool-job-utils").getAnalysisDisplayPresetForJob>;
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
    );
  }

  if (isCommentScraper) {
    return (
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
    );
  }

  return (
    <OutputOverviewTable
      items={paginatedItems}
      startIndex={startIndex}
    />
  );
}
