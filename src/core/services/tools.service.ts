import { apiFetch, buildUrl } from "./api";
import type { 
    Tool, 
    ToolJob, 
    GetToolJobsResponse, 
    GetToolJobDetailResponse,
    GetToolDetailResponse
} from "@/core/interfaces/tools.interface";

export async function getTool(id: string, init?: RequestInit): Promise<Tool> {
    const url = buildUrl(`/tools/${id}`);
    const response = await apiFetch<GetToolDetailResponse>(url, init);
    return response.data;
}

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

export async function getToolJobs(
    id: string, 
    params: { page?: number; limit?: number } = {},
    init?: RequestInit
): Promise<GetToolJobsResponse> {
    const url = buildUrl(`/tools/${id}/jobs`, params);
    return apiFetch<GetToolJobsResponse>(url, init);
}

export async function getToolJob(
    toolId: string, 
    jobId: string, 
    init?: RequestInit
): Promise<ToolJob> {
    const url = buildUrl(`/tools/${toolId}/jobs/${jobId}`);
    const response = await apiFetch<GetToolJobDetailResponse>(url, init);
    return response.data;
}
