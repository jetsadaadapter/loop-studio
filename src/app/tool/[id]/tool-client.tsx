"use client";

import { useState, useEffect, useRef } from "react";
import { Terminal } from "lucide-react";
import { useRouter } from "next/navigation";
import type {
  Tool,
  ToolJob,
  GetToolJobsResponse,
  ToolTestPromptResult,
} from "@/core/interfaces/tools.interface";
import {
  runTool,
  getToolJobs,
  getToolJob,
  testToolPrompt,
} from "@/core/services/tools.service";
import { useDialogToast } from "@/components/ui/alert-dialog-toast";
import { AppCover } from "@/components/app-cover";
import Link from "next/link";
import { createToolExecutionSchema } from "@/core/validators/tools.validator";
import { ToolFormSection } from "./tool-form-section";
import { ToolHistorySidebar } from "./tool-history-sidebar";
import { ToolJobModal } from "./tool-job-modal";
import { getJobStatus } from "./tool-job-utils";
import type { JobStatus } from "./tool-job-utils";
import { ToolJobVisualizer } from "./components/tool-job-visualizer";
import { ToolStatsGrid } from "./components/tool-stats-grid";
import { ProcessingModal } from "./components/processing-modal";
import packageInfo from "../../../../package.json";

interface ToolClientProps {
  tool: Tool;
  initialJobs: GetToolJobsResponse;
}

const normalizeJobIdentity = (value: unknown): string => {
  if (typeof value !== "string") return "";
  const normalized = value.trim();
  if (!normalized) return "";
  const lowered = normalized.toLowerCase();
  if (lowered === "undefined" || lowered === "null" || lowered === "nan") {
    return "";
  }
  return normalized;
};

const isDebugMode = process.env.NODE_ENV !== "production";

const logDroppedInvalidJobId = (
  source: "processing-modal-poll" | "active-job-poll",
  payload: {
    rawJobId: unknown;
    toolId: string;
    state?: unknown;
    status?: unknown;
    runId?: unknown;
    plugin?: unknown;
  },
) => {
  if (!isDebugMode) return;

  console.debug("[ToolClient][debug] drop invalid job id", {
    source,
    ...payload,
  });
};

const buildInitialForm = (params: Tool["params"]): Record<string, unknown> => {
  const data: Record<string, unknown> = {};
  params.forEach((param) => {
    if (param.defaultValue !== null) {
      data[param.key] =
        param.type === "boolean"
          ? param.defaultValue === "true"
          : param.defaultValue;
    }
  });
  return data;
};

