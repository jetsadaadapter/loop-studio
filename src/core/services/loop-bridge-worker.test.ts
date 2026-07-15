import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EventEmitter } from "events";
import type { BridgeRequest } from "./loop-bridge.service";

// The worker reads a bridge request, resolves its project, spawns an agent CLI,
// and writes the reply back. Mock all I/O so we test the control flow (enable
// gate, allow-list, success/parse/exit handling) without disk or a real process.

let bridgeFixture: BridgeRequest | null = null;
const writeResponses: Array<{ id: string; result: unknown }> = [];
vi.mock("./loop-bridge.service", () => ({
    readBridgeRequest: () => bridgeFixture,
    writeBridgeResponse: (id: string, result: unknown) => { writeResponses.push({ id, result }); },
}));

vi.mock("./loop-logs.service", () => ({ publishTaskLog: vi.fn() }));

vi.mock("./loop-projects.service", () => ({
    getProjects: () => [{ id: "p1", path: "/fake/project" }],
}));

// Fake child process we can drive from each test. spawnMock is created via
// vi.hoisted so it exists when the (hoisted) vi.mock factory runs.
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
// The most recent spawned fake process (spawn runs synchronously in the worker).
const lastProc = (): FakeProc => {
    expect(spawnMock).toHaveBeenCalled();
    return spawnMock.mock.results.at(-1)!.value as FakeProc;
};

import { autoFulfillBridge, bridgeAutoAgent } from "./loop-bridge-worker.service";

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
        writeResponses.length = 0;
        spawnMock.mockReset();
        spawnMock.mockImplementation(() => makeFakeProc());
        process.env.LOOP_BRIDGE_AUTO = "claude";
    });
    afterEach(() => { delete process.env.LOOP_BRIDGE_AUTO; });

    it("is a no-op when LOOP_BRIDGE_AUTO is unset (waits for a human)", async () => {
        delete process.env.LOOP_BRIDGE_AUTO;
        await autoFulfillBridge("bridge-1");
        expect(spawnMock).not.toHaveBeenCalled();
        expect(writeResponses).toHaveLength(0);
    });

    it("does nothing when the bridge id no longer matches", async () => {
        await autoFulfillBridge("some-other-id");
        expect(spawnMock).not.toHaveBeenCalled();
        expect(writeResponses).toHaveLength(0);
    });

    it("rejects a non-allow-listed agent without spawning", async () => {
        process.env.LOOP_BRIDGE_AUTO = "rm-rf";
        await autoFulfillBridge("bridge-1");
        expect(spawnMock).not.toHaveBeenCalled();
        expect(writeResponses).toHaveLength(1);
        expect(writeResponses[0].result).toMatchObject({ status: "error" });
    });

    it("spawns claude read-only and writes the parsed reply on success", async () => {
        const p = autoFulfillBridge("bridge-1");
        expect(spawnMock).toHaveBeenCalledTimes(1);
        const [bin, args, opts] = spawnMock.mock.calls[0] as unknown as [string, string[], { cwd: string; shell: boolean }];
        expect(bin).toBe("claude");
        expect(args).toEqual(expect.arrayContaining(["-p", "--permission-mode", "dontAsk", "--allowedTools", "Read,Grep,Glob"]));
        expect(args).not.toContain("--bare"); // keyless: use machine login
        expect(opts).toMatchObject({ cwd: "/fake/project", shell: false });

        // claude -p --output-format json emits an array of events; the final
        // {type:"result"} element carries the answer.
        const events = [
            { type: "system", subtype: "init" },
            { type: "result", subtype: "success", is_error: false, result: 'ok <file_edit path="a.ts">x</file_edit>' },
        ];
        lastProc().stdout.emit("data", Buffer.from(JSON.stringify(events)));
        lastProc().emit("close", 0);
        await p;

        expect(writeResponses).toEqual([
            { id: "bridge-1", result: { status: "done", response: 'ok <file_edit path="a.ts">x</file_edit>' } },
        ]);
    });

    it("writes an error when the agent exits non-zero", async () => {
        const p = autoFulfillBridge("bridge-1");
        lastProc().stderr.emit("data", Buffer.from("boom"));
        lastProc().emit("close", 1);
        await p;
        expect(writeResponses).toHaveLength(1);
        expect(writeResponses[0].result).toMatchObject({ status: "error" });
    });

    it("writes an error when stdout is not valid JSON", async () => {
        const p = autoFulfillBridge("bridge-1");
        lastProc().stdout.emit("data", Buffer.from("not json"));
        lastProc().emit("close", 0);
        await p;
        expect(writeResponses[0].result).toMatchObject({ status: "error" });
    });

    it("writes an error when the result event reports is_error", async () => {
        const p = autoFulfillBridge("bridge-1");
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
