"use client";

import type { ToolParam } from "@/core/interfaces/tool";
import type { ToolScript } from "@/core/interfaces/tools.interface";

const API_BASE = process.env.NEXT_PUBLIC_STORE_API_BASE_URL ?? "https://library-api.adapterdigital.com/api";

function requiresWebhook(scripts: ToolScript[]): boolean {
  return scripts.some((s) => s.plugin.toLowerCase().includes("exportcomments"));
}

function buildInputFromParams(params: ToolParam[]): Record<string, unknown> {
  if (!params || params.length === 0) return { startUrls: ["<paste-url-here>"] };
  const sorted = [...params].sort((a, b) => a.sortOrder - b.sortOrder);
  const input: Record<string, unknown> = {};
  for (const p of sorted) {
    if (p.type === "url" || p.type === "array") {
      input[p.key] = p.required ? ["<paste-url-here>"] : [];
    } else if (p.type === "number") {
      input[p.key] = p.defaultValue ? Number(p.defaultValue) : (p.required ? 0 : null);
    } else if (p.type === "boolean") {
      input[p.key] = p.defaultValue === "true" ? true : false;
    } else {
      input[p.key] = p.defaultValue ?? `<${p.key}>`;
    }
  }
  return input;
}

interface PostmanVariable {
  key: string;
  value: string;
  type: string;
}

interface PostmanHeader {
  key: string;
  value: string;
}

interface PostmanRequest {
  method: string;
  header: PostmanHeader[];
  url: { raw: string; protocol: string; host: string[]; path: string[] };
  body?: { mode: string; raw: string; options: { raw: { language: string } } };
}

interface PostmanEvent {
  listen: "test" | "prerequest";
  script: { type: string; exec: string[] };
}

interface PostmanItem {
  name: string;
  description?: string;
  request: PostmanRequest;
  event?: PostmanEvent[];
}

interface PostmanCollection {
  info: { name: string; schema: string };
  item: PostmanItem[];
  variable: PostmanVariable[];
}

const AUTH_HEADERS: PostmanHeader[] = [
  { key: "X-App-Id", value: "{{APP_ID}}" },
  { key: "X-App-Secret", value: "{{APP_SECRET}}" },
  { key: "Content-Type", value: "application/json" },
];

function buildUrl(path: string): PostmanRequest["url"] {
  const raw = `{{API_ENDPOINT}}${path}`;
  const segments = path.split("/").filter(Boolean);
  return {
    raw,
    protocol: "",
    host: ["{{API_ENDPOINT}}"],
    path: segments,
  };
}

