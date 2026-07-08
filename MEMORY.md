# Memory

Cross-session log for coding agents working in this repo (Claude Code, Antigravity, Loop Studio bridge). Multiple tools touch this codebase across sessions — this file is how one session tells the next what happened, so nobody re-discovers the same thing twice or contradicts a recent decision.

## How to use this file

- Before starting non-trivial work, skim the last 5-10 entries below.
- After finishing non-trivial work (a feature, a fix, a refactor, a verification pass), append one entry.
- Keep entries short — a decision/outcome log, not a diary. Link to files/commits, don't paste diffs.
- Newest entry at the top.

## Entry format

```
## YYYY-MM-DD — short title
Agent/tool: <e.g. Claude Code, verifier subagent, Antigravity>
What: one or two lines on what changed and why
Files: key paths touched
Follow-up: anything left undone or worth watching (omit if none)
```

---

## 2026-07-08 — Plan-from-Goal + Auto-Run orchestrator (goal → tasks → auto-close)
Agent/tool: Claude Code
What: Built the 3-phase autonomy feature. (1) `POST /api/loop-projects/[projectId]/plan` — Architect LLM decomposes a goal into 1-15 backlog tasks (Zod-validated JSON), enriched server-side with auto-tags from path patterns, union-find grouping (tasks sharing a target file are forced into one group), risk tier + safety nets; apply mode accepts back an edited preview so no second LLM call. Added `tags` to LoopTask; `kanbanColumn`/`priority`/`tags` now PATCHable. (2) Extracted the 5-step pipeline from the collaborate route into `loop-collaboration.service.ts` (now returns testsPassed/typecheckPassed; the fix loop finally re-runs tests) and built `loop-autorun.service.ts` — drains backlog group-by-group; GREEN/YELLOW + all checks passed → auto retro + `git commit` + kanban done; ORANGE/RED or failed checks → OBSERVE + "awaiting approval"; push never automatic. In-memory run state, POST/GET/DELETE at `/api/loop-projects/[projectId]/auto-run`. (3) UI: `AutoRunModal` (goal → plan preview with removable rows → Add to Backlog / Add & Auto-Run), `AutoRunProgress` polling banner with Stop, TaskListTable tags column + backlog/awaiting-approval badges + Approve button (commit + close), Tag filter. Verified: tsc, eslint, build, 225 vitest (16 new), live smoke test of plan preview via Gemini (correct tags/groups/tiers).
Files: `src/core/services/loop-{planner,collaboration,autorun}.service.ts` (+tests), `src/app/api/loop-projects/[projectId]/{plan,auto-run}/route.ts`, collaborate route slimmed, tasks/[taskId] PATCH allowlist, `src/app/loop-components/AutoRun{Modal,Progress}.tsx`, `src/app/[projectId]/{page.tsx,components/TaskListTable.tsx,components/TaskView.tsx}`, interface/validators, `docs/USAGE.md`, `CLAUDE.md`
Follow-up: auto-run state is in-memory (lost on server restart mid-run; task work persists). Bridge mode can't drive plan/auto-run (needs sync LLM). Consider a kanban board view for backlog later.

## 2026-07-08 — Verifier pass: Plan-from-Goal + Auto-Run change set
Agent/tool: verifier subagent (Claude Code)
What: Independently re-verified the uncommitted Plan-from-Goal/Auto-Run diff (9 modified + 9 new files) against AGENTS.md #4/#6. Ran `npx tsc --noEmit` (clean), `npm run build` (clean), `npm run lint` (clean), `npx vitest run` (225/225 passed) fresh rather than trusting the prior entry's claim. Confirmed: all changed/new files ≤300 lines (largest is loop-collaboration.service.ts at 204); no `font-mono` in new/changed UI; TaskListTable reuses `ui/table.tsx` primitives with no TableHead overrides and correct font-weight tiers (font-semibold primary column, plain secondary, font-semibold buttons); page.tsx list view uses `ManagerToolbar` (AutoRunModal's goal `<textarea>` is a modal input, not a list-view filter, so exempt); no secrets/API keys in the diff, no `.env*` touched. Smoke-tested `npm start` against `/`, `/agents`, `/api/loop-projects`, `/[projectId]`, `/[projectId]/tasks/[taskId]`, and the new `/api/loop-projects/[projectId]/auto-run` — all 200. Verdict: READY.
Files: none changed (verification only)
Follow-up: none beyond what the feature entry above already lists.

