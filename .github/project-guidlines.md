# 🚀 Internal App Store: AI Development Guidelines

This document serves as the primary source of truth for the development of the Internal App Store. All AI-generated code (GitHub Copilot, Cursor, etc.) must adhere to these standards.

## 🏗️ 1. Tech Stack Overview

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn UI (Radix UI underneath)
- **Authentication:** NextAuth.js (Gmail/Google Provider via Centralized MCP)
- **Validation:** Zod (Strict Schema Validation)
- **Architecture:** Validator Interface Pattern (Clean Architecture)

---

## 📁 2. Directory Structure

Maintain a clear separation between UI, Logic, and Data Validation. Never mix business logic directly inside UI components.

```text
├── src/
│   ├── app/                # UI Pages & Layouts (Next.js App Router)
│   ├── components/         # Shared UI (shadcn, composite components)
│   ├── core/               # Business Logic & Infrastructure (The Core)
│   │   ├── interfaces/     # TypeScript definitions & Contracts
│   │   ├── validators/     # Zod Schemas (Single source of truth)
│   │   ├── services/       # API Clients, Config Generators
│   │   └── adapters/       # Data transformers (External to Internal formats)
│   ├── hooks/              # Reusable React hooks
│   ├── lib/                # Shared utilities (auth config, db, utils)
│   └── types/              # Global types
```

---

## 🛡️ 3. Validator Interface Standard

**Principle:** Never trust external data. Every resource (App, MCP, Media, Apify) must be validated before entering the application state.

Always derive TypeScript types from Zod schemas using `z.infer<typeof Schema>`.

Security requirements for validators:

- Use strict schemas (`.strict()`) for all external payloads to reject unknown keys.
- Validate URL fields with protocol/domain constraints (`https` only and approved host allowlist).
- Enforce input size limits (`.max(...)`) for text, arrays, and nested objects to prevent abuse.
- Parse once at boundaries (API, adapters, webhook handlers); internal layers must only consume validated types.
- Convert `ZodError` to safe user-facing messages and structured logs. Never log raw sensitive payloads.

### Resource Schema Implementation Example

```typescript
// src/core/validators/resource.validator.ts
import { z } from "zod";

export const ResourceType = z.enum(["APP", "MCP", "APIFY", "MEDIA"]);

export const BaseResourceSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  type: ResourceType,
  iconUrl: z.string().url(),
});

export const MCPSchema = BaseResourceSchema.extend({
  type: z.literal("MCP"),
  config: z.object({
    command: z.string(),
    args: z.array(z.string()),
    env: z.record(z.string()).optional(),
  }),
});

// Use Discriminated Unions for scalable typing
export const AppResourceSchema = z.discriminatedUnion("type", [
  MCPSchema,
  // Add APIFY, MEDIA, WEB_APP schemas here
]);

export type AppResource = z.infer<typeof AppResourceSchema>;
```

---

## 🎨 4. UI & Design Principles (Play Store Style)

- **Visual Hierarchy:** Use Shadcn/Embla `Carousel` for featured apps and horizontal `Grid` for app categories.
- **Micro-interactions:** Use Framer Motion or Tailwind transitions for smooth hover states.
- **States:** Always handle `Loading`, `Empty`, and `Error` states using Shadcn `Skeleton` and `Alert` components.
- **Modals:** Use Shadcn `Dialog` or `Sheet` to display app details (screenshots, permissions, version history) without leaving the overview page.

---

## ⚙️ 5. Push Config & Integrations Logic

To enable "One-Click Install" for MCP/Configs:

1. **Desktop Agent / CLI:** The app must trigger a protocol handler (e.g., `company-store://install?id=123`) or provide a clear CLI sync command.
2. **Config Generation:** Use a dedicated service in `src/core/services` to transform Zod-validated data into tool-specific configurations (e.g., `claude_desktop_config.json`).

Secure MCP installation workflow (mandatory):

1. Validate install request with signed metadata (resource id, version, checksum, publisher).
2. Resolve command from server-side allowlist only. Never execute commands provided directly by clients.
3. Enforce policy checks before install: user role, environment, scope, and approval requirement.
4. Persist audit event for each action (requested, approved, installed, failed) with actor and timestamp.

Execution safety rules:

- Allowlist only known commands and fixed binary paths.
- Disallow shell interpolation and dynamic script composition.
- Restrict environment variables to approved keys.
- Run integrations with least privilege and explicit filesystem/network boundaries.

---

## 🔐 6. Auth & Security

- **Domain Restriction:** Only authorize emails ending with the designated `@company.com`.
- **RBAC:** User roles and permissions must be extracted from the Centralized MCP Auth token.
- **Middleware:** Use Next.js Middleware (`middleware.ts`) to protect all `/api` and private routes. Unauthenticated users must be redirected to the login page immediately.
- **Token Handling:** Use short-lived access tokens, rotate refresh tokens, and enforce secure cookie settings (`HttpOnly`, `Secure`, `SameSite`).
- **Secrets Management:** Never store secrets in source code or client bundles. Use managed secret storage and environment injection at runtime.
- **API Protection:** Apply rate limiting and abuse detection on auth, install, and config endpoints.
- **Security Headers:** Enforce CSP, HSTS, `X-Frame-Options`, and `Referrer-Policy` for production.
- **CSRF Protection:** Protect all state-changing routes and callback endpoints.
- **Audit Logging:** Log auth decisions, privilege changes, and install operations with redaction of sensitive values.

---

## 🤖 7. AI Code Generation Rules (Strict)

1. **Component Scoping:** Keep components small and focused (Single Responsibility). If a file exceeds 150 lines, split it into smaller sub-components.
2. **Naming Convention:** Validators use `[name].validator.ts`, components use `[Name].tsx` (PascalCase), and hooks use `use[Name].ts` (camelCase).
3. **Error Handling:** Use `ZodError` for validation and display user-friendly messages via Shadcn `Toast`. Never expose raw stack traces to the UI.
4. **Client vs Server:** Explicitly use `"use client"` only when React hooks (`useState`, `useEffect`, context) or event listeners are required. Default to Server Components.

---

## ✅ 8. Security Baseline & Delivery Checklist

Every feature and release must pass the following checks:

1. **Authorization:** API routes enforce role checks server-side; no client-side-only authorization.
2. **Validation:** External inputs validated with strict schemas and bounded sizes.
3. **Secrets:** No credentials in repository, logs, or browser-visible payloads.
4. **Install Safety:** MCP execution uses allowlisted commands with audit trail.
5. **Observability:** Security-relevant events are logged and monitored.
6. **Testing:** Include at least one positive and one negative auth/permission test per protected flow.
7. **Dependency Hygiene:** Run dependency vulnerability checks in CI for each pull request.
