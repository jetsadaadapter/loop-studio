"use client";

import Image from "next/image";
import { useState, type SyntheticEvent } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  FileCode,
  Folder,
  Link as LinkIcon,
  Pencil,
  PlugZap,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
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

export function ManagerAppCard({
  item,
  isBusy = false,
  isDeleting = false,
  integration = "",
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
        {/* Name */}
        <h3 className="mb-1 truncate text-[14px] font-bold tracking-tight text-slate-900">
          {item.name}
        </h3>

        {/* Meta row */}
        <div className="mb-2 flex items-center gap-3 text-[11px] font-medium text-slate-500">
          <span className="flex items-center gap-1 truncate">
            <Folder className="size-3 shrink-0" />
            {item.category || "—"}
          </span>
          <span className="flex items-center gap-1 shrink-0">
            <LinkIcon className="size-3" />
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
          {hasIntegration && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="ml-auto flex shrink-0 cursor-default items-center gap-1 rounded-md bg-sky-50 px-1.5 py-0.5 text-sky-500">
                  <FileCode className="size-3" />
                  <span className="text-[10px] font-semibold">Dev Guide</span>
                </TooltipTrigger>
                <TooltipContent side="top">Developer Guide Available</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Description */}
        <p className="mb-3 line-clamp-2 text-[12px] leading-relaxed text-slate-500">
          {item.description || "No description provided."}
        </p>

        {/* Type pill */}
        <div className="mt-auto mb-3">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
              type.className,
            )}
          >
            {type.label} App
          </span>
        </div>

        {/* Divider + footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <button
            type="button"
            className="flex flex-1 items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5 text-left transition hover:bg-white hover:shadow-sm"
            onClick={handleCopyLink}
            title="Copy link"
          >
            <span className="truncate text-[11px] text-slate-500">/apps/{item.id.slice(0, 8)}…</span>
            {copiedLink ? (
              <Check className="size-3 shrink-0 text-emerald-500" />
            ) : (
              <Copy className="size-3 shrink-0 text-slate-400" />
            )}
          </button>
          <span className="ml-2.5 shrink-0 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
            #{item.sortOrder}
          </span>
        </div>
      </div>

      {hasIntegration && (
        <IntegrationPreviewDialog
          open={showIntegration}
          onOpenChange={setShowIntegration}
          integration={integration}
          onCopy={handleCopyIntegration}
          onDownload={handleDownloadIntegration}
          didCopy={didCopyIntegration}
        />
      )}
    </Card>
  );
}
