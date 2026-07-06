import type { ToolScript } from "@/core/interfaces/tools.interface";
import type { ToolParam } from "@/core/interfaces/tool";

// Always use production URL in generated guides — dev localhost must not leak into customer-facing docs
const API_BASE = "https://library-api.adapterdigital.com/api";

// ── Helpers ───────────────────────────────────────────────────────────────────

function requiresWebhook(scripts: ToolScript[]): boolean {
  return scripts.some((s) => s.plugin.toLowerCase().includes("exportcomments"));
}

function pluginLabel(plugin: string): string {
  const map: Record<string, string> = {
    apify: "Apify Scraper",
    gemini: "Gemini AI Analyzer",
    "exportcomments-create": "Create an Export Job",
    "exportcomments-fetch": "Retrieve an Export Job",
  };
  return map[plugin.toLowerCase()] || plugin;
}

function pluginRole(plugin: string, index: number, total: number): string {
  const p = plugin.toLowerCase();
  if (p.includes("exportcomments-create") || p.includes("apify")) return "Fetch raw data from source";
  if (p.includes("gemini") || p.includes("analyze") || p.includes("ai")) return "AI analysis / enrichment";
  if (p.includes("exportcomments-fetch")) return "Retrieve export job results";
  if (index === 0) return "Fetch / collect input data";
  if (index === total - 1) return "Final processing step";
  return "Intermediate processing";
}

// Build params table with Constraints column
function buildParamsTable(params: ToolParam[]): string {
  if (!params || params.length === 0) return "";
  const sorted = [...params].sort((a, b) => a.sortOrder - b.sortOrder);
  const rows = sorted.map((p) => {
    // Try to extract constraints from config or options
    let constraints = "—";
    if (p.options && Array.isArray(p.options) && p.options.length > 0) {
      constraints = `One of: ${p.options.map((o) => `\`${String(o)}\``).join(", ")}`;
    } else if (p.type === "url") {
      constraints = "Full URL format only";
    } else if (p.defaultValue) {
      constraints = `Default: \`${p.defaultValue}\``;
    } else if (p.placeholder) {
      constraints = p.placeholder;
    }
    return `| \`${p.key}\` | ${p.label} | \`${p.type}\` | ${p.required ? "**Required**" : "Optional"} | ${constraints} |`;
  }).join("\n");
  return `| Key | Label | Type | Required | Constraints |\n|---|---|---|---|---|\n${rows}`;
}

// Build Step 1 JSON body — pure valid JSON, no comments
function buildStep1Body(params: ToolParam[], needsWebhook: boolean): string {
  const inputFields: Record<string, unknown> = {};
  if (params && params.length > 0) {
    const sorted = [...params].sort((a, b) => a.sortOrder - b.sortOrder);
    for (const p of sorted) {
      if (p.type === "url" || p.type === "array") {
        inputFields[p.key] = [`<${p.key}>`];
      } else if (p.type === "number") {
        inputFields[p.key] = p.defaultValue ? Number(p.defaultValue) : (p.required ? 0 : null);
      } else if (p.type === "boolean") {
        inputFields[p.key] = p.defaultValue === "true" ? true : false;
      } else {
        inputFields[p.key] = `<${p.key}>`;
      }
    }
  } else {
    inputFields["startUrls"] = ["<paste-url-here>"];
  }
  const body: Record<string, unknown> = { input: inputFields };
  if (needsWebhook) body["webhookUrl"] = "https://your-server.com/webhook/handler";
  return `\`\`\`json\n${JSON.stringify(body, null, 2)}\n\`\`\``;
}

// Build Node.js input object
function buildNodeJsInput(params: ToolParam[]): string {
  if (!params || params.length === 0) return `{ startUrls: ['<paste-url-here>'] }`;
  const sorted = [...params].sort((a, b) => a.sortOrder - b.sortOrder);
  const fields = sorted.map((p) => {
    if (p.type === "url" || p.type === "array") return `      ${p.key}: ['<paste-url-here>']`;
    if (p.type === "number") return `      ${p.key}: ${p.defaultValue ?? (p.required ? 0 : "null")}`;
    if (p.type === "boolean") return `      ${p.key}: ${p.defaultValue === "true" ? "true" : "false"}`;
    return `      ${p.key}: '<${p.key}>'`;
  });
  return `{\n${fields.join(",\n")}\n    }`;
}

