"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CircleIcon } from "lucide-react";

import { ManagerShell } from "@/components/manager-shell";
import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import {
  type AppLinkType,
  getAppItemId,
  type ManageAppApiItem,
  type ManageAppPayload,
} from "@/core/interfaces/library.interface";
import {
  ApiError,
  createManageApp,
  getManageApps,
  updateManageApp,
} from "@/core/services/library.service";

type ManageAppFormClientProps = {
  mode: "create" | "edit";
  appId?: string;
};

type AppRecord = {
  id: string;
  name: string;
  category: string;
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
  category: "Tool",
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
    category: item.category,
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
      .map((tag) => tag.id || tag.tagId || "")
      .filter(Boolean),
  };
}

function mapRecordToPayload(record: AppRecord): ManageAppPayload {
  return {
    name: record.name.trim(),
    category: record.category.trim(),
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
  if (!value.category.trim()) errors.category = "Category is required.";
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
  const router = useRouter();
  const { pushToast } = useToast();

  const [draft, setDraft] = useState<AppRecord>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Partial<Record<string, boolean>>>({});

  const pageTitle = mode === "create" ? "Create App" : "Edit App";

  const statuses = useMemo(
    () => [
      {
        value: "active",
        label: "Publish",
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
      const payload = mapRecordToPayload(draft);

      if (mode === "edit" && appId) {
        await updateManageApp(appId, payload);
        pushToast("App updated successfully.", "success");
      } else {
        await createManageApp(payload);
        pushToast("App created successfully.", "success");
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
          <Card className="rounded-xl border">
            <CardContent className="p-6 text-sm text-muted-foreground">
              Loading app details...
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 space-y-6 lg:col-span-8">
              <Card className="rounded-xl border-0">
                <CardHeader>
                  <h5 className="text-base font-medium">General</h5>
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
                    <Input
                      placeholder="Category"
                      value={draft.category}
                      onChange={(event) => {
                        const next = { ...draft, category: event.target.value };
                        setDraft(next);
                        if (touched.category) revalidateField("category", next);
                      }}
                      onBlur={() => touchAndValidate("category", draft)}
                    />
                    <FieldError
                      errors={
                        touched.category
                          ? [{ message: fieldErrors.category }]
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
                  <h5 className="text-base font-medium">Media</h5>
                </CardHeader>
                <CardContent>
                  <Field>
                    <ImageUpload
                      value={draft.imageId}
                      previewSrc={
                        draft.imageId
                          ? `/images/${encodeURIComponent(draft.imageId.trim())}`
                          : `/images/${DEFAULT_IMAGE_PREVIEW_ID}`
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
                  <h5 className="text-base font-medium">Action</h5>
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
                  <h5 className="text-base font-medium">Content</h5>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Field>
                    <FieldLabel>
                      Instructions <span className="text-destructive">*</span>
                    </FieldLabel>
                    <textarea
                      placeholder="Instructions"
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
                      onBlur={() => touchAndValidate("instructions", draft)}
                      rows={5}
                      className="min-h-28 w-full rounded-md border border-input bg-background px-2.5 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    />
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
                  <h5 className="text-base font-medium">Icon</h5>
                </CardHeader>
                <CardContent>
                  <Field>
                    <ImageUpload
                      value={draft.iconId}
                      previewSrc={
                        draft.iconId
                          ? `/images/${encodeURIComponent(draft.iconId.trim())}`
                          : `/images/${DEFAULT_IMAGE_PREVIEW_ID}`
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
                      placeholder="Upload thumbnail"
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
                  <h5 className="text-base font-medium">Status</h5>
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

                  <Field>
                    <FieldLabel>Sort Order</FieldLabel>
                    <Input
                      type="number"
                      placeholder="Sort order"
                      value={String(draft.sortOrder)}
                      onChange={(event) => {
                        const next = {
                          ...draft,
                          sortOrder: Number(event.target.value || 0),
                        };
                        setDraft(next);
                        if (touched.sortOrder)
                          revalidateField("sortOrder", next);
                      }}
                      onBlur={() => touchAndValidate("sortOrder", draft)}
                    />
                    <FieldDescription>
                      Lower values appear first.
                    </FieldDescription>
                    <FieldError
                      errors={
                        touched.sortOrder
                          ? [{ message: fieldErrors.sortOrder }]
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
    </ManagerShell>
  );
}
