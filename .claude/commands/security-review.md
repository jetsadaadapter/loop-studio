---
description: Run a security review on current branch changes
---

Use the `security-guard` sub-agent to review the current git diff for security issues.

First run: `git diff main...HEAD --name-only` to see changed files.
Then focus the review on:

1. Any changes to `src/proxy.ts` — CSP or auth route changes
2. Any new API routes under `src/app/api/`
3. Any changes to `src/core/interfaces/auth.interface.ts` — role changes
4. Any new third-party domains (check `next.config.ts` + `src/proxy.ts` consistency)
5. Any use of `dangerouslySetInnerHTML` in changed files
6. Any new environment variables or secrets references

Report findings grouped by severity: CRITICAL → HIGH → MEDIUM → LOW.
If no issues found, confirm the changes are security-clean.
