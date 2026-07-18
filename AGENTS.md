<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Internal Library: Agent Rules

This file is the execution guide for coding agents in this repository.

Canonical engineering rules are maintained in `.github/project-guidlines.md`.
When these files diverge, update both in the same change.

## 1. Source of Truth

- Product/developer docs: `README.md`
- Engineering rules: `.github/project-guidlines.md`
- Agent behavior rules: `AGENTS.md` (this file)
- Agent rules & guidelines: `.antigravityrules`
- Core standards & guidelines: `.antigravity/standard.md`
- Coding best practices & automation: `.antigravity/best-practices.md`
- UI/UX & Design system standards: `DESIGN.md`
- Loop methodology & risk-tier rubric: `LOOP-ENGINEERING.md` — the six-stage playbook and the fan-out risk tiers (RED/ORANGE/YELLOW/GREEN) that the UI-primitive safety-net tests cite
- Cross-session shift log: `MEMORY.md` — skim recent entries before non-trivial work, append one after

## 2. Repository Analysis Policy (Mandatory Pre-Analysis)

Always use Graphify before reading source files directly.

Priority order when investigating this codebase:

1. **Graphify knowledge graph** — `graphify-out/graph.json` / `graphify-out/GRAPH_REPORT.md`. If `graphify-out/graph.json` does not exist yet, run `/graphify` to build it first. If it exists, query it with `/graphify query "<question>"` before opening any source file.
2. **Repository documents** — `CLAUDE.md`, `AGENTS.md`, `DESIGN.md`, `README.md`, `docs/`.
3. **Source code** — only as a last resort, and only the specific files identified as relevant by steps 1–2.

Rules:

- Never recursively scan the entire repository unless the user explicitly requests it, or the Graphify graph lacks sufficient information to answer the question.
- Open only the minimum set of files required to complete the task.
- This keeps token usage low and agent behavior consistent across sessions — important for a project this size (hundreds of files, worked on by multiple AI agents/tools).

## 3. Current App Model (Must Match Code)

This repo was cut down from the "Adapter App Store" codebase to a standalone Loop
Studio (task management for AI coding agents) — the App Store's public pages,
management-menu CRUD modules (apps/banners/categories/keys/models/prompts/tags/
tools/users), and its Zero Trust auth system were all removed. If you find code
that only makes sense for that old App Store (an unused service, a stray import),
it's leftover — flag it for removal rather than building on it.

- Main app routes (all live at root now, no `/manage` prefix):
  - `/` — the project list (formerly `/manage/loop-projects`)
  - `/[projectId]`, `/[projectId]/tasks/[taskId]`, `/agents`
  - `/api/loop-projects/**`, `/api/loop-agents/**`
- Page-local component folder for the root routes is `src/app/loop-components/`
  (named to avoid confusion with the shared `src/components/`) — don't recreate
  a plain `src/app/components/`.
- No auth system — every route is public to the local user. `src/proxy.ts` sets
  CSP/security headers (per-request nonce) and rejects cross-site requests
  (Host allowlist + same-origin check on state-changing methods; extend hosts
  via `LOOP_ALLOWED_HOSTS`). It does not authenticate anyone.
- No global notification system — `NotificationProvider`/`NotificationPanel`
  were removed along with the App Store backend they polled.
- `.claude/hooks/pre-tool-use.sh` still blocks edits to `src/proxy.ts` that add
  `unsafe-inline`/`unsafe-eval` — CSP is kept even though auth was removed.

## 4. Code Change Rules

**AI/LLM Token & Context Guardrails (Strict Efficiency Rules):**

- **Grep Before View**: DO NOT read an entire file if it exceeds 100 lines. First, use `grep_search` to pinpoint the exact location of interest, then use `view_file` specifying a narrow line range (e.g., `StartLine` and `EndLine`).
- **Surgical Code Edits**: Never rewrite an entire file when modifying code. Use `replace_file_content` (for contiguous blocks) or `multi_replace_file_content` (for separate blocks) targeting the smallest possible line range.
- **Minimize Context Bloat**: Do not request or include large build logs, node_modules listings, or console histories. Only request the exact 5-10 lines containing error stacks.
- **Asynchronous Task Waiting**: Never poll terminal statuses or run infinite loops. Launch async tasks and wait for the system's background wakeup.
- **Data & Logic Decoupling**: Keep mock arrays, static constants, and options list out of `.tsx` files. Store them in a separate `data.ts` sibling file so they are not repeatedly parsed during UI changes.

- Default to Server Components; use `"use client"` only when required
- Keep business logic in `src/core/services` and `src/core/adapters`, not in UI
- Validate external data with strict Zod schemas at boundaries
- Avoid unrelated refactors in focused fixes
- Before creating any new component under `src/components`, read `src/components/COMPONENTS.md` and `DESIGN.md` in the project root, and follow their naming/structure/design standards
- **File Length Limits (300 Lines Rule)**: Keep files modular, clean, and highly maintainable. Under ordinary circumstances, code files **must not exceed 300 lines**. Actively refactor code by splitting long components or services into focused sub-components or standalone helpers.

**Normalize all UI fields:** Before rendering any field that may be an object or string (e.g., `category`), always normalize to string:

- Example: `{typeof category === "string" ? category : category?.name || ""}`

**Strict Typography Prohibitions:** All UI text elements, labels, buttons, numbers, metrics, and identifiers (e.g., IDs) MUST strictly use `font-sans`. Using `font-mono` is strictly forbidden across all user interface components. The only exception is for raw code blocks, pre-formatted logs, or technical syntax highlights.

**Unified Table Reuse & Typography Weights:** All tables MUST strictly reuse the component system in `src/components/ui/table.tsx` (`TableContainer`, `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`).
- Do NOT apply local style overrides on header cells (`TableHead`) such as custom colors or weight classes (e.g., `font-bold text-slate-650`). Let it inherit default `TableHead` styling.
- Row cell styling weights must align with the User Management table standards:
  - Entity names/primary columns use `font-semibold` (never `font-bold`).
  - Secondary metadata, action terms, time, dates, or descriptions use standard font weight (never `font-medium` or `font-bold`).
  - Badges and initials fallback inside avatar backgrounds may use `font-bold`.
  - Custom buttons in row columns use `font-semibold` instead of `font-bold`.

**Standardized Toolbar & Filters:** Every dashboard list view containing a data table MUST use a standardized filter and search UI pattern.
- Always use `ManagerToolbar` (from `@/components/manager-toolbar`) which wraps the premium `ManageSearchInput` and `ManageFilterSelect` components.
- Do NOT write custom toolbar divs with raw HTML `<input>` or native `<select>` tags. All search bars and dropdown selectors must follow this design system.
- Include a refresh control (using `ManageRefreshButton` passed inside the `trailing` prop of `ManagerToolbar`) to let users refresh table contents.

**Error checks after every change:** After every code change, always run lint, type check, and build. If any error/warning or build fails, you must fix it before proceeding to the next task.

### Start-of-Task Guidelines (Required Every Time)

Before writing code on any new task, follow this sequence:

1. Follow the Repository Analysis Policy (Section 2): query Graphify first, then repository docs, and only then source files.
2. Read `.antigravityrules`, `.antigravity/standard.md`, `.antigravity/best-practices.md`, and `DESIGN.md` in the project root to ensure compliance with the repository architecture, UX rules, and design tokens.
3. Do not jump into code immediately.
4. Analyze requirements first.
5. List files that will be created/updated.
6. Break work into small verifiable steps.
7. Before editing, state which files will change and how.
8. After editing, summarize what changed.
9. Do not remove existing code unless necessary.
10. Keep code readable, beginner-friendly, and easy to maintain.
11. Always account for security, maintainability, and best practices.

## 5. Documentation Sync Policy

If code changes affect behavior or setup, update these files together:

1. `README.md` (usage/setup overview)
2. `.github/project-guidlines.md` (engineering standards)
3. `AGENTS.md` (agent execution constraints)

## 6. Pre-merge Checks

Before finishing a substantial change:

1. `npm run build` passes
2. Core routes still behave correctly:
   - `/` (project list)
   - `/[projectId]` and `/[projectId]/tasks/[taskId]`
   - `/agents`
3. No secrets added to repository

## 7. Loop Studio IDE Bridge Protocol

Loop Studio chat has a **free, key-less mode** ("Use IDE Agent Bridge"). Instead of calling a paid LLM, the app writes the request to `.antigravity/bridge.json` and waits for an IDE coding agent (you) to fulfill it. Follow this protocol when asked to `run bridge`:

1. Read `.antigravity/bridge.json`. If `status` is `"pending"`, act on it; otherwise there is nothing to do.
2. Fulfill `prompt` (use `history` for context). Make the code changes in this repository as needed.
3. Write your reply back into the **same file**: set `status` to `"done"` and put your message in a `response` field. To have the app render/apply code, include full file bodies as `<file_edit path="relative/path">...FULL FILE...</file_edit>` blocks inside `response`. On failure, set `status: "error"` and an `error` message.
4. Do **not** change `id`, `taskId`, or `projectId` — the app polls by `id` and finalizes the reply into the task chat (applying any `<file_edit>` blocks). It sets `status: "consumed"` once applied.

The `instructions` field inside the file restates this. The bridge is **one file per task** (`.antigravity/bridge-<taskId>.json`), so several tasks can be bridged/auto-fulfilled concurrently; the app times out polling after ~5 minutes but leaves the file for later fulfillment.

