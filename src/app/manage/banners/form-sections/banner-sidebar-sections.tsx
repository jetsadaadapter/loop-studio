"use client";

import { CalendarIcon, Clock2Icon, ImageIcon, MonitorCheck, X } from "lucide-react";
import { format } from "date-fns";
import { type DateRange } from "react-day-picker";
import { CircleIcon } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { ImageUpload } from "@/components/ui/image-upload";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

function SidebarCardHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <CardHeader className="pb-2">
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          {icon}
        </div>
        <div>
          <h5 className="text-base font-semibold leading-tight">{title}</h5>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </CardHeader>
  );
}

type BannerSidebarSectionsProps = {
  imageId: string;
  isActive: boolean;
  dateRange: DateRange | undefined;
  startsAt: string | null;
  endsAt: string | null;
  touched: Partial<Record<string, boolean>>;
  fieldErrors: Record<string, string>;
  onImageChange: (id: string) => void;
  onImageError: (msg: string) => void;
  onStatusChange: (value: string) => void;
  onDateRangeSelect: (range: DateRange | undefined) => void;
  onTimeChange: (type: "start" | "end", value: string) => void;
  onClearDateRange: () => void;
  getTimeValue: (isoString: string | null) => string;
};

export function BannerSidebarSections({
  imageId,
  isActive,
  dateRange,
  startsAt,
  endsAt,
  touched,
  fieldErrors,
  onImageChange,
  onImageError,
  onStatusChange,
  onDateRangeSelect,
  onTimeChange,
  onClearDateRange,
  getTimeValue,
}: BannerSidebarSectionsProps) {
  return (
    <div className="space-y-6">
      {/* Banner Image */}
      <Card className="rounded-xl border border-slate-200/70 shadow-sm">
        <SidebarCardHeader
          icon={<ImageIcon className="size-4" />}
          title="Banner Image"
          description="Recommended 16:10 ratio"
        />
        <CardContent>
          <Field>
            <ImageUpload
              value={imageId}
              previewSrc={imageId ? `/images/${encodeURIComponent(imageId.trim())}` : undefined}
              onChange={onImageChange}
              onError={onImageError}
              placeholder="Upload banner image"
              description="Recommended 16:10. Supports png, jpg, jpeg, webp."
            />
            <FieldError errors={touched.imageId ? [{ message: fieldErrors.imageId }] : []} />
          </Field>
        </CardContent>
      </Card>

      {/* Status */}
      <Card className="rounded-xl border border-slate-200/70 shadow-sm">
        <SidebarCardHeader
          icon={<MonitorCheck className="size-4" />}
          title="Status"
          description="Visibility settings"
        />
        <CardContent>
          <Field>
            <FieldLabel>Publish Status</FieldLabel>
            <Select
              value={isActive ? "active" : "inactive"}
              onValueChange={(val) => onStatusChange(val || "")}
            >
              <SelectTrigger className="w-full [&>span]:flex [&>span]:items-center [&>span]:gap-2">
                <CircleIcon
                  className={cn(
                    "size-2",
                    isActive ? "fill-teal-600 text-teal-600" : "fill-gray-400 text-gray-400",
                  )}
                />
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="active">
                  <div className="flex items-center gap-2">
                    <CircleIcon className="size-2 fill-teal-600 text-teal-600" />
                    <span className="text-xs">Active</span>
                  </div>
                </SelectItem>
                <SelectItem value="inactive">
                  <div className="flex items-center gap-2">
                    <CircleIcon className="size-2 fill-gray-400 text-gray-400" />
                    <span className="text-xs">Inactive</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      {/* Visibility Schedule */}
      <Card className="rounded-xl border border-slate-200/70 shadow-sm">
        <SidebarCardHeader
          icon={<CalendarIcon className="size-4" />}
          title="Visibility Schedule"
          description="Optional date range for display"
        />
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    className={cn(
                      "h-9 flex-1 justify-start px-3 text-xs font-normal",
                      !dateRange && "text-muted-foreground",
                    )}
                  />
                }
              >
                <CalendarIcon className="mr-2 size-3.5 shrink-0" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} &mdash; {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Card size="sm" className="w-fit border-0 shadow-none">
                  <CardContent className="p-0">
                    <Calendar
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={onDateRangeSelect}
                      numberOfMonths={1}
                      className="p-0"
                      disabled={{ before: new Date() }}
                    />
                  </CardContent>
                  {dateRange?.from && (
                    <CardFooter className="border-t bg-zinc-50/50 p-3">
                      <div className="flex w-full gap-2">
                        <Field className="flex-1 min-w-0">
                          <FieldLabel className="text-[10px] uppercase font-bold text-zinc-400 mb-1">
                            Start Time
                          </FieldLabel>
                          <InputGroup className="h-8">
                            <InputGroupAddon className="px-1.5 border-r">
                              <Clock2Icon className="size-3 text-zinc-400" />
                            </InputGroupAddon>
                            <InputGroupInput
                              type="time"
                              value={getTimeValue(startsAt)}
                              onChange={(e) => onTimeChange("start", e.target.value)}
                              disabled={!startsAt}
                              className="h-full px-1 text-xs [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden"
                            />
                          </InputGroup>
                        </Field>
                        <Field className="flex-1 min-w-0">
                          <FieldLabel className="text-[10px] uppercase font-bold text-zinc-400 mb-1">
                            End Time
                          </FieldLabel>
                          <InputGroup className="h-8">
                            <InputGroupAddon className="px-1.5 border-r">
                              <Clock2Icon className="size-3 text-zinc-400" />
                            </InputGroupAddon>
                            <InputGroupInput
                              type="time"
                              value={getTimeValue(endsAt)}
                              onChange={(e) => onTimeChange("end", e.target.value)}
                              disabled={!endsAt}
                              className="h-full px-1 text-xs [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden"
                            />
                          </InputGroup>
                        </Field>
                      </div>
                    </CardFooter>
                  )}
                </Card>
              </PopoverContent>
            </Popover>

            {dateRange && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-2 h-9 shrink-0 px-2 text-xs text-destructive hover:text-destructive"
                onClick={onClearDateRange}
              >
                <X className="size-3.5" />
              </Button>
            )}
          </div>

          {(startsAt || endsAt) && (
            <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-500">Starts</span>
                <span className="font-semibold text-slate-800">
                  {startsAt ? format(new Date(startsAt), "PPP p") : "—"}
                </span>
              </div>
              <div className="border-t border-slate-100" />
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-500">Ends</span>
                <span className="font-semibold text-slate-800">
                  {endsAt ? format(new Date(endsAt), "PPP p") : "—"}
                </span>
              </div>
            </div>
          )}

          <FieldError errors={touched.endsAt ? [{ message: fieldErrors.endsAt }] : []} />
        </CardContent>
      </Card>
    </div>
  );
}
