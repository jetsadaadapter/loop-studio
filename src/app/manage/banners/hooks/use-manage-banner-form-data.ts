"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setHours, setMinutes } from "date-fns";
import { type DateRange } from "react-day-picker";
import { useDialogToast } from "@/components/ui/alert-dialog-toast";
import {
  createManageBanner,
  getManageBanner,
  getManageBanners,
  updateManageBanner,
} from "@/core/services/banners.service";
import { getManageApps } from "@/core/services/apps.service";
import { getAppItemId } from "@/core/interfaces/apps.interface";
import type { ManageAppApiItem } from "@/core/interfaces/apps.interface";
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

export function useManageBannerFormData(mode: "create" | "edit", bannerId?: string) {
  const router = useRouter();
  const { pushDialogToast } = useDialogToast();

  const [draft, setDraft] = useState<BannerRecord>(EMPTY_BANNER);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [apps, setApps] = useState<ManageAppApiItem[]>([]);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Partial<Record<string, boolean>>>({});

  function touch(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function clearFieldError(field: string) {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function handleFieldChange<K extends keyof BannerRecord>(field: K, value: BannerRecord[K]) {
    setDraft((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) clearFieldError(field);
  }

  function handleDateRangeSelect(range: DateRange | undefined) {
    setDateRange(range);

    const currentFrom = draft.startsAt ? new Date(draft.startsAt) : new Date();
    const currentTo = draft.endsAt ? new Date(draft.endsAt) : new Date();

    const newStartsAt = range?.from
      ? setMinutes(setHours(range.from, currentFrom.getHours()), currentFrom.getMinutes()).toISOString()
      : null;
    const newEndsAt = range?.to
      ? setMinutes(setHours(range.to, currentTo.getHours()), currentTo.getMinutes()).toISOString()
      : null;

    setDraft((prev) => ({ ...prev, startsAt: newStartsAt, endsAt: newEndsAt }));
    clearFieldError("startsAt");
    clearFieldError("endsAt");
  }

  function handleTimeChange(type: "start" | "end", timeValue: string) {
    const [hours, minutes] = timeValue.split(":").map(Number);
    const field = type === "start" ? "startsAt" : "endsAt";

    setDraft((prev) => {
      const currentIso = type === "start" ? prev.startsAt : prev.endsAt;
      if (!currentIso) return prev;
      const newDate = setMinutes(setHours(new Date(currentIso), hours), minutes);
      return { ...prev, [field]: newDate.toISOString() };
    });

    clearFieldError(field);
    if (type === "start") clearFieldError("endsAt");
  }

  function clearDateRange() {
    setDateRange(undefined);
    setDraft((prev) => ({ ...prev, startsAt: null, endsAt: null }));
  }

  useEffect(() => {
    let cancelled = false;

    async function loadApps() {
      try {
        const response = await getManageApps({ page: 1, limit: 1000 });
        if (!cancelled) setApps(response.data ?? []);
      } catch {
        // Apps failed to load — grid will stay empty
      } finally {
        if (!cancelled) setIsLoadingApps(false);
      }
    }

    void loadApps();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (mode !== "create") return;
    let cancelled = false;

    async function loadMaxSortOrder() {
      try {
        const response = await getManageBanners({ limit: 100 });
        if (cancelled) return;
        const max = Math.max(0, ...response.data.map((b) => b.sortOrder));
        setDraft((prev) => ({ ...prev, sortOrder: max + 1 }));
      } catch {
        // Keep default sortOrder
      }
    }

    void loadMaxSortOrder();
    return () => { cancelled = true; };
  }, [mode]);

  useEffect(() => {
    if (mode !== "edit" || !bannerId) return;
    let cancelled = false;

    async function loadEditData() {
      setIsLoading(true);
      setError("");
      try {
        const banner = await getManageBanner(bannerId!);
        if (cancelled) return;

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
          setDateRange({ from: new Date(mapped.startsAt), to: new Date(mapped.endsAt) });
        }
      } catch {
        if (!cancelled) setError("Failed to load banner data.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadEditData();
    return () => { cancelled = true; };
  }, [mode, bannerId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const result = ManageBannerSchema.safeParse(draft);

    if (!result.success) {
      const allFields = Object.keys(EMPTY_BANNER) as (keyof BannerRecord)[];
      setTouched(Object.fromEntries(allFields.map((f) => [f, true])));
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        newErrors[path] = issue.message;
      });
      setFieldErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      if (mode === "edit" && bannerId) {
        await updateManageBanner(bannerId, result.data);
        pushDialogToast("Banner updated successfully.", "success");
      } else {
        await createManageBanner(result.data);
        pushDialogToast("Banner created successfully.", "success");
      }
      router.push("/manage/banners");
      router.refresh();
    } catch {
      setError("Failed to save banner. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function getTimeValue(isoString: string | null) {
    if (!isoString) return "00:00";
    const date = new Date(isoString);
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  }

  return {
    draft,
    setDraft,
    dateRange,
    apps,
    isLoading,
    isLoadingApps,
    isSubmitting,
    error,
    fieldErrors,
    touched,
    touch,
    handleFieldChange,
    handleDateRangeSelect,
    handleTimeChange,
    clearDateRange,
    getTimeValue,
    handleSubmit,
  };
}
