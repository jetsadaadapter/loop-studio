import Image from "next/image";
import Link from "next/link";
import type { SyntheticEvent } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

      <CardContent className="space-y-2 px-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Category</span>
          <span className="font-medium">{item.category}</span>
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

      <CardFooter className="flex items-center gap-2 border-t bg-muted/40 px-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          disabled={isBusy}
          onClick={onEdit}
        >
          Edit
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="flex-1"
          disabled={isBusy}
          onClick={onDelete}
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
        <Link
          href={`/apps/${item.id}`}
          className="inline-flex h-8 flex-1 items-center justify-center rounded-md border border-border bg-secondary px-3 text-xs font-medium text-secondary-foreground transition hover:bg-secondary/80"
        >
          Detail
        </Link>
      </CardFooter>
    </Card>
  );
}
