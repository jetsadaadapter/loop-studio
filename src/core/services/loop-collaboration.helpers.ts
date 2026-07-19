import { getProjects, saveProjects, kanbanColumnForStatus } from "@/core/services/loop-projects.service";
import { callLoopLlm, type LlmProvider, type LlmMessage } from "@/core/services/loop-llm.service";
import type { TaskStatus, TaskStage } from "@/core/interfaces/loop-projects.interface";

// Shared types, constants, and small helpers for the AI-team pipeline. Split out
// of loop-collaboration.service.ts to keep that file under the 300-line cap; the
// service re-exports the public types.

export type ResolvedLlm = { provider: LlmProvider; apiKey: string; model: string };

export interface CollaborationResult {
    success: boolean;
    error?: string;
    /** Vitest run exit code was 0 (after at most one fix loop). */
    testsPassed: boolean;
    /** `tsc --noEmit` exit code was 0. */
    typecheckPassed: boolean;
}

// Failing tests get re-fixed at most this many times before the pipeline gives up.
export const MAX_FIX_ATTEMPTS = 2;
// Tail of vitest output fed back to the developer on failure (prompt-size cap).
export const MAX_TEST_OUTPUT_CHARS = 4000;

// All agent personas share one resolved provider (Claude or Gemini) to keep setup simple.
export async function callAgentLLM(llm: ResolvedLlm, systemPrompt: string, messages: LlmMessage[]) {
    return callLoopLlm(llm.provider, llm.apiKey, llm.model, systemPrompt, messages, 3000);
}

// Surface refused edits in the task log so a blocked attempt to touch the
// verifier is visible, not silent — the human reviewing the run should know
// an agent tried to edit a protected test/config file.
export function logBlockedEdits(
    writeLog: (text: string) => void,
    role: string,
    blocked: { path: string; reason: string }[],
) {
    for (const b of blocked) {
        writeLog(`[${role}] BLOCKED edit to ${b.path} — ${b.reason}.`);
    }
}

export async function executeGitDiff(projectPath: string, file: string): Promise<string> {
    const { spawn } = await import("child_process");
    return new Promise((resolve) => {
        const proc = spawn("git", ["diff", "--", file], { cwd: projectPath });
        let out = "";
        proc.stdout.on("data", (d) => { out += d.toString(); });
        proc.on("error", () => resolve("No diff (git unavailable)"));
        proc.on("close", () => resolve(out || "No diff"));
    });
}

export function appendHistoryMessage(
    projectId: string,
    taskId: string,
    senderName: string,
    content: string,
    input: number,
    output: number,
    cost: number,
) {
    const projects = getProjects();
    const project = projects.find((p) => p.id === projectId);
    const task = project?.tasks?.find((t) => t.id === taskId);
    if (task) {
        task.chatHistory.push({
            id: `msg-col-${Date.now()}`,
            role: "assistant",
            senderName,
            content,
            timestamp: new Date().toISOString(),
            tokensUsed: { input, output, cost },
        });

        task.tokensUsed.input += input;
        task.tokensUsed.output += output;
        task.tokensUsed.cost += cost;
        task.updatedAt = new Date().toISOString();
        saveProjects(projects);
    }
}

export function updateTaskStatus(projectId: string, taskId: string, status: TaskStatus, stage: TaskStage) {
    const projects = getProjects();
    const project = projects.find((p) => p.id === projectId);
    const task = project?.tasks?.find((t) => t.id === taskId);
    if (task) {
        task.status = status;
        task.currentStage = stage;
        task.kanbanColumn = kanbanColumnForStatus(status);
        task.updatedAt = new Date().toISOString();
        saveProjects(projects);
    }
}