export function ToolClient({ tool, initialJobs }: ToolClientProps) {
  const router = useRouter();
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ToolTestPromptResult | null>(
    null,
  );
  const [jobs, setJobs] = useState<ToolJob[]>(initialJobs.data);
  const [currentPage, setCurrentPage] = useState(initialJobs.meta?.page || 1);
  const [totalPages, setTotalPages] = useState(
    initialJobs.meta?.totalPages || 1,
  );
  const [isRunning, setIsRunning] = useState(false);
  const [isProcessingOpen, setIsProcessingOpen] = useState(false);
  const [isJobComplete, setIsJobComplete] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>(() =>
    buildInitialForm(tool.params),
  );
  const [selectedJob, setSelectedJob] = useState<ToolJob | null>(null);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [isJobLoading, setIsJobLoading] = useState(false);
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);
  const [isVisualizerLoading, setIsVisualizerLoading] = useState(false);
  const [selectedVisualizerJob, setSelectedVisualizerJob] =
    useState<ToolJob | null>(null);
  const [activeTab, setActiveTab] = useState<JobStatus>("all");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { pushDialogToast } = useDialogToast();

  const refreshJobs = async (page: number = currentPage) => {
    setIsRefreshing(true);
    try {
      const response = await getToolJobs(tool.id, { page, limit: 20 });
      setJobs(response.data);
      setCurrentPage(response.meta?.page || page);
      setTotalPages(response.meta?.totalPages || 1);
    } catch {
      pushDialogToast("Failed to refresh job history.", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Poll job status while processing modal is open
  useEffect(() => {
    if (!isProcessingOpen) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }
    pollRef.current = setInterval(async () => {
      try {
        const res = await getToolJobs(tool.id, { page: 1, limit: 5 });
        let latest = res.data[0];
        const latestJobId = normalizeJobIdentity(latest?.jobId);

        if (latest && !latestJobId) {
          logDroppedInvalidJobId("processing-modal-poll", {
            rawJobId: latest.jobId,
            toolId: tool.id,
            state: latest.state,
            status: latest.status,
            runId: latest.runId,
            plugin: latest.plugin,
          });
        }

        if (
          latest &&
          latestJobId &&
          latest.state !== "completed" &&
          latest.state !== "failed"
        ) {
          // Force synchronization and fetch full completed details from backend
          const updatedJob = await getToolJob(tool.id, latestJobId);
          latest = updatedJob;
          res.data[0] = updatedJob;
        }

        if (
          latest &&
          (latest.state === "completed" || latest.state === "failed")
        ) {
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
          setJobs(res.data);
          setCurrentPage(res.meta?.page || 1);
          setTotalPages(res.meta?.totalPages || 1);
          setIsJobComplete(true);
        } else {
          setJobs(res.data);
        }
      } catch {
        /* silently retry */
      }
    }, 5000);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [isProcessingOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll active selected jobs (modal or visualizer) to auto-refresh their status and results
  useEffect(() => {
    const activeJob =
      isJobModalOpen && selectedJob
        ? selectedJob
        : isVisualizerOpen && selectedVisualizerJob
          ? selectedVisualizerJob
          : null;

    if (!activeJob) return;

    const status = getJobStatus(activeJob);
    if (status === "completed" || status === "failed") return;

    const interval = setInterval(async () => {
      try {
        const activeJobId = normalizeJobIdentity(activeJob.jobId);
        if (!activeJobId) {
          logDroppedInvalidJobId("active-job-poll", {
            rawJobId: activeJob.jobId,
            toolId: tool.id,
            state: activeJob.state,
            status: activeJob.status,
            runId: activeJob.runId,
            plugin: activeJob.plugin,
          });
          return;
        }
        const job = await getToolJob(tool.id, activeJobId);

        if (isJobModalOpen && selectedJob?.jobId === job.jobId) {
          setSelectedJob(job);
        }
        if (isVisualizerOpen && selectedVisualizerJob?.jobId === job.jobId) {
          setSelectedVisualizerJob(job);
        }

        // Also update the job in the main list
        setJobs((prev) =>
          prev.map((j) =>
            j.jobId === job.jobId
              ? {
                  ...j,
                  state: job.state,
                  status: job.status,
                  result: job.result,
                  error: job.error,
                }
              : j,
          ),
        );
      } catch {
        /* silently retry */
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [
    isJobModalOpen,
    isVisualizerOpen,
    selectedJob,
    selectedVisualizerJob,
    tool.id,
  ]);

  const handleFormChange = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key])
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
  };

  const handleRun = async () => {
    const schema = createToolExecutionSchema(tool.params);
    const result = schema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        newErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setIsRunning(true);
    try {
      await runTool(tool.id, formData);
      setIsJobComplete(false);
      setIsProcessingOpen(true);
      setFormData(buildInitialForm(tool.params));
      setErrors({});
      await refreshJobs(1);
    } catch {
      pushDialogToast("Failed to start job.", "error");
    } finally {
      setIsRunning(false);
    }
  };

  const handleViewJob = (runId: string) => {
    if (!runId) return;
    router.push(`/tools/${tool.id}/runs/${runId}`);
  };

  const handleViewVisualizer = async (jobId: string) => {
    const safeJobId = normalizeJobIdentity(jobId);
    if (!safeJobId) {
      pushDialogToast("Invalid job id.", "error");
      return;
    }

    setIsVisualizerOpen(true);
    setIsVisualizerLoading(true);
    setSelectedVisualizerJob(null);
    try {
      const job = await getToolJob(tool.id, safeJobId);
      setSelectedVisualizerJob(job);
      setJobs((prev) =>
        prev.map((j) =>
          j.jobId === safeJobId ? { ...j, result: job.result } : j,
        ),
      );
    } catch {
      pushDialogToast("Failed to fetch job details.", "error");
      setIsVisualizerOpen(false);
    } finally {
      setIsVisualizerLoading(false);
    }
  };

  // Handler for test prompt
  const handleTestPrompt = async () => {
    const prompt =
      formData["prompt"] || formData["rawInput"] || formData["text"];
    if (!prompt || typeof prompt !== "string") {
      setTestResult({ error: "No prompt input." });
      // setErrors((prev) => ({ ...prev, prompt: "No prompt input." }));
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testToolPrompt(tool.id, prompt);
      setTestResult(res);
    } catch {
      setTestResult({ error: "Test prompt failed." });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="pb-6">
      <div className="mb-6">
        <AppCover
          src={null}
          alt={`${tool.name} cover`}
          accentColor={tool.accentColor || "#c20019"}
        >
          <div className="pt-5 sm:pt-8">
            <Link
              href="/apps"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-4 py-2 text-xs font-bold text-white backdrop-blur-md transition-all duration-300 hover:bg-white/20 hover:border-white/30 hover:-translate-y-0.5 active:scale-95 shadow-md shadow-black/5 hover:shadow-lg cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-3.5"
              >
                <path
                  fillRule="evenodd"
                  d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Back to Library</span>
            </Link>
          </div>
          <div className="relative z-10 flex min-h-48 flex-col justify-end py-5 pt-10 text-white sm:min-h-64 sm:py-8 sm:pt-16 lg:min-h-80 lg:py-10 lg:pt-20">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-3.5 flex-wrap select-none">
                <span className="rounded-full bg-linear-to-r from-red-500/10 to-brand/20 border border-brand/40 px-3 py-1 text-[9px] font-black text-white shadow-xs uppercase tracking-wider">
                  AI Automation
                </span>
                <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[9px] font-extrabold text-slate-355 tracking-wide">
                  v{packageInfo.version}
                </span>
              </div>
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-linear-to-br from-brand via-brand-strong to-rose-700 border border-white/20 backdrop-blur-md rounded-2xl shadow-xl shadow-brand/10 shrink-0 hidden sm:flex">
                  <Terminal className="size-6 text-white animate-pulse" />
                </div>
                <h1 className="page-hero-title font-black tracking-tight bg-linear-to-r from-white via-slate-100 to-slate-200 bg-clip-text text-transparent">
                  {tool.name}
                </h1>
              </div>
              <p className="mt-4 text-xs sm:text-[13px] text-slate-300 leading-relaxed max-w-2xl font-medium select-text">
                {tool.description ||
                  "Configure and run this automated tool to analyze your data."}
              </p>

              {/* Stats Grid */}
              <ToolStatsGrid tool={tool} jobs={jobs} />
            </div>
          </div>
        </AppCover>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <ToolFormSection
            params={tool.params}
            formData={formData}
            errors={errors}
            isRunning={isRunning}
            onChange={handleFormChange}
            onRun={handleRun}
            onTestPrompt={handleTestPrompt}
            isTesting={isTesting}
            testResult={testResult}
            onClearTestResult={() => setTestResult(null)}
          />
        </div>
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start lg:h-fit min-w-0">
          <ToolHistorySidebar
            jobs={jobs}
            activeTab={activeTab}
            selectedJobId={selectedJob?.jobId || selectedVisualizerJob?.jobId}
            onTabChange={setActiveTab}
            onViewJob={handleViewJob}
            onViewVisualizer={handleViewVisualizer}
            onRefresh={() => refreshJobs(currentPage)}
            isRefreshing={isRefreshing}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={refreshJobs}
          />
        </aside>
      </div>

      <ToolJobModal
        open={isJobModalOpen}
        isLoading={isJobLoading}
        job={selectedJob}
        onOpenChange={setIsJobModalOpen}
        onOpenVisualizer={(jobId) => {
          setIsJobModalOpen(false);
          handleViewVisualizer(jobId);
        }}
      />

      <ToolJobVisualizer
        open={isVisualizerOpen}
        isLoading={isVisualizerLoading}
        job={selectedVisualizerJob}
        toolName={tool.name}
        onOpenChange={setIsVisualizerOpen}
      />
      <ProcessingModal
        key={isProcessingOpen ? "open" : "closed"}
        open={isProcessingOpen}
        onOpenChange={async (open) => {
          setIsProcessingOpen(open);
          if (!open) {
            setIsJobComplete(false);
            await refreshJobs(1);
          }
        }}
        toolName={tool.name}
        isJobComplete={isJobComplete}
      />
    </div>
  );
}
