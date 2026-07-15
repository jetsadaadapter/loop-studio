import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EventEmitter } from "events";
import type { BridgeRequest } from "./loop-bridge.service";

// The worker reads a task's bridge request, resolves its project + agent (project
// override → env default), spawns the agent CLI read-only, and writes the reply
// back. Mock all I/O so we test control flow without disk or a real process.

let bridgeFixture: BridgeRequest | null = null;
const writeResponses: Array<{ taskId: string; id: string; result: { status: string } }> = [];
vi.mock("./loop-bridge.service", () => ({
    readBridgeRequest: () => bridgeFixture,
    writeBridgeResponse: (taskId: string, id: string, result: { status: string }) => {
        writeResponses.push({ taskId, id, result });
    },
}));

vi.mock("./loop-logs.service", () => ({ publishTaskLog: vi.fn() }));

let projectsFixture: Array<{ id: string; path: string; autoAgent?: string }> = [];
vi.mock("./loop-projects.service", () => ({ getProjects: () => projectsFixture }));

// Direct-spawn path is exercised for autoFulfillBridge (tmux off); the tmux
// service is stubbed with fixtures the recovery tests drive.
let tmuxRunDirs: string[] = [];
let tmuxMetaByDir: Record<string, { taskId: string; projectId: string; bridgeId: string; agent: string } | null> = {};
let tmuxOutcomeByTask: Record<string, { hasExit: boolean; exitCode: number; stdout: string }> = {};
let tmuxSessionAliveFlag = false;
const cleanupTmuxMock = vi.fn();
const pollTmuxMock = vi.fn(async () => ({ exitCode: 0, stdout: "", timedOut: false }));
vi.mock("./loop-tmux.service", () => ({
    tmuxAvailable: () => false,
    runAgentInTmux: vi.fn(),
    listTmuxRunDirs: () => tmuxRunDirs,
    readTmuxMeta: (dir: string) => tmuxMetaByDir[dir] ?? null,
    readTmuxOutcome: (taskId: string) => tmuxOutcomeByTask[taskId] ?? { hasExit: false, exitCode: 1, stdout: "" },
    tmuxSessionAlive: () => tmuxSessionAliveFlag,
    cleanupTmuxRun: (t: string) => cleanupTmuxMock(t),
    pollTmuxRun: (...a: unknown[]) => pollTmuxMock(...(a as [])),
}));

// Fake child process we can drive. spawnMock via vi.hoisted so it exists when the
// (hoisted) vi.mock factory runs; child_process mock needs a `default` export.
type FakeProc = EventEmitter & { stdout: EventEmitter; stderr: EventEmitter; kill: () => void };
const { spawnMock } = vi.hoisted(() => ({ spawnMock: vi.fn() }));
vi.mock("child_process", () => ({ spawn: spawnMock, default: { spawn: spawnMock } }));

function makeFakeProc(): FakeProc {
    const proc = new EventEmitter() as FakeProc;
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    proc.kill = vi.fn();
    return proc;
}
const lastProc = (): FakeProc => {
    expect(spawnMock).toHaveBeenCalled();
    return spawnMock.mock.results.at(-1)!.value as FakeProc;
};
const spawnedBin = (): string => (spawnMock.mock.calls.at(-1) as unknown as [string])[0];

import { autoFulfillBridge, bridgeAutoAgent, recoverTmuxBridges } from "./loop-bridge-worker.service";

const pendingBridge = (): BridgeRequest => ({
    status: "pending",
    id: "bridge-1",
    taskId: "t1",
    projectId: "p1",
    requestType: "chat",
    prompt: "add a health check",
    history: [],
    instructions: "…",
    updatedAt: "",
});

