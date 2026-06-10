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
    <div className="bg-slate-50/60 p-3 xs:p-4 sm:p-6 md:p-8 flex-1 min-h-0 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100/80 pb-5">
            <div>
              <h3 className="text-base font-bold text-slate-800 tracking-tight font-sans">
                Export Comments Job
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-sans">
                Job created to extract comments from external platform
              </p>
            </div>
            {/* Status Badge */}
            <div className="flex items-center">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-sans shadow-xs",
                  isCompleted
                    ? "bg-emerald-500 text-white shadow-emerald-500/10"
                    : isFetching
                      ? "bg-amber-500 text-white shadow-amber-500/10"
                      : "bg-slate-500 text-white shadow-slate-500/10"
                )}
              >
                {isFetching && <Loader2 className="size-3.5 animate-spin" />}
                {isCompleted && <CheckCircle2 className="size-3.5" />}
                <span className="capitalize">{status}</span>
              </span>
            </div>
          </div>

          {/* Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Source Info */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans">
                Source Target URL
              </span>
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <Link2 className="size-4 text-slate-400 shrink-0" />
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand font-semibold hover:underline truncate flex-1 font-sans"
                >
                  {sourceUrl}
                </a>
                <ExternalLink className="size-3.5 text-slate-400 shrink-0" />
              </div>
            </div>

            {/* Total Export Keys */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans">
                Export Keys Count
              </span>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-700 font-semibold font-sans">
                  Total GUIDs
                </span>
                <span className="text-sm font-bold text-slate-900 font-sans">
                  {ecGuids.length}
                </span>
              </div>
            </div>
          </div>

          {/* GUIDs List */}
          {ecGuids.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans">
                Export GUIDs
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200/60 rounded-xl overflow-hidden bg-slate-50/20">
                {ecGuids.map((guid) => {
                  const mappedUrl = guidUrlMap[guid] || sourceUrl;
                  return (
                    <div
                      key={guid}
                      className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-bold text-slate-800 tracking-wider bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50">
                            {guid}
                          </code>
                          <button
                            onClick={() => handleCopy(guid)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                            title="Copy GUID"
                          >
                            {copiedId === guid ? (
                              <Check className="size-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="size-3.5" />
                            )}
                          </button>
                        </div>
                        {mappedUrl && (
                          <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500">
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
