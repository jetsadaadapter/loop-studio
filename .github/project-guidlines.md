# Internal Library: Project Guidelines

เอกสารนี้เป็นมาตรฐานหลักสำหรับการพัฒนาใน repository นี้ และต้องสอดคล้องกับโค้ดปัจจุบันเสมอ

## 1. Stack และ Version หลัก

- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4
- Zod 4
- NextAuth.js 4 (มี route รองรับ)
- Zero Trust Google login script flow (production flow ที่ใช้งานจริง)

## 2. โครงสร้างระบบ

```text
src/
  app/            Page routes และ layouts
  components/     Shared UI
  core/
    interfaces/   Domain/API contracts
    validators/   Zod schemas
    services/     Fetch/API service layer
    adapters/     Data adapters
  lib/            Utilities และ auth setup
  types/          Type augmentation
  proxy.ts        Route protection + CSP/security headers
```

กฎสำคัญ:

- ห้ามใส่ business logic หนักใน UI component
- Validate external input ที่ boundary ก่อนเข้า domain เสมอ
- ใช้ `z.infer` จาก schema เป็นหลัก ไม่ duplicate type แบบ manual

## 3. Auth และ Routing Policy (Current Implementation)

Flow ปัจจุบัน:

1. `/login` แสดงปุ่ม Zero Trust
2. script จาก `/login-adapterstore/login-button.js` พา login ผ่านผู้ให้บริการ
3. callback ที่ `/callback`
4. callback เรียก `/api/auth/zt-cookie` เพื่อเซ็ต `zt_token` เป็น httpOnly cookie
5. `src/proxy.ts` ตรวจ `zt_token` ทุก request ที่เข้า matcher

Public paths:

- `/login`
- `/callback`
- `/api/auth/*`

Behavior บังคับ:

- ไม่มี `zt_token` -> redirect ไป `/login`
- มี token แล้วเข้าหน้า `/login` -> redirect ไป `/apps`

หมายเหตุ:

- NextAuth route (`/api/auth/[...nextauth]`) ยังมีไว้รองรับ แต่ login UI หลักใช้ Zero Trust flow

## 4. Security Baseline

ทุก change ที่แตะ auth/network/security ต้องคงหลักต่อไปนี้:

- CSP แบบ nonce ต่อ request ผ่าน `src/proxy.ts`
- Security headers ขั้นต่ำ: `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Referrer-Policy`, `Permissions-Policy`
- Cookie auth ต้องเป็น `httpOnly` และ `secure` ใน production
- หากเพิ่ม external host (API/image/script) ต้องอัปเดต allowlist ให้ครบทั้ง CSP และ `next.config.ts`

## 5. Data Validation Standard

หลักการ:

- Never trust external data
- Parse once at boundary
- Internal layers ใช้เฉพาะ typed/validated objects

ข้อบังคับ validator:

- External payload ต้องใช้ `.strict()`
- URL field ต้อง enforce `https` และ host policy ตาม domain ที่กำหนด
- ใส่ `.max()` ให้ข้อความ, array และ nested object ที่รับจากภายนอก
- เมื่อเกิด `ZodError` ให้แปลงเป็นข้อความปลอดภัยต่อผู้ใช้ ห้าม leak raw payload

## 6. Environment Variables

กำหนดไว้ใน `.env.example` เป็น baseline ขั้นต่ำ:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `ALLOWED_EMAIL_DOMAIN`
- `NEXT_PUBLIC_STORE_API_BASE_URL`

ค่าที่รองรับเพิ่มเติม (optional):

- `NEXT_PUBLIC_ZT_AUTH_BASE_URL`
- `NEXT_PUBLIC_ZT_CLIENT_ID`
- `NEXT_PUBLIC_ZT_CALLBACK_PATH`
- `NEXT_PUBLIC_ZT_DEBUG_CALLBACK`

## 7. UI และ Frontend Rules

- ใช้ฟอนต์ local Sukhumvit Set จาก `src/app/fonts/sukhumvit-set`
- ใช้ Server Components เป็น default
- ใส่ `"use client"` เฉพาะเมื่อจำเป็นต้องใช้ state/effect/browser API
- ต้องมี loading/empty/error state สำหรับหน้าที่ดึงข้อมูล
- ข้อกำหนดเรื่อง Typography (ข้อห้ามเด็ดขาด): ทุกการสร้างองค์ประกอบบนหน้า UI (รวมถึง ข้อความ, ตัวเลข, สถิติ, ป้ายกำกับ, ปุ่ม, ID, และ metadata) จะต้องใช้คลาส `font-sans` เท่านั้น ห้ามใช้ `font-mono` บนหน้า UI ทั่วไปโดยเด็ดขาด ยกเว้นกรณีเฉพาะ เช่น กล่องแสดงโค้ดดิบ (Code Blocks), หน้าต่างแสดงผล JSON ล็อก หรือ syntax editor


### App Cover Asset Guideline

