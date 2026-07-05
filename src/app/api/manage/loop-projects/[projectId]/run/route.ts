import { NextResponse } from "next/server";
import { getProjects, runProjectCommand } from "@/core/services/loop-projects.service";
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

        // Run async (fire-and-forget). Streams live output into the log file.
        void runProjectCommand(processKey, project.path, cmd, args, (chunk) => {
            fs.appendFileSync(logFilePath, chunk);
        }).then((code) => {
            fs.appendFileSync(logFilePath, `\n--- Run "${type}" finished with exit code ${code} ---\n`);
        });

        return NextResponse.json({ success: true, message: `Started command: ${cmd} ${args.join(" ")}` });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
