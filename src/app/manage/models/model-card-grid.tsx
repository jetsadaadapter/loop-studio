"use client";

import Image from "next/image";
import { Star, Cpu, Pencil, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ManagerActionsDropdown } from "@/components/manager-actions-dropdown";
import type { ModelRecord } from "./use-manage-ai";

// ── Provider logo/color resolver ──────────────────────────────────────────────

const PROVIDER_META: Record<string, { bg: string; label: string; initial: string }> = {
  google:    { bg: "from-blue-100/60 via-red-50/40 to-yellow-100/40",        label: "Google",    initial: "G"  },
  gemini:    { bg: "from-indigo-100/60 via-purple-100/40 to-blue-50/40",     label: "Gemini",    initial: "Ge" },
  anthropic: { bg: "from-orange-100/70 via-amber-100/50 to-rose-50/30",      label: "Anthropic", initial: "A"  },
  openai:    { bg: "from-emerald-100/60 via-teal-50/40 to-green-100/40",     label: "OpenAI",    initial: "AI" },
  mistral:   { bg: "from-violet-100/60 via-purple-50/40 to-fuchsia-100/40",  label: "Mistral",   initial: "M"  },
};

function getProviderMeta(provider: string) {
  const key = provider.toLowerCase();
  for (const [k, v] of Object.entries(PROVIDER_META)) {
    if (key.includes(k)) return v;
  }
  return { bg: "from-slate-50 to-slate-100/30", label: provider, initial: provider.slice(0, 2).toUpperCase() };
}

// ── Provider logo area ────────────────────────────────────────────────────────

function getModelBadge(modelSlug: string): { label: string; bg: string; text: string } | null {
  const s = modelSlug.toLowerCase();
  if (s.includes("gemini-2.5")) return { label: "2.5", bg: "bg-indigo-600", text: "text-white" };
  if (s.includes("gemini-2.0")) return { label: "2.0", bg: "bg-blue-500",   text: "text-white" };
  if (s.includes("gemini-1.5")) return { label: "1.5", bg: "bg-sky-500",    text: "text-white" };
  if (s.includes("gemini-1.0") || s.includes("gemini-1")) return { label: "1.0", bg: "bg-slate-400", text: "text-white" };
  if (s.includes("flash"))      return { label: "Flash", bg: "bg-amber-400",  text: "text-white" };
  if (s.includes("pro"))        return { label: "Pro",   bg: "bg-violet-600", text: "text-white" };
  if (s.includes("ultra"))      return { label: "Ultra", bg: "bg-rose-600",   text: "text-white" };
  if (s.includes("claude-3-5")) return { label: "3.5",  bg: "bg-orange-500", text: "text-white" };
  if (s.includes("claude-3"))   return { label: "3",    bg: "bg-orange-400", text: "text-white" };
  if (s.includes("gpt-4o"))     return { label: "4o",   bg: "bg-emerald-500",text: "text-white" };
  if (s.includes("gpt-4"))      return { label: "4",    bg: "bg-emerald-600",text: "text-white" };
  if (s.includes("gpt-3"))      return { label: "3.5",  bg: "bg-teal-500",   text: "text-white" };
  return null;
}

