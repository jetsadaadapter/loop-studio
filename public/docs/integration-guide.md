# ADT Library API — Integration Guide

> **วัตถุประสงค์:** อธิบาย lifecycle ของการเรียกใช้ Tool ตั้งแต่ต้นจนจบ ครอบคลุม input, pipeline processing, และ output เพื่อให้ทั้งนักพัฒนาและ AI Agent เข้าใจ flow ได้อย่างสมบูรณ์

---

## สถาปัตยกรรมภาพรวม (Architecture Overview)

ADT Library Tool ทำงานเป็น **asynchronous pipeline** ประกอบด้วย 3 phase:

```
[Phase 1] INPUT          [Phase 2] PIPELINE               [Phase 3] OUTPUT
───────────────          ────────────────────────────     ────────────────
Client ส่ง params  →     Script 1 (e.g. exportcomments) → GET /results
via POST /run            Script 2 (e.g. gemini-analyze)   /{resultId}/items
                         Script N ...
                         → FINAL resultId = last job
```

**กฎสำคัญ:**
- Scripts ทำงาน **ตามลำดับ** — output ของ script ก่อนหน้าเป็น input ของ script ถัดไป
- **`resultId`** ที่ใช้ดึงผลลัพธ์ขั้นสุดท้าย = **`jobs[last].resultId`** เสมอ
- **`jobId`** ที่ใช้ดู intermediate detail = `exportcomments-fetch` (ถ้ามี) หรือ `jobs[0]`
- Flow **จบ** เมื่อ Webhook ส่ง `event: "run.completed"` และ `result.resultId` มีค่า

**Terminal condition — flow is complete when:**
```
event === "run.completed"  AND  result.resultId !== null
```

---

## Authentication

ทุก Request ต้องส่ง Header:

| Header | Description |
|--------|-------------|
| `X-App-Id` | App ID ที่ได้รับจากหน้า API Keys |
| `X-App-Secret` | Secret Key สำหรับยืนยันตัวตน |
| `Content-Type` | `application/json` |

> ⚠️ **อย่าเปิดเผย `X-App-Secret`** ต่อสาธารณะหรือ commit ลง source code

---

## Phase 1 — INPUT: Run Tool

### Endpoint

```
POST /integrations/tools/{toolId}/run
```

### Request Body

```json
{
  "input": {
    "startUrls": ["https://www.facebook.com/example/posts/123456789"]
  },
  "webhookUrl": "https://your-server.com/webhook/handler"
}
```

> **หมายเหตุ:** `webhookUrl` จำเป็นสำหรับ Tool ที่ใช้ ExportComments pipeline — ถ้า API Key มี webhookUrl อยู่แล้วไม่ต้องใส่ซ้ำ

### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "toolId": "<toolId>",
    "runId": "<runId>",
    "jobs": [
      { "jobId": "<jobId-1>", "plugin": "exportcomments-create", "state": "queued" },
      { "jobId": "<jobId-2>", "plugin": "exportcomments-fetch",  "state": "queued" },
      { "jobId": "<jobId-3>", "plugin": "gemini",                "state": "queued" }
    ]
  }
}
```

**บันทึกค่าไว้:**
- `runId` — ใช้ใน Phase 2
- `jobs[last].jobId` — last job = final resultId source
- `jobs[index of exportcomments-fetch].jobId` หรือ `jobs[0].jobId` — jobId สำหรับดู intermediate detail

---

## Phase 2 — PIPELINE: Monitor Job States

```http
GET /integrations/tools/{toolId}/runs/{runId}
```

Poll ทุก **4 วินาที** จนกว่าทุก job จะเป็น `completed` หรือ `failed` (แนะนำ max 150 ครั้ง ≈ 10 นาที)

| State | ความหมาย |
|-------|----------|
| `queued` | รอคิว |
| `running` | กำลังประมวลผล |
| `waiting` | รอ upstream script |
| `completed` | เสร็จ — `resultId` พร้อมใช้ |
| `failed` | เกิด error — ตรวจ `error` field |

**การ assign variables จาก Phase 2 response:**

```
jobId              = exportcomments-fetch.jobId  (ถ้ามี)
                   = jobs[0].jobId               (apify / custom tool)

resultId           = jobs[last].resultId         (final output เสมอ)

intermediateResultId = exportcomments-fetch.resultId  (ถ้ามี)
                     = jobs[0].resultId               (apify / custom tool)
