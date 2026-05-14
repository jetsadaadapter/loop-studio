"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, CircleIcon, Copy, Download, Eye } from "lucide-react";
import Markdown from "react-markdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { ManagerShell } from "@/components/manager-shell";
import { useDialogToast } from "@/components/ui/alert-dialog-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagInput } from "@/components/ui/tag-input";
import type {
  AppLinkType,
  ManageAppApiItem,
  ManageAppPayload,
} from "@/core/interfaces/apps.interface";
import { getAppItemId } from "@/core/interfaces/apps.interface";
import type { ManageTagListResponse } from "@/core/interfaces/tags.interface";
import {
  createManageApp,
  getManageApps,
  updateManageApp,
} from "@/core/services/apps.service";
import { ApiError } from "@/core/services/api";

type ManageAppFormClientProps = {
  mode: "create" | "edit";
  appId?: string;
};

type AppRecord = {
  id: string;
  name: string;
  categoryId: string;
  description: string;
  imageId: string;
  iconId: string;
  instructions: string;
  ctaLabel: string;
  ctaLink: string;
  linkType: AppLinkType;
  isActive: boolean;
  sortOrder: number;
  badgeLabel: string;
  tags: string[];
};

const DEFAULT_IMAGE_PREVIEW_ID = "01KPT44CNPSK9J86V2SZHVJ3V6";

const EMPTY_FORM: AppRecord = {
  id: "",
  name: "",
  categoryId: "",
  description: "",
  imageId: "",
  iconId: "",
  instructions: "",
  ctaLabel: "",
  ctaLink: "",
  linkType: "internal",
  isActive: true,
  sortOrder: 0,
  badgeLabel: "",
  tags: [],
};

function mapApiItemToRecord(item: ManageAppApiItem): AppRecord {
  return {
    id: getAppItemId(item),
    name: item.name,
    categoryId:
      item.categoryId ||
      (typeof item.category === "object" ? item.category.id : ""),
    description: item.description,
    imageId: item.imageId,
    iconId: item.iconId,
    instructions: item.instructions,
    ctaLabel: item.ctaLabel ?? "",
    ctaLink: item.ctaLink ?? "",
    linkType: item.linkType,
    isActive: item.isActive,
    sortOrder: item.sortOrder,
    badgeLabel: item.badgeLabel ?? "",
    tags: (item.tags ?? [])
      .map((tag) => tag.name || tag.id || tag.tagId || "")
      .filter(Boolean),
  };
}

function mapRecordToPayload(record: AppRecord): ManageAppPayload {
  return {
    name: record.name.trim(),
    // Always send categoryId as string (id only)
    categoryId: String(record.categoryId).trim(),
    description: record.description.trim(),
    imageId: record.imageId.trim(),
    iconId: record.iconId.trim(),
    instructions: record.instructions.trim(),
    ctaLabel: record.ctaLabel.trim(),
    ctaLink: record.ctaLink.trim(),
    linkType: record.linkType,
    isActive: record.isActive,
    sortOrder: record.sortOrder,
    badgeLabel: record.badgeLabel.trim(),
    tags: record.tags,
  };
}

function hasChanged(nextValue: string, previousValue: string): boolean {
  const next = nextValue.trim();
  const prev = previousValue.trim();
  return Boolean(next) && Boolean(prev) && next !== prev;
}

function buildImageRemovePayload(
  nextMedia: { imageId: string; iconId: string },
  previousMedia: { imageId: string; iconId: string },
): NonNullable<ManageAppPayload["imageRemove"]> | undefined {
  const previousImageId = previousMedia.imageId.trim();
  const previousIconId = previousMedia.iconId.trim();

  const imageChanged = hasChanged(nextMedia.imageId, previousImageId);
  const iconChanged = hasChanged(nextMedia.iconId, previousIconId);

  const imageRemove: NonNullable<ManageAppPayload["imageRemove"]> = {};

  if (imageChanged && previousImageId) {
    imageRemove.imageId = previousImageId;
  }

  if (iconChanged && previousIconId) {
    imageRemove.iconId = previousIconId;
    // Current backend cleanup expects coverId alongside icon replacement.
    imageRemove.coverId = previousIconId;
  }

  return Object.keys(imageRemove).length > 0 ? imageRemove : undefined;
}

function parseApiFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || !error.details) return {};

  const details = error.details as {
    errors?: Record<string, string | string[]>;
    fieldErrors?: Record<string, string | string[]>;
  };

  const raw = details.fieldErrors ?? details.errors;
  if (!raw || typeof raw !== "object") return {};

  const mapped: Record<string, string> = {};
  for (const [field, value] of Object.entries(raw)) {
    mapped[field] = Array.isArray(value)
      ? (value[0] ?? "Invalid value")
      : value;
  }
  return mapped;
}

function validateAppForm(value: AppRecord): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!value.name.trim()) errors.name = "App name is required.";
  if (!value.categoryId.trim()) errors.categoryId = "Category is required.";
  if (!value.description.trim())
    errors.description = "Description is required.";
  if (value.description.trim() && value.description.trim().length < 10) {
    errors.description = "Description must be at least 10 characters.";
  }

  if (!value.imageId.trim()) errors.imageId = "Banner image is required.";
  if (!value.iconId.trim()) errors.iconId = "Thumbnail image is required.";

  if (!value.instructions.trim()) {
    errors.instructions = "Instructions are required.";
  } else if (value.instructions.trim().length < 10) {
    errors.instructions = "Instructions must be at least 10 characters.";
  }

  if (!value.ctaLabel.trim()) errors.ctaLabel = "CTA label is required.";
  if (!value.ctaLink.trim()) errors.ctaLink = "CTA link is required.";

  if (value.linkType === "internal" && !value.ctaLink.trim().startsWith("/")) {
    errors.ctaLink = "Internal link must start with /.";
  }

  if (
    value.linkType === "external" &&
    !value.ctaLink.trim().startsWith("https://")
  ) {
    errors.ctaLink = "External link must start with https://.";
  }

  if (!Number.isInteger(value.sortOrder) || value.sortOrder < 0) {
    errors.sortOrder = "Sort order must be a non-negative integer.";
  }

  if (value.badgeLabel.length > 40) {
    errors.badgeLabel = "Badge label must be 40 characters or fewer.";
  }

  if (value.tags.length === 0) {
    errors.tags = "At least one tag is required.";
  }

  return errors;
}

