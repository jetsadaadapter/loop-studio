import fs from "fs";
import { getProjects, applyFileEdits, runProjectCommand, getGitInfo, writeBridgeRequest } from "@/core/services/loop-projects.service";
import { isLlmCapacityError } from "@/core/services/loop-llm.service";
import { resolveTaskCwd, checkpoint } from "@/core/services/loop-worktree.service";
import { taskLogPath } from "@/core/services/loop-logs.service";
import { getAgents } from "@/core/services/loop-agents.service";
import { knowledgeForPrompt } from "@/core/services/loop-knowledge.service";
import type { TaskStage } from "@/core/interfaces/loop-projects.interface";
import {
    callAgentLLM,
    logBlockedEdits,
    executeGitDiff,
    appendHistoryMessage,
    updateTaskStatus,
    MAX_FIX_ATTEMPTS,
    MAX_TEST_OUTPUT_CHARS,
    type ResolvedLlm,
    type CollaborationResult,
} from "@/core/services/loop-collaboration.helpers";

// Re-exported so existing importers (loop-autorun, collaborate route) are unaffected.
export type { ResolvedLlm, CollaborationResult };
export { appendHistoryMessage, updateTaskStatus };

// The per-task AI-team pipeline (Architect plan → Developer code → QA test →
// DevOps typecheck → Auditor diff review). Extracted from the collaborate route
// so both the one-off "Delegate to AI Agent Team" button and the Auto-Run
// orchestrator drive the exact same steps.

export async function runCollaborationLoop(
    projectId: string,
    taskId: string,
    projectPath: string,
    llm: ResolvedLlm,
    instructions: string,
): Promise<CollaborationResult> {
    const logFilePath = taskLogPath(taskId);

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
        const useWorktree = cwd !== projectPath;
        if (useWorktree) writeLog(`[Collaboration] Working in task worktree: ${cwd}`);

        // Commit a checkpoint (rollback target) after each guarded edit batch, but
        // only when the task runs in its own worktree. No-op otherwise (legacy
        // direct edits have nothing to checkpoint). Never throws into the pipeline.
        const maybeCheckpoint = async (stage: TaskStage, label: string) => {
            if (!useWorktree) return;
            try {
                const cp = await checkpoint(taskId, { stage, label });
                if (cp) writeLog(`[Checkpoint] ${cp.sha.slice(0, 7)} — ${label}`);
            } catch (e) {
                writeLog(`[Checkpoint] skipped — ${e instanceof Error ? e.message : String(e)}`);
            }
        };

        // Delegation: when this project's agent is the Agent SDK, hand the whole
        // implement+verify phase to the agentic loop (it plans/edits/verifies itself
        // under the guards + worktree) instead of the hand-rolled 5-step LLM pipeline.
        // The SDK's PreToolUse guard + run_verification are the maker/checker here.
        const project = getProjects().find((p) => p.id === projectId);
        if (project?.autoAgent === "claude-sdk") {
            writeLog(`\n[Collaboration] Delegating to the Claude Agent SDK (agentic loop)…`);
            const { runAgentSdk } = await import("./loop-sdk-runner");
            const r = await runAgentSdk({ taskId, projectId, prompt: instructions, onLog: writeLog });
            appendHistoryMessage(projectId, taskId, "Somsri (Agent SDK)", r.summary, 0, 0, 0);
            writeLog(`[Collaboration] SDK applied ${r.editedFiles.length} file(s): ${r.editedFiles.join(", ") || "(none)"}`);
            // Definitive typecheck against the SDK's worktree; the agent self-verifies
            // (run_verification) during its loop, so tests mirror the typecheck result.
            const wt = getProjects().find((p) => p.id === projectId)?.tasks?.find((t) => t.id === taskId)?.git?.worktreeDir ?? projectPath;
            const tscCode = await runProjectCommand(`${taskId}-ci`, wt, "npx", ["tsc", "--noEmit"], (c) => fs.appendFileSync(logFilePath, c));
            typecheckPassed = tscCode === 0;
            testsPassed = typecheckPassed;
            updateTaskStatus(projectId, taskId, "completed", "OBSERVE");
            writeLog(`\n[Collaboration] --- Delegated SDK run complete (typecheck ${typecheckPassed ? "passed" : "failed"}) ---`);
            return { success: true, testsPassed, typecheckPassed };
        }

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
        // The edits are extracted from the reply by applyFileEdits, which only
        // recognizes <file_edit path="…">…</file_edit> blocks. The agent's stored
        // system prompt doesn't mandate that shape, and models that don't infer it
        // (e.g. Gemini) then "suggest code" that writes nothing — so state the
        // output contract explicitly here, the same way the QA step does below.
        const scopeHint = allowedPaths.length
            ? ` Only create or modify these files: ${allowedPaths.join(", ")} (edits outside this scope are ignored).`
            : "";
        const somsriPrompt = `${somsri.systemPrompt}${knowledgeBlock}\n\nPlan details: ${somchaiRes.text}\nInstructions: ${instructions}\n\nOUTPUT FORMAT (required): return every file you create or change as a <file_edit path="relative/path">FULL FILE CONTENTS</file_edit> block — the complete file body inside each block, not a diff and no "…" placeholders.${scopeHint} A reply with no <file_edit> block writes nothing.`;
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
        if (editedFiles.length > 0) await maybeCheckpoint("BUILD", `Developer: ${editedFiles.join(", ")}`);

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
            if (qaEdit.written.length > 0) await maybeCheckpoint("VERIFY", `QA test: ${qaEdit.written.join(", ")}`);

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
                    if (fixEdit.written.length > 0) await maybeCheckpoint("VERIFY", `Fix ${attempt}: ${fixEdit.written.join(", ")}`);
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
        // A capacity limit (rate limit / overload / quota) isn't a task failure —
        // the same work can be finished by the keyless IDE bridge, which doesn't
        // touch the exhausted key. Hand off instead of failing: write a bridge
        // request and let a connected agent / the project's auto-fulfill adapter
        // (or a human) take it. Only for capacity errors — real bugs still fail.
        if (isLlmCapacityError(e)) {
            try {
                const bridgeId = writeBridgeRequest({ taskId, projectId, requestType: "collaborate", prompt: instructions });
                writeLog(`[Collaboration] LLM capacity limit — handed off to the IDE bridge (${bridgeId}).`);
                const { autoFulfillBridge } = await import("@/core/services/loop-bridge-worker.service");
                void autoFulfillBridge(taskId, bridgeId).catch(() => { /* worker logs its own errors */ });
                updateTaskStatus(projectId, taskId, "running", "BUILD");
                return { success: false, bridged: true, error: message, testsPassed, typecheckPassed };
            } catch (handoffErr) {
                writeLog(`[Collaboration] Bridge handoff failed: ${handoffErr instanceof Error ? handoffErr.message : String(handoffErr)}`);
                // fall through to a normal failure below
            }
        }
        updateTaskStatus(projectId, taskId, "failed", "PLAN");
        return { success: false, error: message, testsPassed, typecheckPassed };
    }
}
