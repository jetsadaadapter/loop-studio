"use client";

import { usePathname, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  startTransition,
} from "react";

import { getLocalizedText, getManageRouteMeta } from "@/app/manage/config";
import { ManagerShell } from "@/components/manager-shell";

import { ManagerModelTable } from "@/components/manager-model-table";
import { ManagerForm } from "@/components/manager-form";
import type { ManagerFormProps } from "@/components/manager-form/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ModelFormFields, validateModelForm } from "./ModelFormFields";
import { ManagerDeleteConfirm } from "@/components/manager-delete-confirm";
import { useDialogToast } from "@/components/ui/alert-dialog-toast";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import type {
  ManageAiModelApiItem,
  ManageAiModelPayload,
} from "@/core/interfaces/models.interface";
import {
  createManageAiModel,
  deleteManageAiModel,
  getManageAiModels,
  setDefaultManageAiModel,
  updateManageAiModel,
} from "@/core/services/models.service";
import { ApiError } from "@/core/services/api";

type ModelRecord = {
  id: string;
  modelSlug: string;
  name: string;
  provider: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type FormSubmitHandler = ManagerFormProps["onSubmit"];

type FormSubmitEvent = Parameters<FormSubmitHandler>[0];

const EMPTY_MODEL: ModelRecord = {
  id: "",
  modelSlug: "",
  name: "",
  provider: "google",
  isDefault: false,
  isActive: true,
  createdAt: "",
  updatedAt: "",
};

function mapApiModel(item: ManageAiModelApiItem): ModelRecord {
  return {
    id: item.id,
    modelSlug: item.modelSlug,
    name: item.name,
    provider: item.provider,
    isDefault: item.isDefault,
    isActive: item.isActive,
    createdAt: (item.createdAt || "").slice(0, 10),
    updatedAt: (item.updatedAt || "").slice(0, 10),
  };
}

function mapModelPayload(model: ModelRecord): ManageAiModelPayload {
  return {
    modelSlug: model.modelSlug.trim(),
    name: model.name.trim(),
    provider: model.provider,
    isActive: model.isActive,
    isDefault: model.isDefault,
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

export function ManageAiClient() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasHandledCreateQuery = useRef(false);
  const { pushDialogToast } = useDialogToast();
  const [models, setModels] = useState<ModelRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [lastUpdatedString, setLastUpdatedString] = useState<string>("");
  const lastUpdatedStringRef = useRef("");
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState("all");
  const [sortBy, setSortBy] = useState("sort-asc");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [draft, setDraft] = useState<ModelRecord>(EMPTY_MODEL);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ModelRecord | null>(null);

  const loadModels = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setLoadError("");
      try {
        const response = await getManageAiModels();
        setModels(response.map(mapApiModel));
        setLastUpdatedAt(new Date());
      } catch {
        setLoadError("Failed to load AI models.");
        pushDialogToast("Failed to load AI models.", "error");
      } finally {
        if (silent) {
          setIsRefreshing(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [pushDialogToast],
  );

  useEffect(() => {
    startTransition(() => {
      void loadModels();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Avoid hydration mismatch: format date string only on client
  useEffect(() => {
    let formatted = "Not updated yet";
    if (lastUpdatedAt) {
      formatted = `Updated ${lastUpdatedAt.toLocaleDateString()} ${lastUpdatedAt.toLocaleTimeString()}`;
    }
    if (lastUpdatedStringRef.current !== formatted) {
      setLastUpdatedString(formatted);
      lastUpdatedStringRef.current = formatted;
    }
    // Only update state if value actually changes to avoid cascading renders
  }, [lastUpdatedAt]);

  const selectedModel = useMemo(
    () => models.find((item) => item.id === selectedId) ?? draft,
    [models, selectedId, draft],
  );

  const pageTitle = useMemo(() => {
    return getLocalizedText(getManageRouteMeta(pathname).title);
  }, [pathname]);

  const visibleModels = useMemo(() => {
    const filtered = models
      .filter((item) =>
        `${item.name} ${item.modelSlug} ${item.provider}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
      .filter(
        (item) => providerFilter === "all" || item.provider === providerFilter,
      );

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "newest": {
          const timeA = new Date(a.createdAt).getTime() || 0;
          const timeB = new Date(b.createdAt).getTime() || 0;
          return timeB - timeA;
        }
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "sort-asc":
        default:
          return (a.modelSlug || a.id).localeCompare(b.modelSlug || b.id);
      }
    });
  }, [models, providerFilter, search, sortBy]);

  const providerOptions = useMemo(() => {
    const providers = Array.from(
      new Set(models.map((item) => item.provider).filter(Boolean)),
    ).sort((left, right) => left.localeCompare(right));

    return [
      { value: "all", label: "All" },
      ...providers.map((value) => ({ value, label: value })),
    ];
  }, [models]);

  const hasActiveFilter = search.trim() !== "" || providerFilter !== "all";

  function openCreateForm() {
    setMode("create");
    setDraft(EMPTY_MODEL);
    setSelectedId(null);
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
    setProviderFilter("all");
  }

  function resetForm() {
    setMode(null);
    setSelectedId(null);
    setDraft(EMPTY_MODEL);
    setError("");
    setFieldErrors({});
  }

  const onSubmit: FormSubmitHandler = (event) => {
    void handleSubmit(event);
  };

  async function handleSubmit(event: FormSubmitEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    const errors = validateModelForm(draft);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please review the highlighted fields.");
      setIsSubmitting(false);
      return;
    }

    setError("");
    setFieldErrors({});

    const payload = mapModelPayload(draft);
    const optimistic: ModelRecord = {
      ...draft,
      id: draft.id || `tmp-${Date.now()}`,
      createdAt: draft.createdAt || new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    if (mode === "edit") {
      const previous = models.find((item) => item.id === optimistic.id);
      setModels((current) =>
        current.map((item) => {
          if (item.id === optimistic.id) return optimistic;
          return optimistic.isDefault ? { ...item, isDefault: false } : item;
        }),
      );

      try {
        const updated = await updateManageAiModel(optimistic.id, payload);
        const updatedRecord = mapApiModel(updated);
        setModels((current) =>
          current.map((item) => {
            if (item.id === optimistic.id) return updatedRecord;
            return updatedRecord.isDefault ? { ...item, isDefault: false } : item;
          }),
        );
        pushDialogToast("AI model updated.", "success");
        resetForm();
      } catch (submitError) {
        if (previous) {
          setModels((current) =>
            current.map((item) => (item.id === previous.id ? previous : item)),
          );
        }
        setFieldErrors(parseApiFieldErrors(submitError));
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Failed to update model.",
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setModels((current) => {
      const base = [optimistic, ...current];
      if (!optimistic.isDefault) return base;
      return base.map((item) =>
        item.id === optimistic.id ? item : { ...item, isDefault: false },
      );
    });

    try {
      const created = await createManageAiModel(payload);
      const createdRecord = mapApiModel(created);
      setModels((current) => {
        const base = current.map((item) =>
          item.id === optimistic.id ? createdRecord : item,
        );
        if (!createdRecord.isDefault) return base;
        return base.map((item) =>
          item.id === createdRecord.id ? item : { ...item, isDefault: false },
        );
      });
      pushDialogToast("AI model created.", "success");
      resetForm();
    } catch (submitError) {
      setModels((current) =>
        current.filter((item) => item.id !== optimistic.id),
      );
      setFieldErrors(parseApiFieldErrors(submitError));
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to create model.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onSetDefault(modelId: string) {
    setSettingDefaultId(modelId);
    const previous = models;
    setModels((current) =>
      current.map((item) => ({
        ...item,
        isDefault: item.id === modelId,
      })),
    );

    try {
      const updated = await setDefaultManageAiModel(modelId);
      setModels((current) =>
        current.map((item) =>
          item.id === modelId
            ? { ...item, ...mapApiModel(updated), isDefault: true }
            : item,
        ),
      );
      pushDialogToast("Default model updated.", "success");
    } catch (error) {
      setModels(previous);
      pushDialogToast(
        error instanceof Error ? error.message : "Failed to set default model.",
        "error",
      );
    } finally {
      setSettingDefaultId(null);
    }
  }

  async function onDelete(target: ModelRecord) {
    setDeletingId(target.id);
    setDeleteTarget(null);
    const previous = models;
    setModels((current) => current.filter((item) => item.id !== target.id));

    try {
      await deleteManageAiModel(target.id);
      pushDialogToast("AI model deleted.", "success");
    } catch (deleteError) {
      setModels(previous);
      pushDialogToast(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete model.",
        "error",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <ManagerShell
      title={pageTitle}
      description="Model manager scaffold with one-click default assignment."
      actions={
        <Button
          type="button"
          disabled={
            isSubmitting || settingDefaultId !== null || deletingId !== null
          }
          onClick={openCreateForm}
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-1.5">
              <ButtonSpinner />
              Processing...
            </span>
          ) : (
            "Add Model"
          )}
        </Button>
      }
    >
      <div className="flex flex-col gap-3 border-b border-border/70 pb-4 md:gap-4 xl:flex-row xl:items-center xl:justify-between mb-4">
        <div className="flex min-w-0 items-center gap-3">
          <div>
            <p className="text-base font-semibold text-foreground">Filters</p>
            <p className="text-sm text-muted-foreground">
              {visibleModels.length} items found
            </p>
          </div>
        </div>
        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:w-auto xl:items-center xl:justify-end">
          {/* Search input */}
          <div className="relative w-full sm:col-span-2 xl:w-[320px]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-search pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            >
              <path d="m21 21-4.34-4.34"></path>
              <circle cx="11" cy="11" r="8"></circle>
            </svg>
            <input
              type="text"
              placeholder="Search model name, slug, or provider"
              className="h-8 w-full min-w-0 rounded-sm border border-input px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 bg-background pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {/* Refresh button */}
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={isLoading || isRefreshing}
            onClick={() => void loadModels({ silent: true })}
            className="h-8 gap-1.5 px-2.5 w-full border-brand/30 bg-brand/10 text-brand hover:bg-brand/15 hover:text-brand xl:w-auto rounded-sm"
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
          {/* Sort select (shadcn/ui) */}
          <div className="w-full xl:w-40">
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value ?? "sort-asc")}
            >
              <SelectTrigger className="w-full xl:w-40 h-8 rounded-sm border border-input bg-background px-2.5 py-1 text-sm">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sort-asc">Sort: Low-High</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="name-asc">Name: A-Z</SelectItem>
                <SelectItem value="name-desc">Name: Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Provider filter select (shadcn/ui) */}
          <div className="w-full xl:w-40">
            <Select
              value={providerFilter}
              onValueChange={(value) => setProviderFilter(value ?? "all")}
            >
              <SelectTrigger className="w-full xl:w-40 h-8 rounded-sm border border-input bg-background px-2.5 py-1 text-sm">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                {providerOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <span className="text-xs text-slate-500 mt-1 block">
        {lastUpdatedString}
      </span>

      <ManagerModelTable
        models={visibleModels}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
        settingDefaultId={settingDefaultId}
        deletingId={deletingId}
        loadError={!!loadError}
        hasActiveFilter={hasActiveFilter}
        hideCheckboxAll
        onEdit={(id) => {
          const row = visibleModels.find((m) => m.id === id);
          if (row) {
            setMode("edit");
            setSelectedId(row.id);
            setDraft(row);
          }
        }}
        onSetDefault={onSetDefault}
        onDelete={(id) => {
          const row = visibleModels.find((m) => m.id === id);
          if (row) setDeleteTarget(row);
        }}
        onRetry={() => void loadModels()}
        onAdd={openCreateForm}
        onClearFilters={clearFilters}
      />

      {deleteTarget ? (
        <ManagerDeleteConfirm
          itemTypeLabel="model"
          itemName={deleteTarget.name}
          itemId={deleteTarget.id}
          isLoading={deletingId === deleteTarget.id}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void onDelete(deleteTarget)}
        />
      ) : null}

      <Sheet
        open={!!mode}
        onOpenChange={(open) => {
          if (!open) resetForm();
        }}
      >
        <SheetContent side="right" className="max-w-xl w-full">
          <SheetHeader>
            <SheetTitle>
              {mode === "create" ? "Add Model" : "Edit Model"}
            </SheetTitle>
            {mode === "edit" && (
              <SheetDescription>{selectedModel.name}</SheetDescription>
            )}
          </SheetHeader>
          <ManagerForm
            hideHeader
            onSubmit={onSubmit}
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
            className="shadow-none border-0 p-0"
          >
            <ModelFormFields
              draft={draft}
              fieldErrors={fieldErrors}
              onChange={(field, value) =>
                setDraft((current) => ({ ...current, [field]: value }))
              }
            />
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </ManagerForm>
        </SheetContent>
      </Sheet>
    </ManagerShell>
  );
}
