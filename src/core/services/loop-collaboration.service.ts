import fs from "fs";
import path from "path";
import { getProjects, saveProjects, applyFileEdits, runProjectCommand, getGitInfo, kanbanColumnForStatus } from "@/core/services/loop-projects.service";
import { resolveTaskCwd } from "@/core/services/loop-worktree.service";
import { callLoopLlm, type LlmProvider, type LlmMessage } from "@/core/services/loop-llm.service";
import { getAgents } from "@/core/services/loop-agents.service";
import { knowledgeForPrompt } from "@/core/services/loop-knowledge.service";
import type { TaskStatus, TaskStage } from "@/core/interfaces/loop-projects.interface";

// The per-task AI-team pipeline (Architect plan → Developer code → QA test →
// DevOps typecheck → Auditor diff review). Extracted from the collaborate route
// so both the one-off "Delegate to AI Agent Team" button and the Auto-Run
// orchestrator drive the exact same steps.

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
const MAX_FIX_ATTEMPTS = 2;
// Tail of vitest output fed back to the developer on failure (prompt-size cap).
const MAX_TEST_OUTPUT_CHARS = 4000;

// All agent personas share one resolved provider (Claude or Gemini) to keep setup simple.
async function callAgentLLM(llm: ResolvedLlm, systemPrompt: string, messages: LlmMessage[]) {
    return callLoopLlm(llm.provider, llm.apiKey, llm.model, systemPrompt, messages, 3000);
}

// Surface refused edits in the task log so a blocked attempt to touch the
// verifier is visible, not silent — the human reviewing the run should know
// an agent tried to edit a protected test/config file.
function logBlockedEdits(
    writeLog: (text: string) => void,
    role: string,
    blocked: { path: string; reason: string }[],
) {
    for (const b of blocked) {
        writeLog(`[${role}] BLOCKED edit to ${b.path} — ${b.reason}.`);
    }
}

