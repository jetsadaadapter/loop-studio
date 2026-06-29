"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import { createPortal } from "react-dom";
import { getManageTools } from "@/core/services/manage-tools.service";
import type { ManageToolApiItem } from "@/core/interfaces/tool";
import { getManageApps } from "@/core/services/apps.service";
import { getUserProfile } from "@/core/services/users.service";
import {
  ExternalLink,
  Folder,
  Pencil,
  PlugZap,
  Trash2,
  BookOpen,
  Wrench,
  CopyPlus,
  Cpu,
  Search,
  Unlink,
  Loader2,
  Check,
  Copy,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ManagerActionsDropdown } from "@/components/manager-actions-dropdown";
import { IntegrationPreviewDialog } from "@/app/manage/apps/integration-preview-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, getAppBadgeClass } from "@/lib/utils";
import type { AppLinkType } from "@/core/interfaces/apps.interface";

type ManagerAppCardItem = {
  id: string;
  name: string;
  category: string;
  description: string;
  linkType: AppLinkType;
  ctaLink?: string;
  sortOrder: number;
  isActive: boolean;
  imageUrl?: string;
  badgeLabel?: string;
};

type ManagerAppCardProps = {
  item: ManagerAppCardItem;
  isBusy?: boolean;
  isDeleting?: boolean;
  integration?: string;
  tags?: { id: string; name: string; color?: string }[];
  linkedTool?: { id: string; name: string; isActive: boolean; description?: string; appToolId?: string };
  onToggleActive?: () => void;
  onDuplicate?: () => void;
  isDuplicating?: boolean;
  onAttachTool?: (toolId: string) => void;
  onDetachTool?: () => void;
  isAttaching?: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

const TYPE_STYLES: Record<AppLinkType, { label: string; className: string }> = {
  internal: { label: "Internal", className: "bg-indigo-50 text-indigo-600" },
  external: { label: "External", className: "bg-rose-50 text-rose-600" },
  instruction: { label: "Instruction", className: "bg-amber-50 text-amber-600" },
  tool: { label: "Tool", className: "bg-violet-50 text-violet-600" },
};

function onCardImageError(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.style.display = "none";
}

function CopyableAppIdBadge({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        void navigator.clipboard.writeText(id).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      className="inline-flex items-center gap-1 mb-1.5 px-1.5 py-0.5 rounded bg-slate-100 text-[8px] font-bold text-slate-500 font-sans cursor-pointer hover:bg-slate-200 hover:text-slate-700 transition-colors select-none"
      title={`Copy App ID: ${id}`}
    >
      <span>ID: {id.slice(0, 10)}…</span>
      {copied ? (
        <Check className="size-2 shrink-0 text-emerald-600" />
      ) : (
        <Copy className="size-2 shrink-0 opacity-60" />
      )}
    </span>
  );
}

function LinkedToolStrip({ tool, onDetach, isAttaching }: { tool: { name: string; isActive: boolean; description?: string }; onDetach?: () => void; isAttaching?: boolean }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="mx-4 mb-3 border-t border-slate-100 pt-2.5 space-y-2">
        <p className="text-[10px] text-slate-600 font-medium leading-snug">
          Unlink <span className="font-bold text-slate-800">{tool.name}</span> from this app?
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setConfirming(false); }}
            className="flex-1 h-7 rounded-md border border-slate-200 bg-white text-[10px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDetach?.(); setConfirming(false); }}
            disabled={isAttaching}
            className="flex-1 h-7 rounded-md bg-brand hover:bg-brand/90 text-white text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50 shadow-sm shadow-brand/20"
          >
            {isAttaching ? <Loader2 className="size-3 animate-spin" /> : <><Unlink className="size-3" />Unlink</>}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 mb-3 border-t border-slate-100 pt-2.5 flex items-center gap-2">
      {/* Icon */}
      <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-brand to-rose-700 text-white shadow-sm shadow-brand/25">
        <Wrench className="size-3" />
      </div>
      {/* Name */}
      <p className="min-w-0 flex-1 truncate text-[10px] font-semibold text-slate-700">
        {tool.name}
      </p>
      {/* Connected badge */}
      <span
        className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
          tool.isActive
            ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
            : "bg-slate-200 text-slate-400"
        }`}
      >
        {tool.isActive && (
          <svg className="size-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
        {tool.isActive ? "Connected" : "Inactive"}
      </span>
      {onDetach && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
          disabled={isAttaching}
          className="shrink-0 flex size-5 items-center justify-center rounded text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-40"
          title="Detach tool"
        >
          <Unlink className="size-3" />
        </button>
      )}
    </div>
  );
}

export function ManagerAppCard({
  item,
  isBusy = false,
  isDeleting = false,
  integration = "",
  tags = [],
  linkedTool,
  onToggleActive,
  onDuplicate,
  isDuplicating = false,
  onAttachTool,
  onDetachTool,
  isAttaching = false,
  onEdit,
  onDelete,
}: ManagerAppCardProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showIntegration, setShowIntegration] = useState(false);
  const [didCopyIntegration, setDidCopyIntegration] = useState(false);
  const [showToolPicker, setShowToolPicker] = useState(false);
  const [toolPickerQuery, setToolPickerQuery] = useState("");
  const [tools, setTools] = useState<ManageToolApiItem[]>([]);
  const [toolsLoading, setToolsLoading] = useState(false);
  const connectBtnRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [pickerRect, setPickerRect] = useState<DOMRect | null>(null);

  async function loadFallbackToolsFromApps() {
    try {
      const appsPage = await getManageApps({ page: 1, limit: 1000 });
      const appsList = appsPage.data ?? [];
      const extractedTools: ManageToolApiItem[] = [];
      const seenToolIds = new Set<string>();

      for (const app of appsList) {
        if (app.appTool && app.appTool.tool && app.appTool.toolId) {
          const toolId = app.appTool.toolId;
          if (!seenToolIds.has(toolId)) {
            seenToolIds.add(toolId);
            extractedTools.push({
              id: toolId,
              name: app.appTool.tool.name,
              description: app.appTool.tool.description ?? "",
              isActive: app.appTool.tool.isActive,
              creditCost: 0,
              userId: app.appTool.tool.userId ?? "",
              params: (app.appTool.tool.params ?? []).map(p => ({
                id: p.id,
                toolId: p.toolId,
                key: p.key,
                label: p.label,
                type: p.type,
                defaultValue: p.defaultValue,
                transform: p.transform,
                placeholder: p.placeholder,
                options: p.options,
                required: p.required,
                sortOrder: p.sortOrder,
                config: p.config ?? null,
              })),
              scripts: (app.appTool.tool.scripts ?? []).map(s => ({
                id: s.id,
                toolId: s.toolId,
                plugin: s.plugin,
                config: s.config ?? {},
                label: s.label,
                description: s.description,
                sortOrder: s.sortOrder,
                creditCost: s.creditCost ?? null,
              })),
              sortOrder: app.appTool.sortOrder ?? 0,
              createdAt: app.appTool.createdAt ?? "",
              updatedAt: app.appTool.tool.updatedAt ?? "",
            });
          }
        }
      }
      setTools(extractedTools.filter((t) => t.isActive));
    } catch {
      setTools([]);
    }
  }

  useEffect(() => {
    if (!showToolPicker) return;
    let cancelled = false;

    async function init() {
      Promise.resolve().then(() => {
        setToolsLoading(true);
      });
      try {
        const profile = await getUserProfile();
        if (cancelled) return;
        const hasAccess = (profile.roles ?? []).some(
          (r) => r === "admin" || r === "system-admin"
        );
        if (!hasAccess) {
          await loadFallbackToolsFromApps();
          return;
        }
        const data = await getManageTools();
        if (!cancelled) setTools(data.filter((t) => t.isActive));
      } catch {
        if (!cancelled) {
          await loadFallbackToolsFromApps();
        }
      } finally {
        if (!cancelled) {
          Promise.resolve().then(() => {
            setToolsLoading(false);
          });
        }
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [showToolPicker]);

  useEffect(() => {
    if (showToolPicker && connectBtnRef.current) {
      setPickerRect(connectBtnRef.current.getBoundingClientRect());
    }
  }, [showToolPicker]);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (!connectBtnRef.current?.contains(target) && !pickerRef.current?.contains(target)) {
        setShowToolPicker(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const filteredTools = toolPickerQuery.trim()
    ? tools.filter((t) => t.name.toLowerCase().includes(toolPickerQuery.toLowerCase()))
    : tools;

  async function handleCopyIntegration() {
    await navigator.clipboard.writeText(integration);
    setDidCopyIntegration(true);
    setTimeout(() => setDidCopyIntegration(false), 2000);
  }

  function handleDownloadIntegration() {
    const blob = new Blob([integration], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${item.name.toLowerCase().replace(/\s+/g, "-")}-integration.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const hasIntegration = integration.trim().length > 0;

  const type = TYPE_STYLES[item.linkType] ?? TYPE_STYLES.internal;
  const imageSrc = item.imageUrl?.trim() || null;

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/apps/${item.id}`
        : `/apps/${item.id}`;
    void navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <Card className="group flex flex-col overflow-hidden p-0 border border-zinc-100 shadow-[0_2px_12px_rgba(0,0,0,0.06)] bg-white rounded-2xl">
      {/* Image */}
      <div className="p-2 pb-0 shrink-0">
        <div className="relative w-full aspect-[16/10] overflow-hidden rounded-xl">
          <div className="absolute inset-0 animate-pulse bg-muted" />

          {imageSrc ? (
            <>
              <Image
                src={imageSrc}
                alt={item.name}
                fill
                className="relative z-10 object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                priority
                unoptimized
                onError={onCardImageError}
              />
            </>
          ) : (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400/40">
                No image
              </span>
            </div>
          )}

          {/* Status badge — image overlay */}
          {!item.isActive && (
            <div className="absolute left-2 top-2 z-20">
              <span className="rounded-md border border-zinc-200 bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 backdrop-blur-sm">
                Inactive
              </span>
            </div>
          )}

          {/* Actions — image overlay */}
          <div className="absolute right-2 top-2 z-20">
            <ManagerActionsDropdown
              ariaLabel={`Open actions for ${item.name}`}
              triggerSize="icon-sm"
              triggerClassName="flex size-8 items-center justify-center rounded-full border-0 bg-black/40 p-0 text-white shadow-none backdrop-blur-md transition hover:bg-black/60 hover:text-white aria-expanded:bg-black/60 active:bg-black/60"
              actions={[
                {
                  label: "Edit app",
                  icon: Pencil,
                  disabled: isBusy,
                  onClick: onEdit,
                },
                {
                  label: "View detail",
                  icon: ExternalLink,
                  onClick: (e) => {
                    e.stopPropagation();
                    const url =
                      typeof window !== "undefined"
                        ? `${window.location.origin}/apps/${item.id}`
                        : `/apps/${item.id}`;
                    window.open(url, "_blank");
                  },
                },
                ...(hasIntegration
                  ? [
                      {
                        label: "Integration Guide",
                        icon: PlugZap,
                        onClick: (e: React.MouseEvent) => {
                          e.stopPropagation();
                          setShowIntegration(true);
                        },
                      },
                    ]
                  : []),
                ...(onDuplicate
                  ? [
                      {
                        label: isDuplicating ? "Duplicating…" : "Duplicate app",
                        icon: CopyPlus,
                        disabled: isBusy || isDuplicating,
                        onClick: (e: React.MouseEvent) => { e.stopPropagation(); onDuplicate(); },
                      },
                    ]
                  : []),
                {
                  label: isDeleting ? "Deleting…" : "Delete",
                  icon: Trash2,
                  disabled: isBusy,
                  onClick: onDelete,
                  variant: "destructive",
                  showSeparatorBefore: true,
                },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
        {/* Name + toggle */}
        <div className="mb-1 flex items-center gap-2">
          <h3 className="min-w-0 flex-1 truncate text-[14px] font-bold tracking-tight text-slate-900">
            {item.name}
          </h3>
          {onToggleActive && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleActive(); }}
              className="shrink-0 flex items-center cursor-pointer select-none"
              style={{ background: "none", border: "none", outline: "none", padding: 0 }}
              aria-label={item.isActive ? "Deactivate app" : "Activate app"}
            >
              <Switch
                checked={item.isActive}
                className="pointer-events-none data-[checked]:bg-emerald-500"
                tabIndex={-1}
              />
            </button>
          )}
        </div>
        <div className="w-fit"><CopyableAppIdBadge id={item.id} /></div>

        {/* Meta row */}
        <div className="mb-2 flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500 truncate">
            <Folder className="size-3 shrink-0" />
            {item.category || "—"}
          </span>
          {/* Type pill — replaces link icon */}
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0",
              type.className,
            )}
          >
            {type.label}
          </span>
          {item.badgeLabel && item.badgeLabel.trim().length > 0 && (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0",
                getAppBadgeClass(item.badgeLabel),
              )}
            >
              {item.badgeLabel}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="mb-3 line-clamp-2 text-[12px] leading-relaxed text-slate-500">
          {item.description || "No description provided."}
        </p>

        {/* Tags + dev guide */}
        <div className="mt-auto flex flex-wrap items-center gap-1.5">
          {(() => {
            const validTags = tags.filter(t => t.name);
            const MAX = 2;
            const visible = validTags.slice(0, MAX);
            const overflow = validTags.length - MAX;
            return (
              <>
                {visible.map((tag) => (
                  <span
                    key={tag.id || tag.name}
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border"
                    style={tag.color ? { backgroundColor: `${tag.color}18`, borderColor: `${tag.color}40`, color: tag.color } : undefined}
                  >
                    {tag.name}
                  </span>
                ))}
                {overflow > 0 && (
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                    +{overflow}
                  </span>
                )}
              </>
            );
          })()}
          {hasIntegration && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  onClick={() => setShowIntegration(true)}
                  className="ml-auto flex items-center justify-center size-5 text-sky-400 hover:text-sky-600 transition-colors cursor-pointer"
                >
                  <BookOpen className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent side="top">Developer Guide</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Linked tool strip — show connected tool or empty state for internal apps */}
      {linkedTool ? (
        <LinkedToolStrip tool={linkedTool} onDetach={onDetachTool} isAttaching={isAttaching} />
      ) : item.linkType === "internal" ? (
        <div className="mx-4 mb-3 flex items-center gap-2 border-t border-slate-100 pt-2.5">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-slate-400">
            {isAttaching ? <Loader2 className="size-3 animate-spin" /> : <Wrench className="size-3" />}
          </div>
          <p className="min-w-0 flex-1 truncate text-[10px] text-slate-400 font-sans">
            No tool connected
          </p>
          {onAttachTool && (
            <button
              ref={connectBtnRef}
              type="button"
              disabled={isAttaching}
              onClick={(e) => { e.stopPropagation(); setShowToolPicker((v) => !v); }}
              className="shrink-0 text-[9px] font-bold text-brand hover:text-brand/80 transition-colors cursor-pointer disabled:opacity-50"
            >
              Connect →
            </button>
          )}
          {/* Tool picker portal */}
          {showToolPicker && pickerRect && typeof document !== "undefined" && createPortal(
            <div
              ref={pickerRef}
              style={{ position: "fixed", top: pickerRect.bottom + 4, left: pickerRect.left - 240 + pickerRect.width, width: 260, zIndex: 9999 }}
              className="rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
                <Search className="size-3.5 shrink-0 text-slate-400" />
                <input
                  autoFocus
                  type="text"
                  value={toolPickerQuery}
                  onChange={(e) => setToolPickerQuery(e.target.value)}
                  placeholder="Search tools…"
                  className="w-full bg-transparent text-xs text-slate-700 placeholder:text-slate-400 outline-none"
                />
              </div>
              <div className="max-h-52 overflow-y-auto py-1">
                {toolsLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="size-4 animate-spin text-slate-400" />
                  </div>
                ) : filteredTools.length === 0 ? (
                  <p className="py-5 text-center text-xs text-slate-400">No tools found</p>
                ) : filteredTools.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => { onAttachTool?.(t.id); setShowToolPicker(false); setToolPickerQuery(""); }}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors"
                  >
                    <span className={`size-2 shrink-0 rounded-full ${t.isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-800">{t.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>,
            document.body
          )}
        </div>
      ) : null}

      {hasIntegration && (
        <IntegrationPreviewDialog
          open={showIntegration}
          onOpenChange={setShowIntegration}
          integration={integration}
          onCopy={handleCopyIntegration}
          onDownload={handleDownloadIntegration}
          didCopy={didCopyIntegration}
          toolId={item.linkType === "internal" && item.ctaLink?.startsWith("/tool/") ? item.ctaLink.replace("/tool/", "").trim() : undefined}
          appName={item.name}
        />
      )}
    </Card>
  );
}
