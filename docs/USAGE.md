# คู่มือใช้งาน Loop Studio — สั่งงานทีม AI Agents ด้วย Goal เดียว

Loop Studio คือแดชบอร์ดสำหรับสั่งให้ AI coding agents ทำงานกับโปรเจกต์อื่นบนเครื่องเดียวกัน
ผ่าน loop 6 ขั้น: **PLAN → BUILD → VERIFY → AUTOMATE → OBSERVE → LEARN**

เอกสารนี้เน้นโหมด **Delegate to AI Agent Team** — พิมพ์ goal ครั้งเดียวแล้วให้ทีม agents
แจกงานกันทำอัตโนมัติ (implement อยู่ที่
`src/app/api/loop-projects/[projectId]/tasks/[taskId]/collaborate/route.ts`)

## การเตรียมครั้งแรก

1. รันแอป: `npm run dev` แล้วเปิด `http://localhost:3000`
2. **ลงทะเบียนโปรเจกต์** ที่หน้า `/`:
   - **Register Existing** — ชี้ path ของโปรเจกต์ที่มีอยู่แล้วบนเครื่อง
   - **Bootstrap Project** — สร้างโปรเจกต์ใหม่จาก template (Next.js / Vite React / โฟลเดอร์เปล่า)
3. **ตั้งค่า API key** ที่หน้า `/agents`:
   - รองรับ Anthropic (`sk-ant-…`) หรือ Google AI Studio (`AIza…` — มี free tier)
   - ระบบเลือก provider ให้อัตโนมัติจาก prefix ของ key
   - key เก็บใน localStorage ของเบราว์เซอร์เท่านั้น ไม่ถูกส่งไปไหน
   - ทางเลือก: ตั้ง `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` ใน `.env.local` (ดู `.env.example`)
   - ไม่มี key ก็ใช้ได้ — ดูโหมด IDE Bridge ด้านล่าง
4. **เช็คทีม agents** ที่หน้า `/agents` — โหมด delegate ต้องมีทีมหลักครบ 4 คน
   (Somchai/Architect, Somsri/Developer, Wichai/QA, Preecha/Auditor — มีมาให้เป็น default;
   ถ้าลบไปให้ลบ `.antigravity/loop-agents.json` แล้วรีเฟรชเพื่อ restore)

## สั่งงานด้วย Goal เดียว (Delegate to AI Agent Team)

1. หน้า `/[projectId]` → กด **Create Task** → ใส่ชื่องาน + target files
   (ระบบคำนวณ Risk Tier จาก import fan-out ของไฟล์ให้อัตโนมัติ)
2. กด **Enter Loop** เข้า task workspace (`/[projectId]/tasks/[taskId]`)
3. ที่ chat panel กดปุ่มรูปคน (Users icon) **"Delegate to AI Agent Team"**
4. พิมพ์ goal / instructions แล้วส่ง

จากนั้นระบบรัน pipeline 5 ขั้นอัตโนมัติ:

| ขั้น | Agent | ทำอะไร |
|---|---|---|
| 1 | Somchai (Architect) | วิเคราะห์ goal วางแผนไฟล์ที่ต้องแก้ |
| 2 | Somsri (Developer) | เขียนโค้ดจริง — `<file_edit>` blocks ถูกเขียนลงไฟล์ในโปรเจกต์ |
| 3 | Wichai (QA) | เขียน Vitest test แล้วรันจริง; ถ้า fail ส่งกลับให้ Somsri แก้ 1 รอบ |
| 4 | DevOps | รัน `npx tsc --noEmit` ตรวจ type |
| 5 | Preecha (Auditor) | ตรวจ git diff หา security issues |

ระหว่างรัน: **LogTerminal** stream ทุกขั้นแบบ real-time, ข้อความของแต่ละ agent ขึ้นใน chat
จบแล้ว task ถูกตั้งเป็น `completed` ที่ stage **OBSERVE**

5. **ปิดงาน (ตรวจโดยคนเสมอ):** ไป Observe stage → ดู diff ใน GitWorkspace →
   **Commit All** / **Publish** → Learn stage กรอก retrospective 3 ข้อ

## Plan from Goal — แตก goal เป็น backlog อัตโนมัติ

ที่หน้า `/[projectId]` แท็บ Tasks กดปุ่ม **"Plan from Goal"**:

1. พิมพ์ goal (10 ตัวอักษรขึ้นไป) → กด **Generate Plan**
2. Somchai (Architect) แตก goal เป็น task ย่อย (1–15 อัน) แต่ละอันมี:
   - **tags** อัตโนมัติจาก path ของ target files (react/vitest/nextjs/security/…)
   - **group** — task ที่แตะไฟล์เดียวกันถูกบังคับอยู่กลุ่มเดียวกัน (กันแก้ชนกัน)
   - **Risk Tier + safety nets** คำนวณจาก import fan-out จริง
