"use client";

import { useState } from "react";
import { Wrench, Sparkles, Globe, LineChart, Pencil, Trash2, Workflow, SlidersHorizontal, Copy, Check, CopyPlus, Plus } from "lucide-react";
import { ManagerActionsDropdown } from "@/components/manager-actions-dropdown";
import { Switch } from "@/components/ui/switch";
import type { ManageToolApiItem, ToolParam, ToolScript } from "@/core/interfaces/tool";
import {
  PLUGIN_META,
  PARAM_TYPE_BADGE,
  getSortedScripts,
} from "./data";

const VISIBLE_LIMIT = 3;

function OverflowBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.75 text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200/60 shadow-3xs">
      +{count}
    </span>
  );
}

// ── Automatic dynamic tool icon resolver based on plugin type or name keywords ───

export function getToolIconData(tool: ManageToolApiItem) {
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
    <div className="relative shrink-0">
      <div
        className={`flex size-10 items-center justify-center rounded-xl border transition-all duration-300 ${
          isActive ? bgActive : bgInactive
        }`}
      >
        <Icon className={`size-4 ${isActive ? "animate-pulse-slow text-current" : ""}`} />
      </div>
      {/* Status dot — top-right corner */}
      <span
        className={`absolute -top-1 -right-1 flex size-3.5 items-center justify-center rounded-full border-2 border-white shadow-sm ${
          isActive ? "bg-emerald-500" : "bg-slate-300"
        }`}
        aria-label={isActive ? "Active" : "Inactive"}
      >
        {isActive && <span className="size-1.5 rounded-full bg-white/70 animate-pulse" aria-hidden />}
      </span>
    </div>
  );
}

// ── Atomic badges ─────────────────────────────────────────────────────────────

function CopyableToolIdBadge({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <span
      onClick={handleCopy}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-[8px] font-bold text-slate-500 font-sans cursor-pointer hover:bg-slate-200 hover:text-slate-700 transition-colors select-none"
      title={`Copy Tool ID: ${id}`}
    >
      <span>ID: {id.slice(0, 8)}...</span>
      {copied ? (
        <Check className="size-2 shrink-0 text-emerald-600" />
      ) : (
        <Copy className="size-2 shrink-0 opacity-60" />
      )}
    </span>
  );
}

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

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="flex size-6 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-300 bg-white text-slate-400 hover:border-brand hover:text-brand hover:bg-rose-50 transition-all duration-200 cursor-pointer"
      title={label}
      aria-label={label}
    >
      <Plus className="size-3" />
    </button>
  );
}

const CIRCLE_FALLBACK = {
  circleBg: "bg-gradient-to-br from-slate-400 to-slate-500",
  circleText: "text-white",
  circleBorder: "border-slate-200",
};

function PipelineCircle({ script, index }: { script: ToolScript; index: number }) {
  const pluginKey = script.plugin.toLowerCase();
  const meta = pluginKey.startsWith("exportcomments")
    ? PLUGIN_META["exportcomments"]
    : (PLUGIN_META[pluginKey] ?? null);
  const { circleBg, circleText, circleBorder } = meta ?? CIRCLE_FALLBACK;
  const initial = (script.label || script.plugin).charAt(0).toUpperCase();

  return (
    <div
      className={`relative flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-white ${circleBg} ${circleText} ${circleBorder} shadow-sm transition-transform duration-200 hover:scale-110 hover:z-10 cursor-default`}
      style={{ marginLeft: index > 0 ? "-8px" : "0", zIndex: index }}
      title={script.label}
    >
      <span className="text-[10px] font-bold">{initial}</span>
    </div>
  );
}

function PipelineCircles({ scripts, onManageScripts }: { scripts: ToolScript[]; onManageScripts?: () => void }) {
  const MAX_VISIBLE = 4;
  const visible = scripts.slice(0, MAX_VISIBLE);
  const overflow = scripts.length - MAX_VISIBLE;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        {visible.map((s, i) => (
          <PipelineCircle key={s.id} script={s} index={i} />
        ))}
        {overflow > 0 && (
          <div
            className="relative flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-slate-500 shadow-sm text-[9px] font-bold"
            style={{ marginLeft: "-8px", zIndex: MAX_VISIBLE }}
            title={`${overflow} more scripts`}
          >
            +{overflow}
          </div>
        )}
      </div>
      {onManageScripts && (
        <AddButton onClick={onManageScripts} label="Manage pipeline scripts" />
      )}
    </div>
  );
}

// ── Tool row (Premium Light-Glassmorphism layout with 3-dots actions menu) ──────

interface ToolRowProps {
  tool: ManageToolApiItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive?: () => void;
  onDuplicate?: () => void;
  isDuplicating?: boolean;
  onPreviewPrompt?: (param: ToolParam) => void;
  onManageParams?: () => void;
  onManageScripts?: () => void;
}

