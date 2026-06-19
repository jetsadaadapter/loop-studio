import type { ToolScript } from "@/core/interfaces/tools.interface";
import type { ToolParam } from "@/core/interfaces/tool";

const API_BASE = process.env.NEXT_PUBLIC_STORE_API_BASE_URL ?? "https://library-api.adapterdigital.com/api";

// Detect if tool requires webhook (ExportComments pipeline)
function requiresWebhook(scripts: ToolScript[]): boolean {
  return scripts.some((s) => s.plugin.toLowerCase().includes("exportcomments"));
}

// Map plugin name to human-readable label
function pluginLabel(plugin: string): string {
  const map: Record<string, string> = {
    apify: "Apify Scraper",
    gemini: "Gemini AI",
    "exportcomments-create": "Create an Export Job",
    "exportcomments-fetch": "Retrieve an Export Job",
  };
  return map[plugin.toLowerCase()] || plugin;
}

// Build pipeline table rows
function buildPipelineTable(scripts: ToolScript[]): string {
  const sorted = [...scripts].sort((a, b) => a.sortOrder - b.sortOrder);
  const rows = sorted
    .map((s, i) => `| ${i + 1} | ${s.label || pluginLabel(s.plugin)} | \`${s.plugin}\` |`)
    .join("\n");
  return `| # | Label | Plugin |\n|---|---|---|\n${rows}`;
}

// Delivery note
function buildDeliveryNote(scripts: ToolScript[]): string {
  if (requiresWebhook(scripts)) {
    return `> ⚠️ This tool depends on an external callback from the ExportComments service. A \`webhookUrl\` must be configured on your API key or provided in the request body. Polling alone will not complete the run.`;
  }
  return `Both jobs are queued immediately on Step 1 and can run in parallel. You can poll or use a webhook.`;
}

// Build params table
function buildParamsTable(params: ToolParam[]): string {
  if (!params || params.length === 0) return "";
  const sorted = [...params].sort((a, b) => a.sortOrder - b.sortOrder);
  const rows = sorted
    .map((p) => `| \`${p.key}\` | ${p.label} | \`${p.type}\` | ${p.required ? "**Required**" : "Optional"} | ${p.placeholder ?? p.defaultValue ?? "—"} |`)
    .join("\n");
  return `| Key | Label | Type | Required | Notes |\n|---|---|---|---|---|\n${rows}`;
}

// Build Step 1 request body from actual params
function buildStep1Body(params: ToolParam[], needsWebhook: boolean): string {
  const inputFields: Record<string, unknown> = {};
  if (params && params.length > 0) {
    const sorted = [...params].sort((a, b) => a.sortOrder - b.sortOrder);
    for (const p of sorted) {
      if (p.type === "url" || p.type === "array") {
        inputFields[p.key] = p.required ? ["<paste-url-here>"] : [];
      } else if (p.type === "number") {
        inputFields[p.key] = p.defaultValue ? Number(p.defaultValue) : (p.required ? 0 : null);
      } else if (p.type === "boolean") {
        inputFields[p.key] = p.defaultValue === "true" ? true : false;
      } else {
        inputFields[p.key] = p.defaultValue ?? `<${p.key}>`;
      }
    }
  } else {
    inputFields["startUrls"] = ["<paste-url-here>"];
  }

  const body: Record<string, unknown> = { input: inputFields };
  if (needsWebhook) body["webhookUrl"] = "https://your-server.com/webhook/handler";

  return `\`\`\`json\n${JSON.stringify(body, null, 2)}\n\`\`\``;
}

// Build Node.js code example input object from params
function buildNodeJsInput(params: ToolParam[]): string {
  if (!params || params.length === 0) {
    return `{ startUrls: ['<paste-url-here>'] }`;
  }
  const sorted = [...params].sort((a, b) => a.sortOrder - b.sortOrder);
  const fields = sorted.map((p) => {
    if (p.type === "url" || p.type === "array") {
      return `      ${p.key}: ['<paste-url-here>']`;
    } else if (p.type === "number") {
      return `      ${p.key}: ${p.defaultValue ?? (p.required ? 0 : "null")}`;
    } else if (p.type === "boolean") {
      return `      ${p.key}: ${p.defaultValue === "true" ? "true" : "false"}`;
    }
    return `      ${p.key}: '<${p.key}>'`;
  });
  return `{\n${fields.join(",\n")}\n    }`;
}

