// Runs once when a Next.js server instance boots (see Next.js "Instrumentation").
// Used to start the Loop Studio heartbeat scheduler in the Node.js runtime only
// (never in the edge runtime, and dynamic-imported so it isn't bundled there).
export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        const { startScheduler } = await import("@/core/services/loop-scheduler.service");
        startScheduler();
        // Finalize any tmux auto-fulfill runs orphaned by a previous restart.
        const { recoverTmuxBridges } = await import("@/core/services/loop-bridge-worker.service");
        recoverTmuxBridges();
    }
}