export function ToolRow({ tool, onEdit, onDelete, onToggleActive, onDuplicate, isDuplicating, onPreviewPrompt, onManageParams, onManageScripts }: ToolRowProps) {
  const scripts = getSortedScripts(tool);
  const namespace = `adapter/${tool.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <article
      className={`group relative overflow-hidden flex flex-col p-4 rounded-2xl border transition-all duration-300 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.015)] ${
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
      <div className="flex items-start gap-2.5">
        {/* Automatic Custom Icon */}
        <div className="group-hover:scale-105 transition-transform duration-300">
          <ToolIcon tool={tool} isActive={tool.isActive} />
        </div>

        {/* Info Block */}
        <div className="min-w-0 flex-1 space-y-0">
          {/* Row 1: name + switch */}
          <div className="flex items-center gap-1.5">
            <h3 className="min-w-0 flex-1 truncate text-[13px] font-semibold tracking-tight text-slate-800 group-hover:text-brand transition-colors">
              {tool.name}
            </h3>
            {onToggleActive && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onToggleActive(); }}
                className="shrink-0 flex items-center cursor-pointer select-none"
                style={{ background: "none", border: "none", outline: "none", padding: 0 }}
                aria-label={tool.isActive ? "Deactivate tool" : "Activate tool"}
              >
                <Switch
                  checked={tool.isActive}
                  className="pointer-events-none data-[checked]:bg-emerald-500"
                  tabIndex={-1}
                />
              </button>
            )}
          </div>
          {/* Row 2: namespace path */}
          <p className="line-clamp-1 font-sans text-[9px] font-medium tracking-wide text-slate-400">
            {namespace}
          </p>
          {/* Row 3: ID badge */}
          <div className="pt-0.5">
            <CopyableToolIdBadge id={tool.id} />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-2 flex-1">
        {tool.description ? (
          <p className="line-clamp-1 text-[11px] leading-relaxed text-slate-500 font-sans">{tool.description}</p>
        ) : (
          <p className="text-[11px] italic leading-relaxed text-slate-400 font-sans">No description</p>
        )}
      </div>

      {/* Grid Footer - Renders parameters or pipelines, or a beautiful configuration prompt if empty */}
      {tool.params.length > 0 || scripts.length > 0 ? (
        <div className="mt-3 pt-3 border-t border-slate-100/85 space-y-2">
          <div className="space-y-2">
            {/* Parameters Section */}
            {tool.params.length > 0 && (
              <div className="space-y-1">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400/90">
                  Parameters
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {tool.params.slice(0, VISIBLE_LIMIT).map((p) => (
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
                  {tool.params.length > VISIBLE_LIMIT && (
                    <OverflowBadge count={tool.params.length - VISIBLE_LIMIT} />
                  )}
                  {onManageParams && (
                    <AddButton onClick={onManageParams} label="Manage parameters" />
                  )}
                </div>
              </div>
            )}

            {/* Pipeline Section — always visible */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400/90">
                  Pipeline
                </span>
                {scripts.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500 border border-slate-200/70">
                    <Workflow className="size-2.5 shrink-0" />
                    {scripts.length}
                  </span>
                )}
              </div>
              {scripts.length > 0 ? (
                <PipelineCircles scripts={scripts} onManageScripts={onManageScripts} />
              ) : (
                <div className="flex items-center gap-1.5">
                  {onManageScripts && (
                    <AddButton onClick={onManageScripts} label="Configure pipeline" />
                  )}
                  <span className="text-[9px] text-slate-400 font-sans">No scripts yet</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3 pt-3 border-t border-slate-100/80 flex flex-col items-center justify-center py-2.5 px-3 text-center bg-slate-50/40 rounded-xl border border-dashed border-slate-200/50">
          <p className="text-[10px] text-slate-400 font-semibold font-sans">
            No parameters or pipeline steps defined.
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            {onManageParams && (
              <button
                type="button"
                onClick={onManageParams}
                className="h-7 px-2.5 text-[9px] font-bold bg-white text-slate-700 hover:text-brand border border-slate-200 rounded-lg shadow-2xs hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-1"
              >
                <SlidersHorizontal className="size-2.5" />
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
      )}

      {/* Actions dropdown — bottom-right */}
      <div className="absolute bottom-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
                    icon: SlidersHorizontal,
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
            ...(onDuplicate
              ? [
                  {
                    label: isDuplicating ? "Duplicating…" : "Duplicate tool",
                    icon: CopyPlus,
                    disabled: isDuplicating,
                    onClick: onDuplicate,
                    showSeparatorBefore: true,
                  },
                ]
              : []),
            {
              label: "Delete",
              icon: Trash2,
              onClick: onDelete,
              variant: "destructive" as const,
              showSeparatorBefore: !onDuplicate,
            },
          ]}
        />
      </div>
    </article>
  );
}
