"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, Loader2, Link2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScrapedJobItem } from "../../../tool-job-utils";

interface ExportCommentsCreateOverviewProps {
  items: ScrapedJobItem[];
}

export function ExportCommentsCreateOverview({ items }: ExportCommentsCreateOverviewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const item = items[0] as Record<string, unknown> | undefined;
  if (!item) return null;

  const ecGuids = Array.isArray(item.ecGuids) ? (item.ecGuids as string[]) : [];
  const guidUrlMap = (item.guidUrlMap as Record<string, string>) || {};
  const sourceUrl = (item.sourceUrl as string) || "";
  const status = (item.status as string) || "pending";

  const isFetching = status.toLowerCase() === "fetching" || status.toLowerCase() === "running";
  const isCompleted = status.toLowerCase() === "completed" || status.toLowerCase() === "success";

  return (
    <div className="bg-slate-50/60 p-4 sm:p-5 flex-1 min-h-0 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Main Card */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-xs p-4 sm:p-5 space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100/80 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 tracking-tight font-sans">
                Export Comments Job
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-sans">
                Job created to extract comments from external platform
              </p>
            </div>
            {/* Status Badge */}
            <div className="flex items-center">
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-sans shadow-xs",
                  isCompleted
                    ? "bg-emerald-500 text-white shadow-emerald-500/10"
                    : isFetching
                      ? "bg-amber-500 text-white shadow-amber-500/10"
                      : "bg-slate-500 text-white shadow-slate-500/10"
                )}
              >
                {isFetching && <Loader2 className="size-3 animate-spin" />}
                {isCompleted && <CheckCircle2 className="size-3" />}
                <span className="capitalize">{status}</span>
              </span>
            </div>
          </div>

          {/* Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Source Info */}
            <div className="space-y-1.5">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-sans">
                Source Target URL
              </span>
              <div className="flex items-center gap-1.5 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <Link2 className="size-3.5 text-slate-400 shrink-0" />
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-brand font-semibold hover:underline truncate flex-1 font-sans"
                >
                  {sourceUrl}
                </a>
                <ExternalLink className="size-3 text-slate-400 shrink-0" />
              </div>
            </div>

            {/* Total Export Keys */}
            <div className="space-y-1.5">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-sans">
                Export Keys Count
              </span>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-700 font-semibold font-sans">
                  Total GUIDs
                </span>
                <span className="text-xs font-bold text-slate-900 font-sans">
                  {ecGuids.length}
                </span>
              </div>
            </div>
          </div>

          {/* GUIDs List */}
          {ecGuids.length > 0 && (
            <div className="space-y-2.5 pt-1.5">
              <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider font-sans">
                Export GUIDs
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200/60 rounded-lg overflow-hidden bg-slate-50/20">
                {ecGuids.map((guid) => {
                  const mappedUrl = guidUrlMap[guid] || sourceUrl;
                  return (
                    <div
                      key={guid}
                      className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <code className="text-[11px] font-bold text-slate-800 tracking-wider bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/50">
                            {guid}
                          </code>
                          <button
                            onClick={() => handleCopy(guid)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                            title="Copy GUID"
                          >
                            {copiedId === guid ? (
                              <Check className="size-3 text-emerald-500" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                          </button>
                        </div>
                        {mappedUrl && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-500">
                            <span className="font-semibold">URL:</span>
                            <a
                              href={mappedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline truncate hover:text-brand"
                            >
                              {mappedUrl}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
