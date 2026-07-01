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

## 4. Auth and Security Guardrails

- Do not weaken CSP or remove nonce-based CSP flow unless explicitly requested
- Keep `zt_token` cookie flow intact for login/callback/logout paths
- Keep `/login`, `/callback`, `/api/auth/*` as public unless requirements change
- If adding new third-party domains:
  - Update `next.config.ts` (`images.remotePatterns` if image host)
  - Update trusted CSP sources in `src/proxy.ts`

## 5. Code Change Rules

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

## 6. Documentation Sync Policy

If code changes affect behavior or setup, update these files together:

1. `README.md` (usage/setup overview)
2. `.github/project-guidlines.md` (engineering standards)
3. `AGENTS.md` (agent execution constraints)

## 7. Pre-merge Checks

Before finishing a substantial change:

1. `npm run build` passes
2. Auth-critical routes still behave correctly:
   - `/login`
   - `/callback`
   - `/apps`
3. No secrets added to repository