export async function runCollaborationLoop(
    projectId: string,
    taskId: string,
    projectPath: string,
    llm: ResolvedLlm,
    instructions: string,
): Promise<CollaborationResult> {
    const logFilePath = path.join(process.cwd(), ".antigravity", `log-${taskId}.txt`);

    const writeLog = (text: string) => {
        fs.appendFileSync(logFilePath, text + "\n");
    };

    let testsPassed = false;
    let typecheckPassed = false;

    // The task's declared scope — every agent edit below is confined to these
    // files (empty = no scope declared, so no restriction). Read once up front.
    const scopeTask = getProjects().find((p) => p.id === projectId)?.tasks?.find((t) => t.id === taskId);
    const allowedPaths = scopeTask?.targetFiles ?? [];

    try {
        // Where the agent reads/edits/runs: the task's worktree when the project
        // opted into useWorktree, else the repo path itself (legacy). Resolved once.
        const cwd = await resolveTaskCwd(taskId);
        if (cwd !== projectPath) writeLog(`[Collaboration] Working in task worktree: ${cwd}`);

        const agents = getAgents();
        const somchai = agents.find(a => a.id === "agent-somchai");
        const somsri = agents.find(a => a.id === "agent-somsri");
        const wichai = agents.find(a => a.id === "agent-wichai");
        const preecha = agents.find(a => a.id === "agent-preecha");

        if (!somchai || !somsri || !wichai || !preecha) {
            throw new Error("Missing one of the core AI team agents (Architect/Developer/QA/Auditor). Restore the default agents to run collaboration.");
        }

        writeLog(`\n[Collaboration] --- AI Team Collaboration Started ---`);
        writeLog(`[Collaboration] Prompt: "${instructions}"\n`);

        // Accumulated learnings from previous runs — planner and developer both
        // see them so knowledge compounds instead of restarting from zero.
        const knowledge = knowledgeForPrompt(projectId);
        const knowledgeBlock = knowledge ? `\n\n${knowledge}` : "";
        if (knowledge) writeLog(`[Collaboration] Injected project knowledge from previous runs.`);

        // --- STEP 1: Somchai (Architect) Plans the Task ---
        writeLog(`[Step 1/5] Somchai (Architect) is analyzing requirements...`);
        const somchaiPrompt = `${somchai.systemPrompt}${knowledgeBlock}\n\nTask instructions: ${instructions}. Please write a short plan summarizing files to edit.`;
        const somchaiRes = await callAgentLLM(llm, somchaiPrompt, [{ role: "user", content: "Plan the task." }]);
        appendHistoryMessage(projectId, taskId, "Somchai (Architect)", somchaiRes.text, somchaiRes.input, somchaiRes.output, somchaiRes.cost);
        writeLog(`[Somchai (Architect)]: ${somchaiRes.text.split("\n")[0]}...`);

        // --- STEP 2: Somsri (Developer) Writes Code ---
        writeLog(`\n[Step 2/5] Somsri (Developer) is writing code...`);
        const somsriPrompt = `${somsri.systemPrompt}${knowledgeBlock}\n\nPlan details: ${somchaiRes.text}\nInstructions: ${instructions}`;
        const somsriRes = await callAgentLLM(llm, somsriPrompt, [{ role: "user", content: "Implement the required files." }]);
        // Implementer role: cannot write test or verifier-config files (default policy).
        const devEdit = applyFileEdits(cwd, somsriRes.text, { allowedPaths });
        const editedFiles = devEdit.written;

        appendHistoryMessage(projectId, taskId, "Somsri (Developer)", somsriRes.text, somsriRes.input, somsriRes.output, somsriRes.cost);
        if (editedFiles.length > 0) {
            writeLog(`[Somsri (Developer)] Code written successfully to: ${editedFiles.join(", ")}`);
        } else {
            writeLog(`[Somsri (Developer)] Code suggestion completed (no files written).`);
        }
        logBlockedEdits(writeLog, "Somsri (Developer)", devEdit.blocked);

        // --- STEP 3: Wichai (QA) Writes and Runs Unit Test ---
        writeLog(`\n[Step 3/5] Wichai (QA) is writing tests and verifying...`);
        const targetFile = editedFiles[0] || allowedPaths[0] || "";
        const testFile = targetFile.replace(/\.(tsx|ts|jsx|js)$/, ".test.$1");

        if (!targetFile) {
            // No file was written and the task declared no targetFiles — there is
            // nothing concrete to test, so skip QA rather than invent a test for a
            // made-up path (the old hardcoded card.tsx default did exactly that).
            writeLog(`[Wichai (QA)] No in-scope target file to test — skipping test authoring.`);
        } else {
            const qaPrompt = `${wichai.systemPrompt}\n\nWrite a basic unit test file in Vitest for the modified file: ${targetFile}. Save it using <file_edit path="${testFile}">...</file_edit> tags.`;
            const qaRes = await callAgentLLM(llm, qaPrompt, [{ role: "user", content: "Write test cases." }]);
            // QA role: the one path allowed to author test files (still not config),
            // and only for a test that covers an in-scope target.
            const qaEdit = applyFileEdits(cwd, qaRes.text, { allowTestFiles: true, allowedPaths });

            appendHistoryMessage(projectId, taskId, "Wichai (QA)", qaRes.text, qaRes.input, qaRes.output, qaRes.cost);
            writeLog(`[Wichai (QA)] Test file created: ${qaEdit.written.join(", ")}`);
            logBlockedEdits(writeLog, "Wichai (QA)", qaEdit.blocked);

            // Run the vitest test, keeping the output tail: a failing run is fed
            // back to the developer verbatim — "the tests failed" alone made the
            // fix loop guess; the actual assertion diff lets it fix the real bug.
            let testOutput = "";
            const runTests = () => {
                testOutput = "";
                return runProjectCommand(taskId, cwd, "npx", ["vitest", "run", testFile], (chunk) => {
                    fs.appendFileSync(logFilePath, chunk);
                    testOutput = (testOutput + chunk).slice(-MAX_TEST_OUTPUT_CHARS);
                });
            };

            writeLog(`[Wichai (QA)] Executing Vitest runner...`);
            let testResultCode = await runTests();

            if (testResultCode === 0) {
                testsPassed = true;
                writeLog(`[Wichai (QA)] SUCCESS: All Vitest unit tests passed!`);
            } else {
                for (let attempt = 1; attempt <= MAX_FIX_ATTEMPTS && testResultCode !== 0; attempt++) {
                    writeLog(`[Wichai (QA)] FAILED (exit ${testResultCode}). Fix attempt ${attempt}/${MAX_FIX_ATTEMPTS}: sending the failing output to Somsri...`);
                    const fixRes = await callAgentLLM(
                        llm,
                        `${somsri.systemPrompt}${knowledgeBlock}\n\nThe tests for ${targetFile} failed.\n` +
                        `Failing test output (tail):\n${testOutput}\n\n` +
                        `Fix the IMPLEMENTATION only — do not edit the test file, it is the gate you must satisfy. ` +
                        `Return the full corrected implementation file(s) in <file_edit> blocks.`,
                        [{ role: "user", content: "Fix the unit test failures." }]
                    );
                    // Fix loop is still the implementer: test/config edits stay blocked, scope stays enforced.
                    const fixEdit = applyFileEdits(cwd, fixRes.text, { allowedPaths });
                    appendHistoryMessage(projectId, taskId, `Somsri (Developer) - Fix ${attempt}`, fixRes.text, fixRes.input, fixRes.output, fixRes.cost);
                    logBlockedEdits(writeLog, `Somsri (Developer) - Fix ${attempt}`, fixEdit.blocked);
                    testResultCode = await runTests();
                }
                testsPassed = testResultCode === 0;
                writeLog(testsPassed
                    ? `[Wichai (QA)] SUCCESS: Tests pass after the fix loop.`
                    : `[Wichai (QA)] Tests still failing after ${MAX_FIX_ATTEMPTS} fix attempts (exit ${testResultCode}).`);
            }
        }

        // --- STEP 4: Mana (DevOps) Typechecks and Simulates CI ---
        writeLog(`\n[Step 4/5] Mana (DevOps) is running CI verification (tsc typecheck)...`);
        const devopsResultCode = await runProjectCommand(`${taskId}-ci`, cwd, "npx", ["tsc", "--noEmit"], (chunk) => {
            fs.appendFileSync(logFilePath, chunk);
        });

        typecheckPassed = devopsResultCode === 0;
        if (typecheckPassed) {
            writeLog(`[Mana (DevOps)] SUCCESS: Compiler type check passed!`);
        } else {
            writeLog(`[Mana (DevOps)] WARNING: Type check errors found (code ${devopsResultCode}).`);
        }

        // --- STEP 5: Preecha (Auditor) Audits Git Diff ---
        writeLog(`\n[Step 5/5] Preecha (Auditor) is performing security and diff audits...`);
        const gitInfo = await getGitInfo(cwd);
        writeLog(`[Preecha (Auditor)] Auditing branch "${gitInfo.branch}" @ ${gitInfo.commit} (${gitInfo.modifiedFiles.length} modified file(s))`);
        const gitDiff = await executeGitDiff(cwd, targetFile);

        const auditorPrompt = `${preecha.systemPrompt}\n\nReview this Git Diff for security issues:\n${gitDiff}`;
        const auditorRes = await callAgentLLM(llm, auditorPrompt, [{ role: "user", content: "Review git diff." }]);
        appendHistoryMessage(projectId, taskId, "Preecha (Auditor)", auditorRes.text, auditorRes.input, auditorRes.output, auditorRes.cost);
        writeLog(`[Preecha (Auditor)]: ${auditorRes.text}`);

        // Update task status
        updateTaskStatus(projectId, taskId, "completed", "OBSERVE");
        writeLog(`\n[Collaboration] --- AI Team Collaboration Completed Successfully ---`);
        return { success: true, testsPassed, typecheckPassed };

    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        writeLog(`\n[Collaboration] ERROR: ${message}`);
        updateTaskStatus(projectId, taskId, "failed", "PLAN");
        return { success: false, error: message, testsPassed, typecheckPassed };
    }
}

async function executeGitDiff(projectPath: string, file: string): Promise<string> {
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
    cost: number
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
            tokensUsed: { input, output, cost }
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