- หน้า detail ใช้ภาพ cover เดียวที่รองรับทั้ง desktop/mobile
- อัตราส่วนแนะนำ: 16:9
- ขนาดไฟล์แนะนำ (baseline): 2560x1440 px
- ขนาดขั้นต่ำที่ยอมรับได้: 1920x1080 px
- แนะนำ export เป็น WebP (หรือ AVIF) เพื่อคุมคุณภาพและขนาดไฟล์

### App Detail Layout & Spacing Guideline (Screenshots & Spacing)

- **Screenshot Display**: หากแอปพลิเคชันไม่มีรูปภาพ Screenshot อัปโหลดไว้ (`imageUrl` ว่าง) ให้ทำการ**ซ่อน (Skip) บล็อกแสดงรูปภาพ Screenshot ทั้งหมดออกไปจากหน้าจอทันที** แทนที่จะแสดงกรอบสี่เหลี่ยมสีเทาหรือข้อความบอกว่าไม่มีรูปภาพ
- **About Spacing Dynamic**:
  - เมื่อแอปพลิเคชันไม่มีรูปภาพ Screenshot ให้**นำเส้นคั่นด้านบน (`border-t`) ออก** และปรับระยะห่างด้านบนเป็น `pt-0`
  - ให้กำหนดความห่างด้านล่างของ About Section เป็น `pb-8` เสมอ เพื่อให้มั่นใจว่าป้าย Tag (เช่น MCP) มีระยะห่างที่พอเหมาะเหนือเซกชันถัดไป (เช่น Instructions) และไม่ดูชิดกับเส้นคั่นมากเกินไป

## 8. Coding Rules for Contributors and AI Agents

- ตั้งชื่อไฟล์ตาม convention:
  - Validators: `[name].validator.ts`
  - Components (new): ใช้โฟลเดอร์แบบ kebab-case เสมอ เช่น `src/components/library-guided-cta-block/`
  - Hooks: `use[Name].ts`
- ก่อนลงมือเขียนโค้ดและสร้าง component ใหม่ ต้องอ่าน `.antigravity/standard.md`, `.antigravity/best-practices.md`, และ `DESIGN.md` ใน root โฟลเดอร์ก่อนทุกครั้ง เพื่อทำความเข้าใจระเบียบโครงสร้าง สถาปัตยกรรม สี ฟอนต์ และอนิเมชันของโปรเจกต์
- แยก responsibilities ให้ไฟล์อ่านง่าย; ไฟล์ใหญ่เกินจำเป็นให้ split component/service
- **กฎจำกัดความยาวของไฟล์ไม่เกิน 300 บรรทัด (300 Lines Rule)**: เพื่อรักษาความเป็นโมดูลาร์ (Modularity) อ่านง่าย (Readability) และบำรุงรักษาได้ง่ายที่สุด ไฟล์โค้ดทั้งหมด**ห้ามมีความยาวเกิน 300 บรรทัด** หากตัวคอมโพเนนต์หรือเซอร์วิสเริ่มมีขนาดใหญ่เกินขีดจำกัดนี้ ผู้พัฒนาและ AI Agent จะต้องทำการรีแฟคเตอร์ (Refactor) โดยการแยกออกเป็นคอมโพเนนต์ย่อย (Sub-components) หรือแยกส่วนตรรกะออกไปเป็น Custom Hook หรือ Utility Service เสริมภายนอกทันที
- หลีกเลี่ยง refactor unrelated code ระหว่างแก้ issue เดียว
- หากแก้ behavior ที่กระทบเอกสาร ให้ update เอกสารนี้, `README.md`, `AGENTS.md`, `DESIGN.md`, `.antigravity/standard.md`, และ `.antigravity/best-practices.md` พร้อมกัน

### Start-of-Task Guidelines (Required Every Time)

ก่อนเริ่มเขียนโค้ดทุกครั้ง ให้ทำตามลำดับนี้:

1. อย่าเพิ่งเขียนโค้ดทันที
2. วิเคราะห์ requirement ให้ชัดก่อนลงมือ
3. ระบุไฟล์ที่จะสร้าง/แก้ไขให้ครบ
4. แบ่งงานเป็น step เล็ก ๆ ที่ทำและตรวจสอบได้
5. ก่อนแก้โค้ด ให้บอกว่าไฟล์ไหนจะเปลี่ยนและเปลี่ยนอะไร
6. หลังแก้โค้ด ให้สรุปสิ่งที่แก้ไปอย่างกระชับ
7. ห้ามลบโค้ดเดิมโดยไม่จำเป็น
8. เขียนโค้ดให้อ่านง่าย เหมาะกับผู้เริ่มต้น และดูแลง่าย
9. คำนึงถึง security, maintainability และ best practices เสมอ

### Component Structure Standard (New Components)

โครงสร้างมาตรฐานสำหรับ component ใหม่:

```text
src/components/<component-name>/
  index.tsx
  styles.module.css      # optional
  data.ts                # optional
  types.ts               # optional
```

ข้อกำหนด:

