"use client";

import { useState } from "react";
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
import type { JobStatus } from "./tool-job-utils";

interface ToolClientProps {
  tool: Tool;
  initialJobs: GetToolJobsResponse;
}

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
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ToolTestPromptResult | null>(
    null,
  );
  const [jobs, setJobs] = useState<ToolJob[]>(initialJobs.data);
  const [isRunning, setIsRunning] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>(() =>
    buildInitialForm(tool.params),
  );
  const [selectedJob, setSelectedJob] = useState<ToolJob | null>(null);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [isJobLoading, setIsJobLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<JobStatus>("all");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { pushDialogToast } = useDialogToast();

  const refreshJobs = async () => {
    setIsRefreshing(true);
    try {
      const response = await getToolJobs(tool.id);
      setJobs(response.data);
    } catch {
      pushDialogToast("Failed to refresh job history.", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

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
      pushDialogToast("Job started successfully!", "success");
      setFormData(buildInitialForm(tool.params));
      setErrors({});
      await refreshJobs();
    } catch {
      pushDialogToast("Failed to start job.", "error");
    } finally {
      setIsRunning(false);
    }
  };

  const handleViewJob = async (jobId: string) => {
    setIsJobModalOpen(true);
    setIsJobLoading(true);
    setSelectedJob(null);
    try {
      const job = await getToolJob(tool.id, jobId);
      setSelectedJob(job);
      setJobs((prev) =>
        prev.map((j) => (j.jobId === jobId ? { ...j, result: job.result } : j)),
      );
    } catch {
      pushDialogToast("Failed to fetch job details.", "error");
      setIsJobModalOpen(false);
    } finally {
      setIsJobLoading(false);
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
    } catch (e) {
      setTestResult({ error: "Test prompt failed." });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="mx-auto w-full max-w-6xl pb-6 flex-1">
        <div className="mb-6">
          <AppCover src={null} alt={`${tool.name} cover`} accentColor="#0ea5e9">
            <div className="pt-5 sm:pt-8">
              <Link
                href="/apps"
                className="inline-flex items-center gap-1.5 rounded-full bg-black/50 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-black/70"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
                    clipRule="evenodd"
                  />
                </svg>
                Back to Library
              </Link>
            </div>
            <div className="relative z-10 flex min-h-48 flex-col justify-end py-5 pt-10 text-white sm:min-h-64 sm:py-8 sm:pt-16 lg:min-h-80 lg:py-10 lg:pt-20">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 mb-2">
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-slate-300 ring-1 ring-white/10">
                    AI Tool
                  </span>
                </div>
                <h1 className="page-hero-title text-white">{tool.name}</h1>
                <p className="mt-4 text-lg text-slate-300 max-w-2xl leading-relaxed">
                  {tool.description ||
                    "Configure and run this automated tool to analyze your data."}
                </p>
              </div>
            </div>
          </AppCover>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
            />
          </div>
          <div className="space-y-6 lg:sticky lg:top-24">
            <ToolHistorySidebar
              jobs={jobs}
              activeTab={activeTab}
              selectedJobId={selectedJob?.jobId}
              onTabChange={setActiveTab}
              onViewJob={handleViewJob}
              onRefresh={refreshJobs}
              isRefreshing={isRefreshing}
            />
          </div>
        </div>
      </div>

      <ToolJobModal
        open={isJobModalOpen}
        isLoading={isJobLoading}
        job={selectedJob}
        onOpenChange={setIsJobModalOpen}
      />
    </div>
  );
}
