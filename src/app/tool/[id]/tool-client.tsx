"use client";

import { useState, useEffect, useRef } from "react";
import { Terminal } from "lucide-react";
import { useRouter } from "next/navigation";
import type {
  Tool,
  ToolJob,
  ToolRunGrouped,
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

const formatModelName = (nameOrSlug: string): string => {
  if (!nameOrSlug) return "";
  if (/[A-Z]/.test(nameOrSlug) && !nameOrSlug.includes("-")) {
    return nameOrSlug;
  }
  return nameOrSlug
    .split("-")
    .map((word) => {
      if (word === "3.5") return "3.5";
      if (word === "1.5") return "1.5";
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
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
  const [jobs, setJobs] = useState<ToolRunGrouped[]>(initialJobs.data);
  const [isRunning, setIsRunning] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(() => {
    const latestRun = initialJobs?.data?.[0];
    if (latestRun) {
      const status = getJobStatus(latestRun);
      if (status === "active" || status === "running" || status === "queued" || status === "waiting") {
        return latestRun.runId;
      }
    }
    return null;
  });
  const previousRunIdRef = useRef<string | null>(null);
  // Always start closed on page load/reload — modal only opens when user triggers a run in this session
  const [isProcessingOpen, setIsProcessingOpen] = useState(false);
  const [lastTriggeredJobId, setLastTriggeredJobId] = useState<string | null>(null);
  const [isJobComplete, setIsJobComplete] = useState(false);
  const [isWaitingForRun, setIsWaitingForRun] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>(() =>
    buildInitialForm(tool.params),
  );
  const [selectedJob, setSelectedJob] = useState<ToolJob | null>(null);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);
  const [isVisualizerLoading, setIsVisualizerLoading] = useState(false);
  const [selectedVisualizerJob, setSelectedVisualizerJob] =
    useState<ToolJob | null>(null);
  const [activeTab, setActiveTab] = useState<JobStatus>("all");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { pushDialogToast } = useDialogToast();

  const refreshJobs = async () => {
    setIsRefreshing(true);
    try {
      const response = await getToolJobs(tool.id, { limit: 100 });
      setJobs(response.data);
    } catch {
      pushDialogToast("Failed to refresh run history.", "error");
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
        const res = await getToolJobs(tool.id, { limit: 1 });
        const targetRun = res.data[0];

        if (targetRun) {
          // Verify this run corresponds to the one we triggered
          const isTriggeredRun = lastTriggeredJobId
            ? targetRun.jobs?.some((j) => j.jobId === lastTriggeredJobId || j.id === lastTriggeredJobId)
            : previousRunIdRef.current
              ? targetRun.runId !== previousRunIdRef.current
              : true;

          if (isTriggeredRun) {
            setIsWaitingForRun(false);
            setActiveRunId(targetRun.runId);
            const state = String(targetRun.state || "").toLowerCase();

            // Check if ALL jobs in the run have reached a terminal state
            const allJobsFinished = targetRun.jobs && targetRun.jobs.length > 0
              ? targetRun.jobs.every((j) => {
                  const jobStatus = getJobStatus(j);
                  return jobStatus === "completed" || jobStatus === "failed" || jobStatus === "cancelled";
                })
              : false;

            // Check if ANY job is still active
            const hasActiveJobs = targetRun.jobs && targetRun.jobs.length > 0
              ? targetRun.jobs.some((j) => {
                  const jobStatus = getJobStatus(j);
                  return jobStatus === "active" || jobStatus === "running" || jobStatus === "queued" || jobStatus === "waiting";
                })
              : false;

            // Consider the run finished ONLY if:
            // 1. All individual jobs have reached terminal states, AND
            // 2. No jobs are still active/queued/waiting
            const isFinished = allJobsFinished && !hasActiveJobs;

            const isOverallCompleted = state === "completed";
            const allJobsCompleted = targetRun.jobs && targetRun.jobs.length > 0
              ? targetRun.jobs.every((j) => getJobStatus(j) === "completed")
              : false;

            const shouldCloseModal = isOverallCompleted && allJobsCompleted;

            console.log("[ToolClient] Polling check:", {
              runId: targetRun.runId,
              runState: state,
              allJobsFinished,
              hasActiveJobs,
              isFinished,
              isOverallCompleted,
              allJobsCompleted,
              shouldCloseModal,
              jobs: targetRun.jobs?.map(j => ({
                jobId: j.jobId,
                state: j.state,
                status: getJobStatus(j)
              }))
            });

            if (isFinished) {
              console.log("[ToolClient] Run finished. shouldCloseModal:", shouldCloseModal);
              if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
              }

              if (shouldCloseModal) {
                setIsJobComplete(true);
                setIsProcessingOpen(false);
                setLastTriggeredJobId(null);
                setActiveRunId(null);
              } else {
                // Keep modal open for non-completed states (failed/cancelled)
                setIsJobComplete(false);
                setJobs((prev) => {
                  const exists = prev.some((run) => run.runId === targetRun.runId);
                  if (!exists) {
                    return [targetRun, ...prev];
                  }
                  return prev.map((run) => run.runId === targetRun.runId ? targetRun : run);
                });
              }
              await refreshJobs();
            } else {
              // Update jobs state to reflect latest status
              setJobs((prev) => {
                const exists = prev.some((run) => run.runId === targetRun.runId);
                if (!exists) {
                  return [targetRun, ...prev];
                }
                return prev.map((run) => run.runId === targetRun.runId ? targetRun : run);
              });
            }
          }
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
  }, [isProcessingOpen, lastTriggeredJobId, activeRunId, tool.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
          prev.map((run) => {
            if (run.runId === job.runId) {
              const updatedJobs = run.jobs.map((j) =>
                j.jobId === job.jobId
                  ? {
                      ...j,
                      state: job.state,
                      status: job.status,
                      result: job.result,
                      error: job.error,
                    }
                  : j
              );
              const runState = getJobStatus({ ...run, jobs: updatedJobs });
              return {
                ...run,
                state: runState,
                jobs: updatedJobs,
              };
            }
            return run;
          }),
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
    setTestResult(null);
    setIsRunning(true);
    try {
      previousRunIdRef.current = jobs[0]?.runId || null;
      setActiveRunId(null);
      setIsWaitingForRun(true);
      const runRes = await runTool(tool.id, formData) as Record<string, unknown>;
      setIsJobComplete(false);
      
      const jobId = (runRes?.jobId as string | undefined) || ((runRes?.data as Record<string, unknown> | undefined)?.jobId as string | undefined);
      const runId = (runRes?.runId as string | undefined) || ((runRes?.data as Record<string, unknown> | undefined)?.runId as string | undefined);
      
      if (jobId) {
        setLastTriggeredJobId(jobId);
      }
      if (runId) {
        setActiveRunId(runId);
      }
      
      setIsProcessingOpen(true);
      setFormData(buildInitialForm(tool.params));
      setErrors({});
      await refreshJobs();
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
        prev.map((run) => {
          if (run.jobs?.some((sub) => sub.jobId === safeJobId)) {
            return {
              ...run,
              jobs: run.jobs.map((sub) =>
                sub.jobId === safeJobId ? { ...sub, result: job.result } : sub
              ),
            };
          }
          return run;
        })
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

  interface PromptParamConfig {
    promptId?: string;
    prompt?: {
      name?: string;
      prompt?: string;
      model?: {
        name?: string;
        modelSlug?: string;
      };
    };
    model?: string;
  }

  const promptParam = tool.params?.find((p) => p.type === "prompt");
  const promptConfig = (promptParam?.config ?? {}) as PromptParamConfig;
  const promptModelName = promptConfig?.prompt?.model?.name || promptConfig?.prompt?.model?.modelSlug || promptConfig?.model;

  const activeScript = tool.scripts?.find((s) => s.config?.model);
  const rawActiveModel = promptModelName || (activeScript?.config?.model as string) || "";
  const activeModel = formatModelName(rawActiveModel) || "Gemini 1.5 Flash";

  const handleActivityAccess = () => {
    const sidebar = document.getElementById("tool-history-sidebar");
    if (sidebar) {
      sidebar.scrollIntoView({ behavior: "smooth" });
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start px-4 xs:px-0">
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
            activeModel={activeModel}
            onActivityAccess={handleActivityAccess}
          />
        </div>
        <aside id="tool-history-sidebar" className="space-y-6 lg:sticky lg:top-24 lg:self-start lg:h-fit min-w-0">
          <ToolHistorySidebar
            jobs={jobs}
            activeTab={activeTab}
            selectedJobId={selectedJob?.jobId || selectedVisualizerJob?.jobId}
            onTabChange={setActiveTab}
            onViewJob={handleViewJob}
            onViewVisualizer={handleViewVisualizer}
            onRefresh={refreshJobs}
            isRefreshing={isRefreshing}
          />
        </aside>
      </div>

      <ToolJobModal
        open={isJobModalOpen}
        isLoading={false}
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
      {(() => {
        let activeRun = activeRunId
          ? jobs.find((run) => run.runId === activeRunId)
          : lastTriggeredJobId
            ? jobs.find((run) =>
                run.jobs?.some((j) => j.jobId === lastTriggeredJobId || j.id === lastTriggeredJobId)
              )
            : undefined;

        // If we are waiting for the run to show up, do not fall back to jobs[0] yet
        // to prevent showing the previous completed/failed run.
        if (!activeRun && !lastTriggeredJobId && !activeRunId && !isWaitingForRun) {
          activeRun = jobs.find((j) => {
            const status = getJobStatus(j);
            return status === "active" || status === "running" || status === "queued" || status === "waiting";
          }) || jobs[0];
        }

        // Debug logging
        if (isProcessingOpen) {
          console.log("[ProcessingModal] Debug state:", {
            isProcessingOpen,
            lastTriggeredJobId,
            activeRunId: activeRun?.runId,
            activeRunState: activeRun?.state,
            activeRunJobsCount: activeRun?.jobs?.length,
            activeRunJobsStates: activeRun?.jobs?.map(j => ({
              jobId: j.jobId,
              state: j.state,
              status: getJobStatus(j)
            }))
          });
        }

        return (
          <ProcessingModal
            key={isProcessingOpen ? "open" : "closed"}
            open={isProcessingOpen}
            onOpenChange={async (open) => {
              setIsProcessingOpen(open);
              if (!open) {
                setIsJobComplete(false);
                setLastTriggeredJobId(null);
                setActiveRunId(null);
                setIsWaitingForRun(false);
                await refreshJobs();
              }
            }}
            toolName={tool.name}
            isJobComplete={isJobComplete}
            activeRun={activeRun}
          />
        );
      })()}
    </div>
  );
}
