"use client";

import React from "react";
import { Ellipsis, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type DropdownActionItem = {
  label: string;
  icon: LucideIcon;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  variant?: "default" | "destructive";
  showSeparatorBefore?: boolean;
};

type ManagerActionsDropdownProps = {
  actions: DropdownActionItem[];
  triggerClassName?: string;
  triggerSize?: "icon" | "icon-sm" | "default";
  triggerVariant?: "ghost" | "outline" | "default";
  align?: "start" | "end" | "center";
  side?: "top" | "bottom" | "left" | "right";
  ariaLabel?: string;
  iconSizeClassName?: string;
};

export function ManagerActionsDropdown({
  actions,
  triggerClassName = "flex size-7 items-center justify-center rounded-full border border-slate-200/60 bg-white/80 p-0 text-slate-500 shadow-none backdrop-blur-xs transition hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200",
  triggerSize = "icon",
  triggerVariant = "ghost",
  align = "end",
  side = "bottom",
  ariaLabel = "Open actions menu",
  iconSizeClassName = "size-3.5",
}: ManagerActionsDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant={triggerVariant}
            size={triggerSize}
            className={triggerClassName}
          />
        }
        aria-label={ariaLabel}
      >
        <Ellipsis className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} side={side} className="w-40 z-30">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          const isDestructive = action.variant === "destructive";
          
          return (
            <React.Fragment key={`${action.label}-${idx}`}>
              {action.showSeparatorBefore && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onClick={action.onClick}
                disabled={action.disabled}
                variant={action.variant}
                className={`py-2 text-xs cursor-pointer gap-2 ${
                  isDestructive
                    ? "text-red-600 focus:bg-red-50 focus:text-red-600"
                    : ""
                }`}
              >
                <Icon className={iconSizeClassName} />
                {action.label}
              </DropdownMenuItem>
            </React.Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