**Auto-fulfill mode (opt-in).** A pending request can be fulfilled by a local agent without a human. `loop-bridge-worker.service.ts` holds an **adapter registry** (`ADAPTERS` — currently `claude` and `gemini`); the agent is chosen per-project via `LoopProject.autoAgent` (Edit Project modal), else by the `LOOP_BRIDGE_AUTO` server env default; unset = wait for a human. The worker spawns the selected CLI **read-only** — `claude`: `--permission-mode dontAsk --allowedTools Read,Grep,Glob` (no `--bare`, so it uses the machine's Claude login, keyless); `gemini`: `--approval-mode plan --skip-trust` (uses `GEMINI_API_KEY`). Read-only means the agent never writes project files itself — it returns `<file_edit>` blocks that the existing bridge POST route applies through the guarded `applyFileEdits`, so all edit guards (config lock, test-file policy, and the task-scope guard — edits are confined to the task's `targetFiles` when set, with in-scope test siblings allowed for QA) still hold. Only registered adapters are ever spawned; the prompt is passed as a discrete argv element (no shell). Add an agent by adding one entry to `ADAPTERS` (bin, argv builder, output parser).

**tmux execution (opt-in).** With `LOOP_BRIDGE_TMUX=1` (and tmux installed) the worker runs the agent inside a detached tmux session `loop-<taskId>` via `loop-tmux.service.ts` instead of a direct child: the run survives an app restart and is attachable (`tmux attach -t loop-<taskId>`), with stdout captured to a file for parsing and stderr streamed to the task log. tmux needs a shell command, so `runAgentInTmux` writes a controlled wrapper script with **every** argv element single-quote-escaped (`shq`) — a chat prompt containing `;`/backticks/`$()` stays inert data (unit-tested + runtime-probed). Unset or tmux-missing → the original direct spawn. **Restart recovery**: each run writes a `meta.json` (taskId/projectId/bridgeId/agent) into its `.antigravity/tmux/<taskId>/` dir, which persists if the process dies mid-run. On boot, `recoverTmuxBridges()` (called from `instrumentation.ts`) scans those dirs and, for each still-pending bridge, either finalizes it (agent finished during downtime — exit file present), resumes polling (its tmux session is still alive), or marks it interrupted (session gone). Stale/superseded runs are dropped.

## 8. Agent Guardrail Automation

Some rules above are also enforced mechanically, so they hold even if a session forgets to self-check:

- `.claude/hooks/pre-tool-use.sh` — blocks new `src/**` files over 300 lines, blocks edits to `src/proxy.ts` that add `unsafe-inline`/`unsafe-eval`
- `.claude/hooks/post-tool-use.sh` — runs ESLint on every `.ts`/`.tsx` file right after it's edited, feeds errors back immediately
- `.claude/hooks/stop.sh` — runs `tsc --noEmit` at the end of a turn; currently advisory only (see comment in the script for why)
- `.claude/agents/verifier.md` — a subagent that checks a diff against Section 6 before you call a change done; invoke it before handing off substantial work

These are a backstop, not a replacement for following Sections 5–7 directly.

## 9. MCP Server (external agent tools → Loop Studio)

`scripts/mcp-server.ts` is a stdio Model Context Protocol server (run `npm run mcp`) that lets an external MCP client — Claude Desktop, Cursor, Claude Code — connect to Loop Studio. It is the reverse of the bridge auto-fulfill (§7): instead of Loop Studio spawning an agent, an agent connects in and works.

- **Capabilities: read + fulfill only.** Read tools (`list_projects`, `get_project`, `get_task`, `read_task_logs`) and bridge-fulfill tools (`list_pending_bridges`, `get_bridge`, `submit_bridge_reply`). No create-task / advance-stage / trigger-run.
- `submit_bridge_reply` routes through the shared `finalizeBridgeReply` (`src/core/services/loop-bridge-apply.service.ts`) — the same guarded `applyFileEdits` path as the bridge POST route, so config-lock / test-file / task-scope guards still apply to a connected agent's `<file_edit>` blocks.
- **stdio/local only** — no HTTP surface. It reads the same `.antigravity/` JSON store as the app (works whether or not `next dev` is running). Runs via `tsx` with relative imports (not the `@/` alias).
- Connect:
  - Claude Code: `claude mcp add loop-studio -- npx tsx <abs>/scripts/mcp-server.ts`
  - Claude Desktop: `{ "mcpServers": { "loop-studio": { "command": "npx", "args": ["tsx", "<abs>/scripts/mcp-server.ts"] } } }`
- Add a read tool by registering it against a service getter; keep the server thin (tools delegate to services). Never write to stdout in the server (it is the JSON-RPC channel) — diagnostics go to stderr.