// Build pipeline section with flow diagram
function buildPipelineSection(scripts: ToolScript[], jobScript?: ToolScript): string {
  const sorted = [...scripts].sort((a, b) => a.sortOrder - b.sortOrder);
  const total = sorted.length;

  const rows = sorted.map((s, i) => {
    const role = pluginRole(s.plugin, i, total);
    const isActualFinal = i === total - 1;
    // jobScript = exportcomments-fetch (if present) or jobs[0] — the intermediate data source
    const isJobSource = jobScript ? s.plugin === jobScript.plugin : i === 0;
    const note = isActualFinal
      ? `✅ **Final \`resultId\`** — use this job's \`resultId\` for Phase 3`
      : isJobSource
        ? `🔑 **\`jobId\` source** — used for intermediate job detail`
        : `→ output passed to Script ${i + 2}`;
    return `| ${i + 1} | ${s.label || pluginLabel(s.plugin)} | \`${s.plugin}\` | ${role} | ${note} |`;
  }).join("\n");

  const table = `| # | Label | Plugin | Role | Notes |\n|---|---|---|---|---|\n${rows}`;

  const diagramLines = sorted.map((s, i) => {
    const label = s.label || pluginLabel(s.plugin);
    const isActualFinal = i === total - 1;
    return isActualFinal
      ? `[Script ${i + 1}: ${label}]\n → ✅ FINAL resultId → GET /results/{resultId}/items`
      : `[Script ${i + 1}: ${label}]\n → output →`;
  }).join("\n");

  return `${table}

\`\`\`
INPUT (params)
     │
     ▼
${diagramLines}
\`\`\``;
}

// Webhook section (only for webhook-required tools)
function buildWebhookPhase(toolId: string): string {
  return `---

## Phase 2b — WEBHOOK: Receive Completion Event

When the pipeline finishes, the API fires a \`POST\` request to your \`webhookUrl\`:

\`\`\`json
{
  "event": "run.completed",
  "runId": "<runId>",
  "toolId": "${toolId}",
  "result": {
    "resultId": "<resultId>",
    "itemCount": 47
  }
}
\`\`\`

| Field | Description |
|---|---|
| \`event\` | Always \`"run.completed"\` on success |
| \`runId\` | Matches the \`runId\` from Phase 1 |
| \`result.resultId\` | Use this to fetch the final output in Phase 3 |
| \`result.itemCount\` | Total number of processed items |

> ✅ Respond with HTTP \`200\` immediately. The API retries on non-2xx or timeout.

**Example webhook handler (Node.js / Express):**

\`\`\`typescript
app.post('/webhook/handler', (req, res) => {
  const { event, runId, result } = req.body;
  res.sendStatus(200); // acknowledge immediately
  if (event === 'run.completed' && result?.resultId) {
    handleCompletion(runId, result.resultId);
  }
});
\`\`\`

`;
}

// ── Main Generator ─────────────────────────────────────────────────────────────