```

---

## Phase 2b — WEBHOOK: Receive Completion (webhook tools only)

เมื่อ pipeline เสร็จ ระบบส่ง POST ไปยัง webhookUrl:

```json
{
  "event": "run.completed",
  "runId": "<runId>",
  "toolId": "<toolId>",
  "result": {
    "resultId": "<resultId>",
    "itemCount": 47
  }
}
```

> ✅ ตอบกลับ HTTP `200` ทันที — API จะ retry ถ้าไม่ได้รับ 2xx

---

## Phase 3 — OUTPUT: Get Final Result

ใช้ **`resultId`** จาก `jobs[last]` (Phase 2) เพื่อดึงผลลัพธ์ขั้นสุดท้าย:

```
GET /integrations/tools/results/{resultId}/items?page=1&limit=20
```

> ✅ นี่คือ **final output** ของ pipeline — ผลรวมจากทุก script

### Response

```json
{
  "success": true,
  "data": [],
  "meta": {
    "total": 47,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

| Parameter | Type | Default | Max |
|-----------|------|---------|-----|
| `page` | `number` | `1` | — |
| `limit` | `number` | `10` | `100` |

---

## Optional — Get Paginated Items (Intermediate Script)

ใช้ **`intermediateResultId`** เพื่อดู raw data ของ script ก่อน final:

```
GET /integrations/tools/results/{intermediateResultId}/items?page=1&limit=20
```

> ℹ️ ใช้เพื่อ debug หรือดู raw data ของ script ย่อย — **ไม่ใช่** final output

---

## Pipeline ตัวอย่าง: ExportComments + Gemini (3 Scripts)

```
INPUT (startUrls)
     │
     ▼
[Script 1: exportcomments-create]
 → สร้าง export job ใน ExportComments
 → output → ecGuid, jsonUrl
     │
     ▼
[Script 2: exportcomments-fetch]  ← 🔑 jobId source (intermediate detail)
 → ดึงข้อมูล comments จาก export job
 → output → รายการ comments (raw data)
     │
     ▼
[Script 3: gemini]  ← ✅ FINAL resultId → GET /results/{resultId}/items
 → วิเคราะห์ sentiment ด้วย AI
 → output → ผลการวิเคราะห์ per comment
```

---

## Complete Flow Diagram

```
CLIENT                    ADT LIBRARY API               WEBHOOK ENDPOINT
  │                              │                              │
  │  POST /tools/{id}/run ──────>│                              │
  │<── 200 { runId, jobs[] } ───│                              │
  │                              │ Script 1: [queued→completed] │
  │                              │ Script 2: [queued→completed] │
  │                              │ Script 3: [queued→completed] │
  │                              │ → FINAL jobs[last].resultId  │
  │                              │── POST webhook payload ─────>│
  │                              │   { event:"run.completed",   │
  │                              │     result.resultId }        │
  │  GET /results/{resultId}     │                              │
  │  /items?page=1&limit=20 ────>│                              │
  │<── 200 { data: [...] } ─────│                              │
  │                              │                              │
[END]                          [END]                          [END]
```

---

## Error Reference

| HTTP Status | ความหมาย | วิธีจัดการ |
|-------------|----------|----------|
| `200` | สำเร็จ | ดำเนินการต่อ |
| `400` | Input ไม่ถูกต้อง / credit ไม่พอ | ตรวจ error message |
| `401` | Credentials ไม่ถูกต้อง | ตรวจ X-App-Id / X-App-Secret |
| `403` | ไม่มีสิทธิ์เข้าถึง Tool | ติดต่อ Admin |
| `404` | ไม่พบ Tool หรือ Result | ตรวจ toolId / resultId |
| `429` | เกิน Rate Limit | รอแล้ว retry with exponential backoff |
| `500` | ระบบมีปัญหา | retry หรือติดต่อ support |

---

## Notes สำหรับ AI Agent

1. **ก่อน POST /run** — ตรวจว่า Tool มี params อะไรบ้าง (required/optional) และ map input ให้ตรง key
2. **หลัง POST /run** — เก็บ `runId` และ `jobs[]` ไว้
3. **Phase 2** — poll GET /runs/{runId} จนทุก job = `completed`
4. **`resultId`** = `jobs[last].resultId` — ใช้สำหรับ final output เสมอ
5. **`jobId`** = `exportcomments-fetch.jobId` หรือ `jobs[0].jobId` — ใช้สำหรับ intermediate detail เท่านั้น
6. **Flow จบที่:** `GET /results/{resultId}/items` ได้ `data[]` — นี่คือ output สุดท้าย
7. **Webhook tools:** รอ `event: "run.completed"` ก่อน Phase 3
