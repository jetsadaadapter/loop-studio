"use client";

import { useState } from "react";
import { Terminal, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ToolJob } from "@/core/interfaces/tools.interface";
import { getJobStatus, getItemCount } from "../../../tool-job-utils";
import { normalizeStartUrls } from "../../../start-urls-utils";

interface TabLogProps {
  job: ToolJob;
}

export function TabLog({ job }: TabLogProps) {
  const status = getJobStatus(job);
  const itemCount = getItemCount(job);
  const [copied, setCopied] = useState(false);

  const getSafeDate = (val: unknown): Date => {
    if (!val) return new Date();
    const d = new Date(val as string | number | Date);
    if (!isNaN(d.getTime())) return d;
    return new Date();
  };

  const getSafeISOString = (dateObj: Date): string => {
    try {
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toISOString();
      }
    } catch {}
    return new Date().toISOString();
  };

  const startTime = getSafeDate(job.createdAt);

  const generateLogs = () => {
    const logLines: string[] = [];
    const addLog = (
      timestampStr: string,
      type: "INFO" | "SUCCESS" | "WARN" | "ERROR",
      message: string,
    ) => {
      logLines.push(`[${timestampStr}] ${type}: ${message}`);
    };

    const initTimeStr = getSafeISOString(startTime);
    addLog(
      initTimeStr,
      "INFO",
      `System: Actor run initiated for plugin: ${job.plugin || "Apify"}.`,
    );

    const jobResult = job.result as Record<string, unknown> | undefined;
    const configActorId = (job.config?.actorId || jobResult?.actorId) as
      | string
      | undefined;
    if (configActorId) {
      addLog(
        initTimeStr,
        "INFO",
        `System: Active Actor ID resolved: "${configActorId}".`,
      );
    }

    const runId = jobResult?.runId as string | undefined;
    if (runId) {
      addLog(initTimeStr, "INFO", `System: Upstream Job Run ID: "${runId}".`);
    }

    const inputKeys = Object.keys(job.input || {}).filter(
      (k) => k !== "startUrls",
    );
    if (inputKeys.length > 0) {
      addLog(
        initTimeStr,
        "INFO",
        `System: Validated input schema parameters: [${inputKeys.join(", ")}].`,
      );
    }

    const startUrls = normalizeStartUrls(job.input?.startUrls);
    if (startUrls.length > 0) {
      addLog(
        initTimeStr,
        "INFO",
        `System: Dispatched targets queue size: ${startUrls.length}.`,
      );
      startUrls.forEach((u, i) => {
        addLog(initTimeStr, "INFO", `Target #${i + 1}: ${u}`);
      });
    }

    if (job.processed) {
      const procTime = getSafeISOString(getSafeDate(job.processed));
      addLog(procTime, "INFO", `Dataset: Writing results to catalog.`);
    }

    if (status === "failed") {
      const endTimeStr = getSafeISOString(getSafeDate(job.updatedAt));
      addLog(
        endTimeStr,
        "ERROR",
        `System: Job execution terminated with failure state.`,
      );
      if (job.error) {
        const errStr =
          typeof job.error === "string" ? job.error : JSON.stringify(job.error);
        addLog(endTimeStr, "ERROR", `Failure Cause: ${errStr}`);
      }
    } else if (
      status === "running" ||
      status === "active" ||
      status === "queued"
    ) {
      const currTimeStr = getSafeISOString(new Date());
      addLog(
        currTimeStr,
        "INFO",
        `System: Job execution is currently in progress. Status: [${status}].`,
      );
    } else {
      const endTimeStr = job.updatedAt
        ? getSafeISOString(getSafeDate(job.updatedAt))
        : getSafeISOString(startTime);
      addLog(
        endTimeStr,
        "SUCCESS",
        `System: Actor completed successfully. Total items processed: ${itemCount}.`,
      );
    }

    return logLines;
  };

  const logs = generateLogs();

  const handleCopy = () => {
    navigator.clipboard.writeText(logs.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 h-full min-h-0 bg-slate-50 p-4 flex flex-col overflow-hidden relative select-none">
      {/* Log Header Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-3 shrink-0">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
          <Terminal className="size-3.5 text-indigo-650" />
          <span>System Console Logs</span>
        </div>

        <Button
          onClick={handleCopy}
          size="sm"
          variant="ghost"
          className="h-7 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-md text-[11px] font-semibold px-2.5 gap-1 active:scale-95 transition-all cursor-pointer shadow-xs"
        >
          {copied ? (
            <>
              <Check className="size-3 text-emerald-500" />
              <span className="text-emerald-600">Copied Logs</span>
            </>
          ) : (
            <>
              <Copy className="size-3 text-slate-400" />
              <span>Copy Logs</span>
            </>
          )}
        </Button>
      </div>

      {/* Log Box */}
      <div className="flex-1 overflow-auto rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
        <pre className="font-sans text-[11px] leading-relaxed text-slate-600 select-text">
          {logs.map((line, i) => {
            const isError = line.includes("ERROR:");
            const isSuccess = line.includes("SUCCESS:");
            const isInfo = line.includes("INFO:");
            const isActive = line.includes(
              "System: Job execution is currently in progress. Status: [active].",
            );
            return (
              <div
                key={i}
                className={[
                  "py-0.5 border-l-2 pl-3",
                  isError
                    ? "text-rose-600 border-rose-500 bg-rose-50/40"
                    : isSuccess
                      ? "text-emerald-700 border-emerald-500 bg-emerald-50/40"
                      : isActive
                        ? "active-log-line text-emerald-700 border-emerald-500 bg-emerald-50/80 font-bold animate-pulse"
                        : isInfo
                          ? "text-slate-600 border-slate-200 bg-slate-50/20"
                          : "text-slate-555 border-transparent",
                ].join(" ")}
              >
                {line}
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
}
