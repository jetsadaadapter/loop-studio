import fs from "fs";
import path from "path";

// File-edit verifier guards: the single place that decides whether an LLM/bridge
// <file_edit> block is allowed to touch disk. Split out of loop-projects.service
// to keep that file under the 300-line cap; re-exported from there for callers.

// Verifier/build configuration — these files ARE the gate (they decide what
// "passing" means). No AI role may rewrite them: an agent that can edit the
// test runner config or package scripts can make the check trivially pass.
const CONFIG_FILE_PATTERNS: RegExp[] = [
    /^package\.json$/,
    /^tsconfig(\..+)?\.json$/,
    /^(vitest|vite|playwright|jest|eslint)\.config\.[cm]?[jt]s$/,
    /^\.eslintrc(\..+)?$/,
];

/**
 * Classify a repo-relative path as part of the verifier surface:
 * - "config": the gate's configuration (test/build/CI). Off-limits to every AI role.
 * - "test":   test/spec/snapshot sources. Off-limits to the implementer, written only by QA.
 * - null:     ordinary source the implementer may edit freely.
 */
export function classifyProtectedPath(relativePath: string): "config" | "test" | null {
    const normalized = relativePath.replace(/\\/g, "/");
    const segments = normalized.split("/").filter(Boolean);
    const base = segments[segments.length - 1] ?? "";

    if (CONFIG_FILE_PATTERNS.some((re) => re.test(base))) return "config";
    if (normalized.includes(".github/workflows/")) return "config";

    if (/\.(test|spec)\.[cm]?[jt]sx?$/.test(base)) return "test";
    if (base.endsWith(".snap")) return "test";
    if (segments.some((s) => s === "__tests__" || s === "__snapshots__")) return "test";

    return null;
}

export interface ApplyFileEditsOptions {
    /**
     * Allow writing test/spec/snapshot files. Set by the QA role (whose job is
     * to author tests) and by human-in-the-loop paths (interactive chat, bridge).
     * Verifier *configuration* stays blocked regardless of this flag.
     */
    allowTestFiles?: boolean;
    /**
     * Restrict edits to the task's declared scope (its `targetFiles`). When set
     * and non-empty, an edit is refused unless its path is one of these files —
     * or (when `allowTestFiles` is set) a test/spec/snapshot file covering one of
     * them, so QA can still write `foo.test.ts` for an in-scope `foo.ts`.
     * An empty/undefined list means "no scope declared" → no restriction, so
     * tasks that never set targetFiles behave exactly as before.
     */
    allowedPaths?: string[];
}

export interface FileEditResult {
    /** Repo-relative paths actually written. */
    written: string[];
    /** Edits refused, with the reason (traversal or protected verifier file). */
    blocked: { path: string; reason: string }[];
}

// Normalize a project-relative path for scope comparison (posix, no leading "./").
function normalizeRel(p: string): string {
    return path.posix.normalize(p.replace(/\\/g, "/")).replace(/^\.\//, "");
}

// Reduce a path to "dir/basename" without its extension or test/spec/snapshot
// infix, so "a/b.test.tsx", "a/b.test.tsx.snap" and "a/b.tsx" all share the stem
// "a/b" — lets a test file be matched to the target file it covers.
function pathStem(p: string): string {
    const norm = normalizeRel(p);
    const dir = path.posix.dirname(norm);
    const base = path.posix
        .basename(norm)
        .replace(/\.snap$/, "")
        .replace(/\.(test|spec)\.[^.]+$/, "")
        .replace(/\.[^.]+$/, "");
    return dir === "." ? base : `${dir}/${base}`;
}

// File Edits Parser for Claude Chat Responses.
// Defaults to the strict implementer policy (no test files, no config) so an
// unaudited caller can never silently edit the gate.
export function applyFileEdits(
    projectPath: string,
    content: string,
    options: ApplyFileEditsOptions = {},
): FileEditResult {
    const fileRegex = /<file_edit\s+path=["']([^"']+)["']\s*>([\s\S]*?)<\/file_edit>/g;
    let match;
    const written: string[] = [];
    const blocked: { path: string; reason: string }[] = [];
    const projectRoot = path.resolve(projectPath);

    while ((match = fileRegex.exec(content)) !== null) {
        const relativePath = match[1];
        const fileContent = match[2];
        const fullPath = path.resolve(projectRoot, relativePath);

        // The path comes from LLM/bridge output — never let it escape the
        // registered project directory (e.g. via "../" or an absolute path).
        if (!fullPath.startsWith(projectRoot + path.sep)) {
            blocked.push({ path: relativePath, reason: "resolves outside the project root" });
            console.error(`Refused file edit outside project root: ${relativePath}`);
            continue;
        }

        const kind = classifyProtectedPath(relativePath);
        if (kind === "config") {
            blocked.push({ path: relativePath, reason: "verifier/build configuration is protected from AI edits" });
            continue;
        }
        if (kind === "test" && !options.allowTestFiles) {
            blocked.push({ path: relativePath, reason: "test files are protected from the implementer (only QA may write them)" });
            continue;
        }

        // Scope guard: keep an agent inside the task's declared targetFiles so a
        // wandering edit (e.g. a QA test for an unrelated component) can't land.
        // An in-scope target's test/spec/snapshot sibling is allowed for QA.
        if (options.allowedPaths && options.allowedPaths.length > 0) {
            const rel = normalizeRel(relativePath);
            const allowed = options.allowedPaths.map(normalizeRel);
            const inScope =
                allowed.includes(rel) ||
                (kind === "test" &&
                    !!options.allowTestFiles &&
                    allowed.some((a) => pathStem(a) === pathStem(rel)));
            if (!inScope) {
                blocked.push({ path: relativePath, reason: `outside task scope (targetFiles: ${allowed.join(", ")})` });
                continue;
            }
        }

        try {
            fs.mkdirSync(path.dirname(fullPath), { recursive: true });
            fs.writeFileSync(fullPath, fileContent, "utf8");
            written.push(relativePath);
        } catch (e) {
            blocked.push({ path: relativePath, reason: e instanceof Error ? e.message : String(e) });
            console.error(`Failed to write file ${relativePath}:`, e);
        }
    }

    return { written, blocked };
}
