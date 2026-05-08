"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  startTransition,
  useId,
} from "react";
import { CircleIcon } from "lucide-react";

import { getLocalizedText, getManageRouteMeta } from "@/app/manage/config";
import { ManagerShell } from "@/components/manager-shell";
import { ManagerToolbar } from "@/components/manager-toolbar";
import { ManagerDataTable } from "@/components/manager-data-table";
import { ManagerForm } from "@/components/manager-form";
import type { ManagerFormProps } from "@/components/manager-form/types";
import { ManagerFormSection } from "@/components/manager-form-section";
import { ManagerDeleteConfirm } from "@/components/manager-delete-confirm";
import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  getAppItemId,
  type AppLinkType,
  type ManageAppApiItem,
  type ManageAppPayload,
} from "@/core/interfaces/library.interface";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";
import { TagInput } from "@/components/ui/tag-input";
import {
  ApiError,
  createManageApp,
  deleteManageApp,
  getManageApps,
  updateManageApp,
} from "@/core/services/library.service";

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
  updatedAt: string;
};

type FormSubmitHandler = ManagerFormProps["onSubmit"];

type FormSubmitEvent = Parameters<FormSubmitHandler>[0];

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
  updatedAt: "",
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
    updatedAt: (item.updatedAt || "").slice(0, 10),
  };
}

