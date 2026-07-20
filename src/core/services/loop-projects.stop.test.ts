import { describe, it, expect, vi } from "vitest";
import type { ChildProcess } from "child_process";
import { ACTIVE_PROCESSES, stopProjectCommand } from "./loop-projects.service";

// A ChildProcess stand-in with pid:undefined so killProcessTree skips the
// process-group signal (process.kill) and just calls proc.kill() — no real
// process is ever touched by the test.
function fakeProc(): { proc: ChildProcess; kill: ReturnType<typeof vi.fn> } {
    const kill = vi.fn();
    return { proc: { pid: undefined, kill } as unknown as ChildProcess, kill };
}

describe("stopProjectCommand", () => {
    it("returns false when nothing is tracked under the key", () => {
        expect(stopProjectCommand("run-does-not-exist")).toBe(false);
    });

    it("kills the tracked process and clears the registry entry", () => {
        const { proc, kill } = fakeProc();
        ACTIVE_PROCESSES.set("run-proj-stop-1", proc);

        expect(stopProjectCommand("run-proj-stop-1")).toBe(true);
        expect(kill).toHaveBeenCalled();
        expect(ACTIVE_PROCESSES.has("run-proj-stop-1")).toBe(false);
    });
});
