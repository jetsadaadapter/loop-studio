import { NextResponse } from "next/server";
import { getProjects, saveProjects, runProjectCommand, isHostProject, allocatePreviewPort } from "@/core/services/loop-projects.service";
import type { LoopProject, ProjectTemplate } from "@/core/interfaces/loop-projects.interface";
import { RegisterProjectSchema, BootstrapProjectSchema } from "@/core/validators/loop-projects.validator";
import fs from "fs";
import path from "path";

export async function GET() {
    try {
        const projects = getProjects()
            .map((p) => ({ ...p, isHost: isHostProject(p.path) }))
            // Host app pinned first; stable sort keeps registration order after it.
            .sort((a, b) => Number(b.isHost) - Number(a.isHost));
        return NextResponse.json({ success: true, data: projects });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, name, path: projectPath, template, previewUrl } = body;

        const projects = getProjects();

        if (action === "register") {
            const parsed = RegisterProjectSchema.safeParse({ name, path: projectPath, template, previewUrl });
            if (!parsed.success) {
                return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
            }

            // Register an existing project — schema covers format; verify it exists on disk.
            if (!fs.existsSync(parsed.data.path)) {
                return NextResponse.json({ success: false, error: "Invalid project path or path does not exist" }, { status: 400 });
            }

            const existingIdx = projects.findIndex((p) => p.path === parsed.data.path);
            if (existingIdx !== -1) {
                return NextResponse.json({ success: false, error: "Project path already registered" }, { status: 400 });
            }

            const newProj: LoopProject = {
                id: `proj-${Date.now()}`,
                name: parsed.data.name,
                path: parsed.data.path,
                template: (parsed.data.template as ProjectTemplate) || "generic",
                tasks: [],
                ...(parsed.data.previewUrl ? { previewUrl: parsed.data.previewUrl } : {}),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            projects.push(newProj);
            saveProjects(projects);
            return NextResponse.json({ success: true, data: newProj });
        } else if (action === "bootstrap") {
            // Bootstrap a new project
            const parsed = BootstrapProjectSchema.safeParse({ name, path: projectPath, template });
            if (!parsed.success) {
                return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
            }

            // Blank path → create under the app's .projects/ workspace folder,
            // named after the project (kebab-case). Keeps bootstrapped projects
            // in one predictable, gitignored place.
            const slug = String(name || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "new-project";
            const defaultRoot = path.join(process.cwd(), ".projects");
            const targetPath: string = parsed.data.path?.trim() ? parsed.data.path : path.join(defaultRoot, slug);

            const parentDir = path.dirname(targetPath);
            const folderName = path.basename(targetPath);

            if (!fs.existsSync(parentDir)) {
                if (parentDir === defaultRoot) {
                    fs.mkdirSync(defaultRoot, { recursive: true });
                } else {
                    return NextResponse.json({ success: false, error: "Parent directory does not exist" }, { status: 400 });
                }
            }

            if (fs.existsSync(targetPath)) {
                return NextResponse.json({ success: false, error: "Target folder already exists" }, { status: 400 });
            }

            const tempProjectId = `bootstrap-${Date.now()}`;

            let bootstrapCmd = "";
            let args: string[] = [];

            if (template === "nextjs-app") {
                bootstrapCmd = "npx";
                args = ["-y", "create-next-app@latest", folderName, "--typescript", "--tailwind", "--eslint", "--app", "--src-dir", "--import-alias", "@/*", "--use-npm"];
            } else if (template === "vite-react") {
                bootstrapCmd = "npm";
                args = ["create", "vite@latest", folderName, "--", "--template", "react-ts"];
            } else {
                bootstrapCmd = "mkdir";
                args = [folderName];
            }

            // Run asynchronously in background
            let logBuffer = `[Bootstrap] Starting project generation in ${parentDir}...\n`;
            logBuffer += `[Bootstrap] Command: ${bootstrapCmd} ${args.join(" ")}\n\n`;

            const logFilePath = path.join(process.cwd(), ".antigravity", `log-${tempProjectId}.txt`);
            fs.writeFileSync(logFilePath, logBuffer, "utf8");

            // Execute command in parentDir so create CLI can make folderName
            void runProjectCommand(
                tempProjectId,
                parentDir,
                bootstrapCmd,
                args,
                (chunk) => {
                    fs.appendFileSync(logFilePath, chunk);
                }
            ).then((code) => {
                if (code === 0) {
                    fs.appendFileSync(logFilePath, `\n[Bootstrap] SUCCESS: Project created at ${targetPath}!\n`);

                    // Post-Vite React installation steps if template is vite
                    if (template === "vite-react") {
                        fs.appendFileSync(logFilePath, `[Bootstrap] Installing dependencies in ${targetPath}...\n`);
                        void runProjectCommand(
                            `${tempProjectId}-deps`,
                            targetPath,
                            "npm",
                            ["install"],
                            (chunk) => {
                                fs.appendFileSync(logFilePath, chunk);
                            }
                        ).then((depsCode) => {
                            if (depsCode === 0) {
                                fs.appendFileSync(logFilePath, `\n[Bootstrap] SUCCESS: Dependencies installed!\n`);
                                registerBootstrappedProject(name || folderName, targetPath, template);
                            } else {
                                fs.appendFileSync(logFilePath, `\n[Bootstrap] WARNING: Dependency installation exited with code ${depsCode}. Please run npm install manually.\n`);
                                registerBootstrappedProject(name || folderName, targetPath, template);
                            }
                            fs.appendFileSync(logFilePath, `\n[Bootstrap] __DONE__\n`);
                        });
                    } else {
                        registerBootstrappedProject(name || folderName, targetPath, template);
                        fs.appendFileSync(logFilePath, `\n[Bootstrap] __DONE__\n`);
                    }
                } else {
                    fs.appendFileSync(logFilePath, `\n[Bootstrap] FAILED: Command exited with code ${code}\n`);
                    fs.appendFileSync(logFilePath, `\n[Bootstrap] __DONE__\n`);
                }
            });

            return NextResponse.json({
                success: true,
                message: "Bootstrap started in background",
                projectId: tempProjectId
            });
        }

        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

function registerBootstrappedProject(name: string, projectPath: string, template: ProjectTemplate) {
    const projects = getProjects();
    // A generic scaffold (mkdir-only, no dev server) has no port to preview.
    // Everything else gets its own free port up front, distinct from every
    // other registered project and the host app — so its dev server has a
    // home to bind to instead of colliding with whatever else is running.
    const previewUrl = template === "generic" ? undefined : `http://localhost:${allocatePreviewPort(projects)}`;
    const newProj: LoopProject = {
        id: `proj-${Date.now()}`,
        name: name,
        path: projectPath,
        template: template || "generic",
        tasks: [],
        ...(previewUrl ? { previewUrl } : {}),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    projects.push(newProj);
    saveProjects(projects);
}
