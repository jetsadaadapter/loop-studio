---
description: Scaffold a new manage page (list + create + edit) following project patterns. Usage: /new-manage-page <entity-name>
---

Scaffold a complete manage page set for the entity: $ARGUMENTS

Follow this exact structure based on existing patterns in `src/app/manage/banners/` and `src/app/manage/apps/`:

## Files to create:

```
src/app/manage/<entity>/
  page.tsx                          # Server component, renders client
  manage-<entity>s-client.tsx       # List page with search/filter/pagination
  manage-<entity>-form-client.tsx   # Thin orchestrator, imports sections
  create/page.tsx                   # <ManageEntityFormClient mode="create" />
  [id]/edit/page.tsx                # <ManageEntityFormClient mode="edit" bannerId={id} />
  hooks/
    use-manage-<entity>-form-data.ts  # All form state, validation, submit
  form-sections/
    details-section.tsx             # Main content fields
    sidebar-sections.tsx            # Image, status, settings

src/core/
  interfaces/<entity>.interface.ts  # API response types
  services/<entity>.service.ts      # getManage*, createManage*, updateManage*, deleteManage*
  validators/<entity>.validator.ts  # Zod schema + payload type
```

## Steps:
1. Ask user for the entity fields (what data does it have?)
2. Create interfaces + validator + service first
3. Create hooks/use-manage-<entity>-form-data.ts
4. Create form-sections (details + sidebar)
5. Create manage-<entity>-form-client.tsx
6. Create list client + pages
7. Run `npx tsc --noEmit` + `npm run build`

Reference patterns:
- Form: `src/app/manage/banners/manage-banner-form-client.tsx`
- List: `src/app/manage/banners/manage-banners-client.tsx`
- Hook: `src/app/manage/banners/hooks/use-manage-banner-form-data.ts`
