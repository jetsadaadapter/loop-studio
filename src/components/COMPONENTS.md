# Components Naming and Structure Standard

เอกสารนี้คือมาตรฐานกลาง **และสารบัญของจริง** สำหรับ component ใน `src/components`
และ component ประจำ route ใน `src/app/**/components`

## Required Pre-step

ก่อนสร้าง component ใหม่ทุกครั้ง ให้เปิดอ่านไฟล์นี้ก่อน — เพื่อหาว่ามีของเดิมให้ใช้อยู่แล้วหรือไม่
โดยไม่ต้องไล่ grep ทั้ง tree และเพื่อให้ชื่อไฟล์กับโครงสร้างตรงกันทั้งโปรเจกต์

**เมื่อเพิ่ม ย้าย หรือลบ component ให้แก้ไฟล์นี้ใน commit เดียวกัน**
สารบัญที่ไม่มีคนดูแลแย่กว่าไม่มีสารบัญ — ก่อนหน้านี้ไฟล์นี้ค้างอยู่ 3 เดือน
และสั่งให้ใช้ component 3 ตัวที่ไม่เคยถูกสร้างขึ้นมาจริง

---

## Inventory

### UI primitives — `src/components/ui/`

shadcn/ui + @base-ui/react ทั้งหมด 32 ตัว ห้ามแก้ตัว primitive เพื่อ caller รายเดียว ให้ wrap แทน
(ไฟล์ `*.test.tsx` คู่กันคือ unit test ไม่ใช่ component)

| กลุ่ม | ไฟล์ |
|---|---|
| ฟอร์ม | `input` `textarea` `label` `select` `checkbox` `switch` `field` `input-group` `tag-input` `calendar` `image-upload` |
| ปุ่ม / action | `button` `dropdown-menu` `modal-close-button` |
| ชั้นซ้อน | `dialog` `sheet` `popover` `tooltip` `collapsible` |
| แจ้งเตือน | `sonner` `custom-toast` `alert-dialog-toast` |
| แสดงผล | `card` `table` `badge` `avatar` `separator` `skeleton` |
| manage page | `manage-create-button` `manage-search-input` `manage-filter-select` `manage-refresh-button` |
| ไม่ใช่ component | `typography-presets.ts` — token ของ type scale |

### Shared components — `src/components/<name>/`

| โฟลเดอร์ | ไฟล์ | หน้าที่ |
|---|---|---|
| `manager-shell/` | `index.tsx` | layout หลักของหน้า manage, breadcrumb, page actions |
| `manager-toolbar/` | `index.tsx` `types.ts` | search / filter / sort และ quick create |
| `manager-pagination/` | `index.tsx` | ตัวแบ่งหน้าของ list |
| `manager-actions-dropdown/` | `index.tsx` | เมนู action ต่อ row (`edit`, `delete`, `set default`) |
| `manager-delete-confirm/` | `index.tsx` | ยืนยันลบแบบ 2 ขั้น |
| `toast-provider/` | `index.tsx` | provider ของ toast |

### Route components — `src/app/**/components/`

component ที่ route เดียวใช้ ให้อยู่ในโฟลเดอร์ของ route นั้น อ่านเพื่อนบ้านในโฟลเดอร์ก่อนเพิ่มของใหม่

| Route | จำนวน | เนื้อหา |
|---|---|---|
| `[projectId]/components/` | 8 | board / task / walkthrough view, view tabs, workspace header, connect-git modal |
| `agents/components/` | 4 | agent avatar, stat card, success trend chart, task volume heatmap |
| `[projectId]/tasks/[taskId]/components/` | 1 | worktree panel |

### Data layer — `src/core/`

`interfaces/` · `services/` · `validators/` — ไม่มี JSX เรียกผ่าน service layer เสมอ ห้าม fetch ตรงจาก component

---

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

---

## Universal Manager Blueprint

สำหรับหน้ากลุ่ม `Manage > App` และ `AI` ให้ใช้ pattern เดียวกันเพื่อลดภาระการเรียนรู้

### สถานะจริงของชุด component

| Component | สถานะ |
|---|---|
| `manager-shell` | ✅ มีอยู่ |
| `manager-toolbar` | ✅ มีอยู่ |
| `manager-delete-confirm` | ✅ มีอยู่ |
| `manager-pagination` | ✅ มีอยู่ (เอกสารเดิมไม่ได้ระบุ) |
| `manager-actions-dropdown` | ✅ มีอยู่ (เอกสารเดิมไม่ได้ระบุ) |
| `manager-data-table` | ❌ **ไม่เคยถูกสร้าง** — ปัจจุบันประกอบ table เองในหน้า route ด้วย `ui/table` |
| `manager-form` | ❌ **ไม่เคยถูกสร้าง** — form อยู่ในหน้า route ของตัวเอง |
| `manager-form-section` | ❌ **ไม่เคยถูกสร้าง** — ไม่มีโฟลเดอร์ `form-sections/` ใน repo |

3 ตัวล่างคือของที่ **ตั้งใจจะทำแต่ยังไม่ได้ทำ** อย่าเขียนโค้ดที่ import มัน
ถ้าจะสร้างจริงให้สร้างแล้วมาแก้ตารางนี้ ถ้าไม่สร้างก็ประกอบจาก `ui/` ตามที่ route อื่นทำอยู่

### Behavior Contract

- `manager-shell`: layout หลัก, breadcrumb, page actions
- `manager-toolbar`: search/filter/sort และ quick create
- `manager-actions-dropdown`: row actions (`edit`, `delete`, `set default`)
- `manager-delete-confirm`: 2-step confirm สำหรับ delete
- `manager-pagination`: แบ่งหน้าของ list

### State and Key Rules

- ทุก row key ต้องใช้ `id` เท่านั้น
- ห้ามใช้ `name` เป็น React key หรือ selected identifier
- route ไปหน้า detail/edit ต้องใช้ id เช่น `/apps/<id>`

### Form Validation Rules

- map ตาม API fields โดยตรง เพื่อลด mapping ซ้ำ
- validation ที่ผูกกับ `linkType` ต้องอยู่ใน form layer และแสดง error ใกล้ field
- ปุ่ม `Save` มี loading state และ disable ซ้ำซ้อนระหว่าง submit