export function generatePostmanCollection(
  toolId: string,
  appName: string,
  params: ToolParam[] = [],
  scripts: ToolScript[] = [],
  credentials?: { appId: string; appSecret: string },
  existingWebhookUrl?: string,
): PostmanCollection {
  const needsWebhook = requiresWebhook(scripts);
  const inputBody: Record<string, unknown> = { input: buildInputFromParams(params) };
  // Only include webhookUrl if the tool requires it AND the API key doesn't already have one configured
  if (needsWebhook && !existingWebhookUrl) {
    inputBody["webhookUrl"] = "https://your-server.com/webhook/handler";
  }

  const items: PostmanItem[] = [
    // ── Step 1: Run Tool ──────────────────────────────────────────────────────
    {
      name: "Step 1 — Run Tool",
      request: {
        method: "POST",
        header: AUTH_HEADERS,
        url: buildUrl(`/integrations/tools/{{TOOL_ID}}/run`),
        body: {
          mode: "raw",
          raw: JSON.stringify(inputBody, null, 2),
          options: { raw: { language: "json" } },
        },
      },
      event: [
        {
          listen: "test",
          script: {
            type: "text/javascript",
            exec: [
              "const res = pm.response.json();",
              "const runId = res?.data?.runId || res?.data?.id || res?.runId;",
              "if (runId) {",
              "  pm.collectionVariables.set('runId', runId);",
              "  console.log('✅ runId:', runId);",
              "} else {",
              "  console.warn('⚠️ runId not found', JSON.stringify(res));",
              "}",
            ],
          },
        },
      ],
    },
    // ── Step 2: Get Jobs by Run ID ────────────────────────────────────────────
    {
      name: "Step 2 — Get Jobs by Run ID",
      description: "Poll this until all jobs state = 'completed'.\n\nSets jobId = last job's jobId (final output).\nAlso sets intermediateJobId = exportcomments-fetch.jobId (if present) or jobs[0].jobId.",
      request: {
        method: "GET",
        header: AUTH_HEADERS,
        url: buildUrl(`/integrations/tools/{{TOOL_ID}}/runs/{{runId}}`),
      },
      event: [
        {
          listen: "test",
          script: {
            type: "text/javascript",
            exec: [
              "const res = pm.response.json();",
              "const jobs = res?.data?.jobs || res?.data || [];",
              "const jobArr = Array.isArray(jobs) ? jobs : [jobs];",
              "if (!jobArr.length) { console.warn('⚠️ No jobs in response'); return; }",
              "",
              "const allDone = jobArr.every(function(j) { return j.state === 'completed' || j.state === 'failed'; });",
              "if (!allDone) { console.warn('⏳ Jobs still running — resend until all states = completed.'); }",
              "",
              "// jobId = last job (used in Step 3)",
              "const lastJob = jobArr[jobArr.length - 1];",
              "const jobId = lastJob?.jobId || lastJob?.id;",
              "if (jobId) {",
              "  pm.collectionVariables.set('jobId', jobId);",
              "  console.log('✅ jobId (last: ' + lastJob.plugin + '):', jobId);",
              "} else {",
              "  console.warn('⚠️ jobId not found');",
              "}",
              "",
              "// resultId — 2 cases:",
              "// Case 1: exportcomments-fetch present → use its resultId (raw scraped data for paginating)",
              "// Case 2: no exportcomments-fetch → use first job's resultId (jobs[0])",
              "const fetchJob = jobArr.find(function(j) { return j.plugin === 'exportcomments-fetch'; });",
              "const resultSource = fetchJob || jobArr[0];",
              "const resultId = resultSource?.resultId || resultSource?.result?.id;",
              "if (resultId) {",
              "  pm.collectionVariables.set('resultId', resultId);",
              "  console.log('✅ resultId (' + resultSource.plugin + '):', resultId);",
              "} else {",
              "  console.warn('⚠️ resultId not found in ' + resultSource?.plugin + '. State: ' + resultSource?.state);",
              "}",
            ],
          },
        },
      ],
    },
    // ── Step 3: Get Results by Job ID ─────────────────────────────────────────
    {
      name: "Step 3 — Get Results by Job ID",
      description: "Uses {{jobId}} (last job) to get the final job result.\nSets {{resultId}} from the response for Step 4.",
      request: {
        method: "GET",
        header: AUTH_HEADERS,
        url: buildUrl(`/integrations/tools/{{TOOL_ID}}/jobs/{{jobId}}`),
      },
      event: [
        {
          listen: "test",
          script: {
            type: "text/javascript",
            exec: [
              "const res = pm.response.json();",
              "const resultId = res?.data?.resultId || res?.data?.result?.id;",
              "if (resultId) {",
              "  pm.collectionVariables.set('resultId', resultId);",
              "  console.log('✅ resultId:', resultId, '| state:', res?.data?.state);",
              "} else {",
              "  console.warn('⚠️ resultId not found. Job state:', res?.data?.state);",
              "}",
            ],
          },
        },
      ],
    },
    // ── Step 4: Get Paginated Items ───────────────────────────────────────────
    {
      name: "Optional — Get Paginated Items",
      description: "Uses {{resultId}} set in Step 2 to fetch paginated output.\n• exportcomments pipeline: resultId = exportcomments-fetch job's resultId (raw scraped data)\n• Other pipelines: resultId = last job's resultId (final output)",
      request: {
        method: "GET",
        header: AUTH_HEADERS,
        url: buildUrl(`/integrations/tools/results/{{resultId}}/items?page=1&limit=20`),
      },
      event: [
        {
          listen: "test",
          script: {
            type: "text/javascript",
            exec: [
              "const res = pm.response.json();",
              "const total = res?.meta?.total ?? res?.data?.length ?? '?';",
              "console.log('✅ Items total:', total, '| page:', res?.meta?.page);",
            ],
          },
        },
      ],
    },
  ];

  return {
    info: {
      name: `${appName} — Adapter Library API v2`,
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    item: items,
    variable: [
      { key: "API_ENDPOINT", value: API_BASE, type: "string" },
      { key: "TOOL_ID", value: toolId, type: "string" },
      { key: "APP_ID", value: "", type: "string" },
      { key: "APP_SECRET", value: "", type: "string" },
      { key: "runId", value: "", type: "string" },
      { key: "jobId", value: "", type: "string" },
      { key: "resultId", value: "", type: "string" },
    ],
  };
}

export function downloadPostmanCollection(toolId: string, appName: string, params: ToolParam[] = [], scripts: ToolScript[] = [], credentials?: { appId: string; appSecret: string }, existingWebhookUrl?: string) {
  const collection = generatePostmanCollection(toolId, appName, params, scripts, credentials, existingWebhookUrl);
  if (credentials) {
    const appIdVar = collection.variable.find((v) => v.key === "APP_ID");
    const appSecretVar = collection.variable.find((v) => v.key === "APP_SECRET");
    if (appIdVar) appIdVar.value = credentials.appId;
    if (appSecretVar) appSecretVar.value = credentials.appSecret;
  }
  const blob = new Blob([JSON.stringify(collection, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${appName.toLowerCase().replace(/\s+/g, "-")}-postman-collection.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