## 2026-07-08 — CLAUDE.md rewritten as a real onboarding doc; stale auth refs purged
Agent/tool: Claude Code
What: CLAUDE.md was a bare `@AGENTS.md` import; rewrote it to keep the import but add commands (build/lint/test/single-test/visual) and big-picture architecture (JSON store in `.antigravity/`, UI → API routes → services layering, `runProjectCommand` spawning real processes against registered project paths, SSE logs, 6-stage loop, LLM key resolution, 3-tier component placement). Also fixed the last stale auth-era references: AGENTS.md §6 pre-merge routes (`/login`/`/callback`/`/apps` → `/`, `/[projectId]`, `/[projectId]/tasks/[taskId]`, `/agents`), §7's old `/manage/loop-projects` path, and `.claude/agents/verifier.md` (same routes + section numbers were off by one). This closes the verifier.md follow-up from the 2026-07-07 move-to-root entry.
Files: `CLAUDE.md`, `AGENTS.md`, `.claude/agents/verifier.md`, `MEMORY.md`
Follow-up: `README.md` and `.github/project-guidlines.md` still describe the old App Store (known doc-sync debt).

## 2026-07-07 — Resolved the 3 deferred decisions: Loop Studio moved to root
Agent/tool: Claude Code
What: User resolved the 3 open items from the App Store cut. (1) Moved Loop Studio from `/manage/loop-projects` to root: `src/app/manage/loop-projects/**` → `src/app/**` (page.tsx, `[projectId]/`, `agents/`), page-local `components/` renamed to `src/app/loop-components/` to avoid clashing with shared `src/components/`; API routes `/api/manage/loop-projects` → `/api/loop-projects`, `/api/manage/loop-agents` → `/api/loop-agents`; rewrote all internal path strings and relative/aliased imports; merged the old `manage/layout.tsx` top bar into root `src/app/layout.tsx`; deleted the now-empty `src/app/manage/`. (2) Removed the global `NotificationProvider`/`NotificationPanel` (had zero API calls — dead UI, not a backend integration). (3) Confirmed `recharts`/`xlsx` had zero remaining imports and removed both from `package.json`. Verified with `tsc --noEmit`, `eslint`, `next build`, `vitest run` (209 tests), and a real `npm start` + curl smoke test of `/`, `/agents`, `/api/loop-projects` (all 200, CSP header intact).
Files: ~35 files moved/renamed under `src/app/`; edited `src/app/layout.tsx`, `package.json`, `AGENTS.md`
Follow-up: `.claude/agents/verifier.md` still references the old section numbers and the deleted `/login`/`/callback`/`/apps` routes — flagged but not yet fixed (user held off on that specific edit). `README.md`/`.github/project-guidlines.md` still describe the old App Store.

## 2026-07-07 — Cut repo down to Loop Studio only
Agent/tool: Claude Code
What: Removed the App Store this repo used to double as — Zero Trust auth (login/callback/api/auth, proxy.ts auth gate), the whole `/manage` CRUD menu (apps/banners/categories/keys/models/prompts/tags/tools/users + their APIs/services/interfaces/validators), public App Store pages (apps/library/projects/tool/dashboard/about/changelogs/docs), and dev-only component-gallery. `src/proxy.ts` now only sets CSP headers (no auth check). `package.json` lost `next-auth` and `@scalar/api-reference-react`; lockfile resynced (-168 packages). Verified with `tsc --noEmit`, `eslint`, `next build`, and `vitest run` (209 tests) after every batch — all clean.
Files: ~309 files deleted; edited `src/proxy.ts`, `src/app/manage/layout.tsx`, `src/app/page.tsx`, `next.config.ts`, `package.json`, `.env.example`, `AGENTS.md`
Follow-up: 3 open decisions deferred (see AGENTS.md #4) — final route for Loop Studio (root vs `/manage/loop-projects`), whether to keep the global `NotificationProvider`/`NotificationPanel`, and whether `recharts`/`xlsx` deps are actually dead now. `README.md`/`.github/project-guidlines.md` still describe the old App Store — not yet updated (Documentation Sync Policy #6 debt), holding off until the open decisions above are settled since they'll affect what those docs should say.

## 2026-07-07 — Added agent guardrail infrastructure
Agent/tool: Claude Code
What: Set up `.claude/hooks/` (pre-tool-use 300-line + CSP guard, post-tool-use eslint-on-save, stop typecheck advisory), `.claude/agents/verifier.md`, and this MEMORY.md — closing gaps found comparing against a reference "loopkit" agent-vault structure.
Files: `.claude/settings.json`, `.claude/hooks/*.sh`, `.claude/agents/verifier.md`, `MEMORY.md`
Follow-up: `stop.sh` is advisory-only (won't block) until the current `tsc --noEmit` baseline is confirmed clean — tighten it to blocking after that.