export function generateIntegrationGuide(
  toolId: string,
  appName: string,
  scripts: ToolScript[],
  params: ToolParam[] = [],
  existingWebhookUrl?: string,
): string {
  const needsWebhook = requiresWebhook(scripts);
  // If API key already has webhookUrl configured, don't ask them to add it in the body
  const webhookAlreadyConfigured = needsWebhook && !!existingWebhookUrl;
  const sorted = [...scripts].sort((a, b) => a.sortOrder - b.sortOrder);
  // exportcomments-create only triggers the export job — the actual data is produced by
  // exportcomments-fetch (the next script). So the "effective final" output script is
  // exportcomments-fetch when it follows exportcomments-create, not exportcomments-create itself.
  const lastScript = sorted[sorted.length - 1]; // always last — holds final resultId
  // jobScript: the job whose jobId is used to GET intermediate result detail
  //   - exportcomments pipelines → exportcomments-fetch (has raw scraped data)
  //   - apify / custom tools    → first job (index 0)
  const jobScript = (() => {
    const fetchScript = sorted.find((s) => s.plugin.toLowerCase() === "exportcomments-fetch");
    if (fetchScript) return fetchScript;
    return sorted[0]; // first job for apify / custom
  })();
  const jobScriptIndex = sorted.indexOf(jobScript);
  const paramsTable = buildParamsTable(params);
  const nodeJsInput = buildNodeJsInput(params);
  const delivery = needsWebhook ? "**Webhook required**" : "Polling **or** Webhook";
  const pollingNote = needsWebhook
    ? `This is a **supplementary** check — the webhook (Phase 2b) is the authoritative signal for completion.`
    : `Poll every **4 seconds** until all jobs are \`completed\` or \`failed\`.`;

  const webhookBodyNote = webhookAlreadyConfigured
    ? `> ✅ Your API key already has a Webhook URL configured (\`${existingWebhookUrl}\`). You do not need to include \`webhookUrl\` in the request body.`
    : needsWebhook
      ? `> ⚠️ \`webhookUrl\` is **required** in every request — the pipeline will not complete without a reachable webhook endpoint.`
      : "";

  return `# ${appName} — API Integration Guide

## Overview

The Adapter Library API lets you run AI-powered data tools programmatically. Each tool invocation creates a **run** containing one or more **jobs** (pipeline scripts). The flow ends when all scripts complete and a final \`resultId\` is available.

**Base URL**
\`\`\`
${API_BASE}
\`\`\`

**Terminal condition — flow is complete when:**
\`\`\`
event === "run.completed"  AND  result.resultId !== null
\`\`\`

---

## Authentication

| Header | Description |
|---|---|
| \`X-App-Id\` | Your application ID |
| \`X-App-Secret\` | Your secret key |

> ⚠️ Never expose \`X-App-Secret\` in client-side code or repositories. Use environment variables.

---

## Tool Reference

| Property | Value |
|---|---|
| Tool ID | \`${toolId}\` |
| Delivery | ${delivery} |
| Pipeline steps | ${sorted.length} script(s) |

---

## Pipeline Architecture

Each script in the pipeline runs **sequentially**. The output of each script becomes the input to the next. **Only the last script produces the final output.**

${buildPipelineSection(scripts, jobScript)}

${needsWebhook
  ? `> ⚠️ This tool uses ExportComments which operates asynchronously. A \`webhookUrl\` **must** be provided in every request — the webhook fires when the pipeline completes. Polling the run status is optional and supplementary; the pipeline **will not reach completion** without a reachable webhook endpoint.`
  : `> ✅ All jobs queue immediately on POST /run. Poll or use webhook to receive completion.`}

${paramsTable ? `---\n\n## Input Parameters\n\n${paramsTable}\n` : ""}---

## Phase 1 — INPUT: Run the Tool

\`\`\`http
POST ${API_BASE}/integrations/tools/${toolId}/run
Content-Type: application/json
X-App-Id: <your-app-id>
X-App-Secret: <your-secret>
\`\`\`

**Request Body**

${buildStep1Body(params, needsWebhook && !webhookAlreadyConfigured)}

${webhookBodyNote}

**Response (200 OK)**

\`\`\`json
{
  "success": true,
  "data": {
    "toolId": "${toolId}",
    "runId": "<runId>",
    "jobs": [${sorted.map((s, i) => `\n      { "jobId": "<jobId-${i + 1}>", "plugin": "${s.plugin}", "state": "queued" }`).join(",")}
    ]
  }
}
\`\`\`

> Save \`runId\` — required for Phase 2. Also note: **\`jobs[${jobScriptIndex}]\`** (plugin: \`${jobScript?.plugin}\`) is used for intermediate job detail; **\`jobs[${sorted.length - 1}]\`** (plugin: \`${lastScript?.plugin}\`) holds the **final \`resultId\`**.

---

## Phase 2 — PIPELINE: Monitor Job States

${pollingNote}

\`\`\`http
GET ${API_BASE}/integrations/tools/${toolId}/runs/{runId}
X-App-Id: <your-app-id>
X-App-Secret: <your-secret>
\`\`\`

| State | Meaning |
|---|---|
| \`queued\` | Waiting to start |
| \`running\` | Currently processing |
| \`waiting\` | Waiting for upstream script |
| \`completed\` | Done — \`resultId\` available |
| \`failed\` | Error — check \`error\` field |

**Recommended polling config:**
- Interval: every **4 seconds**
- Max attempts: **150** (≈ 10 minutes total)
- Timeout action: treat as failed and surface an error to the user

> **Flow is complete** when **all** \`jobs[n].state === "completed"\`${needsWebhook ? ` and webhook fires \`event: "run.completed"\`` : ""}.

${needsWebhook ? buildWebhookPhase(toolId) : ""}---

## Step 3 — Get Results by Job ID

