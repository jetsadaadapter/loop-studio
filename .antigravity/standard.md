# Antigravity Standard & Source of Truth

> **Target Audience**: AI Agents (Antigravity, Cursor, etc.) and Human Developers.
> **Role**: Senior Full Stack Architect
> **Purpose**: The ultimate source of truth for Project DNA, Architecture, Coding Standards, and AI Agent Protocols.

## 1. Project DNA (Tech Stack)

This project is built for high performance, maintainability, and security.

- **Framework**: Next.js 16.2.4 (App Router)
- **Library**: React 19.2.4
- **Language**: TypeScript 5 (Strict Mode)
- **Styling**: Tailwind CSS 4, clsx, tailwind-merge, class-variance-authority, tw-animate-css
- **UI Components**: shadcn, @base-ui/react, lucide-react (Icons)
- **Validation & Schema**: Zod 4.3.6
- **Authentication**: NextAuth 4.24.14 & Zero Trust login script (`zt_token` cookie flow)
- **Markdown**: react-markdown

## 2. Architecture & Folder Structure

The project follows a **Feature & Domain-based** architecture, strictly separating UI from Business Logic.

```text
src/
├── app/          # Next.js App Router (Pages, API Routes, Layouts)
├── components/   # Reusable UI Components (Strict naming convention)
├── core/         # Core Domain & Business Logic (DO NOT mix with UI)
│   ├── adapters/   # External API / DB integrations
│   ├── interfaces/ # TypeScript domain definitions
│   ├── services/   # Business logic & operations
│   └── validators/ # Zod schemas for boundary validation
├── hooks/        # Custom React Hooks
├── lib/          # Shared utilities and configurations
├── types/        # Global TypeScript types
└── proxy.ts      # Route protection, Security, and CSP enforcement
```

## 3. Coding Excellence

- **TypeScript**: Strict typing is mandatory. No `any`. Use interfaces for objects and Zod for runtime boundary validation.
- **Naming Conventions**:
  - **Folders**: `kebab-case` (e.g., `manager-form-section`)
  - **React Components**: `PascalCase` function names.
  - **Variables/Functions**: `camelCase`.
- **Component Pattern**: All new components MUST follow: `src/components/<component-name>/index.tsx`. Include `styles.module.css`, `data.ts`, `types.ts` only when necessary.
- **Server vs Client**: Default to Server Components. Use `"use client"` *only* when interactivity or React hooks are strictly required.
- **Data Normalization**: Normalize all UI fields that may be objects or strings before rendering. (e.g., `{typeof category === "string" ? category : category?.name || ""}`).
- **Security**: Do not weaken CSP or remove nonce-based CSP flow (`src/proxy.ts`). Maintain the `zt_token` flow.

## 4. AI Agent Protocol

All AI Agents **must** follow this workflow for every task:

1. **Analyze First**: Do not jump into code immediately. Read requirements thoroughly.
2. **Consult Knowledge Base**: Review `AGENTS.md`, `.github/project-guidlines.md`, and this `standard.md` before proceeding. If modifying UI, read `src/components/COMPONENTS.md`.
3. **Plan**: List files that will be created/updated. Break work into small, verifiable steps. State which files will change and how.
4. **Execute**: Write clean, maintainable code keeping business logic in `src/core/` and UI logic in `src/components/` or `src/app/`. Keep token usage efficient.
5. **Verify (Pre-merge checks)**:
   - Run type checks and linters.
   - Run `npm run build`.
   - Ensure auth-critical routes (`/login`, `/callback`, `/apps`) still behave correctly.
6. **Summarize**: Explain what changed concisely. Do NOT remove existing code unless explicitly required or completely obsolete.

## 5. Definition of Done (DoD)

A task or feature is considered "Done" when:

- [ ] Code successfully compiles and passes `npm run build`.
- [ ] No TypeScript errors or ESLint warnings remain.
- [ ] Business logic resides entirely in `src/core/` (Services/Adapters) and is decoupled from the UI layer.
- [ ] Zod validation is implemented for all external data boundaries.
- [ ] UI Components follow the designated structure (`kebab-case` folder, `index.tsx`).
- [ ] No secrets or sensitive keys are hardcoded or added to the repository.
- [ ] Auth paths and CSP rules remain intact and secure.