export function generateIntegrationGuide(
  toolId: string,
  appName: string,
  scripts: ToolScript[],
  params: ToolParam[] = [],
): string {
  const needsWebhook = requiresWebhook(scripts);
  const sorted = [...scripts].sort((a, b) => a.sortOrder - b.sortOrder);
  const delivery = needsWebhook ? "**Webhook required**" : "Polling **or** Webhook";
  const paramsTable = buildParamsTable(params);
  const nodeJsInput = buildNodeJsInput(params);

  return `# ${appName} — API Integration Guide

## Overview

The Adapter Library API lets you run AI-powered data tools programmatically. Each tool invocation creates a **run** containing one or more **jobs**. Results can be retrieved via polling or delivered automatically via webhook.

**Base URL**
\`\`\`
${API_BASE}
\`\`\`

---

## Authentication

All requests require two headers:

| Header | Description |
|---|---|
| \`X-App-Id\` | Your application ID |
| \`X-App-Secret\` | Your secret key |

> **Security note:** Never expose your \`X-App-Secret\` in client-side code or public repositories. Store it as an environment variable on your server.

---

## Tool Reference

| Property | Value |
|---|---|
| Tool ID | \`${toolId}\` |
| Delivery | ${delivery} |

**Pipeline**

${buildPipelineTable(scripts)}

${buildDeliveryNote(scripts)}

${paramsTable ? `---\n\n## Input Parameters\n\n${paramsTable}\n` : ""}
---

## The 3-Step Flow

### Step 1 — Run the Tool

\`\`\`
POST ${API_BASE}/integrations/tools/${toolId}/run
Content-Type: application/json
X-App-Id: <your-app-id>
X-App-Secret: <your-secret>
\`\`\`

**Body**

${buildStep1Body(params, needsWebhook)}

**Response**

\`\`\`json
{
  "success": true,
  "data": {
    "toolId": "${toolId}",
    "runId": "<runId>",
    "jobs": [${sorted.map((s) => `\n      { "jobId": "<jobId>", "plugin": "${s.plugin}" }`).join(",")}
    ]
  }
}
\`\`\`

Save the \`runId\` — you will need it for Step 2.

---

### Step 2 — Get Jobs by Run ID

\`\`\`
GET ${API_BASE}/integrations/tools/${toolId}/runs/{runId}
X-App-Id: <your-app-id>
X-App-Secret: <your-secret>
\`\`\`

Poll every 3–5 seconds until all jobs are \`completed\` or \`failed\`.

| State | Meaning |
|---|---|
| \`queued\` | Waiting to be picked up |
| \`active\` | Currently processing |
| \`waiting\` | Waiting for an upstream job |
| \`completed\` | Finished — \`resultId\` is available |
| \`failed\` | Error — check the \`error\` field |

---

### Step 3 — Get Result by Job ID

\`\`\`
GET ${API_BASE}/integrations/tools/${toolId}/jobs/{jobId}
X-App-Id: <your-app-id>
X-App-Secret: <your-secret>
\`\`\`

---

## Paginated Items

For large datasets, use \`resultId\` from Step 2:

\`\`\`
GET ${API_BASE}/integrations/tools/results/{resultId}/items?page=1&limit=20
X-App-Id: <your-app-id>
X-App-Secret: <your-secret>
\`\`\`

| Query param | Default | Max |
|---|---|---|
| \`page\` | \`1\` | — |
| \`limit\` | \`10\` | \`100\` |

---

## Code Example (Node.js)

\`\`\`typescript
const API_BASE = '${API_BASE}';
const TOOL_ID  = '${toolId}';

const headers = {
  'X-App-Id':     process.env.APP_ID!,
  'X-App-Secret': process.env.APP_SECRET!,
  'Content-Type': 'application/json',
};

// Step 1 — Run the tool
const runRes = await fetch(\`\${API_BASE}/integrations/tools/\${TOOL_ID}/run\`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    input: ${nodeJsInput},${needsWebhook ? `\n    webhookUrl: 'https://your-server.com/webhook/handler',` : ""}
  }),
});
const { data: { runId } } = await runRes.json();

// Step 2 — Poll until all jobs complete
async function waitForRun(runId: string) {
  while (true) {
    const res = await fetch(\`\${API_BASE}/integrations/tools/\${TOOL_ID}/runs/\${runId}\`, { headers });
    const { data } = await res.json();
    const allDone = data.jobs.every((j: any) =>
      j.state === 'completed' || j.state === 'failed'
    );
    if (allDone) return data.jobs;
    await new Promise(r => setTimeout(r, 4000));
  }
}
const completedJobs = await waitForRun(runId);

// Step 3 — Fetch results
for (const job of completedJobs) {
  if (job.state !== 'completed' || !job.jobId) continue;
  const res = await fetch(\`\${API_BASE}/integrations/tools/\${TOOL_ID}/jobs/\${job.jobId}\`, { headers });
  const result = await res.json();
  console.log(\`[\${job.label}]\`, result);
}
\`\`\`

---

## Error Reference

| HTTP Status | Meaning |
|---|---|
| \`401\` | Missing or invalid credentials |
| \`403\` | Key inactive or resource not owned |
| \`404\` | Tool, run, or job not found |
| \`400\` | Invalid request body |
| \`500\` | Internal server error |
`;
}
