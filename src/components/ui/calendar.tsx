"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-2", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-2 relative pt-8",
        month_caption: "absolute top-0 inset-x-0 h-5 flex items-center justify-center mb-0",
        caption_label: "text-xs font-semibold",
        nav: "absolute top-1 inset-x-2 mx-0 h-10 flex items-center justify-between z-20 pointer-events-none",
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "h-7 w-7 bg-transparent p-0 opacity-80 hover:opacity-100 pointer-events-auto"
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "h-7 w-7 bg-transparent p-0 opacity-80 hover:opacity-100 pointer-events-auto"
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex justify-between",
        weekday: "text-muted-foreground rounded-md w-8 font-normal text-xs",
        week: "flex w-full mt-1",
        day: "h-8 w-8 text-center text-xs p-0 relative [&:has([aria-selected].range_end)]:rounded-r-sm [&:has([aria-selected].range_start)]:rounded-l-sm [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-sm last:[&:has([aria-selected])]:rounded-r-sm focus-within:relative focus-within:z-20",
        day_button: cn(
          "h-8 w-8 p-0 font-normal aria-selected:opacity-100 flex items-center justify-center transition-colors text-xs",
          "rounded-sm aria-selected:rounded-none"
        ),
        range_start: "range_start rounded-l-sm aria-selected:rounded-l-sm",
        range_end: "range_end rounded-r-sm aria-selected:rounded-r-sm",
        selected: "bg-black text-white focus:bg-black focus:text-white",
        today: "bg-accent text-accent-foreground",
        outside: "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        disabled: "text-muted-foreground opacity-50",
        range_middle: "range_middle aria-selected:bg-accent aria-selected:text-accent-foreground !rounded-none",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: (props) => {
          if (props.orientation === "left") {
            return <ChevronLeft className="h-4 w-4" />
          }
          return <ChevronRight className="h-4 w-4" />
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
