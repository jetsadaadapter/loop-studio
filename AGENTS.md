<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Internal Library: Agent Rules

This file is the execution guide for coding agents in this repository.

Canonical engineering rules are maintained in `.github/project-guidlines.md`.
When these files diverge, update both in the same change.

## 1. Source of Truth

- Product/developer docs: `README.md`
- Engineering rules: `.github/project-guidlines.md`
- Agent behavior rules: `AGENTS.md` (this file)

## 2. Current App Model (Must Match Code)

- Main app routes:
  - `/apps`
  - `/apps/[slug]`
- Legacy routes are redirected in `next.config.ts`:
  - `/library/apps -> /apps`
  - `/library/apps/:slug -> /apps/:slug`
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

- Default to Server Components; use `"use client"` only when required
- Keep business logic in `src/core/services` and `src/core/adapters`, not in UI
- Validate external data with strict Zod schemas at boundaries
- Avoid unrelated refactors in focused fixes

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
