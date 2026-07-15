/**
 * Loop Studio MCP server (stdio).
 *
 * Lets an external MCP client (Claude Desktop, Cursor, Claude Code) READ Loop
 * Studio's projects/tasks/logs and FULFILL pending IDE-bridge requests — i.e. the
 * client becomes a bridge fulfiller, and its <file_edit> blocks are applied through
 * the same guarded path the app uses. Read + fulfill only (no create/advance/run).
 *
 * Runs standalone over stdio (no HTTP surface); reads the same .antigravity/ JSON
 * store as the app, so it works whether or not the Next server is up.
 *
 *   Claude Code:    claude mcp add loop-studio -- npx tsx <abs>/scripts/mcp-server.ts
 *   Claude Desktop: { "mcpServers": { "loop-studio": { "command": "npx",
 *                     "args": ["tsx", "<abs>/scripts/mcp-server.ts"] } } }
 */
import fs from "fs";
import path from "path";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getProjects } from "../src/core/services/loop-projects.service";
import { listBridgeRequests, readBridgeRequest } from "../src/core/services/loop-bridge.service";
import { finalizeBridgeReply } from "../src/core/services/loop-bridge-apply.service";

const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8")) as { version?: string };
const json = (value: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] });

const server = new McpServer({ name: "loop-studio", version: pkg.version || "0.0.0" });

// ── Read tools ────────────────────────────────────────────────────────────────
server.registerTool(
    "list_projects",
    { description: "List registered Loop Studio projects (id, name, path, template, task count, auto-agent)." },
    async () => json(getProjects().map((p) => ({
        id: p.id, name: p.name, path: p.path, template: p.template,
        tasks: p.tasks?.length ?? 0, autoAgent: p.autoAgent ?? null,
    }))),
);

server.registerTool(
    "get_project",
    { description: "Get one project with a summary of its tasks.", inputSchema: { projectId: z.string() } },
    async ({ projectId }) => {
        const p = getProjects().find((x) => x.id === projectId);
        if (!p) return json({ error: "Project not found" });
        return json({
            id: p.id, name: p.name, path: p.path, template: p.template, autoAgent: p.autoAgent ?? null,
            tasks: (p.tasks ?? []).map((t) => ({ id: t.id, name: t.name, stage: t.currentStage, status: t.status, riskTier: t.riskTier })),
        });
    },
);

server.registerTool(
    "get_task",
    { description: "Get a task's detail (stage, status, risk tier, target files, message count).", inputSchema: { projectId: z.string(), taskId: z.string() } },
    async ({ projectId, taskId }) => {
        const t = getProjects().find((x) => x.id === projectId)?.tasks?.find((x) => x.id === taskId);
        if (!t) return json({ error: "Task not found" });
        return json({
            id: t.id, name: t.name, stage: t.currentStage, status: t.status, riskTier: t.riskTier,
            targetFiles: t.targetFiles ?? [], messages: t.chatHistory?.length ?? 0,
        });
    },
);

server.registerTool(
    "read_task_logs",
    { description: "Read a task's process log (.antigravity/log-<taskId>.txt), last 20k chars.", inputSchema: { taskId: z.string() } },
    async ({ taskId }) => {
        const safe = taskId.replace(/[^A-Za-z0-9._-]/g, "_");
        const file = path.join(process.cwd(), ".antigravity", `log-${safe}.txt`);
        try {
            const text = fs.readFileSync(file, "utf8");
            return json({ taskId, log: text.slice(-20_000) });
        } catch {
            return json({ taskId, log: "", note: "No log file for this task yet." });
        }
    },
);

// ── Fulfill tools ───────────────────────────────────────────────────────────────
server.registerTool(
    "list_pending_bridges",
    { description: "List pending IDE-bridge requests awaiting a reply (across all tasks)." },
    async () => json(
        listBridgeRequests()
            .filter((b) => b.status === "pending")
            .map((b) => ({ taskId: b.taskId, projectId: b.projectId, bridgeId: b.id, requestType: b.requestType, prompt: b.prompt.slice(0, 500) })),
    ),
);

server.registerTool(
    "get_bridge",
    { description: "Get a task's pending bridge request in full (prompt + conversation history) so you can fulfill it.", inputSchema: { taskId: z.string() } },
    async ({ taskId }) => {
        const b = readBridgeRequest(taskId);
        if (!b) return json({ error: "No bridge request for this task" });
        return json({ taskId: b.taskId, projectId: b.projectId, bridgeId: b.id, status: b.status, requestType: b.requestType, prompt: b.prompt, history: b.history ?? [], instructions: b.instructions });
    },
);

server.registerTool(
    "submit_bridge_reply",
    {
        description: "Fulfill a pending bridge request. `reply` is shown in chat; to change files, include full file bodies as <file_edit path=\"relative/path\">...</file_edit> blocks — they are applied through Loop Studio's guarded path (config files blocked; test files allowed).",
        inputSchema: { projectId: z.string(), taskId: z.string(), bridgeId: z.string(), reply: z.string() },
    },
    async ({ projectId, taskId, bridgeId, reply }) => {
        const result = finalizeBridgeReply(projectId, taskId, bridgeId, { reply, senderName: "Agent (via MCP)" });
        if (!result.ok) return json({ error: result.error });
        return json({ ok: true, alreadyConsumed: result.alreadyConsumed ?? false, editedFiles: result.editedFiles, blocked: result.blocked });
    },
);

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    // stdio server runs until the client disconnects; never write to stdout (it's
    // the JSON-RPC channel) — diagnostics go to stderr.
    process.stderr.write("[loop-studio mcp] ready on stdio\n");
}

main().catch((e) => {
    process.stderr.write(`[loop-studio mcp] fatal: ${e instanceof Error ? e.message : String(e)}\n`);
    process.exit(1);
});