function ButtonSpinner() {
  return (
    <span
      aria-hidden
      className="inline-block size-3 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

export function ManageAppFormClient({ mode, appId }: ManageAppFormClientProps) {
  // ...existing code...
  const router = useRouter();
  const { pushDialogToast } = useDialogToast();

  const [draft, setDraft] = useState<AppRecord>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Partial<Record<string, boolean>>>({});
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [tagNameToId, setTagNameToId] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [originalMediaIds, setOriginalMediaIds] = useState<{
    imageId: string;
    iconId: string;
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState<"markdown" | "text">(
    "markdown",
  );
  const [didCopy, setDidCopy] = useState(false);
  const instructionsMdInputRef = useRef<HTMLInputElement>(null);

  const pageTitle = mode === "create" ? "Create App" : "Edit App";

  const statuses = useMemo(
    () => [
      {
        value: "active",
        label: "Active",
        color: "text-teal-600 fill-teal-600",
      },
      {
        value: "inactive",
        label: "Inactive",
        color: "text-gray-500 fill-gray-500",
      },
    ],
    [],
  );

  const selectedStatus = statuses.find(
    (status) => status.value === (draft.isActive ? "active" : "inactive"),
  );

  function touch(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function revalidateField(field: string, nextDraft: AppRecord) {
    const allErrors = validateAppForm(nextDraft);
    setFieldErrors((prev) => ({
      ...prev,
      [field]: allErrors[field] ?? "",
    }));
  }

  function touchAndValidate(field: string, nextDraft: AppRecord) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const allErrors = validateAppForm(nextDraft);
    setFieldErrors((prev) => ({
      ...prev,
      [field]: allErrors[field] ?? "",
    }));
  }

  function applyInstructionsContent(incomingContent: string) {
    const normalized = incomingContent.replace(/\r\n/g, "\n").trim();
    const merged = draft.instructions.trim()
      ? `${draft.instructions.trimEnd()}\n\n${normalized}`
      : normalized;

    const next = {
      ...draft,
      instructions: merged,
    };

    setDraft(next);
    touchAndValidate("instructions", next);
  }

  async function importMarkdownFile(file: File) {
    const isMarkdown =
      /\.md$/i.test(file.name) || file.type === "text/markdown";
    if (!isMarkdown) {
      touch("instructions");
      setFieldErrors((current) => ({
        ...current,
        instructions: "Please use a .md file for Instructions.",
      }));
      return;
    }

    try {
      const markdownText = await file.text();
      if (!markdownText.trim()) {
        touch("instructions");
        setFieldErrors((current) => ({
          ...current,
          instructions: "The .md file is empty.",
        }));
        return;
      }

      applyInstructionsContent(markdownText);
    } catch {
      touch("instructions");
      setFieldErrors((current) => ({
        ...current,
        instructions: "Unable to read the .md file.",
      }));
    }
  }

  async function handleInstructionsPaste(
    event: React.ClipboardEvent<HTMLTextAreaElement>,
  ) {
    const markdownFile = Array.from(event.clipboardData.files).find((file) =>
      /\.md$/i.test(file.name),
    );

    if (!markdownFile) return;

    event.preventDefault();
    await importMarkdownFile(markdownFile);
  }

  async function handleInstructionsMdInputChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    await importMarkdownFile(file);
    event.target.value = "";
  }

  async function handleCopyInstructions() {
    const value = draft.instructions?.trim();
    if (!value) {
      pushDialogToast("No instructions to copy.", "error");
      return;
    }

    if (!navigator?.clipboard?.writeText) {
      pushDialogToast("Clipboard is not supported in this browser.", "error");
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setDidCopy(true);
      pushDialogToast("Instructions copied to clipboard.", "success");

      window.setTimeout(() => {
        setDidCopy(false);
      }, 1600);
    } catch {
      pushDialogToast("Unable to copy instructions.", "error");
    }
  }

  function handleDownloadMarkdown() {
    const value = draft.instructions?.trim();
    if (!value) {
      pushDialogToast("No instructions to download.", "error");
      return;
    }

    try {
      const blob = new Blob([value], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${draft.name.trim().replace(/\s+/g, "-").toLowerCase() || "instructions"}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      pushDialogToast("Instructions downloaded as .md file.", "success");
    } catch {
      pushDialogToast("Unable to download instructions.", "error");
    }
  }

  useEffect(() => {
    if (mode !== "edit") return;

    let cancelled = false;

    async function loadEditData() {
      if (!appId?.trim()) {
        if (!cancelled) {
          setError("Missing app id.");
          setIsLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setIsLoading(true);
        setError("");
      }

      try {
        const apps = await getManageApps();
        if (cancelled) return;

        const record = apps
          .map(mapApiItemToRecord)
          .find((item) => item.id === appId.trim());

        if (!record) {
          setError("App not found.");
          return;
        }

        setDraft(record);
        setOriginalMediaIds({
          imageId: record.imageId,
          iconId: record.iconId,
        });
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load app details.",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadEditData();

    return () => {
      cancelled = true;
    };
  }, [appId, mode]);

  useEffect(() => {
    if (mode !== "create") return;

    let cancelled = false;

    async function loadNextSortOrder() {
      try {
        const apps = await getManageApps();
        if (cancelled) return;

        const maxSortOrder = apps.reduce((currentMax, item) => {
          return Number.isInteger(item.sortOrder)
            ? Math.max(currentMax, item.sortOrder)
            : currentMax;
        }, -1);

        const nextSortOrder = Math.max(0, maxSortOrder + 1);

        setDraft((current) => ({
          ...current,
          sortOrder: nextSortOrder,
        }));
      } catch {
        // Keep default sort order when latest order cannot be resolved.
      }
    }

    void loadNextSortOrder();

    return () => {
      cancelled = true;
    };
  }, [mode]);

  useEffect(() => {
    let cancelled = false;

    async function loadManageTags() {
      try {
        const response = await fetch("/api/manage/tags", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) return;

        const payload = (await response.json()) as ManageTagListResponse;
        const tags = Array.isArray(payload.data) ? payload.data : [];

        if (cancelled) return;

        setTagSuggestions(tags.map((tag) => tag.name).filter(Boolean));
        setTagNameToId(
          Object.fromEntries(
            tags
              .filter((tag) => tag.name && tag.id)
              .map((tag) => [tag.name.trim().toLowerCase(), tag.id]),
          ),
        );
      } catch {
        if (!cancelled) {
          setTagSuggestions([]);
          setTagNameToId({});
        }
      }
    }

    void loadManageTags();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const response = await fetch("/api/manage/categories", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) return;

        const payload = await response.json();
        const data = Array.isArray(payload.data) ? payload.data : [];

        if (!cancelled) {
          setCategories(data);
        }
      } catch {
        if (!cancelled) setCategories([]);
      }
    }

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    const nextErrors = validateAppForm(draft);

    // Mark all validated fields as touched so errors become visible
    const allFields = Object.keys(EMPTY_FORM) as (keyof AppRecord)[];
    setTouched(Object.fromEntries(allFields.map((f) => [f, true])));

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setIsSubmitting(false);
      return;
    }

    setFieldErrors({});

    try {
      const payload: ManageAppPayload = {
        ...mapRecordToPayload(draft),
        tags: draft.tags
          .map((tag) => tagNameToId[tag.trim().toLowerCase()] ?? tag)
          .filter(Boolean),
      };

      const mediaChangeDebug = originalMediaIds
        ? {
            banner: {
              oldId: originalMediaIds.imageId.trim(),
              newId: draft.imageId.trim(),
              changed: hasChanged(draft.imageId, originalMediaIds.imageId),
            },
            icon: {
              oldId: originalMediaIds.iconId.trim(),
              newId: draft.iconId.trim(),
              changed: hasChanged(draft.iconId, originalMediaIds.iconId),
            },
            // Cover cleanup currently follows icon replacement flow.
            cover: {
              oldId: originalMediaIds.iconId.trim(),
              newId: draft.iconId.trim(),
              changed: hasChanged(draft.iconId, originalMediaIds.iconId),
            },
          }
        : null;

      if (mode === "edit" && originalMediaIds) {
        const imageRemove = buildImageRemovePayload(
          {
            imageId: draft.imageId,
            iconId: draft.iconId,
          },
          originalMediaIds,
        );

        if (imageRemove) {
          payload.imageRemove = imageRemove;
        }
      }

      console.log("[ManageAppForm] submit payload", {
        mode,
        appId,
        payload,
      });

      console.log("[ManageAppForm] imageRemove payload", {
        mode,
        appId,
        imageRemove: payload.imageRemove ?? null,
      });

      console.log("[ManageAppForm] media change details", {
        mode,
        appId,
        media: mediaChangeDebug,
      });

      if (mode === "edit" && appId) {
        await updateManageApp(appId, payload);
        pushDialogToast("App updated successfully.", "success");
      } else {
        await createManageApp(payload);
        pushDialogToast("App created successfully.", "success");
      }

      router.push("/manage/apps");
      router.refresh();
    } catch (submitError) {
      const apiFieldErrors = parseApiFieldErrors(submitError);
      if (Object.keys(apiFieldErrors).length > 0) {
        setFieldErrors(apiFieldErrors);
      }

      setError(
        submitError instanceof Error
          ? submitError.message
          : mode === "edit"
            ? "Failed to update app."
            : "Failed to create app.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ManagerShell
      title={pageTitle}
      description={
        mode === "create"
          ? "Add a new app to the catalog."
          : "Edit app details, media, and publishing options."
      }
      actions={
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/manage/apps")}
        >
          Back to List
        </Button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 space-y-6 lg:col-span-8">
              <Card className="rounded-xl border-0">
                <CardHeader>
                  <Skeleton className="h-6 w-32 mb-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
              <Card className="rounded-xl border-0">
                <CardHeader>
                  <Skeleton className="h-6 w-24 mb-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-40 w-full mb-2" />
                  <Skeleton className="h-5 w-1/2" />
                </CardContent>
              </Card>
              <Card className="rounded-xl border-0">
                <CardHeader>
                  <Skeleton className="h-6 w-20 mb-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="col-span-12 lg:col-span-4 space-y-6">
              <Card className="rounded-xl border-0">
                <CardHeader>
                  <Skeleton className="h-6 w-24 mb-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 space-y-6 lg:col-span-8">
              <Card className="rounded-xl border-0">
                <CardHeader>
                  <h5 className="text-base font-semibold">General</h5>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Field>
                    <FieldLabel>
                      App Name <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      placeholder="App name"
                      value={draft.name}
                      onChange={(event) => {
                        const next = { ...draft, name: event.target.value };
                        setDraft(next);
                        if (touched.name) revalidateField("name", next);
                      }}
                      onBlur={() => touchAndValidate("name", draft)}
                    />
                    <FieldError
                      errors={
                        touched.name ? [{ message: fieldErrors.name }] : []
                      }
                    />
                  </Field>

                  <Field>
                    <FieldLabel>
                      Category <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select
                      value={draft.categoryId}
                      onValueChange={(value) => {
                        const next = { ...draft, categoryId: value ?? "" };
                        setDraft(next);
                        touchAndValidate("categoryId", next);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select category">
                          {categories.find((cat) => cat.id === draft.categoryId)
                            ?.name || ""}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent align="start">
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError
                      errors={
                        touched.categoryId
                          ? [{ message: fieldErrors.categoryId }]
                          : []
                      }
                    />
                  </Field>

                  <Field>
                    <FieldLabel>
                      Description <span className="text-destructive">*</span>
                    </FieldLabel>
                    <textarea
                      placeholder="App description"
                      value={draft.description}
                      onChange={(event) => {
                        const next = {
                          ...draft,
                          description: event.target.value,
                        };
                        setDraft(next);
                        if (touched.description)
                          revalidateField("description", next);
                      }}
                      onBlur={() => touchAndValidate("description", draft)}
                      rows={5}
                      className="min-h-24 w-full rounded-md border border-input bg-background px-2.5 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    />
                    <FieldError
                      errors={
                        touched.description
                          ? [{ message: fieldErrors.description }]
                          : []
                      }
                    />
                  </Field>
                </CardContent>
              </Card>

              <Card className="rounded-xl border-0">
                <CardHeader>
                  <h5 className="text-base font-semibold">Banner</h5>
                </CardHeader>
                <CardContent>
                  <Field>
                    <ImageUpload
                      value={draft.imageId}
                      previewSrc={
                        draft.imageId
                          ? `/images/${encodeURIComponent(draft.imageId.trim())}`
                          : mode === "edit"
                            ? `/images/${DEFAULT_IMAGE_PREVIEW_ID}`
                            : undefined
                      }
                      onChange={(value) => {
                        const next = { ...draft, imageId: value };
                        setDraft(next);
                        touchAndValidate("imageId", next);
                      }}
                      onError={(message) => {
                        touch("imageId");
                        setFieldErrors((current) => ({
                          ...current,
                          imageId: message,
                        }));
                      }}
                      placeholder="Upload banner"
                      description="Upload banner via /images/upload and preview instantly."
                    />
                    <FieldDescription>
                      Recommended banner size: 1200x400.
                    </FieldDescription>
                    <FieldError
                      errors={
                        touched.imageId
                          ? [{ message: fieldErrors.imageId }]
                          : []
                      }
                    />
                  </Field>
                </CardContent>
              </Card>

              <Card className="rounded-xl border-0">
                <CardHeader>
                  <h5 className="text-base font-semibold">Action</h5>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Field>
                    <FieldLabel>
                      Link Type <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select
                      value={draft.linkType}
                      onValueChange={(value) => {
                        const next = {
                          ...draft,
                          linkType: value as AppLinkType,
                        };
                        setDraft(next);
                        touchAndValidate("linkType", next);
                        if (touched.ctaLink) revalidateField("ctaLink", next);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent align="start">
                        <SelectItem value="internal">internal</SelectItem>
                        <SelectItem value="external">external</SelectItem>
                        <SelectItem value="instruction">instruction</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError
                      errors={
                        touched.linkType
                          ? [{ message: fieldErrors.linkType }]
                          : []
                      }
                    />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel>
                        CTA Label <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input
                        placeholder="CTA label"
                        value={draft.ctaLabel}
                        onChange={(event) => {
                          const next = {
                            ...draft,
                            ctaLabel: event.target.value,
                          };
                          setDraft(next);
                          if (touched.ctaLabel)
                            revalidateField("ctaLabel", next);
                        }}
                        onBlur={() => touchAndValidate("ctaLabel", draft)}
                      />
                      <FieldError
                        errors={
                          touched.ctaLabel
                            ? [{ message: fieldErrors.ctaLabel }]
                            : []
                        }
                      />
                    </Field>

                    <Field>
                      <FieldLabel>
                        CTA Link <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input
                        placeholder="CTA link"
                        value={draft.ctaLink}
                        onChange={(event) => {
                          const next = {
                            ...draft,
                            ctaLink: event.target.value,
                          };
                          setDraft(next);
                          if (touched.ctaLink) revalidateField("ctaLink", next);
                        }}
                        onBlur={() => touchAndValidate("ctaLink", draft)}
                      />
                      <FieldDescription>
                        Internal should start with /, external with https://.
                      </FieldDescription>
                      <FieldError
                        errors={
                          touched.ctaLink
                            ? [{ message: fieldErrors.ctaLink }]
                            : []
                        }
                      />
                    </Field>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl border-0">
                <CardHeader>
                  <h5 className="text-base font-semibold">Content</h5>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Field>
                    <FieldLabel>
                      Instructions <span className="text-destructive">*</span>
                    </FieldLabel>
                    <input
                      ref={instructionsMdInputRef}
                      type="file"
                      accept=".md,text/markdown"
                      className="hidden"
                      title="Import markdown instructions"
                      aria-label="Import markdown instructions"
                      onChange={(event) => {
                        void handleInstructionsMdInputChange(event);
                      }}
                    />
                    <textarea
                      placeholder="Instructions (supports Markdown)"
                      value={draft.instructions}
                      onChange={(event) => {
                        const next = {
                          ...draft,
                          instructions: event.target.value,
                        };
                        setDraft(next);
                        if (touched.instructions)
                          revalidateField("instructions", next);
                      }}
                      onPaste={(event) => {
                        void handleInstructionsPaste(event);
                      }}
                      onBlur={() => touchAndValidate("instructions", draft)}
                      rows={12}
                      className="w-full rounded-md border border-input bg-background px-2.5 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 font-(family-name:--font-inter)"
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => instructionsMdInputRef.current?.click()}
                      >
                        Import .md
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowPreview(true)}
                        className="flex items-center gap-1.5"
                      >
                        <Eye className="size-4" />
                        Preview
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        Paste text, upload .md file, or preview.
                      </span>
                    </div>
                    <FieldError
                      errors={
                        touched.instructions
                          ? [{ message: fieldErrors.instructions }]
                          : []
                      }
                    />
                  </Field>

                  <Field>
                    <FieldLabel>
                      Tags <span className="text-destructive">*</span>
                    </FieldLabel>
                    <TagInput
                      value={draft.tags}
                      suggestions={tagSuggestions}
                      strictSuggestions
                      helperText="Add tags for app."
                      onChange={(tags) => {
                        const next = { ...draft, tags };
                        setDraft(next);
                        touchAndValidate("tags", next);
                      }}
                      placeholder="Add tags..."
                    />
                    <FieldError
                      errors={
                        touched.tags ? [{ message: fieldErrors.tags }] : []
                      }
                    />
                  </Field>
                </CardContent>
              </Card>
            </div>

            <div className="col-span-12 space-y-6 lg:col-span-4">
              <Card className="rounded-xl border-0">
                <CardHeader>
                  <h5 className="text-base font-semibold">Icon</h5>
                </CardHeader>
                <CardContent>
                  <Field>
                    <ImageUpload
                      value={draft.iconId}
                      previewSrc={
                        draft.iconId
                          ? `/images/${encodeURIComponent(draft.iconId.trim())}`
                          : mode === "edit"
                            ? `/images/${DEFAULT_IMAGE_PREVIEW_ID}`
                            : undefined
                      }
                      previewFit="contain"
                      onChange={(value) => {
                        const next = { ...draft, iconId: value };
                        setDraft(next);
                        touchAndValidate("iconId", next);
                      }}
                      onError={(message) => {
                        touch("iconId");
                        setFieldErrors((current) => ({
                          ...current,
                          iconId: message,
                        }));
                      }}
                      placeholder="Upload icon"
                      description="Supports png, jpg, jpeg, webp."
                    />
                    <FieldError
                      errors={
                        touched.iconId ? [{ message: fieldErrors.iconId }] : []
                      }
                    />
                  </Field>
                </CardContent>
              </Card>

              <Card className="rounded-xl border-0">
                <CardHeader>
                  <h5 className="text-base font-semibold">Status</h5>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Field>
                    <FieldLabel>Publish Status</FieldLabel>
                    <Select
                      value={draft.isActive ? "active" : "inactive"}
                      onValueChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          isActive: value === "active",
                        }))
                      }
                    >
                      <SelectTrigger className="w-full [&>span]:flex [&>span]:items-center [&>span]:gap-2">
                        {selectedStatus ? (
                          <CircleIcon
                            className={`size-2 ${selectedStatus.color}`}
                          />
                        ) : null}
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent align="start">
                        {statuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            <div className="flex items-center gap-2">
                              <CircleIcon
                                className={`size-2 ${status.color}`}
                              />
                              <span className="truncate">{status.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>Badge Label</FieldLabel>
                    <Select
                      value={draft.badgeLabel || "none"}
                      onValueChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          badgeLabel:
                            typeof value === "string" && value !== "none"
                              ? value
                              : "",
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select badge" />
                      </SelectTrigger>
                      <SelectContent align="start">
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="Trending">Trending</SelectItem>
                        <SelectItem value="Hot">Hot</SelectItem>
                        <SelectItem value="Coming Soon">Coming Soon</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError
                      errors={
                        touched.badgeLabel
                          ? [{ message: fieldErrors.badgeLabel }]
                          : []
                      }
                    />
                  </Field>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isSubmitting || isLoading}>
            {isSubmitting ? (
              <span className="inline-flex items-center gap-1.5">
                <ButtonSpinner />
                Saving...
              </span>
            ) : mode === "create" ? (
              "Create App"
            ) : (
              "Save changes"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/manage/apps")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-h-[80vh] max-w-4xl overflow-hidden p-0">
          <div className="bg-linear-to-r from-slate-50 via-white to-emerald-50/50 px-5 py-4 border-b border-slate-200">
            <DialogHeader className="mb-0 space-y-3">
              <DialogTitle>Instructions Preview</DialogTitle>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center rounded-md border border-slate-200 bg-white p-1 shadow-xs">
                  <Button
                    type="button"
                    size="sm"
                    variant={previewMode === "markdown" ? "secondary" : "ghost"}
                    onClick={() => setPreviewMode("markdown")}
                  >
                    Markdown
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={previewMode === "text" ? "secondary" : "ghost"}
                    onClick={() => setPreviewMode("text")}
                  >
                    Text
                  </Button>
                </div>

                <div className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-xs">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => void handleCopyInstructions()}
                    disabled={!draft.instructions.trim()}
                    className="flex items-center gap-1.5"
                  >
                    {didCopy ? (
                      <Check className="size-4" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                    {didCopy ? "Copied" : "Copy"}
                  </Button>

                  <div className="h-5 w-px bg-slate-200" />

                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownloadMarkdown()}
                    disabled={!draft.instructions.trim()}
                    className="flex items-center gap-1.5"
                  >
                    <Download className="size-4" />
                    Download
                  </Button>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="max-h-[62vh] overflow-y-auto bg-white p-5">
            {!draft.instructions.trim() ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-xs italic text-slate-500">
                No instructions provided yet.
              </div>
            ) : previewMode === "markdown" ? (
              <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="prose prose-xs max-w-none font-(family-name:--font-inter) text-xs leading-6 text-slate-900 [&>*+*]:mt-3 prose-headings:text-slate-900 prose-strong:text-slate-900 prose-p:my-3 prose-p:text-xs prose-li:my-2 prose-li:text-xs prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-700 prose-code:text-xs">
                  <Markdown
                    components={{
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      code: (props: any) => {
                        const { inline, ...rest } = props;
                        return inline ? (
                          <code
                            className="rounded border border-slate-200 bg-white px-1 py-0.5 text-[0.8em] text-slate-900"
                            {...rest}
                          />
                        ) : (
                          <code
                            className="block overflow-x-auto rounded-md border border-slate-200 bg-white p-3 text-xs text-slate-900"
                            {...rest}
                          />
                        );
                      },
                      pre: (props) => (
                        <pre
                          className="my-4 overflow-x-auto rounded-md bg-transparent p-0"
                          {...props}
                        />
                      ),
                      blockquote: (props) => (
                        <blockquote
                          className="border-l-4 border-emerald-500/70 bg-emerald-50 px-3 py-2 italic text-slate-700"
                          {...props}
                        />
                      ),
                    }}
                  >
                    {draft.instructions}
                  </Markdown>
                </div>
              </article>
            ) : (
              <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <pre className="whitespace-pre-wrap wrap-break-word text-xs leading-6 text-slate-800 font-(family-name:--font-inter)">
                  {draft.instructions}
                </pre>
              </article>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </ManagerShell>
  );
}
