import { ArrowRight, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ManageToolApiItem, ToolParam, ToolScript } from "@/core/interfaces/tool";
import {
  PLUGIN_META,
  PARAM_TYPE_BADGE,
  getShortId,
  formatUpdatedAt,
  getSortedScripts,
} from "./data";

// ── Atomic badges ─────────────────────────────────────────────────────────────

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
        isActive
          ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${isActive ? "bg-white/70" : "bg-slate-400"}`}
        aria-hidden
      />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function ParamBadge({ param }: { param: ToolParam }) {
  const cls = PARAM_TYPE_BADGE[param.type] ?? "bg-slate-50 text-slate-500 ring-slate-200";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${cls}`}>
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
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600">
        {meta && (
          <span className={`size-1.5 rounded-full ${meta.dot}`} aria-hidden />
        )}
        {script.label}
      </span>
      {!isLast && (
        <ArrowRight className="size-3 text-slate-300" aria-hidden />
      )}
    </span>
  );
}

// ── Tool icon ─────────────────────────────────────────────────────────────────

function ToolIcon({ isActive }: { isActive: boolean }) {
  return (
    <div
      className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 ${
        isActive
          ? "bg-brand/8 ring-brand/20 shadow-sm shadow-brand/10"
          : "bg-slate-50 ring-slate-200/60"
      }`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={isActive ? "text-brand" : "text-slate-400"}
        aria-hidden
      >
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    </div>
  );
}

// ── Tool row ──────────────────────────────────────────────────────────────────

interface ToolRowProps {
  tool: ManageToolApiItem;
  onEdit: () => void;
  onDelete: () => void;
}

export function ToolRow({ tool, onEdit, onDelete }: ToolRowProps) {
  const scripts = getSortedScripts(tool);

  return (
    <article className="group relative flex items-start gap-4 px-5 py-4 transition-colors duration-150 hover:bg-slate-50/70">
      {/* Active stripe */}
      {tool.isActive && (
        <span
          className="absolute left-0 top-3.5 bottom-3.5 w-[3px] rounded-r-full bg-gradient-to-b from-brand to-indigo-500"
          aria-hidden
        />
      )}

      {/* Icon */}
      <ToolIcon isActive={tool.isActive} />

      {/* Body */}
      <div className="min-w-0 flex-1 space-y-2">
        {/* Title row */}
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold leading-tight text-slate-900">
            {tool.name}
          </h3>
          <StatusBadge isActive={tool.isActive} />
          <span className="font-mono text-[10px] font-semibold tracking-wider text-slate-400">
            {getShortId(tool.id)}
          </span>
        </div>

        {/* Description */}
        {tool.description ? (
          <p className="line-clamp-1 text-xs text-slate-500">{tool.description}</p>
        ) : (
          <p className="text-xs italic text-slate-400">No description</p>
        )}

        {/* Params */}
        {tool.params.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-300">
              Params
            </span>
            {tool.params.map((p) => (
              <ParamBadge key={p.id} param={p} />
            ))}
          </div>
        )}

        {/* Pipeline */}
        {scripts.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 pt-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-300">
              Pipeline
            </span>
            {scripts.map((s, idx) => (
              <PipelineStep key={s.id} script={s} isLast={idx === scripts.length - 1} />
            ))}
          </div>
        )}
      </div>

      {/* Right: meta + actions */}
      <div className="flex shrink-0 items-start gap-1 pt-0.5">
        {/* Meta — desktop only */}
        <div className="hidden shrink-0 flex-col items-end gap-1 pr-2 sm:flex">
          <time className="text-[11px] text-slate-400" dateTime={tool.updatedAt}>
            {formatUpdatedAt(tool.updatedAt)}
          </time>
          {tool.scripts.length > 0 && (
            <span className="text-[10px] text-slate-400">
              {tool.scripts.length} {tool.scripts.length === 1 ? "step" : "steps"}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-slate-300 hover:bg-brand/8 hover:text-brand"
          onClick={onEdit}
          aria-label={`Edit ${tool.name}`}
        >
          <Pencil className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-slate-300 hover:bg-rose-50 hover:text-rose-500"
          onClick={onDelete}
          aria-label={`Delete ${tool.name}`}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </article>
  );
}