function mapRecordToPayload(record: AppRecord): ManageAppPayload {
  return {
    name: record.name.trim(),
    category: record.category.trim(),
    description: record.description,
    imageId: record.imageId,
    iconId: record.iconId,
    instructions: record.instructions,
    ctaLabel: record.ctaLabel,
    ctaLink: record.ctaLink,
    linkType: record.linkType,
    isActive: record.isActive,
    sortOrder: record.sortOrder,
    badgeLabel: record.badgeLabel,
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

function ButtonSpinner() {
  return (
    <span
      aria-hidden
      className="inline-block size-3 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

export function ManageAppsClient() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasHandledCreateQuery = useRef(false);
  const { pushToast } = useToast();
  const [apps, setApps] = useState<AppRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [draft, setDraft] = useState<AppRecord>(EMPTY_FORM);
  const [error, setError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<AppRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const statusId = useId();
  const badgeId = useId();
  const linkTypeId = useId();

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
      {
        value: "draft",
        label: "Draft",
        color: "text-amber-300 fill-amber-300",
      },
    ],
    [],
  );

  const selectedStatus = statuses.find(
    (s) => s.value === (draft.isActive ? "active" : "inactive"),
  );

  const loadApps = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setLoadError("");
      try {
        const response = await getManageApps();
        setApps(response.map(mapApiItemToRecord));
        setLastUpdatedAt(new Date());
      } catch {
        setLoadError("Failed to load apps.");
        pushToast("Failed to load apps.", "error");
      } finally {
        if (silent) {
          setIsRefreshing(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [pushToast],
  );

  useEffect(() => {
    startTransition(() => {
      void loadApps();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return apps
      .filter((item) =>
        `${item.name} ${item.category}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
      .filter(
        (item) => categoryFilter === "all" || item.category === categoryFilter,
      )
      .filter((item) => {
        if (statusFilter === "all") return true;
        return statusFilter === "active" ? item.isActive : !item.isActive;
      })
      .sort((left, right) => left.sortOrder - right.sortOrder);
  }, [apps, search, categoryFilter, statusFilter]);

  const categoryOptions = useMemo(() => {
    const categories = Array.from(
      new Set(apps.map((item) => item.category).filter(Boolean)),
    ).sort((left, right) => left.localeCompare(right));

    return [
      { value: "all", label: "All" },
      ...categories.map((value) => ({ value, label: value })),
    ];
  }, [apps]);

  const hasActiveFilter =
    search.trim() !== "" || categoryFilter !== "all" || statusFilter !== "all";

  const pageTitle = useMemo(() => {
    return getLocalizedText(getManageRouteMeta(pathname).title);
  }, [pathname]);

  function openCreateForm() {
    setMode("create");
    setDraft(EMPTY_FORM);
    setError("");
    setFieldErrors({});
  }

  useEffect(() => {
    if (hasHandledCreateQuery.current) return;
    if (searchParams.get("action") !== "create") return;
    hasHandledCreateQuery.current = true;
    startTransition(() => {
      openCreateForm();
    });
  }, [searchParams]);

  function clearFilters() {
    setSearch("");
    setCategoryFilter("all");
    setStatusFilter("all");
  }

  function resetForm() {
    setMode(null);
    setDraft(EMPTY_FORM);
    setError("");
    setFieldErrors({});
  }

  function validateForm(value: AppRecord): string {
    if (!value.name.trim()) return "Name is required.";
    if (!value.category.trim()) return "Category is required.";

    if (value.linkType === "internal" && !value.ctaLink.startsWith("/")) {
      return "Internal link must start with /.";
    }

    if (
      value.linkType === "external" &&
      !value.ctaLink.startsWith("https://")
    ) {
      return "External link must start with https://.";
    }

    return "";
  }

  const onSubmit: FormSubmitHandler = (event) => {
    void handleSubmit(event);
  };

  async function handleSubmit(event: FormSubmitEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    const validationError = validateForm(draft);

    if (validationError) {
      setError(validationError);
      setIsSubmitting(false);
      return;
    }

    setError("");
    setFieldErrors({});

    const payload = mapRecordToPayload(draft);

    const normalized: AppRecord = {
      ...draft,
      id: draft.id || `tmp-${Date.now()}`,
      tags: draft.tags,
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    if (mode === "edit") {
      const previous = apps.find((item) => item.id === normalized.id);
      setApps((current) =>
        current.map((item) => (item.id === normalized.id ? normalized : item)),
      );

      try {
        const updated = await updateManageApp(normalized.id, payload);
        setApps((current) =>
          current.map((item) =>
            item.id === normalized.id ? mapApiItemToRecord(updated) : item,
          ),
        );
        pushToast("App updated successfully.", "success");
        resetForm();
      } catch (submitError) {
        if (previous) {
          setApps((current) =>
            current.map((item) => (item.id === previous.id ? previous : item)),
          );
        }
        setFieldErrors(parseApiFieldErrors(submitError));
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Failed to update app.",
        );
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    setApps((current) => [normalized, ...current]);

    try {
      const created = await createManageApp(payload);
      const createdRecord = mapApiItemToRecord(created);
      setApps((current) =>
        current.map((item) =>
          item.id === normalized.id ? createdRecord : item,
        ),
      );
      pushToast("App created successfully.", "success");
      resetForm();
    } catch (submitError) {
      setApps((current) => current.filter((item) => item.id !== normalized.id));
      setFieldErrors(parseApiFieldErrors(submitError));
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to create app.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onDelete(target: AppRecord) {
    setDeletingId(target.id);
    const previous = apps;
    setApps((current) => current.filter((item) => item.id !== target.id));
    setDeleteTarget(null);

    try {
      await deleteManageApp(target.id);
      pushToast("App deleted successfully.", "success");
    } catch (deleteError) {
      setApps(previous);
      pushToast(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete app.",
        "error",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <ManagerShell
      title={pageTitle}
      description="Universal manager for app catalog (id-first)."
      actions={
        <Button
          type="button"
          disabled={isSubmitting || deletingId !== null}
          onClick={openCreateForm}
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-1.5">
              <ButtonSpinner />
              Processing...
            </span>
          ) : (
            "Create App"
          )}
        </Button>
      }
    >
      <ManagerToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search app name or category"
        trailing={
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              {lastUpdatedAt
                ? `Updated ${lastUpdatedAt.toLocaleDateString()} ${lastUpdatedAt.toLocaleTimeString()}`
                : "Not updated yet"}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isLoading || isRefreshing}
              onClick={() => void loadApps({ silent: true })}
            >
              {isRefreshing ? (
                <span className="inline-flex items-center gap-1.5">
                  <ButtonSpinner />
                  Refreshing...
                </span>
              ) : (
                "Refresh"
              )}
            </Button>
          </div>
        }
        filters={[
          {
            key: "category",
            label: "Category",
            value: categoryFilter,
            onChange: setCategoryFilter,
            options: categoryOptions,
          },
          {
            key: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "all", label: "All" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ],
          },
        ]}
      />

      <ManagerDataTable
        rows={filtered}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        columns={[
          {
            key: "name",
            header: "Name",
            render: (row) => (
              <div>
                <p className="font-medium">{row.name}</p>
                <p className="text-xs text-slate-500">{row.id}</p>
              </div>
            ),
          },
          {
            key: "category",
            header: "Category",
            render: (row) => row.category,
          },
          {
            key: "linkType",
            header: "LinkType",
            render: (row) => <Badge variant="outline">{row.linkType}</Badge>,
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <Badge variant={row.isActive ? "secondary" : "outline"}>
                {row.isActive ? "Active" : "Inactive"}
              </Badge>
            ),
          },
          { key: "sortOrder", header: "Sort", render: (row) => row.sortOrder },
          {
            key: "updatedAt",
            header: "Updated",
            render: (row) => row.updatedAt,
          },
          {
            key: "actions",
            header: "Actions",
            className: "whitespace-nowrap",
            render: (row) => (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting || deletingId !== null}
                  onClick={() => {
                    setMode("edit");
                    setDraft(row);
                  }}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isSubmitting || deletingId !== null}
                  onClick={() => setDeleteTarget(row)}
                >
                  {deletingId === row.id ? (
                    <span className="inline-flex items-center gap-1.5">
                      <ButtonSpinner />
                      Deleting...
                    </span>
                  ) : (
                    "Delete"
                  )}
                </Button>
                <Link
                  href={`/apps/${row.id}`}
                  className="inline-flex h-7 items-center rounded-sm border border-slate-300 px-2.5 text-xs text-slate-700 hover:bg-slate-50"
                >
                  Detail
                </Link>
              </div>
            ),
          },
        ]}
        emptyText={isLoading ? "Loading apps..." : "No apps found"}
        emptyState={
          isLoading ? null : (
            <div className="flex flex-col items-center gap-3 py-2">
              <p className="text-sm text-slate-500">
                {loadError
                  ? "Unable to load app catalog right now."
                  : apps.length === 0
                    ? "No apps yet. Create your first app to start managing catalog content."
                    : "No results for the current search or filters."}
              </p>
              <div className="flex gap-2">
                {loadError ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void loadApps()}
                  >
                    Retry
                  </Button>
                ) : apps.length === 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={isSubmitting || deletingId !== null}
                    onClick={openCreateForm}
                  >
                    Create App
                  </Button>
                ) : hasActiveFilter ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </Button>
                ) : null}
              </div>
            </div>
          )
        }
      />

      {deleteTarget ? (
        <ManagerDeleteConfirm
          itemName={deleteTarget.name}
          itemId={deleteTarget.id}
          isLoading={deletingId === deleteTarget.id}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void onDelete(deleteTarget)}
        />
      ) : null}

      <Sheet open={!!mode} onOpenChange={(open) => !open && resetForm()}>
        <SheetContent side="right" className="w-[90vw] sm:!max-w-[50vw] sm:!w-[50vw] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{mode === "create" ? "Create App" : `Edit App: ${draft.name}`}</SheetTitle>
            <SheetDescription>Universal app form scaffold aligned with /manage/apps payload</SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <ManagerForm
              onSubmit={onSubmit}
              hideHeader
              className="border-none bg-transparent shadow-none"
              actions={
                <>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <span className="inline-flex items-center gap-1.5">
                        <ButtonSpinner />
                        Saving...
                      </span>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </>
              }
            >
              <ManagerFormSection title="General">
                <FieldGroup>
                  <Field>
                    <FieldLabel>
                      Name <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      placeholder="Name"
                      value={draft.name}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                    />
                    <FieldDescription>
                      A name is required and recommended to be unique.
                    </FieldDescription>
                    <FieldError errors={[{ message: fieldErrors.name }]} />
                  </Field>

                  <Field>
                    <FieldLabel>
                      Category <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      placeholder="Category"
                      value={draft.category}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          category: event.target.value,
                        }))
                      }
                    />
                    <FieldDescription>
                      App category for grouping in the catalog.
                    </FieldDescription>
                    <FieldError errors={[{ message: fieldErrors.category }]} />
                  </Field>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor={statusId}>Status</FieldLabel>
                      <Select
                        value={draft.isActive ? "active" : "inactive"}
                        onValueChange={(value) =>
                          setDraft((current) => ({
                            ...current,
                            isActive: value === "active",
                          }))
                        }
                      >
                        <SelectTrigger
                          id={statusId}
                          className="w-full [&>span]:flex [&>span]:items-center [&>span]:gap-2"
                        >
                          {selectedStatus && (
                            <CircleIcon
                              className={`size-2 ${selectedStatus.color}`}
                            />
                          )}
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
                      <FieldDescription>
                        Set the visibility of this app.
                      </FieldDescription>
                      <FieldError errors={[{ message: fieldErrors.isActive }]} />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor={badgeId}>Badge Label</FieldLabel>
                      <Select
                        value={draft.badgeLabel}
                        onValueChange={(value) =>
                          setDraft((current) => ({
                            ...current,
                            badgeLabel: (value === "none" ? "" : value) || "",
                          }))
                        }
                      >
                        <SelectTrigger id={badgeId} className="w-full">
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
                      <FieldDescription>
                        Small badge text on the app card.
                      </FieldDescription>
                      <FieldError
                        errors={[{ message: fieldErrors.badgeLabel }]}
                      />
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel>Sort Order</FieldLabel>
                    <Input
                      type="number"
                      placeholder="Sort order"
                      value={String(draft.sortOrder)}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          sortOrder: Number(event.target.value || 0),
                        }))
                      }
                    />
                    <FieldDescription>Lower values appear first.</FieldDescription>
                    <FieldError errors={[{ message: fieldErrors.sortOrder }]} />
                  </Field>
                </FieldGroup>
              </ManagerFormSection>

              <ManagerFormSection title="Media">
                <FieldGroup>
                  <Field>
                    <ImageUpload
                      value={draft.imageId}
                      onChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          imageId: value,
                        }))
                      }
                      placeholder="Upload banner"
                      description="Drag or drop your files here or click to upload"
                    />
                    <FieldDescription>
                      Banner image for the app header. Recommended size 1200x400.
                    </FieldDescription>
                    <FieldError errors={[{ message: fieldErrors.imageId }]} />
                  </Field>
                </FieldGroup>
              </ManagerFormSection>

              <ManagerFormSection title="Thumbnail">
                <FieldGroup>
                  <Field>
                    <ImageUpload
                      value={draft.iconId}
                      onChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          iconId: value,
                        }))
                      }
                      placeholder="Drop Thumbnail here to upload"
                      description="Set the product thumbnail image. Only *.png, *.jpg and *.jpeg image files are accepted."
                    />
                    <FieldError errors={[{ message: fieldErrors.iconId }]} />
                  </Field>
                </FieldGroup>
              </ManagerFormSection>

              <ManagerFormSection title="Action">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor={linkTypeId}>Link Type</FieldLabel>
                    <Select
                      value={draft.linkType}
                      onValueChange={(value) =>
                        setDraft((current) => ({
                          ...current,
                          linkType: value as AppLinkType,
                        }))
                      }
                    >
                      <SelectTrigger id={linkTypeId} className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent align="start">
                        <SelectItem value="internal">internal</SelectItem>
                        <SelectItem value="external">external</SelectItem>
                        <SelectItem value="instruction">instruction</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      Determines how the CTA button behaves.
                    </FieldDescription>
                    <FieldError errors={[{ message: fieldErrors.linkType }]} />
                  </Field>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field>
                      <FieldLabel>CTA Label</FieldLabel>
                      <Input
                        placeholder="CTA label"
                        value={draft.ctaLabel}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            ctaLabel: event.target.value,
                          }))
                        }
                      />
                      <FieldDescription>Label for the action button.</FieldDescription>
                      <FieldError errors={[{ message: fieldErrors.ctaLabel }]} />
                    </Field>

                    <Field>
                      <FieldLabel>CTA Link</FieldLabel>
                      <Input
                        placeholder="CTA link"
                        value={draft.ctaLink}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            ctaLink: event.target.value,
                          }))
                        }
                      />
                      <FieldDescription>Target URL or path.</FieldDescription>
                      <FieldError errors={[{ message: fieldErrors.ctaLink }]} />
                    </Field>
                  </div>
                </FieldGroup>
              </ManagerFormSection>

              <ManagerFormSection title="Content">
                <FieldGroup>
                  <Field>
                    <FieldLabel>Description</FieldLabel>
                    <Input
                      placeholder="Description"
                      value={draft.description}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                    />
                    <FieldDescription>Short summary of the app.</FieldDescription>
                    <FieldError errors={[{ message: fieldErrors.description }]} />
                  </Field>

                  <Field>
                    <FieldLabel>Instructions</FieldLabel>
                    <textarea
                      placeholder="Instructions"
                      value={draft.instructions}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          instructions: event.target.value,
                        }))
                      }
                      className="min-h-28 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-xs focus:ring-1 focus:ring-brand focus:outline-none"
                    />
                    <FieldDescription>Detailed steps for using the app.</FieldDescription>
                    <FieldError errors={[{ message: fieldErrors.instructions }]} />
                  </Field>

                  <Field>
                    <FieldLabel>Tags</FieldLabel>
                    <TagInput
                      value={draft.tags}
                      onChange={(tags) =>
                        setDraft((current) => ({
                          ...current,
                          tags,
                        }))
                      }
                      placeholder="Add tags..."
                    />
                    <FieldDescription>Add tags for products.</FieldDescription>
                    <FieldError errors={[{ message: fieldErrors.tags }]} />
                  </Field>
                </FieldGroup>
              </ManagerFormSection>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              {Object.keys(fieldErrors).length > 0 ? (
                <div className="rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  <p className="font-medium">Please review these fields:</p>
                  <ul className="mt-1 list-disc pl-5">
                    {Object.entries(fieldErrors).map(([field, message]) => (
                      <li key={field}>
                        {field}: {message}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </ManagerForm>
          </div>
        </SheetContent>
      </Sheet>
    </ManagerShell>
  );
}
