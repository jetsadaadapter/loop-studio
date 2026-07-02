import * as fs from "node:fs";
import * as path from "node:path";

interface ToolParam {
  key: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
  defaultValue?: string | null;
  placeholder?: string | null;
  sortOrder: number;
}

interface ToolScript {
  plugin: string;
  label?: string | null;
  sortOrder: number;
}

interface ManageAppApiItem {
  id: string;
  name: string;
  appTool?: {
    tool: {
      id: string;
      description?: string | null;
      params?: ToolParam[];
      scripts?: ToolScript[];
    };
  } | null;
}

function paramToJsonSchemaType(type: string): string {
  switch (type) {
    case "number": return "number";
    case "boolean": return "boolean";
    case "url":
    case "text":
    case "string":
    case "multiline":
    case "textarea":
    case "date":
    case "prompt":
    case "select":
      return "string";
    case "array":
    case "json":
      return "array";
    default:
      return "string";
  }
}

function buildInputSchema(params: ToolParam[]) {
  const sorted = [...params].sort((a, b) => a.sortOrder - b.sortOrder);
  const properties: Record<string, Record<string, unknown>> = {};
  const required: string[] = [];

  for (const p of sorted) {
    const prop: Record<string, unknown> = {
      description: p.label,
    };

    if (p.type === "array" || p.type === "url") {
      prop.type = "array";
      prop.items = { type: "string", format: p.type === "url" ? "uri" : undefined };
    } else if (p.type === "json") {
      prop.type = "array";
      prop.items = { type: "object" };
    } else {
      prop.type = paramToJsonSchemaType(p.type);
    }

    if (p.options && p.options.length > 0) {
      prop.enum = p.options;
    }
    if (p.defaultValue !== null && p.defaultValue !== undefined) {
      prop.default = p.type === "number" ? Number(p.defaultValue) :
        p.type === "boolean" ? p.defaultValue === "true" : p.defaultValue;
    }
    if (p.placeholder) {
      prop.example = p.placeholder;
    }

    properties[p.key] = prop;
    if (p.required) required.push(p.key);
  }

  return { type: "object" as const, properties, ...(required.length > 0 ? { required } : {}) };
}

function requiresWebhook(scripts: ToolScript[]): boolean {
  return scripts.some((s) => s.plugin.toLowerCase().includes("exportcomments"));
}

