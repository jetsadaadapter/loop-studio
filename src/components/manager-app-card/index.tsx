import Image from "next/image";
import type { SyntheticEvent } from "react";
import { Copy, Ellipsis, ExternalLink, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AppLinkType } from "@/core/interfaces/library.interface";

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

const FALLBACK_IMAGE_SRC = "/images/mock/hero/campaign.png";

function getStatusPresentation(isActive: boolean) {
  if (isActive) {
    return {
      label: "Active",
      badgeVariant: "secondary" as const,
      dotClassName: "bg-emerald-500",
    };
  }

  return {
    label: "Inactive",
    badgeVariant: "outline" as const,
    dotClassName: "bg-zinc-400",
  };
}

function getTypePresentation(linkType: AppLinkType) {
  switch (linkType) {
    case "instruction":
      return {
        label: "Instruction",
        className: "border-transparent bg-slate-700 text-white",
      };
    case "external":
      return {
        label: "External",
        className: "border-transparent bg-rose-700 text-white",
      };
    case "internal":
    default:
      return {
        label: "Internal",
        className: "border-transparent bg-indigo-700 text-white",
      };
  }
}

function getCardImageSource(record: ManagerAppCardItem) {
  if (record.imageUrl && record.imageUrl.trim()) return record.imageUrl;
  return FALLBACK_IMAGE_SRC;
}

function onCardImageError(event: SyntheticEvent<HTMLImageElement>) {
  const target = event.currentTarget;

  if (target.dataset.fallbackApplied === "true") {
    return;
  }

  target.dataset.fallbackApplied = "true";
  target.src = FALLBACK_IMAGE_SRC;
}

export function ManagerAppCard({
  item,
  isBusy = false,
  isDeleting = false,
  onEdit,
  onDelete,
}: ManagerAppCardProps) {
  const status = getStatusPresentation(item.isActive);
  const type = getTypePresentation(item.linkType);

  return (
    <Card className="group overflow-hidden p-0">
      <div className="relative h-64 w-full overflow-hidden">
        <div className="absolute inset-0 animate-pulse bg-muted" />
        <Image
          src={getCardImageSource(item)}
          alt={item.name}
          fill
          className="relative z-10 object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          unoptimized
          onError={onCardImageError}
        />

        <div className="absolute right-3 top-3 z-20">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="flex items-center justify-center rounded-full border-0 bg-white/25 p-0 text-white shadow-none backdrop-blur-sm transition hover:bg-white/35 hover:text-white aria-expanded:bg-white/40 active:bg-white/40"
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
                <Pencil className="size-4" />
                Edit app
              </DropdownMenuItem>
              
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  const url = typeof window !== "undefined" ? `${window.location.origin}/apps/${item.id}` : `/apps/${item.id}`;
                  navigator.clipboard.writeText(url);
                }}
                className="py-2 text-sm cursor-pointer"
              >
                <Copy className="size-4" />
                Copy link
              </DropdownMenuItem>

              <DropdownMenuItem className="py-2 text-sm cursor-pointer">
                <a
                  href={typeof item.id === "string" ? `/apps/${item.id}` : "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={0}
                  className="flex items-center gap-1.5 w-full h-full"
                >
                  <ExternalLink className="size-4" />
                  Detail
                </a>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={onDelete}
                disabled={isBusy}
                variant="destructive"
                className="py-2 text-sm cursor-pointer"
              >
                <Trash2 className="size-4" />
                {isDeleting ? "Deleting..." : "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CardHeader className="px-4 pb-0 pt-0">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-1 text-sm font-semibold">
            {item.name}
          </CardTitle>
          <Badge
            variant={status.badgeVariant}
            className="shrink-0 text-[0.7rem]!"
          >
            <span
              className={`mr-1.5 inline-block size-2 rounded-full ${status.dotClassName}`}
            />
            {status.label}
          </Badge>
        </div>
        <p className="text-[0.7rem] text-muted-foreground">#{item.id}</p>
      </CardHeader>

      <CardContent className="space-y-2 px-4 pb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Category</span>
          <Badge variant="outline" className="font-medium text-[0.7rem] px-2 py-0">
            {item.category}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Type</span>
          <Badge
            variant="outline"
            className={`min-w-24 justify-center text-[0.7rem]! ${type.className}`}
          >
            {type.label}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
