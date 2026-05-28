import { notFound } from "next/navigation";
import { getTool, getToolJobs, getToolRun } from "@/core/services/tools.service";
import { RunClient } from "./run-client";
import type { Tool, GetToolJobsResponse, ToolRun } from "@/core/interfaces/tools.interface";

interface Props {
  params: Promise<{ id: string; runId: string }>;
}

export default async function ToolRunPage({ params }: Props) {
  const { id, runId } = await params;
  console.log(`[ToolRunPage] Loading run: ${runId} for tool: ${id}`);

  let runData: [Tool, ToolRun, GetToolJobsResponse] | null = null;

  try {
    runData = await Promise.all([
      getTool(id),
      getToolRun(id, runId),
      getToolJobs(id, { limit: 20 }),
    ]);
  } catch (error) {
    console.error(`[ToolRunPage] Error loading data:`, error);
    notFound();
  }

  const [tool, run, initialJobs] = runData;

  if (!tool || !run) {
    notFound();
  }

  return (
    <RunClient tool={tool} run={run} initialJobs={initialJobs} runId={runId} />
  );
}
