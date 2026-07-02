# Loop Engineering Playbook

> เอกสารนี้คือระบบปฏิบัติงานมาตรฐานสำหรับทีมและ AI agent (เช่น Claude Code)
> ที่จะแตะโค้ดใน repo นี้ ใช้ตัดสินว่างานแต่ละชิ้น "ต้องทำหนักแค่ไหน" ก่อนเริ่ม
> โดยไม่ต้องถกเถียงทุกครั้งว่าเสี่ยงมากน้อยแค่ไหน
>
> ที่มา: พัฒนาต่อจากงาน hardening `cn()`/`Button()` — สอง node ที่มี
> betweenness centrality สูงสุดในกราฟ dependency ของโปรเจกต์นี้

---

## หลักคิด: Loop ไม่ใช่ Waterfall

งานทุกชิ้นควรวิ่งผ่านวงจร 6 stage นี้ และ stage สุดท้าย (Learn) ต้องป้อนกลับ
เข้า stage แรก (Plan) ของงานถัดไปเสมอ — ไม่ใช่ทำครั้งเดียวจบแล้วลืม

```
Plan → Build → Verify → Automate → Observe → Learn ─┐
  ▲                                                    │
  └────────────────────────────────────────────────────┘
```

| Stage | คำถามหลัก | Output |
|---|---|---|
| Plan | โค้ดจุดนี้เสี่ยงระดับไหน? | Risk tier |
| Build | เขียนโค้ด + เทสคู่กันหรือยัง? | โค้ด + test file |
| Verify | รัน local ผ่านครบไหม? | ผลรัน local |
| Automate | ผูกเข้า CI แล้วหรือยัง? | CI workflow |
| Observe | รันจริงบน CI/prod แล้วเป็นยังไง? | ผลรันจริง |
| Learn | อะไรที่ rubric นี้ยังไม่ครอบคลุม? | ปรับ rubric รอบถัดไป |

---

## Stage 1 (Plan): Risk-Tier Router

**กฎเหล็ก: ก่อนแตะไฟล์ที่ดูเหมือนเป็น shared code ให้ trace dependency graph
ก่อนเสมอ อย่าเดาจากความรู้สึก**

วิธี trace: หา fan-out (จำนวนไฟล์ที่ import เข้ามา) และ betweenness
centrality (ถ้ามีเครื่องมือวัด) ของ node ที่จะแก้ แล้วจัด tier ตามตารางนี้:

| Tier | เกณฑ์ | ตัวอย่างจริงใน repo นี้ | Safety net ที่ต้องมี |
|---|---|---|---|
| 🔴 Red | betweenness สูงสุดในกราฟ หรือ fan-out > 30 | `cn()` (utils.ts, 192 edges) | unit test ครอบ edge case ทุกกรณี + snapshot ของทุกจุดที่เรียกใช้ + visual regression + CI guard |
| 🟠 Orange | shared component ที่ import 5–30 จุด | `Button()` (48 imports, 26 communities) | unit test + snapshot ครบทุก variant/size |
| 🟡 Yellow | ใช้ซ้ำในโซนเดียว (เช่น ใน `forms/` อย่างเดียว) | form-section, drawer builder | unit test มาตรฐาน + เทส 2-3 จุดตัวแทนถ้าเป็น visual |
| 🟢 Green | leaf feature, import < 5 จุด | หน้า feature เฉพาะทาง | unit test มาตรฐานพอ ไม่ต้อง snapshot/visual |

**สิ่งที่ต้องรู้:** tier ของ node หนึ่งๆ **เปลี่ยนได้ตามเวลา** เพราะกราฟของ repo
โตขึ้นเรื่อยๆ แนะนำ re-trace ใหม่ทุกครั้งที่:

- จะแก้ไฟล์ที่มีอายุเกิน 1 ไตรมาสและไม่เคยเช็ค fan-out มาก่อน
- มี PR ใหญ่ merge เข้า main (โครงสร้าง dependency อาจเปลี่ยน)
- เจอ regression ที่ไม่คาดคิดจากไฟล์ที่เคยประเมินว่า "เขียว"

---

## Stage 2-3 (Build/Verify): Prompt Template สำหรับมอบงานให้ AI

ทุก prompt ที่ส่งให้ Claude Code หรือ AI agent อื่น ควรมีโครง 4 ส่วนนี้เสมอ
ไม่ว่างานจะเป็นอะไร — สลับแค่เนื้อหาตรงกลาง โครงคงที่:

```
1. Scope ให้แคบและชัด
   → ระบุไฟล์/ฟังก์ชันที่แตะได้ และที่ห้ามแตะอย่างชัดเจน

2. "อ่านโค้ดจริงก่อนเขียน อย่าเดาจากชื่อฟังก์ชันหรือ pattern ทั่วไป"
   → กันการเขียนเทสจาก assumption ที่ไม่ตรงกับ implementation จริง

3. "ถ้าเจอบั๊ก/ต้องแก้นอก scope ให้หยุดแล้วรายงานก่อน ห้ามแก้เองแล้วไปต่อ"
   → สำคัญที่สุดสำหรับไฟล์ tier แดง/ส้ม หรือไฟล์ security-critical

4. "verify ตัวเองซ้ำก่อนบอกว่าเสร็จ"
   → tier แดง: รันซ้ำ 3 รอบเช็ค flaky, เทียบ checksum ก่อน-หลัง
   → tier เขียว/เหลือง: รัน test suite ปกติผ่านครั้งเดียวพอ

5. สรุปผลพร้อม evidence เสมอ (ตาราง, git diff --stat, checksum)
   → ไม่รับคำว่า "เสร็จแล้ว" เฉยๆ โดยไม่มีหลักฐานประกอบ
```