function buildToolPaths(toolId: string, toolName: string, params: ToolParam[], scripts: ToolScript[]) {
  const needsWebhook = requiresWebhook(scripts);
  const inputSchema = buildInputSchema(params);

  const requestSchema: Record<string, unknown> = {
    type: "object",
    required: ["input"],
    properties: {
      input: inputSchema,
      ...(needsWebhook ? {
        webhookUrl: {
          type: "string",
          format: "uri",
          description: "URL สำหรับรับ Webhook เมื่อ run เสร็จ (จำเป็นสำหรับ Tool ที่ใช้ ExportComments)",
        },
      } : {}),
    },
  };

  const pipelineDesc = scripts
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s, i) => `${i + 1}. ${s.label || s.plugin}`)
    .join("\n");

  const paths: Record<string, Record<string, unknown>> = {};

  paths[`/integrations/tools/${toolId}/run`] = {
    post: {
      summary: `Run — ${toolName}`,
      description: `เรียกใช้ Tool "${toolName}"\n\n**Pipeline:**\n${pipelineDesc}`,
      operationId: `runTool_${toolId}`,
      tags: [toolName],
      parameters: [
        {
          name: "toolId",
          in: "path",
          required: true,
          schema: { type: "string", enum: [toolId] },
          description: "Tool ID",
        },
      ],
      requestBody: {
        required: true,
        content: { "application/json": { schema: requestSchema } },
      },
      responses: {
        "200": {
          description: "Tool started — returns runId and jobs",
          content: { "application/json": { schema: { $ref: "#/components/schemas/RunToolResponse" } } },
        },
        "400": { description: "Invalid input or insufficient credits", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        "404": { description: "Tool not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        "429": { description: "Rate limit exceeded", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      },
    },
  };

  paths[`/integrations/tools/${toolId}/runs/{runId}`] = {
    get: {
      summary: `Poll Status — ${toolName}`,
      description: `ดึงสถานะ jobs ทั้งหมดภายใน run — Poll ทุก 4 วินาที จน state = completed`,
      operationId: `getRunStatus_${toolId}`,
      tags: [toolName],
      parameters: [
        { name: "toolId", in: "path", required: true, schema: { type: "string", enum: [toolId] } },
        { name: "runId", in: "path", required: true, schema: { type: "string" }, description: "Run ID จาก Step 1" },
      ],
      responses: {
        "200": { description: "Current job states", content: { "application/json": { schema: { $ref: "#/components/schemas/RunStatusResponse" } } } },
        "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        "404": { description: "Run not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      },
    },
  };

  paths[`/integrations/tools/${toolId}/jobs/{jobId}`] = {
    get: {
      summary: `Job Result — ${toolName}`,
      description: `ดึงผลลัพธ์ของ job — ใช้ jobId (last job) จาก Step 2`,
      operationId: `getJobResult_${toolId}`,
      tags: [toolName],
      parameters: [
        { name: "toolId", in: "path", required: true, schema: { type: "string", enum: [toolId] } },
        { name: "jobId", in: "path", required: true, schema: { type: "string" }, description: "Job ID จาก Step 2 (last job)" },
      ],
      responses: {
        "200": { description: "Job detail with result", content: { "application/json": { schema: { $ref: "#/components/schemas/JobDetailResponse" } } } },
        "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        "404": { description: "Job not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      },
    },
  };

  return paths;
}

async function run() {
  const token = process.argv[2] || process.env.ZT_TOKEN;
  if (!token) {
    console.error("❌ Error: Missing ZT_TOKEN. Provide it as an argument or environment variable.");
    console.error("Usage: npm run update-spec <your_zt_token>");
    console.error("   or: ZT_TOKEN=<your_zt_token> npm run update-spec");
    process.exit(1);
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_STORE_API_BASE_URL || "https://library-api.adapterdigital.com/api";
  const url = `${apiBaseUrl.endsWith("/") ? apiBaseUrl.slice(0, -1) : apiBaseUrl}/manage/apps?page=1&limit=200`;

  console.log(`📡 Fetching apps from: ${url}`);
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status} ${res.statusText}`);
    }

    const body = (await res.json()) as { data: ManageAppApiItem[] };
    const apps = body.data ?? [];
    const toolApps = apps.filter((app) => app.appTool?.tool);

    console.log(`✓ Retrieved ${apps.length} apps (${toolApps.length} tools)`);

    const allPaths: Record<string, Record<string, unknown>> = {};
    const tags: Array<{ name: string; description: string }> = [];

    for (const app of toolApps) {
      const tool = app.appTool!.tool;
      const toolPaths = buildToolPaths(
        tool.id,
        app.name,
        tool.params ?? [],
        tool.scripts ?? [],
      );
      Object.assign(allPaths, toolPaths);
      tags.push({
        name: app.name,
        description: tool.description || `Tool: ${app.name}`,
      });
    }

    allPaths["/integrations/tools/results/{resultId}/items"] = {
      get: {
        summary: "Get Paginated Items",
        description: "ดึงผลลัพธ์แบบแบ่งหน้า — ใช้ resultId จาก Step 2",
        operationId: "getResultItems",
        tags: ["Results"],
        parameters: [
          { name: "resultId", in: "path", required: true, schema: { type: "string" }, description: "Result ID จาก Step 2" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "หน้าที่ต้องการ" },
          { name: "limit", in: "query", schema: { type: "integer", default: 10, maximum: 100 }, description: "จำนวนต่อหน้า (max 100)" },
        ],
        responses: {
          "200": { description: "Paginated items", content: { "application/json": { schema: { $ref: "#/components/schemas/ResultItemsResponse" } } } },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "404": { description: "Result not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    };

    tags.push({ name: "Results", description: "ดึงผลลัพธ์แบบแบ่งหน้าหลังจาก Tool ประมวลผลเสร็จสิ้น" });

    const spec = {
      openapi: "3.1.0",
      info: {
        title: "ADT Library API",
        version: "1.0.0",
        description: "API สำหรับเรียกใช้ Tool, ดึงผลลัพธ์, และรับ Webhook Events จากระบบ Adapter Library\n\nทุก Request ต้องส่ง Header `X-App-Id` และ `X-App-Secret` ที่ได้รับจากหน้า **API Keys**",
        contact: { name: "Adapter Digital Group", url: "https://adapterdigital.com" },
      },
      servers: [{ url: "https://library-api.adapterdigital.com/api", description: "Production" }],
      security: [{ AppId: [], AppSecret: [] }],
      components: {
        securitySchemes: {
          AppId: { type: "apiKey", in: "header", name: "X-App-Id", description: "App ID ที่ได้รับจากหน้า API Keys" },
          AppSecret: { type: "apiKey", in: "header", name: "X-App-Secret", description: "Secret Key สำหรับยืนยันตัวตน — ห้ามเปิดเผยหรือ commit ลง repository" },
        },
        schemas: {
          RunToolResponse: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: {
                type: "object",
                properties: {
                  runId: { type: "string" },
                  jobs: { type: "array", items: { $ref: "#/components/schemas/JobSummary" } },
                },
              },
            },
          },
          JobSummary: {
            type: "object",
            properties: {
              jobId: { type: "string" },
              plugin: { type: "string" },
              state: { type: "string", enum: ["queued", "running", "waiting", "completed", "failed"] },
            },
          },
          RunStatusResponse: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  runId: { type: "string" },
                  jobs: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        jobId: { type: "string" },
                        plugin: { type: "string" },
                        state: { type: "string", enum: ["queued", "running", "waiting", "completed", "failed"] },
                        resultId: { type: "string", nullable: true },
                        error: { type: "string", nullable: true },
                      },
                    },
                  },
                },
              },
            },
          },
          JobDetailResponse: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  jobId: { type: "string" },
                  plugin: { type: "string" },
                  state: { type: "string", enum: ["queued", "running", "waiting", "completed", "failed"] },
                  resultId: { type: "string" },
                  result: { type: "object", properties: { itemCount: { type: "integer" } }, additionalProperties: true },
                },
              },
            },
          },
          ResultItemsResponse: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: { type: "array", items: { $ref: "#/components/schemas/ResultItem" } },
              meta: {
                type: "object",
                properties: {
                  total: { type: "integer" },
                  page: { type: "integer" },
                  limit: { type: "integer" },
                  totalPages: { type: "integer" },
                },
              },
            },
          },
          ResultItem: {
            type: "object",
            properties: {
              id: { type: "string" },
              sourceKey: { type: "string" },
              sourceKeyValue: { type: "string" },
              analysis: { type: "object", additionalProperties: true },
            },
          },
          ErrorResponse: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string" },
              message: { type: "string" },
              statusCode: { type: "integer" },
            },
          },
        },
      },
      paths: allPaths,
      tags,
    };

    const targetFile = path.join(process.cwd(), "public/docs/openapi.json");
    fs.writeFileSync(targetFile, JSON.stringify(spec, null, 2), "utf8");
    console.log(`💾 Successfully updated static OpenAPI spec at: ${targetFile}`);
  } catch (error) {
    console.error("❌ Failed to update OpenAPI spec:", error);
    process.exit(1);
  }
}

run();
