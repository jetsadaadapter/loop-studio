import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the SDK so tests don't touch the native binary — tool()/createSdkMcpServer
// just echo their inputs so we can inspect the registered tools + invoke handlers.
vi.mock("@anthropic-ai/claude-agent-sdk", () => ({
    tool: (name: string, description: string, schema: unknown, handler: unknown) => ({ name, description, schema, handler }),
    createSdkMcpServer: (opts: unknown) => opts,
}));

const { editFileMock, runVerificationMock } = vi.hoisted(() => ({
    editFileMock: vi.fn(),
    runVerificationMock: vi.fn(),
}));
vi.mock("./loop-agent-tools", () => ({ editFile: editFileMock, runVerification: runVerificationMock }));

import { createLoopToolServer, createPreToolUseHook } from "./loop-sdk-bindings";

const ctx = { taskId: "t1", cwd: "/wt", targetFiles: ["server.js"], allowTestFiles: false };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tools = () => (createLoopToolServer(ctx) as any).tools as Array<{ name: string; handler: (a: unknown) => Promise<{ content: { text: string }[]; isError: boolean }> }>;

beforeEach(() => {
    editFileMock.mockReset();
    runVerificationMock.mockReset();
    editFileMock.mockResolvedValue({ ok: true, path: "server.js" });
    runVerificationMock.mockResolvedValue({ passed: true, output: "ok" });
});

describe("createLoopToolServer", () => {
    it("registers edit_file + run_verification", () => {
        expect(tools().map((t) => t.name)).toEqual(["edit_file", "run_verification"]);
    });

    it("edit_file handler delegates to editFile and maps the result", async () => {
        const editTool = tools()[0];
        const res = await editTool.handler({ path: "server.js", content: "x" });
        expect(editFileMock).toHaveBeenCalledWith(ctx, { path: "server.js", content: "x" });
        expect(res.isError).toBe(false);
        expect(res.content[0].text).toContain("wrote server.js");
    });

    it("edit_file handler surfaces a refusal as isError", async () => {
        editFileMock.mockResolvedValueOnce({ ok: false, reason: "outside task scope" } as never);
        const res = await tools()[0].handler({ path: "pkg", content: "x" });
        expect(res.isError).toBe(true);
        expect(res.content[0].text).toContain("refused: outside task scope");
    });

    it("run_verification handler delegates and maps pass/fail", async () => {
        runVerificationMock.mockResolvedValueOnce({ passed: false, output: "1 failed" } as never);
        const res = await tools()[1].handler({ kind: "vitest" });
        expect(runVerificationMock).toHaveBeenCalledWith(ctx, { kind: "vitest", target: undefined });
        expect(res.isError).toBe(true);
        expect(res.content[0].text).toContain("FAIL");
    });
});

describe("createPreToolUseHook", () => {
    const call = (hook: ReturnType<typeof createPreToolUseHook>, tool_name: string, tool_input: unknown = {}) =>
        hook({ tool_name, tool_input } as never).then((r) => r.hookSpecificOutput.permissionDecision);

    it("allows read-only tools and in-scope edits", async () => {
        const hook = createPreToolUseHook({ targetFiles: ["server.js"], riskTier: "GREEN" });
        expect(await call(hook, "Read")).toBe("allow");
        expect(await call(hook, "mcp__loop__edit_file", { path: "server.js" })).toBe("allow");
    });

    it("denies off-scope edits and unknown tools", async () => {
        const hook = createPreToolUseHook({ targetFiles: ["server.js"], riskTier: "GREEN" });
        expect(await call(hook, "mcp__loop__edit_file", { path: "other.ts" })).toBe("deny");
        expect(await call(hook, "Write", { path: "x" })).toBe("deny");
    });

    it("asks on high-risk edits, but fails closed (deny) when headless", async () => {
        const ask = createPreToolUseHook({ targetFiles: ["server.js"], riskTier: "RED" });
        expect(await call(ask, "mcp__loop__edit_file", { path: "server.js" })).toBe("ask");
        const headless = createPreToolUseHook({ targetFiles: ["server.js"], riskTier: "RED" }, { headless: true });
        expect(await call(headless, "mcp__loop__edit_file", { path: "server.js" })).toBe("deny");
    });
});
