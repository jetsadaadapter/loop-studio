# ADT Library API — Integration Guide

เอกสารนี้อธิบายวิธีการเรียกใช้ Tool ผ่าน API Key และรับผลลัพธ์ผ่าน Webhook

---

## Authentication

ทุก Request ต้องส่ง Header ดังนี้:

| Header | Description |
|--------|-------------|
| `X-App-Id` | App ID ที่ได้รับจาก Developer |
| `X-App-Secret` | Secret Key สำหรับยืนยันตัวตน |
| `Content-Type` | `application/json` |

**ตัวอย่าง Header:**

```
X-App-Id: app_01ktqt92zh947r0d96p09w2ssh
X-App-Secret: sk_live_REPLACE_WITH_YOUR_APP_SECRET
Content-Type: application/json
```

> ⚠️ **อย่าเปิดเผย `X-App-Secret`** ต่อสาธารณะหรือ commit ลง Source Code โดยตรง

---

## Step 1 — Run Tool

ส่ง Request เพื่อเริ่มประมวลผล Tool ที่ต้องการ

**Endpoint:**

```
POST {{api}}/integrations/tools/{toolId}/run
```

- `{toolId}` คือ Tool ID ที่ได้รับจาก Developer เช่น `01KTV6RCYVTJMVTY37M5WQRY5T`

**Request Body:**

```json
{
  "input": {
    "postUrl": ["https://www.facebook.com/Wongnai/posts/1406554364840112/"],
    "limit": 10,
    "replies": false
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `postUrl` | `string[]` | รายการ URL ที่ต้องการดึงข้อมูล |
| `limit` | `number` | จำนวน Comment สูงสุดที่ต้องการ |
| `replies` | `boolean` | ดึง Reply Comments ด้วยหรือไม่ |

**ตัวอย่าง cURL:**

```bash
curl -X POST "{{api}}/integrations/tools/01KTV6RCYVTJMVTY37M5WQRY5T/run" \
  -H "X-App-Id: app_01ktqt92zh947r0d96p09w2ssh" \
  -H "X-App-Secret: sk_live_REPLACE_WITH_YOUR_APP_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "postUrl": ["https://www.facebook.com/Wongnai/posts/1406554364840112/"],
      "limit": 10,
      "replies": false
    }
  }'
```

---

## Step 2 — รับผลลัพธ์ผ่าน Webhook

เมื่อ Tool ประมวลผลเสร็จ ระบบจะส่ง HTTP POST ไปยัง Webhook URL ที่ลงทะเบียนไว้ พร้อม Payload ดังนี้:

```json
{
  "event": "run.completed",
  "runId": "01KTV87B391GNYGCGKEGB18BB8",
  "toolId": "01KTV6RCYVTJMVTY37M5WQRY5T",
  "appId": null,
  "completedAt": "2026-06-11T11:49:24.345Z",
  "result": {
    "resultId": "6a2aa0c4b09302eaffe658af",
    "resultUrl": "https://library-api.adapterdigital.com/api//integrations/tools/results/6a2aa0c4b09302eaffe658af/items"
  },
  "jobs": [
    {
      "jobId": "93aa0f4c-c30a-49ff-939a-d4182265ab1b",
      "plugin": "exportcomments-fetch",
      "state": "completed",
      "resultId": "6a2aa0c4b09302eaffe658af",
      "resultUrl": "https://library-api.adapterdigital.com/api//integrations/tools/results/6a2aa0c4b09302eaffe658af/items"
    },
    {
      "jobId": "01KTV87B3903DE7WFEYRTCC3HJ",
      "plugin": "exportcomments-create",
      "state": "completed",
      "resultId": "6a2aa0afb09302eaffe658ad",
      "resultUrl": "https://library-api.adapterdigital.com/api//integrations/tools/results/6a2aa0afb09302eaffe658ad/items"
    }
  ]
}
```

| Field | Description |
|-------|-------------|
| `event` | ประเภทของ Event (`run.completed` = ประมวลผลเสร็จ) |
| `runId` | ID ของ Run นี้ |
| `toolId` | ID ของ Tool ที่ถูกเรียก |
| `completedAt` | เวลาที่ประมวลผลเสร็จ (ISO 8601) |
| `result.resultId` | ID ของผลลัพธ์หลัก |
| `result.resultUrl` | URL สำหรับดึงข้อมูลผลลัพธ์ |
| `jobs` | รายการ Job ย่อยแต่ละตัวพร้อม State และ Result URL |

---

## Step 3 — ดึงข้อมูลผลลัพธ์

ใช้ `resultUrl` จาก Webhook Payload เพื่อดึงข้อมูลผ่าน API พร้อม Header เดิม

**Endpoint:**

```
GET {{api}}/integrations/tools/results/{resultId}/items?page=1&limit=10
```

**ตัวอย่าง:**

```bash
curl "https://library-api.adapterdigital.com/api//integrations/tools/results/6a2aa0c4b09302eaffe658af/items?page=1&limit=10" \
  -H "X-App-Id: app_01ktqt92zh947r0d96p09w2ssh" \
  -H "X-App-Secret: sk_live_REPLACE_WITH_YOUR_APP_SECRET"
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | `number` | `1` | หน้าที่ต้องการ |
| `limit` | `number` | `10` | จำนวนรายการต่อหน้า |

---

## Flow Overview

```
Client                        ADT Library API              Webhook Endpoint
  │                                  │                            │
  │── POST /tools/{toolId}/run ─────>│                            │
  │                                  │  (ประมวลผล async)          │
  │<─ 200 OK (runId) ───────────────│                            │
  │                                  │                            │
  │                                  │── POST webhook payload ──>│
  │                                  │                            │
  │<─────────────────────────────────────── resultUrl ──────────│
  │                                  │                            │
  │── GET /results/{resultId}/items >│                            │
  │<─ 200 OK (items) ───────────────│                            │
```

---

## Error Handling

| HTTP Status | ความหมาย |
|-------------|----------|
| `200` | สำเร็จ |
| `401` | ไม่มี Header หรือ Credentials ไม่ถูกต้อง |
| `403` | ไม่มีสิทธิ์เข้าถึง Tool นี้ |
| `404` | ไม่พบ Tool หรือ Result ที่ระบุ |
| `429` | เกิน Rate Limit |
| `500` | เกิดข้อผิดพลาดภายในระบบ |

---

## Notes

- ผลลัพธ์ของแต่ละ Job (`jobs[].resultUrl`) อาจแตกต่างกัน ขึ้นอยู่กับ Plugin ที่ใช้
- `result.resultUrl` คือผลลัพธ์รวมหลัก ใช้ URL นี้เพื่อดึงข้อมูลสุดท้าย
- Webhook จะถูก Retry อัตโนมัติหาก Endpoint ไม่ตอบสนองภายในเวลาที่กำหนด
