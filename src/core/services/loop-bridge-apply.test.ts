import { describe, it, expect, vi, beforeEach } from "vitest";
import type { BridgeRequest } from "./loop-bridge.service";
import type { LoopProject } from "@/core/interfaces/loop-projects.interface";

// finalizeBridgeReply is the shared bridge-finalize path (used by the bridge HTTP
// route AND the MCP submit_bridge_reply tool). Mock the stores + edit applier so
// we test its control flow (write-then-apply, guards, consume) in isolation.

vi.mock("fs", () => ({ default: { mkdirSync: vi.fn(), appendFileSync: vi.fn() }, mkdirSync: vi.fn(), appendFileSync: vi.fn() }));

let bridgeFixture: BridgeRequest | null = null;
const writeResponse = vi.fn((taskId: string, id: string, r: { status: string; response?: string }) => {
    if (bridgeFixture && bridgeFixture.id === id) { bridgeFixture.status = r.status as BridgeRequest["status"]; if (r.response !== undefined) bridgeFixture.response = r.response; }
});
const markConsumed = vi.fn();
vi.mock("./loop-bridge.service", () => ({
    readBridgeRequest: () => bridgeFixture,
    writeBridgeResponse: (t: string, i: string, r: { status: string; response?: string }) => writeResponse(t, i, r),
    markBridgeConsumed: (t: string, i: string) => markConsumed(t, i),
}));

let projectsFixture: LoopProject[] = [];
let applyResult = { written: [] as string[], blocked: [] as { path: string; reason: string }[] };
vi.mock("./loop-projects.service", () => ({
    getProjects: () => projectsFixture,
    saveProjects: vi.fn(),
    applyFileEdits: () => applyResult,
}));

import { finalizeBridgeReply } from "./loop-bridge-apply.service";

const makeProject = (): LoopProject => ({
    id: "p1", name: "P1", path: "/fake", template: "nextjs-app",
    tasks: [{ id: "t1", name: "T", currentStage: "BUILD", status: "in-progress", chatHistory: [], activities: [] } as unknown as LoopProject["tasks"][number]],
    createdAt: "", updatedAt: "",
});
const doneBridge = (): BridgeRequest => ({
    status: "done", id: "b1", taskId: "t1", projectId: "p1", requestType: "chat",
    prompt: "p", instructions: "i", response: "done reply", updatedAt: "",
});

describe("finalizeBridgeReply", () => {
    beforeEach(() => {
        projectsFixture = [makeProject()];
        applyResult = { written: [], blocked: [] };
        writeResponse.mockClear();
        markConsumed.mockClear();
        bridgeFixture = doneBridge();
    });

    it("writes the reply (status done), records the message, applies edits, and consumes", () => {
        bridgeFixture = { ...doneBridge(), status: "pending", response: undefined };
        applyResult = { written: ["src/a.ts"], blocked: [] };
        const res = finalizeBridgeReply("p1", "t1", "b1", { reply: 'r <file_edit path="src/a.ts">x</file_edit>', senderName: "Agent (via MCP)" });
        expect(res.ok).toBe(true);
        expect(writeResponse).toHaveBeenCalledWith("t1", "b1", { status: "done", response: expect.stringContaining("file_edit") });
        if (res.ok) expect(res.editedFiles).toEqual(["src/a.ts"]);
        expect(projectsFixture[0].tasks[0].chatHistory).toHaveLength(1);
        expect(projectsFixture[0].tasks[0].chatHistory[0].senderName).toBe("Agent (via MCP)");
        expect(markConsumed).toHaveBeenCalledWith("t1", "b1");
    });

    it("finalizes an already-done bridge without a reply arg (route path)", () => {
        const res = finalizeBridgeReply("p1", "t1", "b1");
        expect(res.ok).toBe(true);
        expect(writeResponse).not.toHaveBeenCalled();
        expect(markConsumed).toHaveBeenCalledWith("t1", "b1");
    });

    it("returns 404 when the bridge is missing / id mismatch", () => {
        const res = finalizeBridgeReply("p1", "t1", "nope");
        expect(res).toMatchObject({ ok: false, status: 404 });
        expect(markConsumed).not.toHaveBeenCalled();
    });

    it("is idempotent — a consumed bridge returns alreadyConsumed", () => {
        bridgeFixture = { ...doneBridge(), status: "consumed" };
        const res = finalizeBridgeReply("p1", "t1", "b1");
        expect(res).toMatchObject({ ok: true, alreadyConsumed: true });
    });

    it("returns 409 when the bridge is still pending and no reply is supplied", () => {
        bridgeFixture = { ...doneBridge(), status: "pending", response: undefined };
        const res = finalizeBridgeReply("p1", "t1", "b1");
        expect(res).toMatchObject({ ok: false, status: 409 });
    });

    it("returns 404 when the project/task is not found", () => {
        projectsFixture = [];
        const res = finalizeBridgeReply("p1", "t1", "b1");
        expect(res).toMatchObject({ ok: false, status: 404 });
    });

    it("surfaces blocked edits", () => {
        applyResult = { written: [], blocked: [{ path: "package.json", reason: "config locked" }] };
        const res = finalizeBridgeReply("p1", "t1", "b1");
        expect(res.ok).toBe(true);
        if (res.ok) expect(res.blocked).toEqual([{ path: "package.json", reason: "config locked" }]);
    });
});