function ProviderLogo({ provider, modelSlug }: { provider: string; modelSlug: string }) {
  const meta = getProviderMeta(provider);
  const p = provider.toLowerCase();
  const badge = getModelBadge(modelSlug);

  const svgLogo =
    p.includes("gemini") ? (
      <Image src="/images/icons/gemini-color.svg" alt="Gemini" width={40} height={40} className="size-10 object-contain" />
    ) : p.includes("google") ? (
      <svg viewBox="0 0 24 24" className="size-10" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ) : p.includes("anthropic") || p.includes("claude") ? (
      <Image src="/images/icons/claude-color.svg" alt="Claude" width={40} height={40} className="size-10 object-contain" />
    ) : p.includes("openai") ? (
      <svg viewBox="0 0 24 24" className="size-10 text-[#10a37f]" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5Z"/>
      </svg>
    ) : null;

  return (
    <div className={`relative w-full h-28 flex items-center justify-center bg-gradient-to-br ${meta.bg} rounded-t-2xl overflow-hidden`}>
      <div className="relative flex size-16 items-center justify-center rounded-2xl bg-white/80 backdrop-blur-sm">
        {svgLogo ?? <span className="text-xl font-bold text-slate-700">{meta.initial}</span>}
        {badge && (
          <span className={`absolute -bottom-1.5 -right-1.5 flex items-center justify-center rounded-full border-2 border-white px-1 min-w-[18px] h-[18px] text-[8px] font-black tracking-tight shadow-sm ${badge.bg} ${badge.text}`}>
            {badge.label}
          </span>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </div>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-xs animate-pulse overflow-hidden">
      <div className="h-28 bg-slate-100" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-2/3 bg-slate-100 rounded" />
        <div className="h-3 w-1/2 bg-slate-100 rounded" />
        <div className="flex gap-2 pt-1">
          <div className="h-5 w-16 bg-slate-100 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ hasFilter, onAdd, onClear }: { hasFilter: boolean; onAdd: () => void; onClear: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100">
        <Cpu className="size-7 text-slate-400" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-slate-800">
          {hasFilter ? "No models match your filters" : "No AI models yet"}
        </p>
        <p className="text-xs text-slate-400 max-w-xs">
          {hasFilter ? "Try adjusting your search or filters." : "Add your first model to get started."}
        </p>
      </div>
      {hasFilter ? (
        <button type="button" onClick={onClear} className="h-8 px-4 text-xs font-semibold rounded-sm border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
          Clear filters
        </button>
      ) : (
        <button type="button" onClick={onAdd} className="h-8 px-4 text-xs font-semibold rounded-sm bg-brand text-white hover:bg-brand/90 transition-colors cursor-pointer">
          Add Model
        </button>
      )}
    </div>
  );
}

// ── Small provider icon for badge ─────────────────────────────────────────────

function ProviderIconSmall({ provider }: { provider: string }) {
  const p = provider.toLowerCase();
  if (p.includes("gemini") || p.includes("google")) {
    return (
      <Image
        src="/images/icons/gemini-color.svg"
        alt="Gemini"
        width={10}
        height={10}
        className="size-2.5 object-contain shrink-0"
      />
    );
  }
  if (p.includes("anthropic") || p.includes("claude")) {
    return (
      <Image
        src="/images/icons/claude-color.svg"
        alt="Claude"
        width={10}
        height={10}
        className="size-2.5 object-contain shrink-0"
      />
    );
  }
  return null;
}

// ── Model card ────────────────────────────────────────────────────────────────

interface ModelCardProps {
  model: ModelRecord;
  isSettingDefault: boolean;
  isDeleting: boolean;
  onEdit: (id: string) => void;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
}

function ModelCard({ model, isSettingDefault, isDeleting, onEdit, onSetDefault, onDelete, onToggleActive }: ModelCardProps) {
  const meta = getProviderMeta(model.provider);

  return (
    <article className={`group relative flex flex-col rounded-2xl border transition-all duration-300 bg-white shadow-xs hover:shadow-md hover:-translate-y-0.5 overflow-hidden ${
      model.isActive
        ? "border-slate-200/80 hover:border-brand/30"
        : "border-slate-100 hover:border-slate-300/60"
    }`}>
      {/* Active stripe */}
      {model.isActive && (
        <span className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brand via-violet-500 to-indigo-600 rounded-r-sm" aria-hidden />
      )}

      {/* Logo area */}
      <ProviderLogo provider={model.provider} modelSlug={model.modelSlug} />

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2.5">
        {/* Name row + Switch */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-slate-800 leading-tight truncate">{model.name}</h3>
            <p className="text-[10px] font-sans text-slate-400 truncate mt-0.5">{model.modelSlug}</p>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleActive(model.id); }}
            className="shrink-0 flex items-center cursor-pointer select-none"
            style={{ background: "none", border: "none", outline: "none", padding: 0 }}
            aria-label={model.isActive ? "Deactivate model" : "Activate model"}
          >
            <Switch
              checked={model.isActive}
              className="pointer-events-none data-[checked]:bg-emerald-500"
              tabIndex={-1}
            />
          </button>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200/60 px-2 py-0.5 text-[9px] font-bold text-slate-600 uppercase tracking-wide">
            <ProviderIconSmall provider={model.provider} />
            {meta.label}
          </span>
          {model.isDefault && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/70 px-2 py-0.5 text-[9px] font-bold text-amber-700 uppercase tracking-wide">
              <Star className="size-2.5 fill-amber-500 text-amber-500" />
              Default
            </span>
          )}
        </div>
      </div>

      {/* 3-dots actions — bottom-right, visible on hover */}
      <div className="absolute bottom-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <ManagerActionsDropdown
          ariaLabel={`Actions for ${model.name}`}
          actions={[
            {
              label: "Edit model",
              icon: Pencil,
              onClick: () => onEdit(model.id),
            },
            ...(!model.isDefault
              ? [{
                  label: isSettingDefault ? "Setting…" : "Set as default",
                  icon: Star,
                  disabled: isSettingDefault,
                  onClick: () => onSetDefault(model.id),
                }]
              : []),
            {
              label: isDeleting ? "Deleting…" : "Delete",
              icon: Trash2,
              disabled: isDeleting,
              onClick: () => onDelete(model.id),
              variant: "destructive" as const,
              showSeparatorBefore: true,
            },
          ]}
        />
      </div>
    </article>
  );
}

// ── Grid ──────────────────────────────────────────────────────────────────────

interface ModelCardGridProps {
  models: ModelRecord[];
  isLoading: boolean;
  settingDefaultId: string | null;
  deletingId: string | null;
  hasActiveFilter: boolean;
  onEdit: (id: string) => void;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
  onAdd: () => void;
  onClearFilters: () => void;
}

export function ModelCardGrid({
  models,
  isLoading,
  settingDefaultId,
  deletingId,
  hasActiveFilter,
  onEdit,
  onSetDefault,
  onDelete,
  onToggleActive,
  onAdd,
  onClearFilters,
}: ModelCardGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {isLoading ? (
        Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
      ) : models.length === 0 ? (
        <EmptyState hasFilter={hasActiveFilter} onAdd={onAdd} onClear={onClearFilters} />
      ) : (
        models.map((model) => (
          <ModelCard
            key={model.id}
            model={model}
            isSettingDefault={settingDefaultId === model.id}
            isDeleting={deletingId === model.id}
            onEdit={onEdit}
            onSetDefault={onSetDefault}
            onDelete={onDelete}
            onToggleActive={onToggleActive}
          />
        ))
      )}
    </div>
  );
}
