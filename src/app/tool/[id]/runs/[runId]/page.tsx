import { notFound } from "next/navigation";
import { getTool, getToolRun } from "@/core/services/tools.service";
import { RunClient } from "./run-client";
import type { Tool, ToolRun } from "@/core/interfaces/tools.interface";

interface Props {
  params: Promise<{ id: string; runId: string }>;
}

export default async function ToolRunPage({ params }: Props) {
  const { id, runId } = await params;
  console.log(`[ToolRunPage] Loading run: ${runId} for tool: ${id}`);

  let runData: [Tool, ToolRun] | null = null;

  try {
    runData = await Promise.all([
      getTool(id),
      getToolRun(id, runId),
    ]);
  } catch (error) {
    console.error(`[ToolRunPage] Error loading data:`, error);
    notFound();
  }

  const [tool, run] = runData;

  if (!tool || !run) {
    notFound();
  }

  return (
    <RunClient key={runId} tool={tool} run={run} runId={runId} />
  );
}
