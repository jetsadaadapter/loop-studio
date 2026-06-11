"use client";

import * as React from "react";
import { Link2, ExternalLink, Download, FileText, MessageSquare, CheckCircle2 } from "lucide-react";
import type { ToolJob } from "@/core/interfaces/tools.interface";
import type { ScrapedJobItem } from "../../../tool-job-utils";
import { CommentThreadCard, type CommentItem } from "../comments/comment-thread-card";

interface ExportCommentsFetchOverviewProps {
  job: ToolJob;
  items: ScrapedJobItem[];
  paginatedItems: ScrapedJobItem[];
  startIndex: number;
}

function mapToCommentItem(rawItem: ScrapedJobItem): CommentItem {
  const raw = rawItem as Record<string, unknown>;

  // Convert Unix timestamp (seconds) to ISO date string
  let dateStr = '';
  if (raw.time) {
    const timestamp = Number(raw.time);
    if (!isNaN(timestamp)) {
      // Convert Unix timestamp (seconds) to milliseconds
      const date = new Date(timestamp * 1000);
      dateStr = date.toISOString();
    }
  }

  // Build Facebook profile URL from profile_id
  let profileUrl = '';
  if (raw.profile_id) {
    const profileId = String(raw.profile_id);
    // If it starts with pfbid, it's a Facebook profile ID
    if (profileId.startsWith('pfbid') || profileId.match(/^\d+$/)) {
      profileUrl = `https://www.facebook.com/${profileId}`;
    } else if (profileId.startsWith('http')) {
      profileUrl = profileId;
    }
  }

  return {
    id: String(raw.comment_id || raw.id || ''),
    commentId: String(raw.comment_id || ''),
    commentUrl: raw.comment_permalink as string,
    text: raw.message as string,
    profilePicture: raw.profile_image as string,
    profileName: raw.name as string,
    profileUrl,
    date: dateStr,
    likesCount: raw.likes as string | number,
    dislikesCount: 0,
    commentsCount: raw.replies as number,
    comments: [],
  };
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
    <div className="bg-slate-50/60 p-4 sm:p-5 flex-1 min-h-0 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Summary Dashboard Card */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-xs p-4 sm:p-5 space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 tracking-tight font-sans">
                Exported Comments Summary
              </h3>
              <p className="text-[10px] text-slate-455 mt-0.5 font-sans">
                Summary of the retrieved comments from target platform
              </p>
            </div>
            <div className="flex items-center">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-sans shadow-xs bg-emerald-500 text-white shadow-emerald-500/10">
                <CheckCircle2 className="size-3" />
                <span>Success</span>
              </span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Target Source */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100/60 space-y-1.5">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-sans">
                Source Target URL
              </span>
              <div className="flex items-center gap-1.5">
                <Link2 className="size-3.5 text-slate-400 shrink-0" />
                {sourceUrl ? (
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-brand font-semibold hover:underline truncate flex-1 font-sans"
                  >
                    {sourceUrl}
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-400 font-medium font-sans truncate">
                    No source URL
                  </span>
                )}
                <ExternalLink className="size-2.5 text-slate-400 shrink-0" />
              </div>
            </div>

            {/* Total Items */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100/60 space-y-1.5">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-sans">
                Fetched Comments
              </span>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="size-3.5 text-slate-400" />
                  <span className="text-[11px] text-slate-700 font-semibold font-sans">Total Count</span>
                </div>
                <span className="text-xs font-bold text-slate-900 font-sans">
                  {itemCount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Export File */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100/60 space-y-1.5">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-sans">
                Backup File
              </span>
              {jsonUrl ? (
                <div className="flex items-center gap-1.5">
                  <FileText className="size-3.5 text-slate-400 shrink-0" />
                  <a
                    href={jsonUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-brand font-semibold hover:underline truncate flex-1 font-sans"
                  >
                    Download Dataset (JSON)
                  </a>
                  <Download className="size-3 text-slate-400 shrink-0" />
                </div>
              ) : (
                <span className="text-[11px] text-slate-400 font-medium font-sans block">
                  No export file available
                </span>
              )}
            </div>
          </div>

          {ecGuid && (
            <div className="pt-1.5 flex items-center gap-2">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-sans">
                Export GUID:
              </span>
              <code className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/50">
                {ecGuid}
              </code>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans">
              Comments ({startIndex + 1} - {Math.min(startIndex + paginatedItems.length, itemCount)} of {itemCount})
            </h4>
            <p className="text-[10.5px] text-slate-400 font-medium font-sans">
              Switch to **All fields** tab to view the complete list
            </p>
          </div>

          <div className="space-y-4">
            {paginatedItems.map((item, idx) => {
              const mappedComment = mapToCommentItem(item);
              return (
                <CommentThreadCard
                  key={`comment-preview-${mappedComment.id || idx}`}
                  comment={mappedComment}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
