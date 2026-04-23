# 🚀 Internal App Store (Adapter Library)

ยินดีต้อนรับสู่ **Internal App Store** แพลตฟอร์มศูนย์กลางสำหรับการจัดการและติดตั้งแอปพลิเคชันภายในองค์กร (เช่น MCP, Apify, Media) พัฒนาขึ้นเพื่อให้ทีมงานภายในสามารถเข้าถึงเครื่องมือและทรัพยากรต่างๆ ได้อย่างรวดเร็วและปลอดภัย ในรูปแบบที่ใช้งานง่ายสไตล์ Play Store

## 🛠 Tech Stack

โปรเจกต์นี้พัฒนาด้วยเทคโนโลยีที่เน้นประสิทธิภาพและความปลอดภัยระดับองค์กร:

- **Framework:** [Next.js 16 (App Router)](https://nextjs.org/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components:** [Shadcn UI](https://ui.shadcn.com/) (Radix UI)
- **Typography:** `Sukhumvit Set` (Required Local Font)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/) (Google Provider via Centralized MCP)
- **Validation:** [Zod](https://zod.dev/) (Strict Schema Validation)
- **Architecture:** Validator Interface Pattern (Clean Architecture)

## ✨ ฟีเจอร์ที่พร้อมใช้งาน (Current Features)

ระบบปัจจุบันได้รับการพัฒนาและเชื่อมต่อกับ API จริงเรียบร้อยแล้ว โดยมีฟีเจอร์หลักที่ใช้งานได้ดังนี้:

- **ระบบยืนยันตัวตน (Authentication & Proxy Guard):** ปกป้องหน้าเว็บด้วยการตรวจสอบ `zt_token` ผ่าน `src/proxy.ts` หากยังไม่ล็อกอินจะถูกส่งไปหน้า `/login` ทันที
- **หน้ารวมแอปพลิเคชัน (App Store Dashboard):**
  - **Hero Banners:** แบนเนอร์แสดงแอปล่าสุดหรือแอปแนะนำ เลื่อนสไลด์ได้
  - **Top Charts (Ranking):** จัดอันดับแอปยอดนิยมแบ่งตามหมวดหมู่ (MCP, Platform, Tool)
  - **App Icons:** รองรับการทำ Image Optimization จากเซิร์ฟเวอร์ พร้อมระบบ Fallback เป็นชื่อย่อหากไม่มีรูป
- **หน้ารายละเอียดแอป (App Details Page):**
  - รองรับ Dynamic Routing (`/apps/[slug]`)
  - แสดงข้อมูลแอปแบบเจาะลึก (เวอร์ชัน, นักพัฒนา, คำแนะนำการใช้งาน)
  - มีส่วนแสดง "แอปที่เกี่ยวข้อง (Related Apps)" ด้านล่าง
- **Server-Side Data Fetching:** โหลดข้อมูลทั้งหมดจาก `library-api.adapterdigital.com` อย่างรวดเร็วด้วย Server Components

## 📁 โครงสร้างโฟลเดอร์ (Directory Structure)

เรายึดหลักการแยกส่วนระหว่าง UI, Logic และ Data Validation อย่างชัดเจน (Separation of Concerns):

```text
├── src/
│   ├── app/                # UI Pages & Layouts (Next.js App Router)
│   ├── components/         # Shared UI Components (shadcn & composite)
│   ├── core/               # Business Logic & Infrastructure (หัวใจของระบบ)
│   │   ├── interfaces/     # TypeScript definitions & Contracts
│   │   ├── validators/     # Zod Schemas (Single source of truth)
│   │   ├── services/       # API Clients, Config Generators
│   │   └── adapters/       # Data transformers (External to Internal formats)
│   ├── hooks/              # Reusable React hooks
│   ├── lib/                # Shared utilities (auth config, db, utils)
│   └── types/              # Global types
```

## 🛡️ มาตรฐานการจัดการข้อมูล (Validator Interface Standard)

เราใช้ **Zod** เป็นด่านหน้าในการทำ Validation ทุกช่องทาง เพื่อความปลอดภัยและลดข้อผิดพลาด:

- **Never trust external data:** ข้อมูลทุกอย่างจากภายนอกต้องผ่าน Validator ก่อนเข้าสู่ Application State
- **Single Source of Truth:** ใช้ `z.infer<typeof Schema>` เพื่อสร้าง TypeScript types จาก Schema เสมอ
- **Strict Validation:** ใช้ `.strict()` เพื่อป้องกัน Unknown Keys และใช้ `.max()` เพื่อจำกัดขนาดข้อมูล

ตัวอย่างการใช้งาน:

```typescript
// src/core/validators/resource.validator.ts
export const BaseResourceSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  type: ResourceType,
}).strict();
```

## 🚀 เริ่มต้นพัฒนา (Getting Started)

### 1. ติดตั้ง Dependencies

```bash
npm install
```

### 2. ตั้งค่า Environment Variables

คัดลอกไฟล์ `.env.example` ไปเป็น `.env.local` และระบุค่าที่จำเป็น

```bash
cp .env.example .env.local
```

### 3. รันโปรเจกต์ในโหมด Development

```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000) บนบราวเซอร์เพื่อดูผลลัพธ์

## 🎨 แนวทางการออกแบบ (UI & Design Principles)

เน้นความสวยงาม ลื่นไหล และพรีเมียม (Premium UX/UI):

- **Typography:** ใช้ `Sukhumvit Set` เป็นฟอนต์หลักเพื่อภาพลักษณ์ที่ทันสมัย
- **Visual Hierarchy:** ใช้ Carousel และ Grid ในการจัดหมวดหมู่แอปพลิเคชัน
- **States:** ต้องมีการจัดการ `Loading` (Skeleton), `Empty`, และ `Error` states เสมอ
- **Modals:** ใช้ Shadcn `Dialog` หรือ `Sheet` สำหรับแสดงรายละเอียดแอป (App Details)

## 🔐 ความปลอดภัยและการยืนยันตัวตน

- **Domain Restriction:** อนุญาตเฉพาะอีเมลโดเมนที่กำหนดเท่านั้น (เช่น `@company.com`)
- **Routing & Middleware Protection:** ปกป้องทุก Private Route และ API ผ่านไฟล์ `src/proxy.ts` (ใช้เป็น Proxy/Middleware หลักแทน `middleware.ts` ตามโครงสร้างของ Framework ที่ตั้งไว้) เพื่อดักจับ Token และทำการ Redirect ผู้ใช้ที่ไม่ได้รับอนุญาตกลับไปยังหน้าล็อกอิน
- **MCP Execution Safety:** มี Allowlist สำหรับคำสั่งและการทำงานของ MCP พร้อมระบบ Audit Trail
- **Secrets Management:** ห้ามจัดเก็บ Secrets ไว้ใน Source Code หรือ Client Bundle โดยเด็ดขาด

## 🤖 กฎการพัฒนา (Development Guidelines)

- **Server-First Approach:** เน้นการใช้งาน Server Components เป็นค่าเริ่มต้น (Default) เพื่อเพิ่มประสิทธิภาพ (Performance) และดึงข้อมูล (Fetch API) ตรงจาก `core/services/` ในฝั่ง Server เสมอ หลีกเลี่ยงการทำ Client-side Fetching เว้นแต่จำเป็น
- **Component Scoping:** รักษาขนาดไฟล์ให้กะทัดรัด (แนะนำไม่เกิน 150 บรรทัดต่อไฟล์)
- **Naming Convention:**
  - Validators: `[name].validator.ts`
  - Components: `[Name].tsx` (PascalCase)
  - Hooks: `use[Name].ts` (camelCase)
- **Error Handling:** ใช้ `ZodError` และแสดงข้อความที่เข้าใจง่ายผ่าน Shadcn `Toast`

---

**อ่านรายละเอียดแนวทางปฏิบัติฉบับเต็มได้ที่:** [Project Guidelines](.github/project-guidlines.md)
