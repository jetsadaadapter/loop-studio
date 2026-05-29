"use client";

import { Wrench, Sparkles, Globe, LineChart, Ellipsis, Pencil, Trash2, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ManagerActionsDropdown } from "@/components/manager-actions-dropdown";
import type { ManageToolApiItem, ToolParam, ToolScript } from "@/core/interfaces/tool";
import {
  PLUGIN_META,
  PARAM_TYPE_BADGE,
  getSortedScripts,
} from "./data";

// ── Automatic dynamic tool icon resolver based on plugin type or name keywords ───

function getToolIconData(tool: ManageToolApiItem) {
  const name = tool.name.toLowerCase();
  const scripts = tool.scripts || [];
  const firstPlugin = scripts[0]?.plugin?.toLowerCase() || "";

  if (firstPlugin === "gemini" || name.includes("ai") || name.includes("gemini") || name.includes("analyzer") || name.includes("analysis")) {
    return {
      Icon: Sparkles,
      bgActive: "bg-violet-50/80 border-violet-150/80 text-violet-600",
      bgInactive: "bg-slate-100/80 border-slate-200/60 text-slate-400",
    };
  }
  if (firstPlugin === "apify" || name.includes("scrape") || name.includes("crawler") || name.includes("data") || name.includes("extract")) {
    return {
      Icon: Globe,
      bgActive: "bg-orange-50/80 border-orange-150/80 text-orange-600",
      bgInactive: "bg-slate-100/80 border-slate-200/60 text-slate-400",
    };
  }
  if (name.includes("social") || name.includes("fb") || name.includes("facebook") || name.includes("post") || name.includes("media") || name.includes("instagram")) {
    return {
      Icon: LineChart,
      bgActive: "bg-sky-50/80 border-sky-150/80 text-sky-600",
      bgInactive: "bg-slate-100/80 border-slate-200/60 text-slate-400",
    };
  }
  // Default fallback wrench icon
  return {
    Icon: Wrench,
    bgActive: "bg-rose-50/80 border-rose-150/80 text-rose-600",
    bgInactive: "bg-slate-100/80 border-slate-200/60 text-slate-400",
  };
}

function ToolIcon({ tool, isActive }: { tool: ManageToolApiItem; isActive: boolean }) {
  const { Icon, bgActive, bgInactive } = getToolIconData(tool);
  return (
    <div
      className={`flex size-11 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 ${
        isActive ? bgActive : bgInactive
      }`}
    >
      <Icon className={`size-4.5 ${isActive ? "animate-pulse-slow text-current" : ""}`} />
    </div>
  );
}

// ── Atomic badges ─────────────────────────────────────────────────────────────

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
        isActive
          ? "bg-emerald-50 text-emerald-700 border border-emerald-250 shadow-sm"
          : "bg-slate-100 text-slate-500 border border-slate-200"
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}
        aria-hidden
      />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function ParamBadge({ param, onClick }: { param: ToolParam; onClick?: () => void }) {
  const isPrompt = param.type === "prompt";
  const baseCls = PARAM_TYPE_BADGE[param.type] ?? "bg-slate-50/60 text-slate-600 border border-slate-200";
  const cls = isPrompt
    ? "cursor-pointer bg-violet-50/70 text-violet-700 border border-violet-200/80 hover:bg-violet-100 hover:text-violet-800 hover:border-violet-300 shadow-2xs select-none transition-all duration-200"
    : baseCls;

  return (
    <span
      onClick={onClick}
      role={isPrompt ? "button" : undefined}
      tabIndex={isPrompt ? 0 : undefined}
      onKeyDown={isPrompt ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(); } } : undefined}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}
    >
      {isPrompt && <Sparkles className="size-2.5 text-violet-500 animate-pulse-slow" />}
      {param.label}
      {param.required && (
        <span className="font-bold text-rose-500" aria-label="required">*</span>
      )}
    </span>
  );
}

function PipelineStep({ script, isLast }: { script: ToolScript; isLast: boolean }) {
  const meta = PLUGIN_META[script.plugin.toLowerCase()];
  return (
    <div className="flex items-center gap-1">
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-slate-600 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors hover:bg-slate-50 hover:border-slate-300">
        {meta && (
          <span className={`size-1.5 rounded-full ${meta.dot} animate-pulse`} aria-hidden />
        )}
        {script.label}
      </span>
      {!isLast && (
        <span className="flex items-center justify-center px-0.5 text-slate-300" aria-hidden>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>
      )}
    </div>
  );
}

