import { NextResponse } from "next/server";
import { getProjects, saveProjects, runProjectCommand, isHostProject, kanbanColumnForStatus } from "@/core/services/loop-projects.service";
import fs from "fs";
import path from "path";

export async function POST(
    req: Request,
    context: { params: Promise<{ projectId: string; taskId: string }> }
) {
    try {
        const { projectId, taskId } = await context.params;
        const body = await req.json();
        const { type } = body; // "vitest" | "playwright" | "lint" | "build" | "deploy"

        const projects = getProjects();
        const pIdx = projects.findIndex((p) => p.id === projectId);
        if (pIdx === -1) {
            return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
        }

        const project = projects[pIdx];
        const tIdx = project.tasks?.findIndex((t) => t.id === taskId) ?? -1;
        if (tIdx === -1) {
            return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
        }

        // Host-app guard: building the repo this server runs from would
        // overwrite the live .next output mid-serve.
        if (type === "build" && isHostProject(project.path)) {
            return NextResponse.json(
                { success: false, error: "Build is disabled for the host app — it would overwrite the running server's build output. Run `npm run build` from a terminal when the server is stopped." },
                { status: 400 },
            );
        }

        const task = project.tasks[tIdx];
        task.status = "running";
        task.kanbanColumn = kanbanColumnForStatus("running");
        task.updatedAt = new Date().toISOString();
        saveProjects(projects);

        // Setup log path
        const logFilePath = path.join(process.cwd(), ".antigravity", `log-${taskId}.txt`);
        fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
        
        let cmd = "";
        let args: string[] = [];

        if (type === "vitest") {
            cmd = "npx";
            args = ["vitest", "run"];
            // Find target test files if any
            const targetFile = task.targetFiles[0];
            if (targetFile) {
                const baseName = path.basename(targetFile, path.extname(targetFile));
                const dirName = path.dirname(targetFile);
                
                // check potential test files
                const possibleTests = [
                    path.join(dirName, `${baseName}.test.tsx`),
                    path.join(dirName, `${baseName}.test.ts`),
                    path.join(dirName, `${baseName}.spec.tsx`),
                    path.join(dirName, `${baseName}.spec.ts`),
                    path.join(dirName, "__snapshots__", `${baseName}.test.tsx.snap`),
                ];
                
                const foundTest = possibleTests.find(t => fs.existsSync(path.join(project.path, t)));
                if (foundTest) {
                    args.push(foundTest);
                }
            }
        } else if (type === "playwright") {
            cmd = "npx";
            args = ["playwright", "test"];
        } else if (type === "lint") {
            cmd = "npm";
            args = ["run", "lint"];
        } else if (type === "build") {
            cmd = "npm";
            args = ["run", "build"];
        }

        if (!cmd) {
            return NextResponse.json({ success: false, error: `Unknown action type: ${type}` }, { status: 400 });
        }

        // Initialize log file
        fs.writeFileSync(logFilePath, `\n--- Executing Action: ${type} ---\nCommand: ${cmd} ${args.join(" ")}\n\n`, "utf8");

        // Run async
        void runProjectCommand(taskId, project.path, cmd, args, (chunk) => {
            fs.appendFileSync(logFilePath, chunk);
        }).then((code) => {
            const reloadedProjects = getProjects();
            const rp = reloadedProjects.find((p) => p.id === projectId);
            const rt = rp?.tasks?.find((t) => t.id === taskId);
            
            if (rt) {
                rt.status = code === 0 ? "completed" : "failed";
                rt.kanbanColumn = kanbanColumnForStatus(rt.status);
                rt.updatedAt = new Date().toISOString();
                
                rt.activities.push({
                    id: `act-${Date.now()}`,
                    taskId: taskId,
                    stage: rt.currentStage,
                    action: "command_execution",
                    message: `Action ${type} finished with exit code ${code}`,
                    timestamp: new Date().toISOString()
                });
                
                saveProjects(reloadedProjects);
            }
            
            fs.appendFileSync(logFilePath, `\n--- Action Finished with exit code ${code} ---\n`);
        });

        return NextResponse.json({ success: true, message: `Started command: ${cmd} ${args.join(" ")}` });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
