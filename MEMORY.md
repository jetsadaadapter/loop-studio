# Memory

Cross-session log for coding agents working in this repo (Claude Code, Antigravity, Loop DevStudio bridge). Multiple tools touch this codebase across sessions — this file is how one session tells the next what happened, so nobody re-discovers the same thing twice or contradicts a recent decision.

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

## 2026-07-07 — Resolved the 3 deferred decisions: Loop DevStudio moved to root
Agent/tool: Claude Code
What: User resolved the 3 open items from the App Store cut. (1) Moved Loop DevStudio from `/manage/loop-projects` to root: `src/app/manage/loop-projects/**` → `src/app/**` (page.tsx, `[projectId]/`, `agents/`), page-local `components/` renamed to `src/app/loop-components/` to avoid clashing with shared `src/components/`; API routes `/api/manage/loop-projects` → `/api/loop-projects`, `/api/manage/loop-agents` → `/api/loop-agents`; rewrote all internal path strings and relative/aliased imports; merged the old `manage/layout.tsx` top bar into root `src/app/layout.tsx`; deleted the now-empty `src/app/manage/`. (2) Removed the global `NotificationProvider`/`NotificationPanel` (had zero API calls — dead UI, not a backend integration). (3) Confirmed `recharts`/`xlsx` had zero remaining imports and removed both from `package.json`. Verified with `tsc --noEmit`, `eslint`, `next build`, `vitest run` (209 tests), and a real `npm start` + curl smoke test of `/`, `/agents`, `/api/loop-projects` (all 200, CSP header intact).
Files: ~35 files moved/renamed under `src/app/`; edited `src/app/layout.tsx`, `package.json`, `AGENTS.md`
Follow-up: `.claude/agents/verifier.md` still references the old section numbers and the deleted `/login`/`/callback`/`/apps` routes — flagged but not yet fixed (user held off on that specific edit). `README.md`/`.github/project-guidlines.md` still describe the old App Store.

## 2026-07-07 — Cut repo down to Loop DevStudio only
Agent/tool: Claude Code
What: Removed the App Store this repo used to double as — Zero Trust auth (login/callback/api/auth, proxy.ts auth gate), the whole `/manage` CRUD menu (apps/banners/categories/keys/models/prompts/tags/tools/users + their APIs/services/interfaces/validators), public App Store pages (apps/library/projects/tool/dashboard/about/changelogs/docs), and dev-only component-gallery. `src/proxy.ts` now only sets CSP headers (no auth check). `package.json` lost `next-auth` and `@scalar/api-reference-react`; lockfile resynced (-168 packages). Verified with `tsc --noEmit`, `eslint`, `next build`, and `vitest run` (209 tests) after every batch — all clean.
Files: ~309 files deleted; edited `src/proxy.ts`, `src/app/manage/layout.tsx`, `src/app/page.tsx`, `next.config.ts`, `package.json`, `.env.example`, `AGENTS.md`
Follow-up: 3 open decisions deferred (see AGENTS.md #4) — final route for Loop DevStudio (root vs `/manage/loop-projects`), whether to keep the global `NotificationProvider`/`NotificationPanel`, and whether `recharts`/`xlsx` deps are actually dead now. `README.md`/`.github/project-guidlines.md` still describe the old App Store — not yet updated (Documentation Sync Policy #6 debt), holding off until the open decisions above are settled since they'll affect what those docs should say.

## 2026-07-07 — Added agent guardrail infrastructure
Agent/tool: Claude Code
What: Set up `.claude/hooks/` (pre-tool-use 300-line + CSP guard, post-tool-use eslint-on-save, stop typecheck advisory), `.claude/agents/verifier.md`, and this MEMORY.md — closing gaps found comparing against a reference "loopkit" agent-vault structure.
Files: `.claude/settings.json`, `.claude/hooks/*.sh`, `.claude/agents/verifier.md`, `MEMORY.md`
Follow-up: `stop.sh` is advisory-only (won't block) until the current `tsc --noEmit` baseline is confirmed clean — tighten it to blocking after that.
