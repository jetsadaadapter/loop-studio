import { describe, it, expect } from "vitest";
import path from "path";
import { taskLogPath, runLogPath } from "./loop-logs.service";

// These builders are the single traversal choke point for the per-task/per-run
// log files: the SSE read route and every writer go through them, so a crafted
// id must never resolve to a path outside .antigravity.

describe("taskLogPath", () => {
    it("builds the log path for a well-formed task id", () => {
        const p = taskLogPath("task-1720000000000-1");
        expect(p).toBe(path.join(process.cwd(), ".antigravity", "log-task-1720000000000-1.txt"));
    });

    it("keeps the resolved path inside .antigravity", () => {
        const root = path.join(process.cwd(), ".antigravity");
        expect(taskLogPath("t1").startsWith(root + path.sep)).toBe(true);
    });

    it.each([
        "../../etc/passwd",
        "../../../tmp/evil",
        "foo/bar",
        "a\\b",
        "with space",
        "dot.dot",
        "",
    ])("rejects a traversal / malformed id: %j", (bad) => {
        expect(() => taskLogPath(bad)).toThrow(/Invalid store id/);
    });
});

describe("runLogPath", () => {
    it("builds the run-log path for a well-formed project id", () => {
        const p = runLogPath("proj-1720000000000");
        expect(p).toBe(path.join(process.cwd(), ".antigravity", "log-run-proj-1720000000000.txt"));
    });

    it("rejects a traversal id", () => {
        expect(() => runLogPath("../../../etc/hosts")).toThrow(/Invalid store id/);
    });
});
