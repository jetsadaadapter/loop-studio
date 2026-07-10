# UI/UX & Frontend Design System Guidelines (DESIGN.md)

เอกสารนี้คือมาตรฐานการออกแบบ (Design System) และคู่มือการเขียนโค้ดหน้าตา UI/UX สำหรับโครงการนี้ เพื่อให้การจัด Layout และสร้าง Component ใหม่ทั้งหมดอยู่บนมาตรฐานระดับพรีเมียม สวยงาม และคงเส้นคงวา (Premium Aesthetic Continuity)

---

## 1. 🤖 AI Agent Instruction (System Prompt สำหรับใช้ควบคุม AI)

เมื่อมีการสั่งงานให้สร้างหน้าจอ (Layout) หรือชิ้นส่วนหน้าจอ (Component) ใหม่ ให้ป้อนข้อกำหนดนี้แก่ AI ทุกครั้ง:

```text
คุณคือ Senior UI/UX Architect ในโครงการ Next.js (Tailwind CSS v4 & shadcn/ui)
โปรดปฏิบัติตามแนวทางการออกแบบใน DESIGN.md และกฎโครงสร้างใน src/components/COMPONENTS.md:
1. การสร้าง Component ใหม่ต้องสร้างเป็นโฟลเดอร์ kebab-case (มี index.tsx, types.ts, data.ts)
2. ห้ามเขียนโค้ดไฟล์ใดเกิน 300 บรรทัดโดยเด็ดขาด ให้แบ่งเป็น Component ย่อยอย่างสะอาดตา
3. ใช้ฟอนต์ Sukhumvit Set เป็นหลักสำหรับภาษาไทย (ผ่าน html:lang(th))
4. ใช้สีหลัก --color-brand (#607456) และผสมผสานโทนสีหรูหรา --color-terracotta (#BA6A4C) หรือ --color-dark-red (#7B2525) สำหรับหน้าฝั่งผู้ใช้งาน
5. ออกแบบ UI ให้มีความพรีเมียม (Premium Aesthetics): ใช้พื้นหลัง Glassmorphism, ขอบโค้งมนละมุน (rounded-xl), อนิเมชันเปิดตัวละเมียดละไม (motion-hero-enter) และเอฟเฟกต์โฮเวอร์ที่มีมิติ (shadow-md hover:shadow-indigo-500/2)
6. ตรวจสอบและ Normalize ข้อมูลที่เป็น Object หรือ String ก่อนแสดงผลเสมอ เพื่อป้องกันแอปพัง เช่น:
   {typeof category === "string" ? category : category?.name || ""}
```

---

## 2. Typography & Font Hierarchy (ระบบตัวอักษร)

เรากำหนดขนาดตัวอักษรและระยะเว้นผ่าน Utility classes พิเศษใน `globals.css` ห้ามตั้งค่าขนาด font เป็นค่าพิกเซลแบบสุ่ม ให้เลือกใช้คลาสเหล่านี้:

| Utility Class | การใช้งานหลัก | คุณลักษณะพิเศษด้านดีไซน์ |
| :--- | :--- | :--- |
| **`.typo-display`** | หัวข้อหลักหน้าแรก, Page Hero Title | Responsive (clamp), `text-wrap: balance` |
| **`.typo-title`** | หัวข้อส่วน (Section Title), หัวการ์ด | `text-wrap: balance` หลีกเลี่ยงคำตกหล่นเดี่ยว |
| **`.typo-body`** | เนื้อหาบทความ, รายละเอียดผลิตภัณฑ์ | `text-wrap: pretty` จัดระยะบรรทัดอ่านสบายตา |
| **`.typo-caption`** | ข้อมูลประกอบขนาดเล็ก, แท็กสถานะ | ตัวพิมพ์ใหญ่ทั้งหมด (Uppercase) เพิ่มความน่าเชื่อถือ |

### 🇹🇭 Thai Font Optimization Rule:
- สำหรับเนื้อหาภาษาไทย ระบบจะจัดลำดับความสำคัญของฟอนต์ด้วย `Sukhumvit Set` ขึ้นก่อนเสมอ (`html:lang(th)`) เพื่อคงความทันสมัยและสวยงามตามรูปแบบขององค์กร

---

## 3. Color Tokens & Theme System (ระบบสีและโทนหลัก)

โปรเจกต์นี้ใช้สีที่ผ่านการเลือกสรรอย่างประณีต ห้ามใช้รหัสสีดิบ (Raw Hex) ให้เลือกใช้ผ่านตัวแปรสีในระบบ Tailwind v4 ต่อไปนี้:

