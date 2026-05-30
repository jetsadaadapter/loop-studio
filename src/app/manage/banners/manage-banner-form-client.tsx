"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Check, LayoutGrid, X, Calendar as CalendarIcon, Clock2Icon } from "lucide-react";
import { format, setHours, setMinutes } from "date-fns";
import { type DateRange } from "react-day-picker";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { FieldGroup, Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getLocalizedText, getManageRouteMeta } from "@/app/manage/config";
import { ManagerShell } from "@/components/manager-shell";
import { useDialogToast } from "@/components/ui/alert-dialog-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import {
  createManageBanner,
  getManageBanner,
  getManageBanners,
  updateManageBanner,
} from "@/core/services/banners.service";
import { getManageApps } from "@/core/services/apps.service";
import { getAppItemId } from "@/core/interfaces/apps.interface";
import type { ManageAppApiItem } from "@/core/interfaces/apps.interface";
import { cn } from "@/lib/utils";
import { ManageBannerSchema } from "@/core/validators/banners.validator";

type BannerRecord = {
  id: string;
  title: string;
  subtitle: string;
  imageId: string;
  appId: string;
  sortOrder: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
};

const EMPTY_BANNER: BannerRecord = {
  id: "",
  title: "",
  subtitle: "",
  imageId: "",
  appId: "",
  sortOrder: 1,
  isActive: true,
  startsAt: null,
  endsAt: null,
};