3. Preview แผน — ลบ task ที่ไม่ต้องการได้ก่อน approve
4. เลือก **Add to Backlog** (เก็บไว้ก่อน) หรือ **Add & Auto-Run** (สร้างแล้วรันเลย)

Task ที่สร้างจากแผนอยู่ในคอลัมน์ `backlog` — ใช้ filter Tag ในตารางเพื่อกรองได้
(API: `POST /api/loop-projects/[projectId]/plan` — ต้องมี API key, bridge ใช้ไม่ได้)

## Auto-Run — รันทั้ง backlog จนจบและปิดงานเองตาม risk gate

Orchestrator หยิบ task จาก backlog ทีละอัน (เรียงตามกลุ่ม) แล้วรัน pipeline ทีม AI
5 ขั้นให้แต่ละ task จากนั้นปิดงานตามระดับความเสี่ยง:

- **GREEN/YELLOW + test & typecheck ผ่าน** → กรอก Learn retro เอง + `git commit`
  อัตโนมัติ + ปิด task (kanban `done`)
- **ORANGE/RED หรือ check ไม่ผ่านครบ** → หยุดที่ OBSERVE ติดป้าย "awaiting approval"
  ให้คุณตรวจ diff ก่อน แล้วกดปุ่ม **Approve** ในตารางเพื่อ commit + ปิด
- **push ไม่อัตโนมัติเสมอ** — คุณกด Publish เองหลังตรวจผลรวม

ระหว่างรันมี progress banner บนหน้าโปรเจกต์ (task ปัจจุบัน, ผลราย task, ปุ่ม
Stop after current) — สถานะ poll จาก `GET /api/loop-projects/[projectId]/auto-run`

## โหมด IDE Bridge (ฟรี ไม่ใช้ API key)

เปิดสวิตช์ **IDE Agent Bridge** (ไอคอนสายฟ้า) ใน chat panel ก่อนส่งข้อความหรือกด delegate:

- คำสั่งถูกเขียนลง `.antigravity/bridge.json` (single-slot — ทีละ 1 คำขอ)
- ฝั่ง IDE ให้สั่ง agent (เช่น Claude Code) ว่า **`run bridge`** — agent จะอ่านไฟล์
  ทำงานตาม prompt แล้วเขียนคำตอบกลับลงไฟล์เดิม (โปรโตคอลเต็มอยู่ใน `AGENTS.md` §7)
- แอป poll รอคำตอบ ~5 นาที (ยกเลิกได้จากปุ่ม Cancel บน banner)
- หรือรัน `node .antigravity/bridge-watcher.js` ทิ้งไว้เพื่อแจ้งเตือนเมื่อมีคำขอใหม่

## โหมดอื่นใน task workspace

- **Chat ตรง** — คุยกับ agent ตัวเดียว (Somsri) แนบไฟล์/รูปได้, Enter ส่ง / Shift+Enter ขึ้นบรรทัดใหม่
- **Run checks (AutoPipeline)** — รัน unit test + lint + build ครบชุดในคลิกเดียว
  ผ่านหมดจะเลื่อน stage ไป OBSERVE ให้
- **Manual loop** — เดินทีละ stage เองผ่าน Advanced controls
  (Plan อนุมัติแผน → Build copy prompt → Verify เลือก Vitest/Playwright →
  Automate รัน lint/build → Observe commit/push → Learn retrospective)
- **Version Timeline** — ดู commit ล่าสุด + revert ได้จาก panel ซ้าย

## ข้อจำกัดปัจจุบัน

- แก้บั๊กอัตโนมัติ 1 รอบต่อ task; ถ้า test ยังไม่ผ่าน task จะถูกพักรอ approve
  แทนที่จะปิดเอง
- Auto-Run รันได้ครั้งละ 1 run ต่อโปรเจกต์ และสถานะ run อยู่ใน memory —
  restart เซิร์ฟเวอร์ระหว่างรันแล้วสถานะ progress หาย (ผลงานใน task ไม่หาย)
- Plan from Goal / Auto-Run ต้องมี API key — โหมด IDE bridge ใช้ได้เฉพาะ
  chat/delegate รายครั้ง
- `git push` ไม่อัตโนมัติเสมอ — ให้คน review แล้วกด Publish เอง
- ทุกอย่างเก็บเป็นไฟล์ JSON ใน `.antigravity/` (ไม่มี database) และรันคำสั่งจริง
  บนเครื่อง — ใช้กับโปรเจกต์ local เท่านั้น แอปไม่มีระบบ auth
