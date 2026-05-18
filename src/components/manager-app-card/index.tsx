"use client";

import Image from "next/image";
import { useState, type SyntheticEvent } from "react";
import { Check, Copy, Ellipsis, ExternalLink, Pencil, Trash2, Folder, Link as LinkIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
};

type ManagerAppCardProps = {
  item: ManagerAppCardItem;
  isBusy?: boolean;
  isDeleting?: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

function getStatusPresentation(isActive: boolean) {
  if (isActive) {
    return {
      label: "Active",
      className: "bg-emerald-50 text-emerald-600",
    };
  }

  return {
    label: "Inactive",
    className: "bg-slate-100 text-slate-500",
  };
}

function getTypePresentation(linkType: AppLinkType) {
  switch (linkType) {
    case "instruction":
      return {
        label: "Instruction",
        className: "bg-amber-50 text-amber-600",
      };
    case "external":
      return {
        label: "External",
        className: "bg-rose-50 text-rose-600",
      };
    case "internal":
    default:
      return {
        label: "Internal",
        className: "bg-indigo-50 text-indigo-600",
      };
  }
}

function getCardImageSource(record: ManagerAppCardItem) {
  if (record.imageUrl && record.imageUrl.trim()) return record.imageUrl;
  return null;
}

function onCardImageError(event: SyntheticEvent<HTMLImageElement>) {
  const target = event.currentTarget;
  target.style.display = "none";
}

export function ManagerAppCard({
  item,
  isBusy = false,
  isDeleting = false,
  onEdit,
  onDelete,
}: ManagerAppCardProps) {
  const [copiedLink, setCopiedLink] = useState(false);

  const status = getStatusPresentation(item.isActive);
  const type = getTypePresentation(item.linkType);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = typeof window !== "undefined" ? `${window.location.origin}/apps/${item.id}` : `/apps/${item.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <Card className="group flex flex-col overflow-hidden p-0 ring-0 border border-zinc-100 shadow-[0_2px_12px_rgba(0,0,0,0.06)] bg-white rounded-2xl">
      {/* Image Container with inner padding */}
      <div className="p-2 pb-0 shrink-0">
        <div className="relative h-40 sm:h-44 w-full overflow-hidden rounded-xl">
          <div className="absolute inset-0 animate-pulse bg-muted" />
          {getCardImageSource(item) ? (
            <Image
              src={getCardImageSource(item)!}
              alt={item.name}
              fill
              className="relative z-10 object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
              priority
              unoptimized
              onError={onCardImageError}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-slate-100 to-slate-200 p-4 z-10">
              <span className="text-center text-sm font-bold tracking-widest text-slate-400/30 uppercase">
                No image available
              </span>
            </div>
          )}

          <div className="absolute right-2 top-2 z-20">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="flex size-8 items-center justify-center rounded-full border-0 bg-black/40 p-0 text-white shadow-none backdrop-blur-md transition hover:bg-black/60 hover:text-white aria-expanded:bg-black/60 active:bg-black/60"
                  />
                }
                aria-label={`Open actions for ${item.name}`}
              >
                <Ellipsis className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="bottom" className="w-48">
                <DropdownMenuItem
                  onClick={onEdit}
                  disabled={isBusy}
                  className="py-2 text-sm cursor-pointer"
                >
                  <Pencil className="size-4 mr-2" />
                  Edit app
                </DropdownMenuItem>


                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    const url = typeof window !== "undefined" ? `${window.location.origin}/apps/${item.id}` : `/apps/${item.id}`;
                    window.open(url, "_blank");
                  }}
                  className="py-2 text-sm cursor-pointer"
                >
                  <ExternalLink className="size-4 mr-2" />
                  Detail
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={onDelete}
                  disabled={isBusy}
                  variant="destructive"
                  className="py-2 text-sm cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
                >
                  <Trash2 className="size-4 mr-2" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-col flex-1 px-4 pb-3 pt-0 sm:px-5 sm:pb-4 sm:pt-0">
        <div className="mb-2">
          <h3 className="text-md font-bold tracking-tight text-slate-900 line-clamp-1">
            {item.name}
          </h3>

          <div className="flex items-center gap-4 mt-2 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-1.5">
              <Folder className="size-3.5" />
              {item.category}
            </div>
            <div className="flex items-center gap-1.5">
              <LinkIcon className="size-3.5" />
              {type.label}
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-600 line-clamp-2 leading-tight mb-3">
          {item.description || "No description provided."}
        </p>

        {/* Tags / Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3 mt-auto">
          <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium tracking-wide ${status.className}`}>
            {status.label}
          </span>
          <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium tracking-wide ${type.className}`}>
            {type.label} App
          </span>
          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium tracking-wide bg-sky-50 text-sky-600 truncate max-w-[120px]">
            {item.category}
          </span>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-slate-100 mb-3" />

        {/* Footer Code Block */}
        <div className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-100 px-3 py-1">
          <span className="text-xs text-slate-600 truncate mr-2">
            /apps/{item.id}
          </span>
          <button
            type="button"
            className="flex shrink-0 items-center justify-center rounded-md p-1.5 text-slate-400 hover:bg-white hover:text-slate-900 hover:shadow-sm transition"
            onClick={handleCopyLink}
            title="Copy Link"
          >
            {copiedLink ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
          </button>
        </div>
      </div>
    </Card>
  );
}
