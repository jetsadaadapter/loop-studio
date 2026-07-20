import { describe, it, expect } from "vitest";
import { evaluateToolCall } from "./loop-pretooluse-guard";

const ctx = (over = {}) => ({ targetFiles: ["server.js"], allowTestFiles: false, riskTier: "GREEN" as const, commandAllowlist: ["git"], ...over });

describe("evaluateToolCall", () => {
    it("allows read-only tools + verification", () => {
        for (const t of ["Read", "Grep", "Glob", "mcp__loop__run_verification"]) {
            expect(evaluateToolCall(t, {}, ctx()).decision).toBe("allow");
        }
    });

    it("allows an in-scope edit at low risk", () => {
        expect(evaluateToolCall("mcp__loop__edit_file", { path: "server.js" }, ctx()).decision).toBe("allow");
    });

    it("denies an off-scope or config edit via evaluateEdit", () => {
        expect(evaluateToolCall("mcp__loop__edit_file", { path: "other.ts" }, ctx()).decision).toBe("deny");
        const cfg = evaluateToolCall("mcp__loop__edit_file", { path: "package.json" }, ctx({ targetFiles: [] }));
        expect(cfg.decision).toBe("deny");
        expect(cfg.reason).toContain("configuration");
    });

    it("asks for human review on an in-scope edit at high risk", () => {
        const r = evaluateToolCall("mcp__loop__edit_file", { path: "server.js" }, ctx({ riskTier: "RED" }));
        expect(r.decision).toBe("ask");
        expect(r.reason).toContain("RED");
    });

    it("denies an edit with no path", () => {
        expect(evaluateToolCall("mcp__loop__edit_file", {}, ctx()).decision).toBe("deny");
    });

    it("allows an allowlisted command at low risk, asks at high risk, denies otherwise", () => {
        expect(evaluateToolCall("mcp__loop__run_command", { cmd: "git" }, ctx()).decision).toBe("allow");
        expect(evaluateToolCall("mcp__loop__run_command", { cmd: "git" }, ctx({ riskTier: "ORANGE" })).decision).toBe("ask");
        expect(evaluateToolCall("mcp__loop__run_command", { cmd: "rm" }, ctx()).decision).toBe("deny");
    });

    it("default-denies built-in mutators and unknown tools", () => {
        expect(evaluateToolCall("Write", { path: "x" }, ctx()).decision).toBe("deny");
        expect(evaluateToolCall("Bash", { command: "ls" }, ctx()).decision).toBe("deny");
        expect(evaluateToolCall("something_else", {}, ctx()).decision).toBe("deny");
    });
});
