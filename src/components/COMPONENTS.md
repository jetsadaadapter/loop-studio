# Components Naming and Structure Standard

เอกสารนี้คือมาตรฐานกลางสำหรับการสร้าง component ใหม่ใน `src/components`.

## Required Pre-step

ก่อนสร้าง component ใหม่ทุกครั้ง ให้เปิดอ่านไฟล์นี้ก่อน เพื่อให้ชื่อไฟล์และโครงสร้างตรงกันทั้งโปรเจกต์

## Naming Rules

- ใช้ชื่อโฟลเดอร์เป็น kebab-case เสมอ
- ตัวอย่าง: `library-guided-cta-block`, `app-category-ranking`, `profile-avatar-menu`

## Default Structure for New Components

```text
src/components/<component-name>/
  index.tsx
  styles.module.css      # optional
  data.ts                # optional
  types.ts               # optional
```

## File Responsibilities

- `index.tsx`: component หลักและ export ที่ภายนอกเรียกใช้
- `styles.module.css`: styles เฉพาะ component (ถ้ามี)
- `data.ts`: constants, fallback data, mapping data ที่เกี่ยวข้องกับ component
- `types.ts`: local types เฉพาะ component

## Import Convention

- จากภายนอก component: `@/components/<component-name>`
- ภายในโฟลเดอร์เดียวกัน: ใช้ relative import เช่น `./styles.module.css`, `./data`

## Migration Guidance for Existing Components

- ถ้ามีไฟล์คู่ที่ใช้ร่วมกัน เช่น `x.tsx` + `x.module.css` หรือ `x.tsx` + `x.data.ts` ให้รวมเป็นโฟลเดอร์ตามมาตรฐานนี้
- ไม่จำเป็นต้องรีเนมครั้งใหญ่แบบคราวเดียว ให้ค่อยๆ migrate ตอนมีงานแตะ component นั้น

## Universal Manager Blueprint

สำหรับหน้ากลุ่ม `Manage > App` และ `AI` ให้ใช้ pattern component เดียวกันเพื่อลดภาระการเรียนรู้

### Recommended Component Set

```text
src/components/manager-shell/
  index.tsx
  styles.module.css

src/components/manager-toolbar/
  index.tsx
  types.ts

src/components/manager-data-table/
  index.tsx
  types.ts

src/components/manager-form/
  index.tsx
  types.ts

src/components/manager-form-section/
  index.tsx

src/components/manager-delete-confirm/
  index.tsx
```

### Behavior Contract

- `manager-shell`: layout หลัก, breadcrumb, page actions
- `manager-toolbar`: search/filter/sort และ quick create
- `manager-data-table`: list rows + row actions (`edit`, `delete`, `set default`)
- `manager-form`: create/edit form แบบ single submit
- `manager-form-section`: แยก section เป็น Basic/Media/Action/Content
- `manager-delete-confirm`: 2-step confirm สำหรับ delete

### State and Key Rules

- ทุก row key ต้องใช้ `id` เท่านั้น
- ห้ามใช้ `name` เป็น React key หรือ selected identifier
- route ไปหน้า detail/edit ต้องใช้ id เช่น `/apps/<id>`

### Form Validation Rules

- map ตาม API fields โดยตรง เพื่อลด mapping ซ้ำ
- validation ที่ผูกกับ `linkType` ต้องอยู่ใน form layer และแสดง error ใกล้ field
- ปุ่ม `Save` มี loading state และ disable ซ้ำซ้อนระหว่าง submit