describe("autoFulfillBridge", () => {
    beforeEach(() => {
        bridgeFixture = pendingBridge();
        projectsFixture = [{ id: "p1", path: "/fake/project" }];
        writeResponses.length = 0;
        spawnMock.mockReset();
        spawnMock.mockImplementation(() => makeFakeProc());
        process.env.LOOP_BRIDGE_AUTO = "claude";
    });
    afterEach(() => { delete process.env.LOOP_BRIDGE_AUTO; });

    it("is a no-op when no agent is selected (env unset, no project override)", async () => {
        delete process.env.LOOP_BRIDGE_AUTO;
        await autoFulfillBridge("t1", "bridge-1");
        expect(spawnMock).not.toHaveBeenCalled();
        expect(writeResponses).toHaveLength(0);
    });

    it("does nothing when the bridge id no longer matches", async () => {
        await autoFulfillBridge("t1", "some-other-id");
        expect(spawnMock).not.toHaveBeenCalled();
        expect(writeResponses).toHaveLength(0);
    });

    it("rejects a non-registered agent without spawning", async () => {
        process.env.LOOP_BRIDGE_AUTO = "rm-rf";
        await autoFulfillBridge("t1", "bridge-1");
        expect(spawnMock).not.toHaveBeenCalled();
        expect(writeResponses[0].result).toMatchObject({ status: "error" });
    });

    it("spawns claude read-only and writes the parsed reply on success", async () => {
        const p = autoFulfillBridge("t1", "bridge-1");
        expect(spawnedBin()).toBe("claude");
        const args = (spawnMock.mock.calls[0] as unknown as [string, string[]])[1];
        expect(args).toEqual(expect.arrayContaining(["-p", "--permission-mode", "dontAsk", "--allowedTools", "Read,Grep,Glob"]));
        expect(args).not.toContain("--bare");

        const events = [
            { type: "system", subtype: "init" },
            { type: "result", subtype: "success", is_error: false, result: 'ok <file_edit path="a.ts">x</file_edit>' },
        ];
        lastProc().stdout.emit("data", Buffer.from(JSON.stringify(events)));
        lastProc().emit("close", 0);
        await p;

        expect(writeResponses).toEqual([
            { taskId: "t1", id: "bridge-1", result: { status: "done", response: 'ok <file_edit path="a.ts">x</file_edit>' } },
        ]);
    });

    it("spawns gemini read-only and parses .response", async () => {
        process.env.LOOP_BRIDGE_AUTO = "gemini";
        const p = autoFulfillBridge("t1", "bridge-1");
        expect(spawnedBin()).toBe("gemini");
        const args = (spawnMock.mock.calls[0] as unknown as [string, string[]])[1];
        expect(args).toEqual(expect.arrayContaining(["--approval-mode", "plan", "--skip-trust", "--output-format", "json"]));

        lastProc().stdout.emit("data", Buffer.from(JSON.stringify({ session_id: "s", response: "gemini says hi", stats: {} })));
        lastProc().emit("close", 0);
        await p;
        expect(writeResponses[0].result).toMatchObject({ status: "done", response: "gemini says hi" });
    });

    it("project.autoAgent overrides the LOOP_BRIDGE_AUTO env default", async () => {
        process.env.LOOP_BRIDGE_AUTO = "claude";
        projectsFixture = [{ id: "p1", path: "/fake/project", autoAgent: "gemini" }];
        void autoFulfillBridge("t1", "bridge-1");
        expect(spawnedBin()).toBe("gemini");
    });

    it("writes an error when the agent exits non-zero", async () => {
        const p = autoFulfillBridge("t1", "bridge-1");
        lastProc().stderr.emit("data", Buffer.from("boom"));
        lastProc().emit("close", 1);
        await p;
        expect(writeResponses[0].result).toMatchObject({ status: "error" });
    });

    it("writes an error when stdout is not valid JSON", async () => {
        const p = autoFulfillBridge("t1", "bridge-1");
        lastProc().stdout.emit("data", Buffer.from("not json"));
        lastProc().emit("close", 0);
        await p;
        expect(writeResponses[0].result).toMatchObject({ status: "error" });
    });

    it("writes an error when a claude result event reports is_error", async () => {
        const p = autoFulfillBridge("t1", "bridge-1");
        const events = [{ type: "result", subtype: "error", is_error: true, result: "rate limited" }];
        lastProc().stdout.emit("data", Buffer.from(JSON.stringify(events)));
        lastProc().emit("close", 0);
        await p;
        expect(writeResponses[0].result).toMatchObject({ status: "error" });
    });
});

describe("bridgeAutoAgent", () => {
    afterEach(() => { delete process.env.LOOP_BRIDGE_AUTO; });
    it("returns null when unset and the trimmed name when set", () => {
        delete process.env.LOOP_BRIDGE_AUTO;
        expect(bridgeAutoAgent()).toBeNull();
        process.env.LOOP_BRIDGE_AUTO = " claude ";
        expect(bridgeAutoAgent()).toBe("claude");
    });
});

describe("recoverTmuxBridges", () => {
    const claudeReply = (text: string) => JSON.stringify([{ type: "result", is_error: false, result: text }]);
    beforeEach(() => {
        bridgeFixture = pendingBridge(); // id bridge-1, taskId t1
        writeResponses.length = 0;
        tmuxRunDirs = ["/tmux/t1"];
        tmuxMetaByDir = { "/tmux/t1": { taskId: "t1", projectId: "p1", bridgeId: "bridge-1", agent: "claude" } };
        tmuxOutcomeByTask = {};
        tmuxSessionAliveFlag = false;
        cleanupTmuxMock.mockClear();
        pollTmuxMock.mockClear();
    });

    it("finalizes a run that completed during downtime (exit file present)", () => {
        tmuxOutcomeByTask = { t1: { hasExit: true, exitCode: 0, stdout: claudeReply("recovered reply") } };
        recoverTmuxBridges();
        expect(writeResponses[0].result).toMatchObject({ status: "done", response: "recovered reply" });
        expect(cleanupTmuxMock).toHaveBeenCalledWith("t1");
    });

    it("marks a run interrupted when there is no exit file and no live session", () => {
        tmuxOutcomeByTask = { t1: { hasExit: false, exitCode: 1, stdout: "" } };
        tmuxSessionAliveFlag = false;
        recoverTmuxBridges();
        expect(writeResponses[0].result).toMatchObject({ status: "error" });
        expect(cleanupTmuxMock).toHaveBeenCalledWith("t1");
    });

    it("resumes polling a still-running session, then finalizes", async () => {
        tmuxOutcomeByTask = { t1: { hasExit: false, exitCode: 1, stdout: "" } };
        tmuxSessionAliveFlag = true;
        pollTmuxMock.mockResolvedValueOnce({ exitCode: 0, stdout: claudeReply("resumed reply"), timedOut: false });
        recoverTmuxBridges();
        expect(pollTmuxMock).toHaveBeenCalled();
        await Promise.resolve(); await Promise.resolve();
        expect(writeResponses[0].result).toMatchObject({ status: "done", response: "resumed reply" });
    });

    it("skips + cleans up a stale/superseded run without writing a response", () => {
        bridgeFixture = { ...pendingBridge(), id: "bridge-999" }; // no longer matches meta.bridgeId
        recoverTmuxBridges();
        expect(writeResponses).toHaveLength(0);
        expect(cleanupTmuxMock).toHaveBeenCalledWith("t1");
    });
});