function ButtonSpinner() {
  return (
    <span
      aria-hidden
      className="inline-block size-3 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

export function ManageBannerFormClient({
  mode,
  bannerId,
  initialData,
  placeholders,
}: {
  mode: "create" | "edit";
  bannerId?: string;
  initialData?: Partial<BannerRecord>;
  placeholders?: Partial<BannerRecord>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { pushDialogToast } = useDialogToast();
  const draftState = { ...EMPTY_BANNER, ...initialData };
  const [draft, setDraft] = useState<BannerRecord>(draftState);
  const [isLoading, setIsLoading] = useState(mode === "edit");

  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (draftState.startsAt && draftState.endsAt) {
      return {
        from: new Date(draftState.startsAt),
        to: new Date(draftState.endsAt),
      };
    }
    return undefined;
  });

  const [maxSortOrder, setMaxSortOrder] = useState(0);
  const [apps, setApps] = useState<ManageAppApiItem[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const routeMeta = useMemo(() => getManageRouteMeta(pathname), [pathname]);
  const pageTitle = useMemo(() => getLocalizedText(routeMeta.title), [routeMeta]);
  const pageSubtitle = useMemo(() => getLocalizedText(routeMeta.subtitle), [routeMeta]);

  useEffect(() => {
    async function loadApps() {
      try {
        const response = await getManageApps({ page: 1, limit: 1000 });
        setApps(response.data ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingApps(false);
      }
    }

    async function loadBanners() {
      if (mode === "create") {
        try {
          const response = await getManageBanners({ limit: 100 });
          const max = Math.max(0, ...response.data.map((b) => b.sortOrder));
          setMaxSortOrder(max);
        } catch (err) {
          console.error(err);
        }
      }
    }

    async function loadEditData() {
      if (mode !== "edit" || !bannerId) return;

      setIsLoading(true);
      try {
        const banner = await getManageBanner(bannerId);
        const mapped: BannerRecord = {
          id: banner.id || banner.bannerId || "",
          title: banner.title || "",
          subtitle: banner.subtitle || "",
          imageId: banner.imageId || "",
          appId: banner.appId || (banner.app ? getAppItemId(banner.app) : ""),
          sortOrder: banner.sortOrder ?? 0,
          isActive: banner.isActive ?? true,
          startsAt: banner.startsAt || null,
          endsAt: banner.endsAt || null,
        };
        setDraft(mapped);
        if (mapped.startsAt && mapped.endsAt) {
          setDateRange({
            from: new Date(mapped.startsAt),
            to: new Date(mapped.endsAt),
          });
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load banner data.");
      } finally {
        setIsLoading(false);
      }
    }

    loadApps();
    loadBanners();
    loadEditData();
  }, [mode, bannerId]);

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range);

    // Preserve existing time if possible
    const currentFrom = draft.startsAt ? new Date(draft.startsAt) : new Date();
    const currentTo = draft.endsAt ? new Date(draft.endsAt) : new Date();

    let newStartsAt = null;
    let newEndsAt = null;

    if (range?.from) {
      const fromWithTime = setMinutes(setHours(range.from, currentFrom.getHours()), currentFrom.getMinutes());
      newStartsAt = fromWithTime.toISOString();
    }

    if (range?.to) {
      const toWithTime = setMinutes(setHours(range.to, currentTo.getHours()), currentTo.getMinutes());
      newEndsAt = toWithTime.toISOString();
    }

    setDraft((prev) => ({
      ...prev,
      startsAt: newStartsAt,
      endsAt: newEndsAt,
    }));
    
    // Clear errors for date fields
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.startsAt;
      delete next.endsAt;
      return next;
    });
  };

  const handleTimeChange = (type: "start" | "end", timeValue: string) => {
    const [hours, minutes] = timeValue.split(":").map(Number);

    setDraft((prev) => {
      const currentIso = type === "start" ? prev.startsAt : prev.endsAt;
      if (!currentIso) return prev;

      const date = new Date(currentIso);
      const newDate = setMinutes(setHours(date, hours), minutes);

      return {
        ...prev,
        [type === "start" ? "startsAt" : "endsAt"]: newDate.toISOString(),
      };
    });

    // Clear error for the specific field
    const field = type === "start" ? "startsAt" : "endsAt";
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    // Also clear endsAt error if start time changes (as it affects range validity)
    if (type === "start" && fieldErrors.endsAt) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.endsAt;
        return next;
      });
    }
  };

  const getTimeValue = (isoString: string | null) => {
    if (!isoString) return "00:00";
    const date = new Date(isoString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleDraftChange = <K extends keyof BannerRecord>(field: K, value: BannerRecord[K]) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = ManageBannerSchema.safeParse({
      ...draft,
      sortOrder: mode === "create" ? maxSortOrder + 1 : draft.sortOrder,
    });

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        newErrors[path] = issue.message;
      });
      setFieldErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = result.data;

      console.log("[ManageBannerForm] submit payload", {
        mode,
        bannerId,
        payload,
      });

      if (mode === "edit" && bannerId) {
        await updateManageBanner(bannerId, payload);
        pushDialogToast("Banner updated successfully.", "success");
      } else {
        await createManageBanner(payload);
        pushDialogToast("Banner created successfully.", "success");
      }

      router.push("/manage/banners");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Failed to save banner. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ManagerShell
      title={pageTitle}
      description={pageSubtitle}
      actions={<Button onClick={() => router.push("/manage/banners")} variant="outline">Back to List</Button>}
    >
      <form onSubmit={handleSubmit} className="space-y-8 pb-20">
        {isLoading ? (
          <div className="grid grid-cols-12 gap-6">
            {/* Main Column Skeleton */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              <Card className="rounded-xl border-0">
                <CardHeader>
                  <Skeleton className="h-6 w-32 mb-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
              <Card className="rounded-xl border-0">
                <CardHeader>
                  <Skeleton className="h-6 w-24 mb-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            </div>
            {/* Sidebar Skeleton */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              <Card className="rounded-xl border-0">
                <CardHeader>
                  <Skeleton className="h-6 w-24 mb-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-48 w-full rounded-lg" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
          {/* Main Column */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <Card className="rounded-xl border-0">
              <CardHeader>
                <h5 className="text-base font-semibold">Banner Details</h5>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field>
                  <FieldLabel>Title <span className="text-destructive">*</span></FieldLabel>
                  <Input
                    value={draft.title}
                    onChange={(e) => handleDraftChange("title", e.target.value)}
                    placeholder={placeholders?.title || "Banner Title"}
                  />
                  <FieldDescription>The main headline displayed on the banner.</FieldDescription>
                  <FieldError>{fieldErrors.title}</FieldError>
                </Field>

                <Field>
                  <FieldLabel>Subtitle <span className="text-destructive">*</span></FieldLabel>
                  <Input
                    value={draft.subtitle}
                    onChange={(e) => handleDraftChange("subtitle", e.target.value)}
                    placeholder={placeholders?.subtitle || "Banner Subtitle"}
                  />
                  <FieldDescription>Additional context or call-to-action text below the title.</FieldDescription>
                  <FieldError>{fieldErrors.subtitle}</FieldError>
                </Field>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-0">
              <CardHeader>
                <h5 className="text-base font-semibold">App Selection <span className="text-destructive">*</span></h5>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto p-1">
                  {isLoadingApps ? (
                    <div className="col-span-full py-10 flex flex-col items-center justify-center gap-2">
                      <ButtonSpinner />
                      <p className="text-xs text-zinc-400">Loading apps...</p>
                    </div>
                  ) : (
                    apps.map((app) => {
                      const appId = getAppItemId(app);
                      const isSelected = draft.appId === appId;
                      const iconUrl = app.iconId ? `/images/${encodeURIComponent(app.iconId.trim())}` : null;

                      return (
                        <button
                          key={appId}
                          type="button"
                          onClick={() => handleDraftChange("appId", appId)}
                          className={cn(
                            "flex flex-col p-4 rounded-xl border text-left transition-all relative overflow-hidden",
                            isSelected
                              ? "bg-white border-zinc-900 ring-1 ring-zinc-900"
                              : "bg-white border-zinc-200 hover:border-zinc-300 shadow-sm"
                          )}
                        >
                          <div className="flex items-start justify-between w-full mb-3">
                            <div className="relative size-10 rounded-lg overflow-hidden flex-shrink-0 border border-zinc-100 bg-zinc-50 flex items-center justify-center">
                              {iconUrl ? (
                                <Image
                                  src={iconUrl}
                                  alt={app.name}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <LayoutGrid className="size-4 text-zinc-400" />
                              )}
                            </div>
                            <div className={cn(
                              "flex size-6 shrink-0 items-center justify-center rounded-full transition-colors",
                              isSelected 
                                ? "bg-zinc-900 border border-zinc-900 text-white" 
                                : "border border-zinc-200 bg-white"
                            )}>
                              <Check className={cn("size-3.5", isSelected ? "text-white" : "text-zinc-300")} />
                            </div>
                          </div>
                          <div className="w-full">
                            <p className="text-[14px] font-bold text-zinc-900 truncate mb-1">{app.name}</p>
                            <p className="text-[12px] text-zinc-500 line-clamp-2 leading-relaxed">
                              {app.description || "No description provided."}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
                <FieldError>{fieldErrors.appId}</FieldError>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <Card className="rounded-xl border-0">
              <CardHeader>
                <h5 className="text-base font-semibold">Banner Image <span className="text-destructive">*</span></h5>
              </CardHeader>
              <CardContent>
                <Field>
                  <ImageUpload
                    value={draft.imageId}
                    previewSrc={draft.imageId ? `/images/${encodeURIComponent(draft.imageId.trim())}` : undefined}
                    onChange={(id) => {
                      handleDraftChange("imageId", id);
                      setFieldErrors((prev) => ({ ...prev, imageId: "" }));
                    }}
                    onError={(msg) => setFieldErrors((prev) => ({ ...prev, imageId: msg }))}
                    placeholder="Upload banner image"
                    description="Recommended 16:10 ratio."
                  />
                  <FieldError>{fieldErrors.imageId}</FieldError>
                </Field>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-0">
              <CardHeader>
                <h5 className="text-base font-semibold">Settings</h5>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field>
                  <FieldLabel>Publish Status</FieldLabel>
                  <Select
                    value={draft.isActive ? "active" : "inactive"}
                    onValueChange={(val) => handleDraftChange("isActive", val === "active")}
                  >
                    <SelectTrigger className="w-full [&>span]:flex [&>span]:items-center [&>span]:gap-2">
                      <div className={cn("size-2 rounded-full", draft.isActive ? "bg-emerald-500" : "bg-zinc-300")} />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="start">
                      <SelectItem value="active">
                        <div className="flex items-center gap-2">
                          <div className="size-2 rounded-full bg-emerald-500" />
                          <span>Active</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="inactive">
                        <div className="flex items-center gap-2">
                          <div className="size-2 rounded-full bg-zinc-300" />
                          <span>Inactive</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <div className="flex items-center justify-between mb-2">
                    <FieldLabel className="mb-0">Visibility Schedule</FieldLabel>
                    {dateRange && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-destructive px-2"
                        onClick={() => {
                          setDateRange(undefined);
                          setDraft((prev) => ({ ...prev, startsAt: null, endsAt: null }));
                        }}
                      >
                        <X className="size-3 mr-1" /> Clear
                      </Button>
                    )}
                  </div>

                  <Popover>
                    <PopoverTrigger
                      render={
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-8 px-2.5 rounded-sm border-input text-xs",
                            !dateRange && "text-muted-foreground"
                          )}
                        />
                      }
                    >
                      <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick visibility range</span>
                      )}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Card size="sm" className="w-fit border-0 shadow-none">
                        <CardContent className="p-0">
                          <Calendar
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={handleDateRangeSelect}
                            numberOfMonths={1}
                            className="p-0"
                            disabled={{ before: new Date() }}
                          />
                        </CardContent>
                        <CardFooter className="border-t bg-zinc-50/50 p-3">
                          <FieldGroup className="flex-row gap-2">
                            <Field className="flex-1 min-w-0">
                              <FieldLabel className="text-[10px] uppercase font-bold text-zinc-400 mb-1">Start Time</FieldLabel>
                              <InputGroup className="h-8">
                                <InputGroupAddon className="px-1.5 border-r">
                                  <Clock2Icon className="size-3 text-zinc-400" />
                                </InputGroupAddon>
                                <InputGroupInput
                                  type="time"
                                  value={getTimeValue(draft.startsAt)}
                                  onChange={(e) => handleTimeChange("start", e.target.value)}
                                  disabled={!draft.startsAt}
                                  className="h-full px-1 text-xs [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden"
                                />
                              </InputGroup>
                            </Field>
                            <Field className="flex-1 min-w-0">
                              <FieldLabel className="text-[10px] uppercase font-bold text-zinc-400 mb-1">End Time</FieldLabel>
                              <InputGroup className="h-8">
                                <InputGroupAddon className="px-1.5 border-r">
                                  <Clock2Icon className="size-3 text-zinc-400" />
                                </InputGroupAddon>
                                <InputGroupInput
                                  type="time"
                                  value={getTimeValue(draft.endsAt)}
                                  onChange={(e) => handleTimeChange("end", e.target.value)}
                                  disabled={!draft.endsAt}
                                  className="h-full px-1 text-xs [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden"
                                />
                              </InputGroup>
                            </Field>
                          </FieldGroup>
                        </CardFooter>
                      </Card>
                    </PopoverContent>
                  </Popover>

                  <div className="mt-4 space-y-2">
                    <div className="p-2 bg-zinc-50 border border-zinc-100 rounded-md">
                      <p className="text-[9px] uppercase font-bold text-zinc-400 mb-0.5">Current Start</p>
                      <p className="text-[11px] font-semibold text-zinc-800">
                        {draft.startsAt ? format(new Date(draft.startsAt), "PPP p") : "Not set"}
                      </p>
                    </div>
                    <div className="p-2 bg-zinc-50 border border-zinc-100 rounded-md">
                      <p className="text-[9px] uppercase font-bold text-zinc-400 mb-0.5">Current End</p>
                      <p className="text-[11px] font-semibold text-zinc-800">
                        {draft.endsAt ? format(new Date(draft.endsAt), "PPP p") : "Not set"}
                      </p>
                    </div>
                  </div>
                </Field>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {!isLoading && (
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <ButtonSpinner /> Saving...
                </span>
              ) : mode === "create" ? "Create Banner" : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/manage/banners")}
            >
              Cancel
            </Button>
          </div>
        )}
      </form>
    </ManagerShell>
  );
}
