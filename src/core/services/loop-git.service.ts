import { spawn } from "child_process";
import path from "path";

// Git helpers for registered project workspaces. Split out of
// loop-projects.service.ts (300-line rule); that module re-exports everything
// here, so importers can keep using either path.

export async function executeGitCommand(projectPath: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        const proc = spawn("git", args, { cwd: projectPath });
        let out = "";
        proc.stdout.on("data", (d) => { out += d.toString(); });
        proc.stderr.on("data", (d) => { out += d.toString(); });
        proc.on("error", (err) => reject(err));
        proc.on("close", (code) => {
            if (code === 0) resolve(out.trim());
            else reject(new Error(out.trim() || `Git exited with code ${code}`));
        });
    });
}

/**
 * True only when the project directory is the ROOT of its own git repo.
 * A project nested inside another repo (e.g. a git-less folder under the
 * host's .projects/) resolves git commands against the PARENT repo — acting
 * on it would read/commit the wrong repository, so callers must check this
 * before any git write.
 */
export async function isOwnGitRepo(projectPath: string): Promise<boolean> {
    try {
        const top = await executeGitCommand(projectPath, ["rev-parse", "--show-toplevel"]);
        return path.resolve(top) === path.resolve(projectPath);
    } catch {
        return false;
    }
}

export async function getGitInfo(projectPath: string) {
    try {
        if (!(await isOwnGitRepo(projectPath))) {
            return { branch: "unknown", commit: "none", modifiedFiles: [] };
        }
        const branch = await executeGitCommand(projectPath, ["branch", "--show-current"]).catch(() => "unknown");
        const commit = await executeGitCommand(projectPath, ["rev-parse", "--short", "HEAD"]).catch(() => "none");
        const status = await executeGitCommand(projectPath, ["status", "--porcelain"]).catch(() => "");
        const modifiedFiles = status.split("\n").filter(Boolean).map(line => line.trim());
        return { branch, commit, modifiedFiles };
    } catch {
        return { branch: "unknown", commit: "none", modifiedFiles: [] };
    }
}

export interface GitCommit {
    hash: string;
    subject: string;
    relativeDate: string;
    insertions: number;
    deletions: number;
}

// Recent commits (version history) with per-commit insertion/deletion counts, for
// the Studio version timeline. Uses record/field separators so subjects with any
// characters parse safely.
export async function getRecentCommits(projectPath: string, limit = 20): Promise<GitCommit[]> {
    try {
        const out = await executeGitCommand(projectPath, [
            "log",
            `-n${limit}`,
            "--pretty=format:\x1e%h\x1f%s\x1f%cr",
            "--shortstat",
        ]);
        return out
            .split("\x1e")
            .map((rec) => rec.trim())
            .filter(Boolean)
            .map((rec) => {
                const [head, ...rest] = rec.split("\n");
                const [hash, subject, relativeDate] = head.split("\x1f");
                const stat = rest.join(" ");
                const insertions = Number(stat.match(/(\d+) insertion/)?.[1] ?? 0);
                const deletions = Number(stat.match(/(\d+) deletion/)?.[1] ?? 0);
                return { hash, subject: subject ?? "", relativeDate: relativeDate ?? "", insertions, deletions };
            });
    } catch {
        return [];
    }
}

import fs from "fs";

const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "dist", "out", "build"]);
const CODE_FILE_EXT = /\.(tsx?|jsx?|mjs|cjs|css|scss|json|mdx?|html?|ya?ml)$/i;

async function listFilesRecursive(dir: string, baseDir = dir): Promise<string[]> {
    const results: string[] = [];
    try {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const resPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (!SKIP_DIRS.has(entry.name)) {
                    const subFiles = await listFilesRecursive(resPath, baseDir);
                    results.push(...subFiles);
                }
            } else if (CODE_FILE_EXT.test(entry.name)) {
                results.push(path.relative(baseDir, resPath));
            }
        }
    } catch {
        // ignore
    }
    return results;
}

// Returns git-tracked, editable source files (relative paths) for the target-file
// picker. Uses `git ls-files` so it respects .gitignore and stays fast, with recursive fallback.
export async function listProjectFiles(projectPath: string): Promise<string[]> {
    try {
        const out = await executeGitCommand(projectPath, ["ls-files"]);
        const files = out
            .split("\n")
            .map((f) => f.trim())
            .filter((f) => f && CODE_FILE_EXT.test(f));
        
        if (files.length === 0) {
            return await listFilesRecursive(projectPath);
        }
        return files;
    } catch {
        return await listFilesRecursive(projectPath);
    }
}
