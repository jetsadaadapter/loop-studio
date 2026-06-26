"use client";

import { useEffect, useState } from "react";
import { ApiReferenceReact } from "@scalar/api-reference-react";
import "@scalar/api-reference-react/style.css";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// Override Scalar's font variables with the project's font stack
const fontOverride = `
  .scalar-app, .scalar-app * {
    --scalar-font: var(--font-sans), ui-sans-serif, system-ui, -apple-system, sans-serif !important;
    --scalar-font-code: var(--font-mono), ui-monospace, SFMono-Regular, monospace !important;
  }
  @keyframes loading-bar {
    0% { left: -33%; }
    100% { left: 100%; }
  }
`;

const SKELETON_WIDTHS = ["60%", "75%", "50%", "85%", "70%", "65%", "80%", "55%"];

export function ApiDocsClient() {
  const [loading, setLoading] = useState(true);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // Start fading out the loader slightly before unmounting
    const fadeTimer = setTimeout(() => setFade(true), 800);
    const destroyTimer = setTimeout(() => setLoading(false), 1100);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(destroyTimer);
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: fontOverride }} />
      
      {loading && (
        <div
          className={`fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-950 transition-opacity duration-300 ${
            fade ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          {/* Skeleton Layout */}
          <div className="flex h-full w-full">
            {/* Sidebar Skeleton */}
            <div className="hidden md:flex w-72 border-r border-slate-200/60 dark:border-slate-800 flex-col p-6 gap-6 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
              <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
              <div className="flex flex-col gap-3 mt-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-4 w-4 bg-slate-200 dark:bg-slate-800 rounded-xs animate-pulse" />
                    <div
                      className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse"
                      style={{ width: SKELETON_WIDTHS[i % SKELETON_WIDTHS.length] }}
                    />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Content Skeleton */}
            <div className="flex-1 p-6 md:p-12 flex flex-col gap-6 bg-white dark:bg-slate-950 overflow-hidden">
              <div className="h-10 w-2/3 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
              <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
              
              <div className="mt-8 flex flex-col gap-4">
                <div className="h-32 w-full bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 animate-pulse flex flex-col p-4 gap-3 justify-center">
                  <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-md" />
                </div>
                <div className="h-40 w-full bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Centered Premium Overlay Loader */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 dark:bg-slate-950/70 backdrop-blur-xs z-50">
            <div className="flex flex-col items-center gap-5 p-6 rounded-2xl bg-white/90 dark:bg-slate-900/90 max-w-[280px] w-full mx-4 transition-all scale-100 animate-in fade-in zoom-in-95 duration-300">
              <div className="relative h-10 w-auto flex items-center justify-center animate-pulse">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/logo/logo-white-330x99.svg"
                  alt="Adapter Digital"
                  className="h-7 w-auto hidden dark:block"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/logo/logo-black-383x115.svg"
                  alt="Adapter Digital"
                  className="h-7 w-auto block dark:hidden"
                />
              </div>
              
              <div className="flex flex-col items-center gap-2">
                <div className="h-1 w-24 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
                  <div className="h-full bg-[#c20019] rounded-full animate-[loading-bar_1.5s_infinite_linear] absolute left-0 top-0 w-1/3" />
                </div>
                <span className="text-xs uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 font-sans mt-1">
                  Loading API Reference
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <ApiReferenceReact
        configuration={{
          sources: [
            {
              url: "/docs/openapi.json",
              agent: { disabled: true },
            },
          ],
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
            .scalar-app {
              --scalar-color-accent: #c20019 !important;
              --scalar-background-accent: rgba(194, 0, 25, 0.08) !important;
              --scalar-color-green: #069061 !important;
              --scalar-color-blue: #c20019 !important;
            }
            /* Adapter logo — injected via fixed positioning over sidebar top (header area) */
            .scalar-app {
              position: relative;
            }
            .docs-logo-overlay {
              position: fixed;
              top: 0;
              left: 0;
              width: var(--scalar-sidebar-width, 288px);
              height: 40px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding-left: 24px;
              padding-right: 12px;
              z-index: 100;
              pointer-events: none;
              background: var(--scalar-background-1);
              border-bottom: 1px solid var(--scalar-border-color);
              border-right: 1px solid var(--scalar-border-color);
            }
            .docs-logo-overlay img {
              height: 24px;
              width: auto;
            }
            
            /* Logo theme switching */
            .logo-light {
              display: block !important;
            }
            .logo-dark {
              display: none !important;
            }
            .dark-mode .logo-light,
            .dark .logo-light {
              display: none !important;
            }
            .dark-mode .logo-dark,
            .dark .logo-dark {
              display: block !important;
            }

            /* Responsive overrides for logo overlay and sidebar positioning */
            @media (max-width: 1000px) {
              .docs-logo-overlay {
                display: none !important;
              }
            }
            @media (min-width: 1001px) {
              .scalar-app .references-sidebar,
              .scalar-app .t-doc__sidebar {
                padding-top: 40px !important;
              }
            }
            * {
              font-family: var(--font-sans), ui-sans-serif, system-ui, -apple-system, sans-serif !important;
            }
            code, pre, .cm-editor, .cm-content {
              font-family: var(--font-mono), ui-monospace, SFMono-Regular, monospace !important;
              font-size: 0.75rem !important;
              line-height: 1.6 !important;
            }
            .sidebar-item, .sidebar-group-item, .sidebar-heading {
              font-size: 0.75rem !important;
            }
            .endpoint-path, .operation-path {
              font-size: 0.8125rem !important;
            }
            h1 { font-size: 1.5rem !important; font-weight: 700 !important; }
            h2 { font-size: 1.125rem !important; font-weight: 600 !important; }
            h3 { font-size: 0.9375rem !important; font-weight: 600 !important; }
            p, li, td, th, label, span:not(.cm-content) {
              font-size: 0.8125rem !important;
              line-height: 1.6 !important;
            }
            .httpMethod, .scalar-badge {
              font-size: 0.625rem !important;
              font-weight: 700 !important;
            }
            /* Hide Ask AI agent button */
            .agent-button-container {
              display: none !important;
            }
            /* Hide Generate MCP layer & nav */
            .scalar-mcp-layer,
            .mcp-nav {
              display: none !important;
            }
            /* Hide Powered by Scalar */
            .references-footer,
            a[href="https://www.scalar.com"] {
              display: none !important;
            }
            /* Hide Share & Deploy toolbar buttons — they are children 3+ inside the toolbar flex row */
            .api-reference-toolbar > div > :nth-child(n+3) {
              display: none !important;
            }

            /* Custom tool list item overrides: prevent word wrapping & add icons */
            [class*="button-label"] {
              white-space: nowrap !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
              display: block !important;
            }
            [class*="button-label"]::before {
              content: "";
              display: inline-block;
              width: 12px;
              height: 12px;
              margin-right: 8px;
              vertical-align: middle;
              background-color: currentColor;
              -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='4 17 10 11 4 5'%3E%3C/polyline%3E%3Cline x1='12' y1='19' x2='20' y2='19'%3E%3C/line%3E%3C/svg%3E") no-repeat center;
              mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='4 17 10 11 4 5'%3E%3C/polyline%3E%3Cline x1='12' y1='19' x2='20' y2='19'%3E%3C/line%3E%3C/svg%3E") no-repeat center;
              -webkit-mask-size: contain;
              mask-size: contain;
              opacity: 0.85;
              flex-shrink: 0;
            }

            /* Exclude introduction/overview sidebar items from having the tool icon */
            [data-sidebar-id*="introduction"] [class*="button-label"]::before,
            [data-sidebar-id*="intro"] [class*="button-label"]::before,
            [data-sidebar-id*="overview"] [class*="button-label"]::before,
            [data-sidebar-id*="description"] [class*="button-label"]::before,
            .references-sidebar > div > ul > li:first-child [class*="button-label"]::before,
            .t-doc__sidebar > div > ul > li:first-child [class*="button-label"]::before {
              content: none !important;
            }

            /* Custom icon for Models item: Cube/Box icon */
            [data-sidebar-id*="model"] [class*="button-label"]::before {
              -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'%3E%3C/path%3E%3Cpolyline points='3.27 6.96 12 12.01 20.73 6.96'%3E%3C/polyline%3E%3Cline x1='12' y1='22.08' x2='12' y2='12'%3E%3C/line%3E%3C/svg%3E") !important;
              mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'%3E%3C/path%3E%3Cpolyline points='3.27 6.96 12 12.01 20.73 6.96'%3E%3C/polyline%3E%3Cline x1='12' y1='22.08' x2='12' y2='12'%3E%3C/line%3E%3C/svg%3E") !important;
            }

            /* Custom icon for Results item: Bar Chart icon */
            [data-sidebar-id*="result"] [class*="button-label"]::before {
              -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='18' y1='20' x2='18' y2='10'%3E%3C/line%3E%3Cline x1='12' y1='20' x2='12' y2='4'%3E%3C/line%3E%3Cline x1='6' y1='20' x2='6' y2='14'%3E%3C/line%3E%3C/svg%3E") !important;
              mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='18' y1='20' x2='18' y2='10'%3E%3C/line%3E%3Cline x1='12' y1='20' x2='12' y2='4'%3E%3C/line%3E%3Cline x1='6' y1='20' x2='6' y2='14'%3E%3C/line%3E%3C/svg%3E") !important;
            }
          `,
        }}
      />
      
      <div className="docs-logo-overlay">
        <Link href="/apps" className="pointer-events-auto flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo/logo-white-330x99.svg"
            alt="Adapter Digital"
            className="logo-dark"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo/logo-black-383x115.svg"
            alt="Adapter Digital"
            className="logo-light"
          />
        </Link>
        <Link
          href="/manage"
          className="pointer-events-auto flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all font-sans"
        >
          <ArrowLeft className="w-3 h-3" />
          Console
        </Link>
      </div>
    </>
  );
}