**บทเรียนจากงานจริง:** ยิ่ง tier สูง ยิ่งต้องแตกงานเป็น prompt ย่อยหลายอัน
ส่งทีละอัน (ดังที่ทำกับ `cn()`/`Button()`: safety net → visual regression
infra → Linux baseline → CI guard) แทนที่จะยัดทุกอย่างใน prompt เดียว
เพื่อให้ debug ง่ายเมื่อมีจุดพลาด

---

## Stage 4 (Automate): CI Guard ที่ scale ตาม tier

อย่าให้ CI รันหนักทุก PR — ผูก path filter ให้ตรงกับ tier ของไฟล์ที่แตะ:

| Tier | Trigger scope | ความเร็วที่ควรได้ |
|---|---|---|
| 🔴 Red | ทุก PR ที่แตะไฟล์นี้ต้องรัน unit + snapshot + visual regression ครบ | ช้าได้ (คุ้มกับความเสี่ยง) |
| 🟠 Orange | unit + snapshot | ปานกลาง |
| 🟡🟢 | unit test มาตรฐานที่รันอยู่แล้วในทุก PR | เร็ว |

หลักการ: **"automate the check, not the annoyance"** — ถ้า CI ช้าเกินไปจนทีม
เริ่มมองข้ามผลลัพธ์ ให้กลับไปดู path filter ก่อน ไม่ใช่ปิด CI ทิ้ง

---

## Stage 5 (Observe): Human-Review Gate ที่ไม่ต่อรอง

ไม่ว่า AI จะมั่นใจแค่ไหนหรือรายงานว่า "ปลอดภัย" แค่ไหน **ไฟล์ประเภทต่อไปนี้
ต้องมีคน review ด้วยตาเสมอก่อน merge** — นี่ไม่ใช่เรื่องเทียร์ความเสี่ยงของ
dependency graph แต่เป็นเรื่อง "ผลกระทบถ้าพัง":

- ไฟล์ authentication / authorization / middleware (เช่น `proxy.ts`)
- ไฟล์ payment / billing logic
- Database schema / migration
- ไฟล์คุม permission / access control
- ไฟล์ environment / secrets configuration

ถ้า AI แก้ไฟล์กลุ่มนี้ ให้ขอ `git diff` เต็มมาอ่านเองเสมอ ไม่ว่างานหลักจะ
เป็นเรื่องอะไรก็ตาม

---

## Stage 6 (Learn): สิ่งที่ต้องบันทึกกลับเข้า rubric

ทุกครั้งที่จบงานหนึ่งรอบ ให้ถามตัวเอง 3 ข้อนี้ก่อนปิดงาน แล้วอัปเดต
เอกสารนี้ถ้าคำตอบชี้ให้เห็นว่า rubric ยังไม่ครอบคลุม:

1. **มี test case ไหนที่ "ผ่าน" แต่ไม่ได้พิสูจน์อะไรจริง?**
   (บทเรียนจาก hover test ของ `default` variant ที่ผ่านเพราะไม่มีอะไรให้พัง
   ไม่ใช่เพราะพิสูจน์ว่า merge ถูกต้อง — ต้องแก้ให้เทสมีความหมายจริง)

2. **มี environment ไหนที่ยังไม่ได้ verify?**
   (บทเรียนจาก baseline macOS ที่ไม่ตรงกับ CI ที่รันบน Linux — ต้อง gen
   baseline ให้ตรงกับทุก environment ที่จะใช้จริง)

3. **มี side-effect นอก scope ที่เกิดขึ้นโดยไม่ตั้งใจไหม?**
   (บทเรียนจาก `next-env.d.ts` ที่ dev server เขียนทับตอนรันใน Docker —
   ต้องเช็ค `git status` ทุกครั้งหลัง AI รันงานเสร็จ ก่อนเชื่อว่า scope
   ที่แจ้งไว้ตรงกับ diff จริง)

---

## Quick Reference: เริ่มงานใหม่ต้องทำอะไรก่อน

```
□ 1. Trace fan-out ของไฟล์/ฟังก์ชันที่จะแตะ
□ 2. จัด tier ตามตาราง Stage 1
□ 3. เลือกระดับ safety net ตาม tier
□ 4. เขียน prompt ตามโครง 5 ข้อของ Stage 2-3
□ 5. ส่งงานเป็น prompt ย่อยทีละอัน ไม่ยัดรวม (ยิ่ง tier สูงยิ่งต้องแตก)
□ 6. เช็ค evidence ทุกครั้งที่ AI รายงานว่า "เสร็จแล้ว"
□ 7. ถ้าแตะไฟล์ในกลุ่ม human-review-required → review เองเสมอ ไม่มีข้อยกเว้น
□ 8. หลังงานจบ ถามคำถาม 3 ข้อของ Stage 6 แล้วอัปเดตเอกสารนี้ถ้าจำเป็น
```
