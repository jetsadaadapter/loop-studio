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

## 2026-07-07 — Added agent guardrail infrastructure
Agent/tool: Claude Code
What: Set up `.claude/hooks/` (pre-tool-use 300-line + CSP guard, post-tool-use eslint-on-save, stop typecheck advisory), `.claude/agents/verifier.md`, and this MEMORY.md — closing gaps found comparing against a reference "loopkit" agent-vault structure.
Files: `.claude/settings.json`, `.claude/hooks/*.sh`, `.claude/agents/verifier.md`, `MEMORY.md`
Follow-up: `stop.sh` is advisory-only (won't block) until the current `tsc --noEmit` baseline is confirmed clean — tighten it to blocking after that.