```text
🟢 สีเน้นหลักของแบรนด์ (Brand Accent):
   ├── --color-brand         : #607456 (สีเขียว Sage Green แบรนด์หลัก)
   └── --color-brand-strong  : #4b5c43 (สีเขียวเข้มสำหรับสถานะ Hover หรือ Active)

🟡 โทนสีประกอบและสีเน้นพรีเมียม (Premium Palette Hues):
   ├── --color-cream         : #EEE0CC (สีครีม สำหรับโทนสว่างอบอุ่น)
   ├── --color-terracotta    : #BA6A4C (สีส้มอิฐพรีเมียม สำหรับปุ่มเน้น/เน้นจุดสนใจ)
   └── --color-dark-red      : #8E1616 (สีแดงเข้มสำหรับสถานะอันตรายหรือลบ)

🎨 พาเลทสีสำหรับพื้นหลังเอเจนต์ (AI Developer Team Card Backgrounds):
   ├── --color-agent-1       : #C4DFDF (สีฟ้าอมเขียวมินต์ Soft Mint Blue-Green)
   ├── --color-agent-2       : #D2E9E9 (สีมินต์จาง Light Mint Tint)
   ├── --color-agent-3       : #E3F4F4 (สีมินต์สว่างพิเศษ Very Light Mint Off-White)
   └── --color-agent-4       : #F8F6F4 (สีเทาขาวอบอุ่น Warm Light Grey)

⚪ โทนสีปกติสำหรับการจัดระเบียบ (Clean Minimalist):
   ├── bg-slate-50/30 หรือ bg-white (พื้นหลังการ์ดสะอาด)
   └── border-slate-200/50 หรือ border-slate-200/60 (เส้นขอบจาง ๆ)
```

---

## 4. Premium Motions & Background Effects (อนิเมชันและเอฟเฟกต์พื้นหลัง)

เพื่อมอบความรู้สึกอันหรูหรา (WOW Effect) ให้กับผู้ใช้งานหน้าบ้าน ให้ประยุกต์ใช้เอฟเฟกต์ต่อไปนี้:

### A. Cinematic Reveal Animation (อนิเมชันการเปิดตัวแบบภาพยนตร์)
ใช้คลาสหน่วงเวลาจางขึ้น (Fade Rise) เพื่อให้เนื้อหาค่อย ๆ โผล่ขึ้นมาอย่างนุ่มนวล:
- **`.motion-hero-enter`**: สำหรับ Page Hero Title ด้านบนสุด
- **`.motion-enter-1`**: สำหรับข้อมูลกลุ่มแรก (ดีเลย์ 100ms)
- **`.motion-enter-2`**: สำหรับกลุ่มถัดไป (ดีเลย์ 250ms)
- **`.motion-enter-3`**: สำหรับกลุ่มถัดไป (ดีเลย์ 400ms)

### B. Ambient Glassmorphism Bubbles (ลูกบอลแสงพื้นหลัง)
สำหรับหน้าฝั่งผู้ใช้งานทั่วไป (Client-facing App) ให้ตกแต่งพื้นหลังด้วยแสงเบลอขยับได้เสมอ:
```tsx
{/* วางไว้ในตำแหน่งบนสุดภายใต้ container หลัก */}
<div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
  <div className="about-bubble-1 animate-blob rounded-full blur-3xl absolute opacity-60" />
  <div className="about-bubble-2 animate-blob-reverse rounded-full blur-3xl absolute opacity-60" />
</div>
```

---

## 5. Layout & Interactive Component Rules (ข้อกำหนดการเขียนโค้ด)

### A. กฎการควบคุมขนาดของไฟล์ (300 Lines Limit Rule)
- ไฟล์โค้ดทุกไฟล์ (โดยเฉพาะไฟล์ `.tsx`) **ต้องไม่เกิน 300 บรรทัด** 
- หากพบว่าโค้ดมีความซับซ้อนและเริ่มยาวขึ้น ให้แยกโฟลเดอร์ของ Component ย่อยทันทีเพื่อความระเบียบและง่ายต่อการทำสอบแบบย่อย (Unit Testing)

### B. สถาปัตยกรรม Component (จาก COMPONENTS.md)
- สร้างโฟลเดอร์ใน `src/components/` โดยใช้ชื่อแบบ `kebab-case` เสมอ
- ไฟล์ภายในโฟลเดอร์ประกอบด้วย:
  - `index.tsx` (ตัวควบคุมหลัก)
  - `types.ts` (เก็บไทป์เฉพาะที่ใช้ในส่วนนั้น)
  - `data.ts` (เก็บ Mock data หรือ Constants ประจำ component)
  - `styles.module.css` (Style พิเศษเพิ่มเติม - *ถ้าจำเป็น*)

### C. การป้องกันแอปพลิเคชันล่ม (Data Boundary Safety)
- ทุกครั้งที่จะทำการแสดงผลข้อมูลที่ดึงมาจาก API หรือตัวแปรภายนอกที่เป็นไปได้ทั้งสตริงและวัตถุ (เช่น `category`) **ต้องทำการตรวจสอบและแปลงให้เป็นข้อความปกติเสร็จสรรพก่อนเอาไปใช้งานเสมอ**:
  ```tsx
  {typeof category === "string" ? category : category?.name || ""}
  ```

### D. ระบบการจัดการหลังบ้าน (Universal Manager Blueprint)
สำหรับโครงสร้างหน้าบริหารจัดการ (Manage / Back-office):
- ใช้เซ็ต Component ตระกูล `manager-*` เพื่อควบคุมหน้าตาให้สอดคล้องกัน ได้แก่ `manager-shell`, `manager-toolbar`, `manager-data-table`, `manager-form`, `manager-form-section`, และ `manager-delete-confirm`
- **React Key Rule**: ทุก ๆ รายการแถวในตารางหรือลูปข้อมูล **ต้องใช้ `id` เป็น Key หรือตัวระบุเท่านั้น** ห้ามใช้ `name` หรือคีย์อื่น ๆ เพื่อป้องกันความล่าช้าในขั้นตอน Cascading React Renders
