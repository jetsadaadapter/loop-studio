"use client";

import * as React from "react";
import { Link2, ExternalLink, Download, FileText, MessageSquare, CheckCircle2 } from "lucide-react";
import type { ToolJob } from "@/core/interfaces/tools.interface";
import type { ScrapedJobItem } from "../../tool-job-utils";
import { CommentThreadCard, type CommentItem } from "./comment-thread-card";

interface ExportCommentsFetchOverviewProps {
  job: ToolJob;
  items: ScrapedJobItem[];
  paginatedItems: ScrapedJobItem[];
  startIndex: number;
}

export function ExportCommentsFetchOverview({
  job,
  items,
  paginatedItems,
  startIndex,
}: ExportCommentsFetchOverviewProps) {
  const sourceUrl =
    (job.result as Record<string, unknown> | undefined)?.sourceUrl as string ||
    (job.input as Record<string, unknown> | undefined)?.sourceUrl as string ||
    "";
  const jsonUrl = (job.input as Record<string, unknown> | undefined)?.jsonUrl as string || "";
  const ecGuid =
    (job.result as Record<string, unknown> | undefined)?.ecGuid as string ||
    (job.input as Record<string, unknown> | undefined)?.ecGuid as string ||
    "";
  const itemCount =
    (job.result as Record<string, unknown> | undefined)?.itemCount as number ||
    items.length;

  return (
    <div className="bg-slate-50/60 p-6 flex-1 min-h-0 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Summary Dashboard Card */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h3 className="text-base font-bold text-slate-800 tracking-tight font-sans">
                Exported Comments Summary
              </h3>
              <p className="text-xs text-slate-455 mt-1 font-sans">
                Summary of the retrieved comments from target platform
              </p>
            </div>
            <div className="flex items-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-sans shadow-xs bg-emerald-500 text-white shadow-emerald-500/10">
                <CheckCircle2 className="size-3.5" />
                <span>Success</span>
              </span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Target Source */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100/60 space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans">
                Source Target URL
              </span>
              <div className="flex items-center gap-2">
                <Link2 className="size-4 text-slate-400 shrink-0" />
                {sourceUrl ? (
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand font-semibold hover:underline truncate flex-1 font-sans"
                  >
                    {sourceUrl}
                  </a>
                ) : (
                  <span className="text-xs text-slate-400 font-medium font-sans truncate">
                    No source URL
                  </span>
                )}
                <ExternalLink className="size-3 text-slate-400 shrink-0" />
              </div>
            </div>

            {/* Total Items */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100/60 space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans">
                Fetched Comments
              </span>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="size-4 text-slate-400" />
                  <span className="text-xs text-slate-700 font-semibold font-sans">Total Count</span>
                </div>
                <span className="text-sm font-bold text-slate-900 font-sans">
                  {itemCount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Export File */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100/60 space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans">
                Backup File
              </span>
              {jsonUrl ? (
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-slate-400 shrink-0" />
                  <a
                    href={jsonUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand font-semibold hover:underline truncate flex-1 font-sans"
                  >
                    Download Dataset (JSON)
                  </a>
                  <Download className="size-3.5 text-slate-400 shrink-0" />
                </div>
              ) : (
                <span className="text-xs text-slate-400 font-medium font-sans block">
                  No export file available
                </span>
              )}
            </div>
          </div>
          
          {ecGuid && (
            <div className="pt-2 flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans">
                Export GUID:
              </span>
              <code className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50">
                {ecGuid}
              </code>
            </div>
          )}
        </div>

        {/* Preview Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans">
              Comments ({startIndex + 1} - {Math.min(startIndex + paginatedItems.length, itemCount)} of {itemCount})
            </h4>
            <p className="text-[10.5px] text-slate-400 font-medium font-sans">
              Switch to **All fields** tab to view the complete list
            </p>
          </div>

          <div className="space-y-4">
            {paginatedItems.map((item, idx) => (
              <CommentThreadCard
                key={`comment-preview-${(item as Record<string, unknown>).id || idx}`}
                comment={item as unknown as CommentItem}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
