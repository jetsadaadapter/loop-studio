import { describe, it, expect, vi, beforeEach } from "vitest";

let dirEntries: string[] = [];
let metaByTask: Record<string, unknown> = {};
const rmCalls: string[] = [];

vi.mock("fs", () => ({
    default: {
        mkdirSync: () => {},
        writeFileSync: () => {},
        rmSync: (p: string) => { rmCalls.push(p); },
        readdirSync: () => {
            if (dirEntries.length === 0) throw new Error("ENOENT");
            return dirEntries;
        },
        readFileSync: (p: string) => {
            const task = String(p).split("/").slice(-2)[0];
            if (!metaByTask[task]) throw new Error("ENOENT");
            return JSON.stringify(metaByTask[task]);
        },
    },
}));

let bridgeByTask: Record<string, { id: string; status: string } | null> = {};
const writeResponse = vi.fn();
vi.mock("./loop-bridge.service", () => ({
    readBridgeRequest: (taskId: string) => bridgeByTask[taskId] ?? null,
    writeBridgeResponse: (t: string, i: string, r: unknown) => writeResponse(t, i, r),
}));
vi.mock("./loop-logs.service", () => ({ publishTaskLog: vi.fn() }));

import { recoverSdkRuns } from "./loop-sdk-runs";

const meta = (taskId: string, bridgeId: string) => ({ taskId, projectId: "p1", bridgeId, worktreeDir: "/wt", startedAt: "" });

beforeEach(() => {
    dirEntries = [];
    metaByTask = {};
    bridgeByTask = {};
    rmCalls.length = 0;
    writeResponse.mockClear();
});

describe("recoverSdkRuns", () => {
    it("marks a still-pending interrupted run as error and clears its marker", () => {
        dirEntries = ["t1"];
        metaByTask = { t1: meta("t1", "b1") };
        bridgeByTask = { t1: { id: "b1", status: "pending" } };

        const r = recoverSdkRuns();
        expect(r.interrupted).toEqual(["t1"]);
        expect(writeResponse).toHaveBeenCalledWith("t1", "b1", expect.objectContaining({ status: "error" }));
        expect(rmCalls.length).toBe(1);
    });

    it("only cleans up when the bridge was already finalized (not pending)", () => {
        dirEntries = ["t1"];
        metaByTask = { t1: meta("t1", "b1") };
        bridgeByTask = { t1: { id: "b1", status: "consumed" } };

        const r = recoverSdkRuns();
        expect(r.interrupted).toEqual([]);
        expect(writeResponse).not.toHaveBeenCalled();
        expect(rmCalls.length).toBe(1); // marker still cleared
    });

    it("does not touch a superseded bridge (id mismatch)", () => {
        dirEntries = ["t1"];
        metaByTask = { t1: meta("t1", "b1") };
        bridgeByTask = { t1: { id: "b2", status: "pending" } };

        const r = recoverSdkRuns();
        expect(r.interrupted).toEqual([]);
        expect(writeResponse).not.toHaveBeenCalled();
    });

    it("no-ops when there are no run markers", () => {
        const r = recoverSdkRuns();
        expect(r).toEqual({ interrupted: [] });
    });
});
