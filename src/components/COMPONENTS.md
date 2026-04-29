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
