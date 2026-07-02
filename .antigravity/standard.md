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
- **File Length Limits (300 Lines Rule)**: To maintain modularity, readability, and high developer efficiency, keep code files concise. Under ordinary circumstances, code files **must not exceed 300 lines**. If component rendering or service business logic exceeds this threshold, actively refactor by splitting them into smaller, focused sub-components (under a matching kebab-case folder structure), standalone hooks, or isolated utility/service helpers.
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

## 6. UX, Validation, & Spacing Standards

- **App Form Validation & Limits**:
  - **App Name**: 3 to 50 characters, with a conditional helper description.
  - **Description**: 10 to 500 characters, with a conditional helper description.
  - **CTA Label**: Max 30 characters, with a conditional helper description.
  - **CTA Link**: Immediately validated on `onChange` to prevent React state race conditions. Internal path must match a whitelist of root segments (`about`, `apps`, `callback`, `dashboard`, `images`, `library`, `login`, `manage`, `tool`, `tools`). Typoed tool paths (e.g. `/toool/`) are blocked; dynamic Tool IDs must be length >= 8 and cannot contain hyphens.
  - **Clean UI**: Always hide form helper descriptions when field validation errors are shown to prevent redundancy.
- **Detail Layout & Screenshots**:
  - **Screenshot Hide**: If `imageUrl` is empty, completely hide the Screenshot container.
  - **About Spacing**: When screenshots are hidden, dynamically remove the About section's top border (`border-t`) and top padding (`pt-0`), and apply `pb-8` to ensure tags have adequate breathing room above subsequent sections.
- **End-User Tool Execution Use Case**:
  - ขั้นตอนการใช้งานของ End User ตั้งแต่การกรอกพารามิเตอร์, การคลิกส่งรัน, การเฝ้าติดตามผลสถานะงานบน Sidebar จนถึงการคลิกเปิดดูผลลัพธ์ใน Modal จะต้องสอดคล้องตามลำดับความต้องการในการใช้งาน (Use Case Flow) ที่ระบุไว้ในแผนภาพ Mermaid ของ `README.md` (หัวข้อ 3.1) อย่างเคร่งครัด เพื่อสร้างประสบการณ์ใช้งานที่ลื่นไหลและไร้รอยต่อ

## 7. Premium UI/UX Design System (2026 Apple-Level standard)

All UI elements, execution controls, and information grids built within this repository must strictly adhere to the following Apple-Level Design guidelines:

- **Clarity & Restraint**:
  - Strip generic high-contrast backgrounds and reduce decorative coloring. Color must serve a **functional** purpose (e.g. green for Success, amber for Running, red for Failed).
  - Borders should be extremely thin (`border border-slate-200/60` or `border-zinc-200/50`) to keep structural panels clean and quiet.
- **Glassmorphic Card Elevation**:
  - Components like forms, tool summaries, and historical lists should be wrapped in individual cards (`bg-white rounded-2xl border border-slate-200/60 shadow-xs`) with subtle elevation translations on hover (`hover:-translate-y-0.5 hover:shadow-xs hover:border-slate-350 transition-all duration-300`).
  - Active items must render a left-aligned vertical color-stripe accent (`bg-gradient-to-b from-brand to-indigo-650 absolute left-0 w-1.5`) and indigo-accented borders to ensure immediate visual identity.
- **Glowing & Saturated Status Indicators**:
  - Badges representing critical states or AI-parsed sentiments must be designed with highly-saturated, solid colors and bold white font layers, accompanied by matching glowing drop shadows (e.g. `bg-emerald-500 text-white shadow-emerald-500/20` for Positive sentiment or Completed runs).
- **Illustrative Empty States**:
  - Avoid rendering basic dashed triggers or empty boxes when a configuration list is uninitialized. Always present a clean, illustrative placeholder comprising a floating, glassmorphic icon with clear instructions and immediate call-to-actions.
- **Technical Typography Alignment**:
  - Raw UUID hashes must never serve as primary title cards. Always render descriptive, human-readable titles (e.g. *"Apify Post Scraper"* or *"Gemini AI Analysis"*) and scale raw hashes down as inline technical label badges (e.g. `#f9ab5e1b` styled as text-xs bold tracking-wider).
- **Typography Alignment**:
  - Enforce UI typography using `font-sans` only. Do NOT use `font-mono` for standard UI text, numbers, metrics, or tags to maintain consistent branding.
- **Cumulative Layout Shift (CLS) Mitigation**:
  - When fetching data asynchronously, always implement high-fidelity custom skeletons matching the exact physical layout of final components, preventing layout shifting and preserving user scroll states.
