# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev                  # dev server on :3000
npm run build                # production build (Next.js 16, Turbopack) — also runs tsc
npm run start                # serve the production build
npm run lint                 # ESLint
npm run test                 # Vitest unit/component tests (jsdom), src/**/*.{test,spec}.{ts,tsx}
npx vitest run src/lib/utils.test.ts        # run a single test file
npx vitest run -t "name of test"            # run tests matching a name
npm run test:visual          # Playwright visual-regression specs in tests/visual/
npm run test:visual:update   # re-baseline visual snapshots
```

After every change run lint + typecheck + build (AGENTS.md rule); hooks in `.claude/hooks/` enforce parts of this automatically.

## What this app is

**Loop Studio** — a local, single-user, no-auth Next.js dashboard for driving AI coding agents against *other* repositories on the same machine. Users register or bootstrap local projects, create tasks against them, and walk each task through a six-stage loop: **PLAN → BUILD → VERIFY → AUTOMATE → OBSERVE → LEARN**. The old "Adapter App Store" product this repo grew out of is gone; anything that only makes sense for it is dead code (see AGENTS.md §3).

## Architecture

**No database.** All state is JSON files under `.antigravity/` at the repo root, read/written synchronously by the service layer:
- `loop-projects.json` — registered projects, their tasks, chat history, activities
- `loop-agents.json` — the AI agent roster (auto-seeded with defaults on first read)
- `bridge-<taskId>.json` — per-task IDE-bridge request (protocol in AGENTS.md §7); one file per task so several tasks can be bridged/auto-fulfilled concurrently
- `knowledge-<projectId>.json` — accumulated learnings, injected into planner/collab prompts
- `autorun-<projectId>.json` — auto-run state mirror (survives restarts; interrupted runs recovered)
- `log-<taskId>.txt` — per-task process output, streamed to the UI

**Layering** (enforce this direction; UI never touches `fs` or spawns processes):

```
src/app/**/page.tsx + components        UI (client components for interactivity)
  → src/app/api/loop-projects/**        route handlers: parse/validate, delegate
    src/app/api/loop-agents/**
  → src/core/services/*.service.ts      all business logic, fs access, child processes
      loop-projects.service.ts          JSON store, git helpers, process runner, risk tiers, SSE log pub/sub;
                                        applyFileEdits guards the verifier (config = blocked for all AI,
                                        test files = only the QA role / human-in-the-loop may write,
                                        and edits are confined to the task's targetFiles scope when set —
                                        an in-scope target's test sibling is still allowed for QA)
      loop-agents.service.ts            agent roster CRUD
      loop-agent-metrics.service.ts     derives per-agent stats (task load, success rate, avg
                                        resolution, weekday volume) from task history across all
                                        projects; backs the /agents dashboard + GET .../summary
      loop-llm.service.ts               Anthropic/Gemini calls for chat
      loop-planner.service.ts           goal → task decomposition (auto-tags, overlap-safe groups)
      loop-collaboration.service.ts     the 5-step AI-team pipeline for one task; when the project's
                                        autoAgent is "claude-sdk" it delegates the implement+verify phase
                                        to the SDK agentic loop (runAgentSdk) instead — early-returns
                                        before the 5 LLM steps, then typechecks the worktree
      loop-autorun.service.ts           backlog orchestrator + risk-gated auto-close; state
                                        mirrored to disk, interrupted runs detected on read
      loop-scheduler.service.ts         heartbeat: a server-side tick fires auto-run on each
                                        project's cadence (headless, uses env API key); started
                                        once via src/instrumentation.ts register()
      loop-knowledge.service.ts         per-project knowledge store: LEARN retros + auto-run
                                        failures accumulate and are injected back into
                                        planner/collaboration prompts (knowledge-<id>.json)
      loop-worktree.service.ts          per-task git isolation (opt-in via LoopProject.useWorktree):
                                        a dedicated worktree + `loop/task-<id>` branch with
                                        Loop-authored checkpoint commits (rollback targets), built on
                                        executeGitCommand; worktrees live under .antigravity/worktrees/
                                        so the target repo stays pristine. resolveTaskCwd(taskId) is the
                                        single place that returns the worktree dir (opted in) vs the
                                        repo path (legacy/non-git fallback); the collaboration pipeline
                                        edits/verifies in that cwd and checkpoints after each edit batch.
                                        On boot (instrumentation.ts) recoverTaskWorktrees() reconciles
                                        worktrees orphaned by a restart (resume/re-add/stale), then
                                        gcTaskWorktrees() reclaims dirs no task references anymore.
                                        GET/POST .../tasks/[taskId]/worktree exposes the git state +
                                        rollback + integrateTask (leave-branch / open-pr via gh /
                                        fast-forward-only merge into baseBranch). Boot-maintenance
                                        (recover + GC) lives in loop-worktree-recovery.ts (300-line split).
                                        Step 1 of the Agent SDK plan — see docs/branch-per-task-checkpoint.md
      loop-agent-tools.ts               Step 2 (guarded tools): editFile (writeGuardedFile → checkpoint)
                                        + runVerification handler logic, kept SDK-free so the Agent SDK
                                        adapter can wrap them with tool()/PreToolUse later. The shared
                                        guard is evaluateEdit/writeGuardedFile in loop-file-guards.ts —
                                        see docs/guarded-tools-pretooluse.md
      loop-pretooluse-guard.ts          Step 2 choke point: evaluateToolCall(toolName, input, ctx) →
                                        allow/deny/ask — the pure PreToolUse decision (reuses evaluateEdit
                                        for edits, allowlists run_command, routes RED/ORANGE to human
                                        review). SDK-free; the adapter maps it to the hook's
                                        permissionDecision and fails `ask` closed when headless.
      loop-sdk-bindings.ts              Step 3.3: the thin @anthropic-ai/claude-agent-sdk glue —
                                        createLoopToolServer wraps editFile/runVerification as tool()s on
                                        an in-process createSdkMcpServer; createPreToolUseHook maps
                                        evaluateToolCall onto the SDK PreToolUse hook. Keep SDK imports
                                        confined here (next.config serverExternalPackages excludes the
                                        native-binary package from the bundle). See docs/sdk-adapter-wiring.md
      loop-sdk-runner.ts                Step 3.4: runAgentSdk — the agentic loop. Forces a task worktree
                                        (isolation), runs query() with the guarded tool server + PreToolUse
                                        hook + maxTurns/maxBudgetUsd caps, streams to the task log, and
                                        returns a summary + git-diffed editedFiles. Registered as the
                                        `claude-sdk` adapter (lazy-imported). See docs/sdk-adapter-wiring.md
      loop-sdk-runs.ts                  Step 3.5 durability: runAgentSdk drops a run marker
                                        (.antigravity/agent-runs/<taskId>) while in flight and clears it on
                                        exit; recoverSdkRuns() (boot, from instrumentation.ts) marks any
                                        run left pending by a restart as failed so its bridge isn't stuck.
  → src/core/validators/ (Zod)          boundary validation
    src/core/interfaces/                shared types + constants (models, skills, pricing)
```

**The server runs real commands.** `runProjectCommand()` in `loop-projects.service.ts` spawns child processes (`git`, `npx vitest`, `npm run build`, `create-next-app`, …) with `cwd` set to the *registered project's* path — not this repo. Output is appended to `.antigravity/log-*.txt` and pushed to in-memory listeners; `GET .../tasks/[taskId]/logs` serves it as Server-Sent Events (`LogTerminal.tsx` consumes it via `EventSource`). Always attach both `error` and `close` handlers to spawned processes — an unhandled spawn error crashes the whole server (a registered project whose directory was deleted is a known trigger).

**Stage flow.** A task's `currentStage` advances via `PATCH .../tasks/[taskId]`. Stage UIs live in `src/app/loop-components/` (`PlanStage` … `LearnStage`, orchestrated by `StageWorkspace` + `TimelineStages`); `AutoPipeline` runs the whole verify/lint/build pipeline in one `POST .../pipeline` call. Risk tier (RED/ORANGE/YELLOW/GREEN) is computed server-side from the target file's import fan-out. The AI-team pipeline separates maker from checker: the Developer/fix-loop (implementer) cannot write test or verifier-config files, only the QA agent may author tests, and build/test/CI config is off-limits to every AI role (Karpathy's "don't let the agent edit the evaluator"). Every agent edit is also confined to the task's declared `targetFiles` scope (when set) — a wandering off-scope write (e.g. a QA test for an unrelated component) is refused, though an in-scope target's own test sibling is still allowed for QA.

**Heartbeat.** A per-project schedule (`schedule` on `LoopProject`, edited via the Schedule modal → `PATCH .../schedule`) lets the backlog drain on a cadence. `loop-scheduler.service.ts` runs one server-side tick a minute (started by `src/instrumentation.ts` on boot); a due project with pending backlog and a **server env API key** (`ANTHROPIC_API_KEY`/`GEMINI_API_KEY` — there is no per-user key server-side) triggers `startAutoRun`. With no env key the tick records "skipped" rather than spinning.

**Chat & LLM keys.** `ChatPanel` sends `POST .../chat` with an `X-Anthropic-API-Key` header read from `localStorage["loop_anthropic_api_key"]` (saved on `/agents`; Google keys are auto-detected by prefix and routed to Gemini). Server falls back to env keys (`.env.example`), and with no key at all the request goes to the IDE bridge instead — chat is never blocked client-side. Optionally, a bridged request is auto-fulfilled by a local agent instead of waiting for a human: `loop-bridge-worker.service.ts` holds an adapter registry — `kind:"spawn"` adapters (`claude` | `gemini`) spawn the selected CLI in **read-only** mode, capture its `<file_edit>`-block reply, and write it back so the normal bridge poll + guarded `applyFileEdits` apply it; the `kind:"sdk"` adapter (`claude-sdk`) instead runs an in-process Agent SDK agentic loop (`loop-sdk-runner.ts`, lazy-imported) that edits inside the task worktree via the guarded tools + PreToolUse hook and finalizes with pre-applied files (no re-apply). The agent is chosen per-project (`LoopProject.autoAgent`, set in the Edit Project modal) or, failing that, by the `LOOP_BRIDGE_AUTO` server env default; unset = wait for a human. `claude` runs keyless (machine login, no `--bare`); `gemini` uses `--approval-mode plan --skip-trust` and `GEMINI_API_KEY`. Setting `LOOP_BRIDGE_TMUX=1` runs the chosen agent inside a detached tmux session (`loop-<taskId>`) via `loop-tmux.service.ts` instead of a direct child — the run survives an app restart and is attachable (`tmux attach -t loop-<taskId>`); every argv element is single-quote-escaped into a controlled wrapper so a chat prompt can't inject shell. Falls back to a direct spawn when tmux is absent. Each tmux run drops a `meta.json` in its work dir so `recoverTmuxBridges()` (run from `instrumentation.ts` on boot) can finalize/resume/error a run orphaned by an app restart.

**MCP server (the reverse direction).** `scripts/mcp-server.ts` (run with `npm run mcp`, a stdio server built on `@modelcontextprotocol/sdk`) lets an external MCP client (Claude Desktop, Cursor, Claude Code) connect and **read** projects/tasks/logs + **fulfill** pending bridge requests. Its `submit_bridge_reply` tool calls the shared `finalizeBridgeReply` (in `loop-bridge-apply.service.ts`) — the same guarded apply path the bridge POST route uses, so a connected agent's `<file_edit>` blocks go through the config lock / test-file policy too. Read + fulfill only (no create/advance/run). It reads the same `.antigravity/` store, so it works whether or not the Next server is up.

**Component placement.** Three tiers, by scope:
- `src/components/ui/` + `src/components/manager-*` — shared design-system primitives (see `src/components/COMPONENTS.md`, `DESIGN.md`); colocated `*.test.tsx`
- `src/app/loop-components/` — page-local components shared across the root routes (do **not** create `src/app/components/`)
- route-local `components/` folders (e.g. `src/app/[projectId]/components/`) — used by one route only

`src/proxy.ts` is the middleware: CSP + security headers (per-request nonce) plus cross-site request rejection — Host must be a localhost name (extend via `LOOP_ALLOWED_HOSTS`) and every method (not just state-changing ones) must be same-site (Origin + `Sec-Fetch-Site`), since the no-auth API runs real commands *and* returns data (logs/files/dir listings) on reads. The pure cross-site guards live in `src/proxy-guards.ts` (unit-tested). A pre-tool-use hook blocks edits that add `unsafe-inline`/`unsafe-eval` to it.
