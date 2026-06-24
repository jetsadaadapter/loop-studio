"use client";

import { ApiReferenceReact } from "@scalar/api-reference-react";
import "@scalar/api-reference-react/style.css";

// Override Scalar's font variables with the project's font stack
const fontOverride = `
  .scalar-app, .scalar-app * {
    --scalar-font: var(--font-sans), ui-sans-serif, system-ui, -apple-system, sans-serif !important;
    --scalar-font-code: var(--font-mono), ui-monospace, SFMono-Regular, monospace !important;
  }
`;

export function ApiDocsClient() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: fontOverride }} />
      <ApiReferenceReact
        configuration={{
          url: "/docs/openapi.json",
          theme: "default",
          layout: "modern",
          defaultHttpClient: {
            targetKey: "shell",
            clientKey: "curl",
          },
          authentication: {
            securitySchemes: {
              AppId: { token: "" },
              AppSecret: { token: "" },
            },
          },
          metaData: {
            title: "ADT Library API Reference",
          },
          customCss: `
            * {
              font-family: var(--font-sans), ui-sans-serif, system-ui, -apple-system, sans-serif !important;
            }
            code, pre, .cm-editor, .cm-content {
              font-family: var(--font-mono), ui-monospace, SFMono-Regular, monospace !important;
              font-size: 0.75rem !important;
              line-height: 1.6 !important;
            }
            /* Sidebar nav items */
            .sidebar-item, .sidebar-group-item, .sidebar-heading {
              font-size: 0.75rem !important;
            }
            /* Endpoint method + path */
            .endpoint-path, .operation-path {
              font-size: 0.8125rem !important;
            }
            /* Section headings */
            h1 { font-size: 1.5rem !important; font-weight: 700 !important; }
            h2 { font-size: 1.125rem !important; font-weight: 600 !important; }
            h3 { font-size: 0.9375rem !important; font-weight: 600 !important; }
            /* Body / description text */
            p, li, td, th, label, span:not(.cm-content) {
              font-size: 0.8125rem !important;
              line-height: 1.6 !important;
            }
            /* Badges (GET/POST/etc) */
            .httpMethod, .scalar-badge {
              font-size: 0.625rem !important;
              font-weight: 700 !important;
            }
            /* Hide Ask AI button in search bar */
            .scalar-search-ai, [data-ask-ai], .ask-ai-button, .ai-search,
            button[aria-label*="AI"], button[aria-label*="Ask"],
            .search-bar button:last-child {
              display: none !important;
            }
            /* Hide Generate MCP footer button */
            [href*="mcp"], [data-generate-mcp], .generate-mcp,
            a[href*="scalar.com/mcp"], .sidebar-footer a,
            .scalar-sidebar-footer a {
              display: none !important;
            }
          `,
        }}
      />
    </>
  );
}
