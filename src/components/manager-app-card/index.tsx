"use client";

import Image from "next/image";
import { useState, type SyntheticEvent } from "react";
import {
  ExternalLink,
  Folder,
  Pencil,
  PlugZap,
  Trash2,
  BookOpen,
  Wrench,
  CopyPlus,
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
  linkedTool?: { id: string; name: string; isActive: boolean; description?: string };
  onToggleActive?: () => void;
  onDuplicate?: () => void;
  isDuplicating?: boolean;
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

function LinkedToolStrip({ tool }: { tool: { name: string; isActive: boolean; description?: string } }) {
  return (
    <div className="mx-4 mb-3 border-t border-slate-100 pt-2.5 flex items-center gap-2">
      {/* Icon */}
      <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-sm shadow-indigo-500/25">
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
  onEdit,
  onDelete,
}: ManagerAppCardProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showIntegration, setShowIntegration] = useState(false);
  const [didCopyIntegration, setDidCopyIntegration] = useState(false);

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
          {tags.filter(t => t.name).map((tag) => (
            <span
              key={tag.id || tag.name}
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border"
              style={
                tag.color
                  ? { backgroundColor: `${tag.color}18`, borderColor: `${tag.color}40`, color: tag.color }
                  : undefined
              }
            >
              {tag.name}
            </span>
          ))}
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

      {/* Linked tool strip — only when appTool data is available */}
      {linkedTool && <LinkedToolStrip tool={linkedTool} />}

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