- ชื่อโฟลเดอร์ต้องเป็น kebab-case
- ไฟล์หลักของ component ใช้ชื่อ `index.tsx`
- CSS module ใช้ชื่อ `styles.module.css`
- import ให้เรียกผ่าน path ของโฟลเดอร์ เช่น `@/components/library-guided-cta-block`

## 9. Delivery Checklist

ก่อน merge ให้ตรวจอย่างน้อย:

1. Build ผ่าน (`npm run build`)
2. Routes สำคัญทำงาน: `/login`, `/callback`, `/apps`, `/apps/[id]`
3. Auth guard ทำงานถูกต้อง (redirect ตามสถานะ token)
4. ไม่มี hard-coded secrets ใน source
5. หากเพิ่มโดเมนภายนอก อัปเดตทั้ง image config และ CSP allowlist ครบ

## 10. Manage UX Standard (Universal)

ใช้กับเมนู `Manage > App` และ `AI` ทั้งหมด เพื่อให้ user เรียนรู้ครั้งเดียวและใช้ได้ทุก manager

### 10.1 Information Architecture

- หน้า list ทุก manager ต้องมี: search, filter, sort, quick actions
- หน้า edit/create ต้องเป็น single-screen form และ save จุดเดียว
- หลัง save ต้องกลับ list พร้อมแสดง success toast และ highlight row ล่าสุด

### 10.2 Manage > App API Contract Rules

- List: `GET /manage/apps`
- Create: `POST /manage/apps`
- Update: `PATCH /manage/apps/:id`
- Delete: `DELETE /manage/apps/:id`
- UI identity key: ใช้ `items.id` เป็นหลักเสมอ

ห้ามใช้ `name` เป็น key ใน:

- route params
- edit/delete actions
- selected row state
- cache key

### 10.3 Form UX Rules (App)

ฟอร์มต้องแบ่ง 4 blocks:

1. Basic (`name`, `category`, `isActive`, `badgeLabel`, `sortOrder`)
2. Media (`imageId`, `iconId`)
3. Action (`linkType`, `ctaLabel`, `ctaLink`)
4. Content (`description`, `instructions`, `tags[]`)

#### 10.3.1 Character Limits & Validation:
- **App Name**: ต้องอยู่ระหว่าง 3 ถึง 50 ตัวอักษร
- **Description**: ต้องอยู่ระหว่าง 10 ถึง 500 ตัวอักษร
- **CTA Label**: ต้องยาวไม่เกิน 30 ตัวอักษร (เฉพาะกรณี `linkType !== "instruction"`)
- **CTA Link**:
  - `internal`: ต้องขึ้นต้นด้วย `/` และมีโครงสร้าง path ที่ถูกต้อง (Whitelist: `about`, `apps`, `callback`, `dashboard`, `images`, `library`, `login`, `manage`, `tool`, `tools`)
  - `external`: ต้องเป็น `https://...`
  - `instruction`: ว่างได้
  - **Tool Link Typo Checking**: หากกรอกลิงก์ประเภท Tool (เช่น ขึ้นต้นด้วย `/to`) จะต้องอยู่ในรูปแบบ `/tool/[toolId]` หรือ `/tools/[toolId]` โดยห้ามกรอกเป็น Slug (ห้ามมีขีดกลาง `-`) และตัว ID (Dynamic Tool ID) ต้องยาวอย่างน้อย 8 ตัวอักษรขึ้นไป

#### 10.3.2 Form Spacing & Warning Displays:
- **Field Description (Helper Label)**: ทุกฟิลด์ที่มีเงื่อนไขจำกัดความยาว (Name, Description, CTA Label, CTA Link) ต้องแสดงคำอธิบายช่วยกรอก (Helper Label) เสมอ
- **Clean UI Principle**: **เมื่อฟิลด์ใดแสดง Error (สีกรอบหรือสีแดง) ให้ซ่อน Helper Label ทันที** เพื่อความสะอาดตาในการใช้งานและไม่เกิดความซ้ำซ้อนของข้อมูลบนหน้าจอ
- **Validation Responsiveness**: ฟิลด์อย่าง `ctaLink` ต้องบังคับอัปเดตสถานะ `touched` และเรียก `revalidateField` ทันทีเมื่อเกิดการเปลี่ยนแปลง (`onChange`) เพื่อแก้ไขและป้องกันสถานะ UI ตกหล่นจาก React state race conditions

### 10.4 AI Model Manager UX Rules

ทุก model record ต้องมีอย่างน้อย:

- `provider`
- `model`
- `taskType`
- `temperature`
- `maxTokens`
- `isDefault`
- `isActive`

interaction ขั้นต่ำ:

1. ตั้ง default model ได้จาก list โดยไม่ต้องเข้า edit page
2. test prompt inline ได้ก่อน save
3. แสดง `updatedAt` และ `updatedBy` ทุกครั้งเพื่อ auditability

### 10.5 Safety and Confirmation

- delete ใช้ 2-step confirmation
- unsaved changes ต้องมี guard ก่อนออกจากหน้า
- ถ้า API error ให้แสดง field-level error ก่อน generic error เสมอ
