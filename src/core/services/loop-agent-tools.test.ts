import { describe, it, expect, vi, beforeEach } from "vitest";

let writeResult: { written?: string; blocked?: { path: string; reason: string } } = {};
let exitCode = 0;
const runCalls: { cmd: string; args: string[] }[] = [];
const checkpointMock = vi.fn(async () => null);

vi.mock("@/core/services/loop-projects.service", () => ({
    writeGuardedFile: () => writeResult,
    runProjectCommand: async (_t: string, _cwd: string, cmd: string, args: string[], onData: (s: string) => void) => {
        onData("some output");
        runCalls.push({ cmd, args });
        return exitCode;
    },
}));
vi.mock("@/core/services/loop-worktree.service", () => ({ checkpoint: checkpointMock }));

const ctx = { taskId: "t1", cwd: "/wt", targetFiles: ["server.js"], allowTestFiles: false };
async function svc() {
    return await import("./loop-agent-tools");
}

beforeEach(() => {
    writeResult = {};
    exitCode = 0;
    runCalls.length = 0;
    checkpointMock.mockClear();
});

describe("editFile", () => {
    it("writes an allowed edit and checkpoints it", async () => {
        writeResult = { written: "server.js" };
        const { editFile } = await svc();
        const r = await editFile(ctx, { path: "server.js", content: "x" });
        expect(r).toEqual({ ok: true, path: "server.js" });
        expect(checkpointMock).toHaveBeenCalledTimes(1);
    });

    it("returns the guard's reason and does not checkpoint when blocked", async () => {
        writeResult = { blocked: { path: "pkg", reason: "outside task scope (targetFiles: server.js)" } };
        const { editFile } = await svc();
        const r = await editFile(ctx, { path: "package.json", content: "x" });
        expect(r.ok).toBe(false);
        expect(r.reason).toContain("scope");
        expect(checkpointMock).not.toHaveBeenCalled();
    });
});

describe("runVerification", () => {
    it("runs vitest and reports pass on exit 0", async () => {
        exitCode = 0;
        const { runVerification } = await svc();
        const r = await runVerification(ctx, { kind: "vitest" });
        expect(r.passed).toBe(true);
        expect(runCalls[0]).toEqual({ cmd: "npx", args: ["vitest", "run"] });
    });

    it("passes a vitest target through", async () => {
        const { runVerification } = await svc();
        await runVerification(ctx, { kind: "vitest", target: "a.test.ts" });
        expect(runCalls[0].args).toEqual(["vitest", "run", "a.test.ts"]);
    });

    it("runs tsc and reports fail on non-zero exit", async () => {
        exitCode = 1;
        const { runVerification } = await svc();
        const r = await runVerification(ctx, { kind: "tsc" });
        expect(r.passed).toBe(false);
        expect(runCalls[0]).toEqual({ cmd: "npx", args: ["tsc", "--noEmit"] });
    });

    it("runs build via npm", async () => {
        const { runVerification } = await svc();
        await runVerification(ctx, { kind: "build" });
        expect(runCalls[0]).toEqual({ cmd: "npm", args: ["run", "build"] });
    });

    it("rejects an unknown verification kind", async () => {
        const { runVerification } = await svc();
        const r = await runVerification(ctx, { kind: "deploy" as unknown as "vitest" });
        expect(r.passed).toBe(false);
        expect(r.output).toContain("Unknown");
        expect(runCalls).toHaveLength(0);
    });
});
