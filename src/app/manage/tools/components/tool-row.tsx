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
      bgActive: "bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent border-violet-500/20 text-violet-600 shadow-sm shadow-violet-500/5",
      bgInactive: "bg-slate-100/50 border-slate-200/50 text-slate-400",
    };
  }
  if (firstPlugin === "apify" || name.includes("scrape") || name.includes("crawler") || name.includes("data") || name.includes("extract")) {
    return {
      Icon: Globe,
      bgActive: "bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent border-orange-500/20 text-orange-600 shadow-sm shadow-orange-500/5",
      bgInactive: "bg-slate-100/50 border-slate-200/50 text-slate-400",
    };
  }
  if (name.includes("social") || name.includes("fb") || name.includes("facebook") || name.includes("post") || name.includes("media") || name.includes("instagram")) {
    return {
      Icon: LineChart,
      bgActive: "bg-gradient-to-br from-sky-500/10 via-blue-500/5 to-transparent border-sky-500/20 text-sky-600 shadow-sm shadow-sky-500/5",
      bgInactive: "bg-slate-100/50 border-slate-200/50 text-slate-400",
    };
  }
  // Default fallback wrench icon
  return {
    Icon: Wrench,
    bgActive: "bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-transparent border-rose-500/20 text-rose-600 shadow-sm shadow-rose-500/5",
    bgInactive: "bg-slate-100/50 border-slate-200/50 text-slate-400",
  };
}

function ToolIcon({ tool, isActive }: { tool: ManageToolApiItem; isActive: boolean }) {
  const { Icon, bgActive, bgInactive } = getToolIconData(tool);
  return (
    <div
      className={`flex size-12 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 ${
        isActive ? bgActive : bgInactive
      }`}
    >
      <Icon className={`size-5 ${isActive ? "animate-pulse-slow text-current" : ""}`} />
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
  const baseCls = PARAM_TYPE_BADGE[param.type] ?? "bg-slate-50 text-slate-600 border border-slate-200/60";
  const cls = isPrompt
    ? "cursor-pointer bg-violet-50/70 text-violet-700 border border-violet-200/80 hover:bg-violet-100/90 hover:text-violet-800 hover:border-violet-300 shadow-3xs select-none transition-all duration-200"
    : `${baseCls} shadow-3xs`;

  return (
    <span
      onClick={onClick}
      role={isPrompt ? "button" : undefined}
      tabIndex={isPrompt ? 0 : undefined}
      onKeyDown={isPrompt ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(); } } : undefined}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.75 text-[10px] font-semibold transition-all duration-250 ${cls}`}
    >
      {isPrompt && <Sparkles className="size-2.5 text-violet-500 animate-pulse-slow shrink-0" />}
      <span>{param.label}</span>
      {param.required && (
        <span className="font-bold text-rose-500 shrink-0 ml-0.5" aria-label="required">*</span>
      )}
    </span>
  );
}

function PipelineStep({ script, isLast }: { script: ToolScript; isLast: boolean }) {
  const meta = PLUGIN_META[script.plugin.toLowerCase()];
  return (
    <div className="flex items-center gap-1">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/70 bg-slate-50/60 px-2.5 py-0.75 text-[10px] font-semibold text-slate-600 transition-all hover:bg-white hover:border-slate-350 shadow-3xs cursor-default">
        {meta && (
          <span className={`size-1.5 rounded-full ${meta.dot} animate-pulse`} aria-hidden />
        )}
        <span>{script.label}</span>
      </span>
      {!isLast && (
        <span className="flex items-center justify-center px-0.5 text-slate-300" aria-hidden>
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
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
      className={`group relative overflow-hidden flex flex-col p-5.5 rounded-2xl border transition-all duration-300 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.015)] ${
        tool.isActive
          ? "border-slate-100 hover:border-brand/35 shadow-[0_12px_36px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)]"
          : "border-slate-100 hover:border-slate-300/80 shadow-[0_4px_20px_rgb(0,0,0,0.005)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.02)]"
      } hover:-translate-y-0.5`}
    >
      {/* Active stripe - Perfectly clipped by overflow-hidden */}
      {tool.isActive && (
        <span
          className="absolute left-0 top-0 bottom-0 w-1.2 bg-gradient-to-b from-brand via-violet-500 to-indigo-650 rounded-r-md group-hover:opacity-90 transition-opacity"
          aria-hidden
        />
      )}

      {/* Top Header - Icon and Aligned Info Block next to it */}
      <div className="flex items-start gap-3">
        {/* Automatic Custom Icon */}
        <div className="group-hover:scale-105 transition-transform duration-300">
          <ToolIcon tool={tool} isActive={tool.isActive} />
        </div>

        {/* Info Block */}
        <div className="min-w-0 flex-1 space-y-0.5 pr-8"> {/* Leave exact space for action menu dropdown */}
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="line-clamp-1 text-sm font-semibold tracking-tight text-slate-800 group-hover:text-brand transition-colors">
              {tool.name}
            </h3>
            <StatusBadge isActive={tool.isActive} />
          </div>
          <p className="line-clamp-1 font-sans text-[9px] font-medium tracking-wide text-slate-400">
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
          <p className="line-clamp-2 text-xs leading-relaxed text-slate-600 font-sans">{tool.description}</p>
        ) : (
          <p className="text-xs italic leading-relaxed text-slate-400 font-sans">No description</p>
        )}
      </div>

      {/* Grid Footer - Renders parameters or pipelines, or a beautiful configuration prompt if empty */}
      {tool.params.length > 0 || scripts.length > 0 ? (
        <div className="mt-5 pt-4 border-t border-slate-100/85 space-y-3">
          <div className="space-y-2.5">
            {/* Parameters Section */}
            {tool.params.length > 0 && (
              <div className="space-y-1">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400/90 mb-1.5">
                  Parameters
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
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
                <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400/90 mb-1.5">
                  Pipeline
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {scripts.map((s, idx) => (
                    <PipelineStep key={s.id} script={s} isLast={idx === scripts.length - 1} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-5 pt-4 border-t border-slate-100/80 flex flex-col items-center justify-center p-3 text-center bg-slate-50/40 rounded-xl border border-dashed border-slate-200/50">
          <p className="text-[10px] text-slate-400 font-semibold font-sans">
            No parameters or pipeline steps defined.
          </p>
          <div className="flex items-center gap-1.5 mt-2.5">
            {onManageParams && (
              <button
                type="button"
                onClick={onManageParams}
                className="h-7 px-2.5 text-[9px] font-bold bg-white text-slate-700 hover:text-brand border border-slate-200 rounded-lg shadow-2xs hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-1"
              >
                <Wrench className="size-2.5" />
                Add Params
              </button>
            )}
            {onManageScripts && (
              <button
                type="button"
                onClick={onManageScripts}
                className="h-7 px-2.5 text-[9px] font-bold bg-brand text-white rounded-lg shadow-2xs hover:bg-brand/95 transition-all cursor-pointer flex items-center gap-1"
              >
                <Workflow className="size-2.5" />
                Configure Pipeline
              </button>
            )}
          </div>
        </div>
      )}    </article>
  );
}