// ── Tool row (Premium Light-Glassmorphism layout with 3-dots actions menu) ──────

interface ToolRowProps {
  tool: ManageToolApiItem;
  onEdit: () => void;
  onDelete: () => void;
  onPreviewPrompt?: (param: ToolParam) => void;
  onManageParams?: () => void;
  onManageScripts?: () => void;
}

export function ToolRow({ tool, onEdit, onDelete, onPreviewPrompt, onManageParams, onManageScripts }: ToolRowProps) {
  const scripts = getSortedScripts(tool);
  const namespace = `adapter/${tool.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <article
      className={`group relative overflow-hidden flex flex-col p-5 rounded-2xl border transition-all duration-300 bg-white/70 backdrop-blur-md ${
        tool.isActive
          ? "border-brand/20 hover:border-brand/40 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_12px_36px_rgb(0,0,0,0.05)]"
          : "border-slate-200/60 hover:border-slate-300/80 shadow-[0_4px_20px_rgb(0,0,0,0.01)] hover:shadow-[0_8px_24px_rgb(0,0,0,0.03)]"
      } hover:-translate-y-0.5`}
    >
      {/* Active stripe - Perfectly clipped by overflow-hidden */}
      {tool.isActive && (
        <span
          className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brand to-indigo-650"
          aria-hidden
        />
      )}

      {/* Top Header - Icon and Aligned Info Block next to it */}
      <div className="flex items-start gap-3">
        {/* Automatic Custom Icon */}
        <ToolIcon tool={tool} isActive={tool.isActive} />

        {/* Info Block */}
        <div className="min-w-0 flex-1 space-y-0.5 pr-8"> {/* Leave exact space for action menu dropdown */}
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="line-clamp-1 text-sm font-semibold tracking-tight text-slate-800 group-hover:text-brand transition-colors">
              {tool.name}
            </h3>
            <StatusBadge isActive={tool.isActive} />
          </div>
          <p className="line-clamp-1 font-sans text-[9px] font-medium tracking-wide text-slate-500">
            {namespace}
          </p>
        </div>

        {/* Actions Overlay Dropdown */}
        <div className="absolute top-4 right-4 z-20">
          <ManagerActionsDropdown
            ariaLabel={`Open actions for ${tool.name}`}
            actions={[
              {
                label: "Edit tool",
                icon: Pencil,
                onClick: onEdit,
              },
              ...(onManageParams
                ? [
                    {
                      label: "Manage params",
                      icon: Wrench,
                      onClick: onManageParams,
                    },
                  ]
                : []),
              ...(onManageScripts
                ? [
                    {
                      label: "Manage scripts",
                      icon: Workflow,
                      onClick: onManageScripts,
                    },
                  ]
                : []),
              {
                label: "Delete",
                icon: Trash2,
                onClick: onDelete,
                variant: "destructive" as const,
                showSeparatorBefore: true,
              },
            ]}
          />
        </div>
      </div>

      {/* Description */}
      <div className="mt-3.5 flex-1">
        {tool.description ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-slate-600">{tool.description}</p>
        ) : (
          <p className="text-xs italic leading-relaxed text-slate-400">No description</p>
        )}
      </div>

      {/* Grid Footer - Only renders parameters or pipelines if present */}
      {(tool.params.length > 0 || scripts.length > 0) && (
        <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
          <div className="space-y-2">
            {/* Parameters Section */}
            {tool.params.length > 0 && (
              <div className="space-y-1">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Parameters
                </span>
                <div className="flex flex-wrap items-center gap-1">
                  {tool.params.map((p) => (
                    <ParamBadge
                      key={p.id}
                      param={p}
                      onClick={() => {
                        if (p.type === "prompt") {
                          onPreviewPrompt?.(p);
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Pipeline Section */}
            {scripts.length > 0 && (
              <div className="space-y-1">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Pipeline
                </span>
                <div className="flex flex-wrap items-center gap-1">
                  {scripts.map((s, idx) => (
                    <PipelineStep key={s.id} script={s} isLast={idx === scripts.length - 1} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}    </article>
  );
}
