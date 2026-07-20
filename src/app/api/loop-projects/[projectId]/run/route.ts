import { NextResponse } from "next/server";
import { getProjects, runProjectCommand, isHostProject, extractPreviewPort, runLogPath } from "@/core/services/loop-projects.service";
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

// Dev servers whose CLI accepts `--port`. Vite in particular ignores the PORT
// env var entirely, so pinning via env alone leaves it on the default 5173 and
// the preview pane (pointed at the project's previewUrl port) reads as offline.
const PORT_FLAG_TEMPLATES = new Set(["vite-react", "nextjs-app", "nextjs-pages"]);

/**
 * Launch options for a `dev` run pinned to the project's previewUrl port.
 * Port-flag templates (Vite/Next) also get `-- --port <n>` on the CLI — Vite
 * honors only that, Next honors both; nodejs/generic fall back to $PORT alone.
 * Returns the base args unchanged when the previewUrl has no explicit port.
 */
export function devLaunchArgs(
    template: string,
    baseArgs: string[],
    previewUrl?: string,
): { args: string[]; extraEnv?: Record<string, string> } {
    const port = extractPreviewPort(previewUrl);
    if (!port) return { args: baseArgs };
    const args = PORT_FLAG_TEMPLATES.has(template)
        ? [...baseArgs, "--", "--port", String(port)]
        : baseArgs;
    return { args, extraEnv: { PORT: String(port) } };
}

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

        const cmd = mapping.cmd;
        // For `dev`, pin the project's previewUrl port (via --port for Vite/Next,
        // $PORT for the rest) so two projects' dev servers never collide and the
        // preview pane can actually reach the server.
        const { args, extraEnv } = type === "dev"
            ? devLaunchArgs(project.template, mapping.args, project.previewUrl)
            : { args: mapping.args, extraEnv: undefined as Record<string, string> | undefined };
        const processKey = `run-${projectId}`;

        // Setup log path
        const logFilePath = runLogPath(projectId);
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
        }, extraEnv).then((code) => {
            fs.appendFileSync(logFilePath, `\n--- Run "${type}" finished with exit code ${code} ---\n`);
        });

        return NextResponse.json({ success: true, message: `Started command: ${cmd} ${args.join(" ")}` });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
