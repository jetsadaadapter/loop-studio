import { apiFetch, buildUrl } from "./api";
import type {
    Tool,
    ToolJob,
    GetToolJobsResponse,
    GetToolJobDetailResponse,
    GetToolDetailResponse,
    ToolTestPromptResult,
    ToolRun,
    GetToolRunResponse,
} from "@/core/interfaces/tools.interface";

function normalizeJobIdentity(value: unknown): string {
    if (typeof value !== "string") return "";
    const normalized = value.trim();
    if (!normalized) return "";

    const lowered = normalized.toLowerCase();
    if (lowered === "undefined" || lowered === "null" || lowered === "nan") {
        return "";
    }

    return normalized;
}

/**
 * Fetch detailed information for a specific tool.
 */
export async function getTool(id: string, init?: RequestInit): Promise<Tool> {
    const url = buildUrl(`/tools/${id}`);
    const response = await apiFetch<GetToolDetailResponse>(url, init);
    return response.data;
}

/**
 * Execute a specific tool with form inputs.
 */
export async function runTool(
    id: string,
    input: Record<string, unknown>,
    init?: RequestInit
): Promise<{ success: boolean; jobId: string }> {
    const url = buildUrl(`/tools/${id}/run`);
    return apiFetch<{ success: boolean; jobId: string }>(url, {
        method: "POST",
        body: JSON.stringify({ input }),
        ...init,
    });
}

/**
 * Retrieve execution job history for a specific tool.
 */
export async function getToolJobs(
    id: string,
    params: { page?: number; limit?: number } = {},
    init?: RequestInit
): Promise<GetToolJobsResponse> {
    const url = buildUrl(`/tools/${id}/jobs`, params);
    return apiFetch<GetToolJobsResponse>(url, init);
}

/**
 * Fetch detailed information for a specific execution job.
 */
export async function getToolJob(
    toolId: string,
    jobId: string,
    init?: RequestInit
): Promise<ToolJob> {
    const safeJobId = normalizeJobIdentity(jobId);
    if (!safeJobId) {
        throw new Error("Invalid job id");
    }

    const url = buildUrl(`/tools/${toolId}/jobs/${safeJobId}`);
    const response = await apiFetch<ToolJob | GetToolJobDetailResponse>(url, init);

    // Flexible handling: check if it's the wrapped response or the job object directly
    if ("data" in response && response.data) {
        return response.data;
    }
    return response as ToolJob;
}

/**
 * Test a tool prompt (Call /tools/[toolId]/test).
 */
export async function testToolPrompt(
    id: string,
    input: string,
    init?: RequestInit
): Promise<ToolTestPromptResult> {
    const url = buildUrl(`/tools/${id}/test`);
    return apiFetch<ToolTestPromptResult>(url, {
        method: "POST",
        body: JSON.stringify({ input }),
        ...init,
    });
}

/**
 * Fetch detailed information for a specific tool run (grouped jobs).
 */
export async function getToolRun(
    toolId: string,
    runId: string,
    init?: RequestInit
): Promise<ToolRun> {
    const url = buildUrl(`/tools/${toolId}/runs/${runId}`);
    const response = await apiFetch<GetToolRunResponse>(url, init);
    return response.data;
}

