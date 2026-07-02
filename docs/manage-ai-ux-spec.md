# Manage App + AI Model UX Spec

## Objective

Design a universal, low-friction admin experience for `Manage > App` and `AI (Model Manager)`.
The UI must minimize steps, use consistent interaction patterns, and bind all records by `id` (never `name`).

## API Inputs (Provided)

### Manage App

- `GET /manage/apps`
- `POST /manage/apps`
- `PATCH /manage/apps/:id`
- `DELETE /manage/apps/:id`

App payload fields:

- `id`
- `name`
- `category`
- `description`
- `imageId`
- `iconId`
- `instructions`
- `ctaLabel`
- `ctaLink`
- `linkType` (`internal` | `external` | `instruction`)
- `isActive`
- `sortOrder`
- `badgeLabel`
- `tags[]`

## UX Principles

1. Universal pattern: `List -> Edit/Create -> Save -> Toast -> Return`.
2. Single-screen form: avoid multi-step wizard unless mandatory.
3. Immediate clarity: show status, action link type, and updated time in list.
4. Safe destructive actions: 2-step delete confirmation.
5. ID-first identity: all selection, routing, and updates use `id`.

## Information Architecture

- `Manage`
  - `App`
    - App list
    - Create app
    - Edit app
    - Delete confirm
  - `AI`
    - Model list
    - Model edit/create
    - Set default model
    - Inline test prompt panel

## Manage > App Workflow

### Happy Path: Create App

1. Open `Manage > App`.
2. Click `Create App`.
3. Fill required fields (`name`, `category`, `linkType`, `sortOrder`).
4. Fill optional fields (`description`, `instructions`, media, tags, CTA fields).
5. Click `Save`.
6. Show success toast.
7. Return to list and highlight created row.

### Happy Path: Edit App

1. Search/filter app from list.
2. Click `Edit` on row.
3. Update fields.
4. Click `Save`.
5. Show success toast and refresh row.

### Happy Path: Delete App

1. Click `Delete` on row.
2. Confirmation modal displays app `name` + `id`.
3. User confirms.
4. Remove row and show success toast.

## AI Model Manager Workflow

### Happy Path: Set Default Model

1. Open `Manage > AI`.
2. Select a row.
3. Click `Set Default`.
4. Update list state immediately.
5. Show success toast.

### Happy Path: Edit Model Policy

1. Click `Edit`.
2. Update `temperature`, `maxTokens`, `isActive`.
3. Optionally run `Test Prompt` in side panel.
4. Click `Save`.

## Validation Rules

### App Form

- `name`: required, max 120
- `category`: required
- `sortOrder`: integer >= 0
- `linkType`:
  - `internal` => `ctaLink` required and starts with `/`
  - `external` => `ctaLink` required and starts with `https://`
  - `instruction` => `ctaLink` optional
- `tags`: array of tag IDs

### AI Form

- `model`: required
- `provider`: required
- `temperature`: number 0.0 to 2.0
- `maxTokens`: integer > 0

## Wireframe (Low Fidelity)

### A) Manage > App List

```text
+--------------------------------------------------------------------------------+
| Manage / App                                                    [Create App]   |
+--------------------------------------------------------------------------------+
| Search [.....................]  Category [All]  Status [All]  LinkType [All]  |
+--------------------------------------------------------------------------------+
| Name                 Category   LinkType      Active  Sort  Updated      Action |
| Media Mix            MCP        instruction   ON      3     2026-05-06   Edit   |
| Facebook Analyzer    Tool       internal      ON      4     2026-05-06   Edit   |
+--------------------------------------------------------------------------------+
```

### B) App Create/Edit

```text
+--------------------------------------------------------------------------------+
| Edit App: Media Mix                                          [Cancel] [Save]  |
+--------------------------------------------------------------------------------+
| BASIC      : name, category, isActive, badgeLabel, sortOrder                    |
| MEDIA      : imageId, iconId                                                    |
| ACTION     : linkType, ctaLabel, ctaLink                                        |
| CONTENT    : description, instructions, tags[]                                  |
+--------------------------------------------------------------------------------+
```

### C) AI Model Manager

```text
+--------------------------------------------------------------------------------+
| Manage / AI Models                                               [Add Model]   |
+--------------------------------------------------------------------------------+
| Provider [All]  Task [All]  Status [Active]                                   |
+--------------------------------------------------------------------------------+
| Model           Provider   Temp  MaxTokens  Default  Status   Updated         |
| gpt-4.1-mini    OpenAI     0.2   1500       Yes      Active   2026-05-06      |
| gpt-4.1         OpenAI     0.7   3000       No       Active   2026-05-06      |
+--------------------------------------------------------------------------------+
| Side panel: Test Prompt -> Output Preview -> Latency/Token Summary             |
+--------------------------------------------------------------------------------+
```

## Universal Component Blueprint

- `manager-shell`: page shell, title, breadcrumb, primary actions.
- `manager-toolbar`: search, filters, quick actions.
- `manager-data-table`: universal list table with row actions.
- `manager-form`: create/edit form with section slots.
- `manager-form-section`: grouped field sections.
- `manager-delete-confirm`: destructive confirmation.

## Acceptance Criteria

1. Manage App CRUD UI references row identity by `id` only.
2. App detail links are generated as `/apps/{id}`.
3. AI manager supports default model selection in one click.
4. Form validation is shown at field level.
5. Delete flow requires explicit confirmation.
6. List pages support search and at least one filter.

## Notes for Implementation

- Prefer server-driven list fetch for first render; use client state for edit interactions.
- Keep save actions idempotent where possible.
- Preserve consistent button placement (`Cancel` left, `Save` right).
