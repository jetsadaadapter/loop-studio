import { NextResponse } from "next/server";
import { getProjects, saveProjects, runProjectCommand } from "@/core/services/loop-projects.service";
import fs from "fs";
import path from "path";

// Auto-pipeline (Phase 3): run the Verify + Automate checkpoints in sequence right
// from the workspace, report per-step pass/fail, and auto-advance the task past
// AUTOMATE when everything is green — so the stages never need clicking through.
const STEPS: { key: string; label: string; cmd: string; args: string[] }[] = [
    { key: "vitest", label: "Unit tests (Vitest)", cmd: "npx", args: ["vitest", "run"] },
    { key: "lint", label: "Lint (ESLint)", cmd: "npm", args: ["run", "lint"] },
    { key: "build", label: "Build (next build)", cmd: "npm", args: ["run", "build"] },
];

export async function POST(req: Request, context: { params: Promise<{ projectId: string; taskId: string }> }) {
    try {
        const { projectId, taskId } = await context.params;

        const projects = getProjects();
        const project = projects.find((p) => p.id === projectId);
        const task = project?.tasks?.find((t) => t.id === taskId);
        if (!project || !task) {
            return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
        }

        task.status = "running";
        task.updatedAt = new Date().toISOString();
        saveProjects(projects);

        const logFilePath = path.join(process.cwd(), ".antigravity", `log-${taskId}.txt`);
        fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
        fs.writeFileSync(logFilePath, `\n--- Auto-Pipeline: Verify + Automate ---\n\n`, "utf8");

        // Run steps sequentially; stop the pipeline on the first failure.
        const results: { key: string; label: string; exitCode: number; ok: boolean }[] = [];
        for (const step of STEPS) {
            fs.appendFileSync(logFilePath, `\n▶ ${step.label} (${step.cmd} ${step.args.join(" ")})\n`);
            const exitCode = await runProjectCommand(`${taskId}-pipeline`, project.path, step.cmd, step.args, (chunk) => {
                fs.appendFileSync(logFilePath, chunk);
            });
            const ok = exitCode === 0;
            results.push({ key: step.key, label: step.label, exitCode, ok });
            fs.appendFileSync(logFilePath, `\n${ok ? "✓" : "✗"} ${step.label} — exit ${exitCode}\n`);
            if (!ok) break;
        }

        const allPassed = results.length === STEPS.length && results.every((r) => r.ok);

        // Persist outcome on a fresh read (the run may have taken a while).
        const reloaded = getProjects();
        const rt = reloaded.find((p) => p.id === projectId)?.tasks?.find((t) => t.id === taskId);
        if (rt) {
            rt.status = allPassed ? "completed" : "failed";
            // Advance past Verify + Automate to Observe once the guard is green.
            if (allPassed && (rt.currentStage === "VERIFY" || rt.currentStage === "AUTOMATE" || rt.currentStage === "BUILD")) {
                rt.currentStage = "OBSERVE";
            }
            rt.activities.push({
                id: `act-${Date.now()}`,
                taskId,
                stage: rt.currentStage,
                action: "auto_pipeline",
                message: allPassed
                    ? "Auto-pipeline passed all checks — advanced to Observe."
                    : `Auto-pipeline failed at: ${results.find((r) => !r.ok)?.label ?? "unknown step"}`,
                timestamp: new Date().toISOString(),
            });
            rt.updatedAt = new Date().toISOString();
            saveProjects(reloaded);
        }

        fs.appendFileSync(logFilePath, `\n--- Auto-Pipeline ${allPassed ? "PASSED" : "FAILED"} ---\n`);
        return NextResponse.json({ success: true, data: { steps: results, allPassed } });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
