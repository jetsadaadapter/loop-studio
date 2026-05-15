import { notFound } from "next/navigation";
import { getTool, getToolJobs } from "@/core/services/tools.service";
import { ToolClient } from "./tool-client";
import { ApiError } from "@/core/services/api";
import type { Tool, GetToolJobsResponse } from "@/core/interfaces/tools.interface";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ToolPage({ params }: Props) {
  const { id } = await params;
  console.log(`[ToolPage] Loading tool with ID: ${id}`);

  let toolData: [Tool, GetToolJobsResponse] | null = null;

  try {
    toolData = await Promise.all([
      getTool(id),
      getToolJobs(id, { limit: 10 }),
    ]);
  } catch (error) {
    console.error(`[ToolPage] Error caught in page:`, error);
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    // For 400 or other errors, we might want to show a custom error UI or just 404 for now
    notFound();
  }

  const [tool, initialJobs] = toolData;

  if (!tool) {
    console.warn(`[ToolPage] Tool not found for ID: ${id}`);
    notFound();
  }

  return (
    <ToolClient tool={tool} initialJobs={initialJobs} />
  );
}
