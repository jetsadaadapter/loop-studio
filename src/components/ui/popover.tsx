"use client"

import * as React from "react"
import { Popover as PopoverParts } from "@base-ui/react/popover"

import { cn } from "@/lib/utils"

const Popover = PopoverParts.Root
const PopoverTrigger = PopoverParts.Trigger

const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof PopoverParts.Popup> & {
    align?: "start" | "center" | "end"
    sideOffset?: number
  }
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverParts.Portal>
    <PopoverParts.Positioner sideOffset={sideOffset} align={align}>
      <PopoverParts.Popup
        ref={ref}
        className={cn(
          "z-50 w-auto rounded-xl border bg-white p-4 text-zinc-950 shadow-lg outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className
        )}
        {...props}
      />
    </PopoverParts.Positioner>
  </PopoverParts.Portal>
))
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }
