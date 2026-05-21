"use client";

import { useState, useEffect } from "react";
import { Terminal, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ToolJob } from "@/core/interfaces/tools.interface";
import { getJobStatus, getItemCount } from "../../tool-job-utils";

interface TabLogProps {
  job: ToolJob;
}

export function TabLog({ job }: TabLogProps) {
  const status = getJobStatus(job);
  const itemCount = getItemCount(job);
  const [copied, setCopied] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
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
      const addLog = (timestampStr: string, type: "INFO" | "SUCCESS" | "WARN" | "ERROR", message: string) => {
        logLines.push(`[${timestampStr}] ${type}: ${message}`);
      };

      const initTimeStr = getSafeISOString(startTime);
      addLog(initTimeStr, "INFO", `System: Actor run initiated for plugin: ${job.plugin || "Apify"}.`);
      
      const jobResult = job.result as Record<string, unknown> | undefined;
      const configActorId = (job.config?.actorId || jobResult?.actorId) as string | undefined;
      if (configActorId) {
        addLog(initTimeStr, "INFO", `System: Active Actor ID resolved: "${configActorId}".`);
      }

      const runId = jobResult?.runId as string | undefined;
      if (runId) {
        addLog(initTimeStr, "INFO", `System: Upstream Job Run ID: "${runId}".`);
      }

      const inputKeys = Object.keys(job.input || {}).filter(k => k !== "startUrls");
      if (inputKeys.length > 0) {
        addLog(initTimeStr, "INFO", `System: Validated input schema parameters: [${inputKeys.join(", ")}].`);
      }

      const startUrls = job.input?.startUrls as { url?: string }[] | undefined;
      if (Array.isArray(startUrls) && startUrls.length > 0) {
        addLog(initTimeStr, "INFO", `System: Dispatched targets queue size: ${startUrls.length}.`);
        startUrls.forEach((u, i) => {
          if (u.url) {
            addLog(initTimeStr, "INFO", `Target #${i + 1}: ${u.url}`);
          }
        });
      }

      if (job.processed) {
        const procTime = getSafeISOString(getSafeDate(job.processed));
        addLog(procTime, "INFO", `Dataset: Writing results to catalog.`);
      }

      if (status === "failed") {
        const endTimeStr = getSafeISOString(getSafeDate(job.updatedAt));
        addLog(endTimeStr, "ERROR", `System: Job execution terminated with failure state.`);
        if (job.error) {
          const errStr = typeof job.error === "string" ? job.error : JSON.stringify(job.error);
          addLog(endTimeStr, "ERROR", `Failure Cause: ${errStr}`);
        }
      } else if (status === "running" || status === "queued") {
        const currTimeStr = getSafeISOString(new Date());
        addLog(currTimeStr, "INFO", `System: Job execution is currently in progress. Status: [${status}].`);
      } else {
        const endTimeStr = job.updatedAt ? getSafeISOString(getSafeDate(job.updatedAt)) : getSafeISOString(startTime);
        addLog(endTimeStr, "SUCCESS", `System: Actor completed successfully. Total items processed: ${itemCount}.`);
      }

      return logLines;
    };

    setLogs(generateLogs());
  }, [job, status, itemCount]);

  const handleCopy = () => {
    navigator.clipboard.writeText(logs.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 h-full min-h-0 bg-[#0f1013] p-4 flex flex-col overflow-hidden relative select-none">
      {/* Log Header Toolbar */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4 shrink-0">
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
          <Terminal className="size-4 text-blue-500" />
          <span>System Console Logs</span>
        </div>

        <Button
          onClick={handleCopy}
          size="sm"
          variant="ghost"
          className="h-8 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-md text-xs font-semibold px-3 gap-1.5 active:scale-95 transition-all cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-emerald-500" />
              <span className="text-emerald-400">Copied Logs</span>
            </>
          ) : (
            <>
              <Copy className="size-3.5 text-zinc-400" />
              <span>Copy Logs</span>
            </>
          )}
        </Button>
      </div>

      {/* Log Box */}
      <div className="flex-1 overflow-auto rounded-xl border border-zinc-850 bg-[#0b0c0e] p-5 shadow-inner">
        <pre className="font-mono text-[11px] leading-relaxed text-zinc-400 select-text">
          {logs.map((line, i) => {
            const isError = line.includes("ERROR:");
            const isSuccess = line.includes("SUCCESS:");
            const isInfo = line.includes("INFO:");
            
            return (
              <div 
                key={i} 
                className={`py-0.5 border-l-2 pl-3 ${
                  isError ? "text-rose-450 border-rose-600 bg-rose-950/5" :
                  isSuccess ? "text-emerald-400 border-emerald-500 bg-emerald-950/5" :
                  isInfo ? "text-zinc-350 border-transparent" : "text-zinc-500 border-transparent"
                }`}
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
