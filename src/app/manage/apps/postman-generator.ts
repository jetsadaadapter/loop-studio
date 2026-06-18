"use client";

const API_BASE = process.env.NEXT_PUBLIC_STORE_API_BASE_URL ?? "https://library-api.adapterdigital.com/api";

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

interface PostmanItem {
  name: string;
  request: PostmanRequest;
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
  const full = `${API_BASE}${path}`;
  const url = new URL(full);
  return {
    raw: full,
    protocol: url.protocol.replace(":", ""),
    host: url.hostname.split("."),
    path: url.pathname.split("/").filter(Boolean),
  };
}

export function generatePostmanCollection(
  toolId: string,
  appName: string,
): PostmanCollection {
  const items: PostmanItem[] = [
    {
      name: "Step 1 — Run Tool",
      request: {
        method: "POST",
        header: AUTH_HEADERS,
        url: buildUrl(`/integrations/tools/${toolId}/run`),
        body: {
          mode: "raw",
          raw: JSON.stringify(
            {
              input: { startUrls: ["<paste-url-here>"] },
              webhookUrl: "https://your-server.com/webhook/handler",
            },
            null,
            2,
          ),
          options: { raw: { language: "json" } },
        },
      },
    },
    {
      name: "Step 2 — Get Jobs by Run ID",
      request: {
        method: "GET",
        header: AUTH_HEADERS,
        url: buildUrl(`/integrations/tools/${toolId}/runs/{{runId}}`),
      },
    },
    {
      name: "Step 3 — Get Result by Job ID",
      request: {
        method: "GET",
        header: AUTH_HEADERS,
        url: buildUrl(`/integrations/tools/${toolId}/jobs/{{jobId}}`),
      },
    },
    {
      name: "Get Paginated Items",
      request: {
        method: "GET",
        header: AUTH_HEADERS,
        url: {
          raw: `${API_BASE}/integrations/tools/results/{{resultId}}/items?page=1&limit=20`,
          protocol: "https",
          host: ["library-api", "adapterdigital", "com"],
          path: ["api", "integrations", "tools", "results", "{{resultId}}", "items"],
        },
      },
    },
  ];

  return {
    info: {
      name: `${appName} — Adapter Library API`,
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    item: items,
    variable: [
      { key: "APP_ID", value: "", type: "string" },
      { key: "APP_SECRET", value: "", type: "string" },
      { key: "runId", value: "", type: "string" },
      { key: "jobId", value: "", type: "string" },
      { key: "resultId", value: "", type: "string" },
    ],
  };
}

export function downloadPostmanCollection(toolId: string, appName: string) {
  const collection = generatePostmanCollection(toolId, appName);
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
