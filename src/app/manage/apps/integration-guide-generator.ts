import type { ToolScript } from "@/core/interfaces/tools.interface";

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

// Step 1 body example
function buildStep1Body(requiresWebhook: boolean): string {
  if (requiresWebhook) {
    return `\`\`\`json
{
  "input": {
    "startUrls": ["<paste-url-here>"]
  },
  "webhookUrl": "https://your-server.com/webhook/handler"
}
\`\`\``;
  }
  return `\`\`\`json
{
  "input": {
    "startUrls": ["<paste-url-here>"]
  }
}
\`\`\``;
}

export function generateIntegrationGuide(
  toolId: string,
  appName: string,
  scripts: ToolScript[],
): string {
  const needsWebhook = requiresWebhook(scripts);
  const sorted = [...scripts].sort((a, b) => a.sortOrder - b.sortOrder);
  const delivery = needsWebhook ? "**Webhook required**" : "Polling **or** Webhook";

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

${buildStep1Body(needsWebhook)}

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
    input: { startUrls: ['<paste-url-here>'] },${needsWebhook ? `\n    webhookUrl: 'https://your-server.com/webhook/handler',` : ""}
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
