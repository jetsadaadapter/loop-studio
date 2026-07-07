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
- `bridge.json` — single-slot IDE-bridge request (protocol in AGENTS.md §7)
- `log-<taskId>.txt` — per-task process output, streamed to the UI

**Layering** (enforce this direction; UI never touches `fs` or spawns processes):

```
src/app/**/page.tsx + components        UI (client components for interactivity)
  → src/app/api/loop-projects/**        route handlers: parse/validate, delegate
    src/app/api/loop-agents/**
  → src/core/services/*.service.ts      all business logic, fs access, child processes
      loop-projects.service.ts          JSON store, git helpers, process runner, risk tiers, SSE log pub/sub
      loop-agents.service.ts            agent roster CRUD
      loop-llm.service.ts               Anthropic/Gemini calls for chat
  → src/core/validators/ (Zod)          boundary validation
    src/core/interfaces/                shared types + constants (models, skills, pricing)
```

**The server runs real commands.** `runProjectCommand()` in `loop-projects.service.ts` spawns child processes (`git`, `npx vitest`, `npm run build`, `create-next-app`, …) with `cwd` set to the *registered project's* path — not this repo. Output is appended to `.antigravity/log-*.txt` and pushed to in-memory listeners; `GET .../tasks/[taskId]/logs` serves it as Server-Sent Events (`LogTerminal.tsx` consumes it via `EventSource`). Always attach both `error` and `close` handlers to spawned processes — an unhandled spawn error crashes the whole server (a registered project whose directory was deleted is a known trigger).

**Stage flow.** A task's `currentStage` advances via `PATCH .../tasks/[taskId]`. Stage UIs live in `src/app/loop-components/` (`PlanStage` … `LearnStage`, orchestrated by `StageWorkspace` + `TimelineStages`); `AutoPipeline` runs the whole verify/lint/build pipeline in one `POST .../pipeline` call. Risk tier (RED/ORANGE/YELLOW/GREEN) is computed server-side from the target file's import fan-out.

**Chat & LLM keys.** `ChatPanel` sends `POST .../chat` with an `X-Anthropic-API-Key` header read from `localStorage["loop_anthropic_api_key"]` (saved on `/agents`; Google keys are auto-detected by prefix and routed to Gemini). Server falls back to env keys (`.env.example`), and with no key at all the request goes to the IDE bridge instead — chat is never blocked client-side.

**Component placement.** Three tiers, by scope:
- `src/components/ui/` + `src/components/manager-*` — shared design-system primitives (see `src/components/COMPONENTS.md`, `DESIGN.md`); colocated `*.test.tsx`
- `src/app/loop-components/` — page-local components shared across the root routes (do **not** create `src/app/components/`)
- route-local `components/` folders (e.g. `src/app/[projectId]/components/`) — used by one route only

`src/proxy.ts` is the middleware: CSP + security headers only, per-request nonce, no auth. A pre-tool-use hook blocks edits that add `unsafe-inline`/`unsafe-eval` to it.
