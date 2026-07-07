import { NextResponse } from "next/server";
import { getProjects, saveProjects, applyFileEdits, runProjectCommand, getGitInfo, writeBridgeRequest } from "@/core/services/loop-projects.service";
import { resolveLoopLlm, callLoopLlm, type LlmProvider, type LlmMessage } from "@/core/services/loop-llm.service";
import { getAgents } from "@/core/services/loop-agents.service";
import type { TaskStatus, TaskStage } from "@/core/interfaces/loop-projects.interface";
import fs from "fs";
import path from "path";

type ResolvedLlm = { provider: LlmProvider; apiKey: string; model: string };

// All agent personas share one resolved provider (Claude or Gemini) to keep setup simple.
async function callAgentLLM(llm: ResolvedLlm, systemPrompt: string, messages: LlmMessage[]) {
    return callLoopLlm(llm.provider, llm.apiKey, llm.model, systemPrompt, messages, 3000);
}

export async function POST(
    req: Request,
    context: { params: Promise<{ projectId: string; taskId: string }> }
) {
    try {
        const { projectId, taskId } = await context.params;
        const body = await req.json();
        const { instructions } = body;

        const forceBridge = body.bridge === true;
        const userKey = req.headers.get("x-anthropic-api-key") || body.apiKey;
        const llm = forceBridge ? null : resolveLoopLlm(userKey);
        if (!llm) {
            const bridgeId = writeBridgeRequest({ taskId, projectId, requestType: "collaborate", prompt: instructions });
            return NextResponse.json({
                success: true,
                bridged: true,
                bridgeId,
                message: "Collaborate bridged to IDE Agent."
            });
        }

        const projects = getProjects();
        const project = projects.find((p) => p.id === projectId);
        const task = project?.tasks?.find((t) => t.id === taskId);

        if (!project || !task) {
            return NextResponse.json({ success: false, error: "Project or Task not found" }, { status: 404 });
        }

        // Set status to running
        task.status = "running";
        task.updatedAt = new Date().toISOString();
        saveProjects(projects);

        // Run the agent collaboration loop in the background against the
        // selected project directory (NOT the host app), matching chat/action routes.
        void runCollaborationLoop(projectId, taskId, project.path, llm, instructions);

        return NextResponse.json({ success: true, message: "AI Team collaboration started in background." });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

async function runCollaborationLoop(projectId: string, taskId: string, projectPath: string, llm: ResolvedLlm, instructions: string) {
    const logFilePath = path.join(process.cwd(), ".antigravity", `log-${taskId}.txt`);
    
    const writeLog = (text: string) => {
        fs.appendFileSync(logFilePath, text + "\n");
    };

    try {
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

        // --- STEP 1: Somchai (Architect) Plans the Task ---
        writeLog(`[Step 1/5] Somchai (Architect) is analyzing requirements...`);
        const somchaiPrompt = `${somchai.systemPrompt}\n\nTask instructions: ${instructions}. Please write a short plan summarizing files to edit.`;
        const somchaiRes = await callAgentLLM(llm, somchaiPrompt, [{ role: "user", content: "Plan the task." }]);
        appendHistoryMessage(projectId, taskId, "Somchai (Architect)", somchaiRes.text, somchaiRes.input, somchaiRes.output, somchaiRes.cost);
        writeLog(`[Somchai (Architect)]: ${somchaiRes.text.split("\n")[0]}...`);

        // --- STEP 2: Somsri (Developer) Writes Code ---
        writeLog(`\n[Step 2/5] Somsri (Developer) is writing code...`);
        const somsriPrompt = `${somsri.systemPrompt}\n\nPlan details: ${somchaiRes.text}\nInstructions: ${instructions}`;
        const somsriRes = await callAgentLLM(llm, somsriPrompt, [{ role: "user", content: "Implement the required files." }]);
        const editedFiles = applyFileEdits(projectPath, somsriRes.text);
        
        appendHistoryMessage(projectId, taskId, "Somsri (Developer)", somsriRes.text, somsriRes.input, somsriRes.output, somsriRes.cost);
        if (editedFiles.length > 0) {
            writeLog(`[Somsri (Developer)] Code written successfully to: ${editedFiles.join(", ")}`);
        } else {
            writeLog(`[Somsri (Developer)] Code suggestion completed (no files written).`);
        }

        // --- STEP 3: Wichai (QA) Writes and Runs Unit Test ---
        writeLog(`\n[Step 3/5] Wichai (QA) is writing tests and verifying...`);
        const targetFile = editedFiles[0] || "src/components/ui/card.tsx";
        const testFile = targetFile.replace(/\.(tsx|ts|jsx|js)$/, ".test.$1");
        
        const qaPrompt = `${wichai.systemPrompt}\n\nWrite a basic unit test file in Vitest for the modified file: ${targetFile}. Save it using <file_edit path="${testFile}">...</file_edit> tags.`;
        const qaRes = await callAgentLLM(llm, qaPrompt, [{ role: "user", content: "Write test cases." }]);
        const testFilesCreated = applyFileEdits(projectPath, qaRes.text);
        
        appendHistoryMessage(projectId, taskId, "Wichai (QA)", qaRes.text, qaRes.input, qaRes.output, qaRes.cost);
        writeLog(`[Wichai (QA)] Test file created: ${testFilesCreated.join(", ")}`);

        // Run the vitest test
        writeLog(`[Wichai (QA)] Executing Vitest runner...`);
        const testResultCode = await runProjectCommand(taskId, projectPath, "npx", ["vitest", "run", testFile], (chunk) => {
            fs.appendFileSync(logFilePath, chunk);
        });

        if (testResultCode === 0) {
            writeLog(`[Wichai (QA)] SUCCESS: All Vitest unit tests passed!`);
        } else {
            writeLog(`[Wichai (QA)] FAILED: Vitest failed with exit code ${testResultCode}. Somsri, please fix the bugs!`);
            // Run one fix loop
            const fixRes = await callAgentLLM(llm, `${somsri.systemPrompt}\n\nThe tests failed. Please review and rewrite the file: ${targetFile}.`, [{ role: "user", content: "Fix the unit test failures." }]);
            applyFileEdits(projectPath, fixRes.text);
            appendHistoryMessage(projectId, taskId, "Somsri (Developer) - Fix Loop", fixRes.text, fixRes.input, fixRes.output, fixRes.cost);
            writeLog(`[Somsri (Developer)] Refactored file in response to failures.`);
        }

        // --- STEP 4: Mana (DevOps) Typechecks and Simulates CI ---
        writeLog(`\n[Step 4/5] Mana (DevOps) is running CI verification (tsc typecheck)...`);
        const devopsResultCode = await runProjectCommand(`${taskId}-ci`, projectPath, "npx", ["tsc", "--noEmit"], (chunk) => {
            fs.appendFileSync(logFilePath, chunk);
        });

        if (devopsResultCode === 0) {
            writeLog(`[Mana (DevOps)] SUCCESS: Compiler type check passed!`);
        } else {
            writeLog(`[Mana (DevOps)] WARNING: Type check errors found (code ${devopsResultCode}).`);
        }

        // --- STEP 5: Preecha (Auditor) Audits Git Diff ---
        writeLog(`\n[Step 5/5] Preecha (Auditor) is performing security and diff audits...`);
        const gitInfo = await getGitInfo(projectPath);
        writeLog(`[Preecha (Auditor)] Auditing branch "${gitInfo.branch}" @ ${gitInfo.commit} (${gitInfo.modifiedFiles.length} modified file(s))`);
        const gitDiff = await executeGitDiff(projectPath, targetFile);

        const auditorPrompt = `${preecha.systemPrompt}\n\nReview this Git Diff for security issues:\n${gitDiff}`;
        const auditorRes = await callAgentLLM(llm, auditorPrompt, [{ role: "user", content: "Review git diff." }]);
        appendHistoryMessage(projectId, taskId, "Preecha (Auditor)", auditorRes.text, auditorRes.input, auditorRes.output, auditorRes.cost);
        writeLog(`[Preecha (Auditor)]: ${auditorRes.text}`);

        // Update task status
        updateTaskStatus(projectId, taskId, "completed", "OBSERVE");
        writeLog(`\n[Collaboration] --- AI Team Collaboration Completed Successfully ---`);

    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        writeLog(`\n[Collaboration] ERROR: ${message}`);
        updateTaskStatus(projectId, taskId, "failed", "PLAN");
    }
}

async function executeGitDiff(projectPath: string, file: string): Promise<string> {
    const { spawn } = await import("child_process");
    return new Promise((resolve) => {
        const proc = spawn("git", ["diff", "--", file], { cwd: projectPath });
        let out = "";
        proc.stdout.on("data", (d) => { out += d.toString(); });
        proc.on("close", () => resolve(out || "No diff"));
    });
}

function appendHistoryMessage(
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

function updateTaskStatus(projectId: string, taskId: string, status: TaskStatus, stage: TaskStage) {
    const projects = getProjects();
    const project = projects.find((p) => p.id === projectId);
    const task = project?.tasks?.find((t) => t.id === taskId);
    if (task) {
        task.status = status;
        task.currentStage = stage;
        task.updatedAt = new Date().toISOString();
        saveProjects(projects);
    }
}
