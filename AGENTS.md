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



## 2. Current App Model (Must Match Code)

- Main app routes:
  - `/apps`
  - `/apps/[id]`
  - `/manage/apps`
  - `/manage/ai`
- Legacy routes are redirected in `next.config.ts`:
  - `/library/apps -> /apps`
  - `/library/apps/:id -> /apps/:id`
- Route protection and CSP are enforced in `src/proxy.ts`
- Primary authentication flow is Zero Trust login script + callback + `zt_token` cookie

## 3. Auth and Security Guardrails

- Do not weaken CSP or remove nonce-based CSP flow unless explicitly requested
- Keep `zt_token` cookie flow intact for login/callback/logout paths
- Keep `/login`, `/callback`, `/api/auth/*` as public unless requirements change
- If adding new third-party domains:
  - Update `next.config.ts` (`images.remotePatterns` if image host)
  - Update trusted CSP sources in `src/proxy.ts`

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

**Error checks after every change:** After every code change, always run lint, type check, and build. If any error/warning or build fails, you must fix it before proceeding to the next task.

### Start-of-Task Guidelines (Required Every Time)

Before writing code on any new task, follow this sequence:

1. Always read `.antigravityrules`, `.antigravity/standard.md`, `.antigravity/best-practices.md`, and `DESIGN.md` in the project root to ensure compliance with the repository architecture, UX rules, and design tokens.
2. Do not jump into code immediately.
3. Analyze requirements first.
4. List files that will be created/updated.
5. Break work into small verifiable steps.
6. Before editing, state which files will change and how.
7. After editing, summarize what changed.
8. Do not remove existing code unless necessary.
9. Keep code readable, beginner-friendly, and easy to maintain.
10. Always account for security, maintainability, and best practices.

## 5. Documentation Sync Policy

If code changes affect behavior or setup, update these files together:

1. `README.md` (usage/setup overview)
2. `.github/project-guidlines.md` (engineering standards)
3. `AGENTS.md` (agent execution constraints)

## 6. Pre-merge Checks

Before finishing a substantial change:

1. `npm run build` passes
2. Auth-critical routes still behave correctly:
   - `/login`
   - `/callback`
   - `/apps`
3. No secrets added to repository
