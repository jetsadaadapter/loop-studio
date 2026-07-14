import { NextResponse } from "next/server";
import { getProjects, runProjectCommand, isHostProject, extractPreviewPort } from "@/core/services/loop-projects.service";
import fs from "fs";
import path from "path";

type RunType = "build" | "lint" | "test" | "e2e" | "dev";

const COMMAND_MAP: Record<RunType, { cmd: string; args: string[] }> = {
    build: { cmd: "npm", args: ["run", "build"] },
    lint: { cmd: "npm", args: ["run", "lint"] },
    test: { cmd: "npx", args: ["vitest", "run"] },
    e2e: { cmd: "npx", args: ["playwright", "test"] },
    dev: { cmd: "npm", args: ["run", "dev"] },
};

export async function POST(
    req: Request,
    context: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await context.params;
        const body = await req.json();
        const { type } = body as { type: RunType };

        const mapping = COMMAND_MAP[type];
        if (!mapping) {
            return NextResponse.json({ success: false, error: `Unknown run type: ${type}` }, { status: 400 });
        }

        const projects = getProjects();
        const project = projects.find((p) => p.id === projectId);
        if (!project) {
            return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
        }

        // Host-app guard: `build` would overwrite the live .next output and
        // `dev` would fight over the port this server is already serving on.
        if ((type === "build" || type === "dev") && isHostProject(project.path)) {
            return NextResponse.json(
                { success: false, error: `"${type}" is disabled for the host app — it conflicts with the running Loop Studio server.` },
                { status: 400 },
            );
        }

        const { cmd, args } = mapping;
        const processKey = `run-${projectId}`;

        // Setup log path
        const logFilePath = path.join(process.cwd(), ".antigravity", `log-run-${projectId}.txt`);
        fs.mkdirSync(path.dirname(logFilePath), { recursive: true });

        // Initialize log file with a header line
        fs.writeFileSync(
            logFilePath,
            `\n--- Live Run: ${type} ---\nDirectory: ${project.path}\nCommand: ${cmd} ${args.join(" ")}\n\n`,
            "utf8"
        );

        // Pin `dev` to the port this project's own previewUrl claims (e.g.
        // "http://localhost:3001" → PORT=3001) — `next dev`/most dev servers
        // fall back to PORT when no explicit --port/-p flag is set in the
        // project's own script, so this is what actually keeps two projects'
        // dev servers from both binding the same default port and colliding.
        const extraEnv = type === "dev" ? (() => {
            const port = extractPreviewPort(project.previewUrl);
            return port ? { PORT: String(port) } : undefined;
        })() : undefined;

        // Run async (fire-and-forget). Streams live output into the log file.
        void runProjectCommand(processKey, project.path, cmd, args, (chunk) => {
            fs.appendFileSync(logFilePath, chunk);
        }, extraEnv).then((code) => {
            fs.appendFileSync(logFilePath, `\n--- Run "${type}" finished with exit code ${code} ---\n`);
        });

        return NextResponse.json({ success: true, message: `Started command: ${cmd} ${args.join(" ")}` });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
