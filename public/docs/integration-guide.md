# ADT Library API — Integration Guide

> **วัตถุประสงค์:** อธิบาย lifecycle ของการเรียกใช้ Tool ตั้งแต่ต้นจนจบ เพื่อให้ทั้งนักพัฒนาและ AI Agent เข้าใจ flow ได้อย่างสมบูรณ์

---

## สถาปัตยกรรมภาพรวม

```
Step 1: POST /run           Step 2: GET /runs/{runId}      Step 3: GET /jobs/{jobId}
────────────────────        ──────────────────────────     ──────────────────────────
{ input: {...} }     →      Poll until completed      →    → resultId
                            Set jobId = last job            
                            Set resultId (see cases)        Optional: GET /results/{resultId}/items
```

**Terminal condition:**
```
all jobs[n].state === "completed"
```

**Variable mapping:**

| Variable | Source | ใช้ใน |
|---|---|---|
| `jobId` | `jobs[last].jobId` | Step 3 |
| `resultId` | มี `exportcomments-fetch` → ใช้ `resultId` ของมัน / ไม่มี → ใช้ `jobs[0].resultId` | Optional — Get Paginated Items |

---

## Authentication

| Header | Description |
|--------|-------------|
| `X-App-Id` | App ID ที่ได้รับจากหน้า API Keys |
| `X-App-Secret` | Secret Key สำหรับยืนยันตัวตน |
| `Content-Type` | `application/json` |

> ⚠️ อย่าเปิดเผย `X-App-Secret` ใน source code หรือ client-side

---

## Step 1 — Run Tool

```
POST /integrations/tools/{toolId}/run
```

```json
{
  "input": {
    "startUrls": ["https://www.facebook.com/example/posts/123456789"]
  },
  "webhookUrl": "https://your-server.com/webhook/handler"
}
```

> `webhookUrl` จำเป็นสำหรับ Tool ที่ใช้ ExportComments — ถ้า API Key มี webhookUrl อยู่แล้วไม่ต้องใส่ซ้ำ

**Response:**

```json
{
  "success": true,
  "data": {
    "runId": "<runId>",
    "jobs": [
      { "jobId": "<jobId-1>", "plugin": "exportcomments-create", "state": "queued" },
      { "jobId": "<jobId-2>", "plugin": "exportcomments-fetch",  "state": "queued" },
      { "jobId": "<jobId-3>", "plugin": "gemini",                "state": "queued" }
    ]
  }
}
```

---

## Step 2 — Get Jobs by Run ID

```
GET /integrations/tools/{toolId}/runs/{runId}
```

Poll ทุก 4 วินาที (max 150 ครั้ง ≈ 10 นาที) จนทุก job เป็น `completed`

| State | ความหมาย |
|-------|----------|
| `queued` | รอคิว |
| `running` | กำลังประมวลผล |
| `waiting` | รอ upstream script |
| `completed` | เสร็จ |
| `failed` | error — ตรวจ `error` field |

**Set variables จาก response:**

| Variable | Logic |
|---|---|
| `jobId` | `jobs[last].jobId` เสมอ |
| `resultId` | มี `exportcomments-fetch` → ใช้ `resultId` ของมัน / ไม่มี → ใช้ `jobs[0].resultId` |

---

## Step 2b — WEBHOOK (webhook tools only)

```json
{
  "event": "run.completed",
  "runId": "<runId>",
  "result": { "resultId": "<resultId>", "itemCount": 47 }
}
```

> ✅ ตอบกลับ HTTP 200 ทันที

---

## Step 3 — Get Results by Job ID

ใช้ `jobId` (last job) จาก Step 2:

```
GET /integrations/tools/{toolId}/jobs/{jobId}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "jobId": "<jobId>",
    "plugin": "gemini",
    "state": "completed",
    "resultId": "<resultId>",
    "result": { "itemCount": 47 }
  }
}
```

---

## Optional — Get Paginated Items

ใช้ `resultId` จาก Step 2:

```
GET /integrations/tools/results/{resultId}/items?page=1&limit=20
```

| Parameter | Default | Max |
|-----------|---------|-----|
| `page` | `1` | — |
| `limit` | `10` | `100` |

**Response:**

```json
{
  "success": true,
  "data": [],
  "meta": { "total": 47, "page": 1, "limit": 20, "totalPages": 3 }
}
```

---

## Pipeline ตัวอย่าง: ExportComments + Gemini

```
INPUT (startUrls)
     │
     ▼
[Script 1: exportcomments-create]  → สร้าง export job
     │
     ▼
[Script 2: exportcomments-fetch]   → ดึง raw comments
     │  resultId ของ script นี้ → ใช้เป็น resultId สำหรับ paginated items
     ▼
[Script 3: gemini]                 → AI analysis (last job → jobId)
     │
     ▼
Step 3: GET /jobs/{lastJobId}
Optional: GET /results/{exportcomments-fetch.resultId}/items
```

---

## Complete Flow (Node.js)

```typescript
const API_BASE = 'https://library-api.adapterdigital.com/api';
const TOOL_ID  = '<toolId>';
const headers  = {
  'X-App-Id': process.env.APP_ID!,
  'X-App-Secret': process.env.APP_SECRET!,
  'Content-Type': 'application/json',
};

// Step 1 — Run
const runRes = await fetch(`${API_BASE}/integrations/tools/${TOOL_ID}/run`, {
  method: 'POST', headers,
  body: JSON.stringify({ input: { startUrls: ['<url>'] }, webhookUrl: '<webhook>' }),
});
const { data: { runId } } = await runRes.json();

// Step 2 — Poll
async function waitForRun(runId: string) {
  for (let i = 0; i < 150; i++) {
    const { data } = await (await fetch(
      `${API_BASE}/integrations/tools/${TOOL_ID}/runs/${runId}`, { headers }
    )).json();
    const done = data.jobs.every((j: any) => j.state === 'completed' || j.state === 'failed');
    if (done) return data.jobs;
    await new Promise(r => setTimeout(r, 4000));
  }
  throw new Error('Timeout');
}
const jobs = await waitForRun(runId);

// Set variables from Step 2
const lastJob   = jobs[jobs.length - 1];
const jobId     = lastJob.jobId;
const fetchJob  = jobs.find((j: any) => j.plugin === 'exportcomments-fetch');
const resultId  = (fetchJob || jobs[0])?.resultId;

// Step 3 — Get final job result
const jobRes  = await fetch(`${API_BASE}/integrations/tools/${TOOL_ID}/jobs/${jobId}`, { headers });
const jobData = await jobRes.json();
console.log('Step 3 state:', jobData.data?.state);

// Optional — Get paginated items
if (resultId) {
  const res    = await fetch(`${API_BASE}/integrations/tools/results/${resultId}/items?page=1&limit=20`, { headers });
  const result = await res.json();
  console.log('Items:', result.data, 'total:', result.meta?.total);
}
```

---

## Error Reference

| HTTP Status | ความหมาย | Action |
|-------------|----------|--------|
| `400` | Invalid input / insufficient credits | ตรวจ error message |
| `401` | Credentials ไม่ถูกต้อง | ตรวจ X-App-Id / X-App-Secret |
| `403` | ไม่มีสิทธิ์ | ติดต่อ Admin |
| `404` | ไม่พบ Tool / Result | ตรวจ toolId / jobId / resultId |
| `429` | Rate limit exceeded | รอแล้ว retry |
| `500` | Internal server error | retry หรือติดต่อ support |