Use \`jobs[${sorted.length - 1}].jobId\` (plugin: \`${lastScript?.plugin ?? "last-script"}\`, last job) from Step 2:

\`\`\`http
GET ${API_BASE}/integrations/tools/${toolId}/jobs/{jobId}
X-App-Id: <your-app-id>
X-App-Secret: <your-secret>
\`\`\`

**Response**

\`\`\`json
{
  "success": true,
  "data": {
    "jobId": "<jobId>",
    "plugin": "${lastScript?.plugin ?? ""}",
    "state": "completed",
    "resultId": "<resultId>",
    "result": { "itemCount": 47 }
  }
}
\`\`\`

---

## Optional — Get Paginated Items

Use \`resultId\` from **Step 2**:
- มี \`exportcomments-fetch\` → ใช้ \`resultId\` ของมัน
- ไม่มี → ใช้ \`jobs[0].resultId\`

\`\`\`http
GET ${API_BASE}/integrations/tools/results/{resultId}/items?page=1&limit=20
X-App-Id: <your-app-id>
X-App-Secret: <your-secret>
\`\`\`

| Query param | Default | Max |
|---|---|---|
| \`page\` | \`1\` | — |
| \`limit\` | \`10\` | \`100\` |

---

## Complete Node.js Example

\`\`\`typescript
const API_BASE = '${API_BASE}';
const TOOL_ID  = '${toolId}';
const headers  = {
  'X-App-Id':     process.env.APP_ID!,
  'X-App-Secret': process.env.APP_SECRET!,
  'Content-Type': 'application/json',
};

// Phase 1 — Run the tool
const runRes = await fetch(\`\${API_BASE}/integrations/tools/\${TOOL_ID}/run\`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    input: ${nodeJsInput},${needsWebhook && !webhookAlreadyConfigured ? `\n    webhookUrl: 'https://your-server.com/webhook/handler', // required` : webhookAlreadyConfigured ? `\n    // webhookUrl already configured on your API key (${existingWebhookUrl})` : ""}
  }),
});
const { data: { runId } } = await runRes.json();

// Phase 2 — Poll${needsWebhook ? " (supplementary — webhook is authoritative)" : ""}
const POLL_INTERVAL_MS = 4_000;
const MAX_ATTEMPTS     = 150; // ~10 minutes

async function waitForRun(runId: string) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const res    = await fetch(\`\${API_BASE}/integrations/tools/\${TOOL_ID}/runs/\${runId}\`, { headers });
    const { data } = await res.json();
    const allDone = data.jobs.every((j: any) => j.state === 'completed' || j.state === 'failed');
    if (allDone) return data.jobs;
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error(\`Run \${runId} did not complete within the timeout period.\`);
}
const jobs = await waitForRun(runId);

// Set variables (same logic as Postman Step 2)
const lastJob   = jobs[jobs.length - 1];
const jobId     = lastJob?.jobId || lastJob?.id;
const fetchJob  = jobs.find((j: any) => j.plugin === 'exportcomments-fetch');
const resultId  = (fetchJob || jobs[0])?.resultId;

// Step 3 — Get results by last jobId
if (jobId) {
  const jobRes  = await fetch(\`\${API_BASE}/integrations/tools/\${TOOL_ID}/jobs/\${jobId}\`, { headers });
  const jobData = await jobRes.json();
  console.log('Step 3 — state:', jobData?.data?.state, '| plugin:', jobData?.data?.plugin);
}

// Optional — Get paginated items using resultId from Step 2
if (resultId) {
  const res    = await fetch(\`\${API_BASE}/integrations/tools/results/\${resultId}/items?page=1&limit=20\`, { headers });
  const result = await res.json();
  console.log('Items (' + result.meta?.total + '):', result.data);
} else {
  console.error('No resultId. Last job:', lastJob?.plugin, lastJob?.state, lastJob?.error);
}
\`\`\`

---

## Error Reference

| HTTP Status | Meaning | Action |
|---|---|---|
| \`400\` | Invalid input or insufficient credits | Check request body / error message |
| \`401\` | Missing or invalid credentials | Verify X-App-Id / X-App-Secret |
| \`403\` | Key inactive or resource not owned | Contact admin |
| \`404\` | Tool, run, or job not found | Verify toolId / runId / jobId |
| \`429\` | Rate limit exceeded | Wait and retry with exponential backoff |
| \`500\` | Internal server error | Retry or contact support |
`;
}
