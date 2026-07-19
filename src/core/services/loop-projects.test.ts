import { describe, it, expect, vi, beforeEach } from "vitest";
import { getProjects, calculateRiskTier, isHostProject, classifyProtectedPath, applyFileEdits, evaluateEdit } from "./loop-projects.service";

vi.mock("fs", () => {
    const mockData = JSON.stringify([
        {
            id: "test-proj",
            name: "Test Project",
            path: "/fake/path",
            template: "nextjs-app",
            tasks: [],
            createdAt: "",
            updatedAt: "",
        }
    ]);
    const promises = {
        readdir: async () => [],
        readFile: async () => "",
    };
    return {
        default: {
            existsSync: () => true,
            readFileSync: () => mockData,
            writeFileSync: () => {},
            renameSync: () => {},
            copyFileSync: () => {},
            mkdirSync: () => {},
            readdirSync: () => [],
            statSync: () => ({ isDirectory: () => false }),
            promises,
        },
        existsSync: () => true,
        readFileSync: () => mockData,
        writeFileSync: () => {},
        renameSync: () => {},
        copyFileSync: () => {},
        mkdirSync: () => {},
        readdirSync: () => [],
        statSync: () => ({ isDirectory: () => false }),
        promises,
    };
});

describe("Loop Projects Service", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should fetch projects registered in configuration", () => {
        const projects = getProjects();
        expect(projects).toBeDefined();
        expect(projects.length).toBe(1);
        expect(projects[0].name).toBe("Test Project");
    });

    it("should calculate Risk Tier for green leaf components", async () => {
        const result = await calculateRiskTier("/fake/path", "src/components/ui/leaf.tsx");
        expect(result.tier).toBe("GREEN");
        expect(result.count).toBe(0);
    });
});

describe("isHostProject", () => {
    it("is true for the app's own working directory", () => {
        expect(isHostProject(process.cwd())).toBe(true);
    });

    it("is true for an unnormalized path to the same directory", () => {
        expect(isHostProject(process.cwd() + "/./")).toBe(true);
    });

    it("is false for any other project directory", () => {
        expect(isHostProject("/tmp/some-other-project")).toBe(false);
        expect(isHostProject(process.cwd() + "/.projects/child")).toBe(false);
    });
});

describe("classifyProtectedPath", () => {
    it("flags verifier/build configuration as config", () => {
        for (const p of [
            "package.json",
            "tsconfig.json",
            "tsconfig.build.json",
            "vitest.config.ts",
            "vite.config.mts",
            "playwright.config.ts",
            "eslint.config.mjs",
            ".eslintrc.json",
            ".github/workflows/ci.yml",
        ]) {
            expect(classifyProtectedPath(p)).toBe("config");
        }
    });

    it("flags test/spec/snapshot sources as test", () => {
        for (const p of [
            "src/lib/utils.test.ts",
            "src/components/Button.spec.tsx",
            "tests/visual/card.visual.spec.ts",
            "src/__tests__/thing.ts",
            "src/components/__snapshots__/x.snap",
        ]) {
            expect(classifyProtectedPath(p)).toBe("test");
        }
    });

    it("leaves ordinary source unprotected", () => {
        expect(classifyProtectedPath("src/components/ui/button.tsx")).toBeNull();
        expect(classifyProtectedPath("src/core/services/thing.service.ts")).toBeNull();
        // "config" as part of an ordinary filename is not the config file itself
        expect(classifyProtectedPath("src/lib/config-helper.ts")).toBeNull();
    });
});

describe("applyFileEdits verifier guard", () => {
    const block = (path: string, body = "x") => `<file_edit path="${path}">${body}</file_edit>`;

    it("lets the implementer write ordinary source", () => {
        const res = applyFileEdits("/fake/path", block("src/components/ui/button.tsx"));
        expect(res.written).toEqual(["src/components/ui/button.tsx"]);
        expect(res.blocked).toEqual([]);
    });

    it("blocks the implementer from writing test files", () => {
        const res = applyFileEdits("/fake/path", block("src/lib/utils.test.ts"));
        expect(res.written).toEqual([]);
        expect(res.blocked[0].path).toBe("src/lib/utils.test.ts");
    });

    it("lets QA write test files when allowTestFiles is set", () => {
        const res = applyFileEdits("/fake/path", block("src/lib/utils.test.ts"), { allowTestFiles: true });
        expect(res.written).toEqual(["src/lib/utils.test.ts"]);
    });

    it("blocks verifier config even for QA/human-in-the-loop", () => {
        const res = applyFileEdits("/fake/path", block("package.json"), { allowTestFiles: true });
        expect(res.written).toEqual([]);
        expect(res.blocked[0].reason).toContain("configuration");
    });

    it("blocks path traversal out of the project root", () => {
        const res = applyFileEdits("/fake/path", block("../../etc/evil.ts"));
        expect(res.written).toEqual([]);
        expect(res.blocked[0].reason).toContain("outside");
    });

    it("blocks an off-scope edit when allowedPaths is set", () => {
        const res = applyFileEdits("/fake/path", block("src/components/ui/card.test.tsx"), {
            allowTestFiles: true,
            allowedPaths: ["server.js"],
        });
        expect(res.written).toEqual([]);
        expect(res.blocked[0].reason).toContain("scope");
    });

    it("allows an edit whose path is in allowedPaths", () => {
        const res = applyFileEdits("/fake/path", block("server.js"), { allowedPaths: ["server.js"] });
        expect(res.written).toEqual(["server.js"]);
        expect(res.blocked).toEqual([]);
    });

    it("allows QA to write a test sibling of an in-scope target", () => {
        const res = applyFileEdits("/fake/path", block("server.test.js"), {
            allowTestFiles: true,
            allowedPaths: ["server.js"],
        });
        expect(res.written).toEqual(["server.test.js"]);
    });

    it("does not restrict scope when allowedPaths is empty (backward compatible)", () => {
        const res = applyFileEdits("/fake/path", block("src/anything.ts"), { allowedPaths: [] });
        expect(res.written).toEqual(["src/anything.ts"]);
    });
});

// evaluateEdit is the pure policy shared by applyFileEdits and (later) the Agent
// SDK PreToolUse hook — so the two guards can never drift.
describe("evaluateEdit", () => {
    it("allows ordinary source", () => {
        expect(evaluateEdit("src/components/ui/button.tsx")).toEqual({ decision: "allow", kind: null });
    });

    it("denies verifier config for everyone", () => {
        const v = evaluateEdit("package.json", { allowTestFiles: true });
        expect(v.decision).toBe("deny");
        expect(v.kind).toBe("config");
        expect(v.reason).toContain("configuration");
    });

    it("denies test files to the implementer, allows them for QA", () => {
        expect(evaluateEdit("src/lib/utils.test.ts").decision).toBe("deny");
        expect(evaluateEdit("src/lib/utils.test.ts", { allowTestFiles: true }).decision).toBe("allow");
    });

    it("denies off-scope edits and allows in-scope + QA test siblings", () => {
        expect(evaluateEdit("src/other.ts", { allowedPaths: ["server.js"] }).decision).toBe("deny");
        expect(evaluateEdit("server.js", { allowedPaths: ["server.js"] }).decision).toBe("allow");
        expect(evaluateEdit("server.test.js", { allowTestFiles: true, allowedPaths: ["server.js"] }).decision).toBe("allow");
    });
});
