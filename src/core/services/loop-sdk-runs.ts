import fs from "fs";
import path from "path";
import { readBridgeRequest, writeBridgeResponse } from "./loop-bridge.service";
import { publishTaskLog } from "./loop-logs.service";

// Durability for in-process SDK agentic runs. Each run drops a marker while it is
// in flight; a clean finish removes it. A marker that survives means the run was
// interrupted by an app restart — recoverSdkRuns (called on boot, like
// recoverTmuxBridges) unsticks its still-pending bridge instead of leaving it
// pending forever. See docs/sdk-adapter-wiring.md §5.5.

const runsRoot = () => path.join(process.cwd(), ".antigravity", "agent-runs");
const runDir = (taskId: string) => path.join(runsRoot(), taskId);

export interface SdkRunMeta {
    taskId: string;
    projectId: string;
    bridgeId: string;
    worktreeDir: string;
    startedAt: string;
}

export function writeRunMeta(meta: SdkRunMeta): void {
    const dir = runDir(meta.taskId);
    try {
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify(meta, null, 2));
    } catch { /* best-effort */ }
}

export function clearRunMeta(taskId: string): void {
    try {
        fs.rmSync(runDir(taskId), { recursive: true, force: true });
    } catch { /* best-effort */ }
}

function listRunMetas(): SdkRunMeta[] {
    let entries: string[];
    try {
        entries = fs.readdirSync(runsRoot());
    } catch {
        return [];
    }
    const metas: SdkRunMeta[] = [];
    for (const name of entries) {
        try {
            const raw = fs.readFileSync(path.join(runsRoot(), name, "meta.json"), "utf8");
            metas.push(JSON.parse(raw) as SdkRunMeta);
        } catch { /* skip unreadable */ }
    }
    return metas;
}

/**
 * On boot, unstick SDK runs orphaned by a restart. For each leftover marker whose
 * bridge is still pending, mark it interrupted (the in-process run is gone); then
 * drop the marker. Best-effort — never throws into boot.
 */
export function recoverSdkRuns(): { interrupted: string[] } {
    const interrupted: string[] = [];
    for (const meta of listRunMetas()) {
        try {
            const bridge = readBridgeRequest(meta.taskId);
            if (bridge && bridge.id === meta.bridgeId && bridge.status === "pending") {
                writeBridgeResponse(meta.taskId, meta.bridgeId, {
                    status: "error",
                    error: "SDK agentic run was interrupted by an app restart.",
                });
                publishTaskLog(meta.taskId, `\n[sdk] run interrupted by an app restart — marked failed.\n`);
                interrupted.push(meta.taskId);
            }
        } catch { /* skip */ }
        clearRunMeta(meta.taskId);
    }
    return { interrupted };
}
