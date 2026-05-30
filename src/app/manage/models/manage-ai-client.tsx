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
import { Search, RotateCw, Plus, SlidersHorizontal } from "lucide-react";
import { getLocalizedText, getManageRouteMeta } from "@/app/manage/config";
import { ManagerShell } from "@/components/manager-shell";

import { ManagerModelTable } from "@/components/manager-model-table";
import { ManagerForm } from "@/components/manager-form";
import { ManagerPagination } from "@/components/manager-pagination";
import type { ManagerFormProps } from "@/components/manager-form/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  ModelFormFields,
  validateModelForm,
  type ModelFormFieldsDraft,
} from "./ModelFormFields";
import { ManagerDeleteConfirm } from "@/components/manager-delete-confirm";
import { toast } from "sonner";
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
  getManageAiModelsResponse,
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
  const [models, setModels] = useState<ModelRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [lastUpdatedString, setLastUpdatedString] = useState<string>("");
  const lastUpdatedStringRef = useRef("");
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [providerFilter, setProviderFilter] = useState("all");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sortBy, setSortBy] = useState("sort-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12); // standard 12 as default
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [totalItems, setTotalItems] = useState(0);
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
        const response = await getManageAiModelsResponse(currentPage, pageSize);
        setModels((response.data ?? []).map(mapApiModel));
        setTotalItems(response.meta?.total ?? 0);
        setLastUpdatedAt(new Date());
      } catch {
        setLoadError("Failed to load AI models.");
        toast.error("Failed to load AI models.");
      } finally {
        if (silent) {
          setIsRefreshing(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [currentPage, pageSize],
  );

  useEffect(() => {
    startTransition(() => {
      void loadModels();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize]);

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

  const routeMeta = useMemo(() => getManageRouteMeta(pathname), [pathname]);
  const pageTitle = useMemo(() => getLocalizedText(routeMeta.title), [routeMeta]);
  const pageSubtitle = useMemo(() => getLocalizedText(routeMeta.subtitle), [routeMeta]);

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

  // Reset page when filters or pageSize change
  useEffect(() => {
    startTransition(() => {
      setCurrentPage(1);
    });
  }, [search, providerFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const pagedModels = visibleModels;

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
    setSearchInput("");
    setProviderFilter("all");
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
  }

  function onSearchChange(value: string) {
    setSearchInput(value);
    setSearch(value);
  }

  function resetForm() {
    setMode(null);
    setSelectedId(null);
    setDraft(EMPTY_MODEL);
    setError("");
    setFieldErrors({});
  }

  const handleDraftChange = <K extends keyof ModelFormFieldsDraft>(
    field: K,
    value: ModelFormFieldsDraft[K],
  ) => {
    setDraft((current) => ({ ...current, [field]: value }));
    if (fieldErrors[field as string]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field as string];
        return next;
      });
    }
  };

  const onSubmit: FormSubmitHandler = (event) => {
    void handleSubmit(event);
  };

  async function handleSubmit(event: FormSubmitEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    const errors = validateModelForm(draft);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
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

      const updatePromise = async () => {
        try {
          const updated = await updateManageAiModel(optimistic.id, payload);
          const updatedRecord = mapApiModel(updated);
          setModels((current) =>
            current.map((item) => {
              if (item.id === optimistic.id) return updatedRecord;
              return updatedRecord.isDefault ? { ...item, isDefault: false } : item;
            }),
          );
          resetForm();
          return updated;
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
          throw submitError;
        } finally {
          setIsSubmitting(false);
        }
      };

      toast.promise(updatePromise(), {
        loading: "Updating AI model...",
        success: "AI model updated.",
        error: "Failed to update AI model.",
      });

      return;
    }

    setModels((current) => {
      const base = [optimistic, ...current];
      if (!optimistic.isDefault) return base;
      return base.map((item) =>
        item.id === optimistic.id ? item : { ...item, isDefault: false },
      );
    });

    const createPromise = async () => {
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
        resetForm();
        return created;
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
        throw submitError;
      } finally {
        setIsSubmitting(false);
      }
    };

    toast.promise(createPromise(), {
      loading: "Creating AI model...",
      success: "AI model created.",
      error: "Failed to create AI model.",
    });
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

    const setDefaultPromise = async () => {
      try {
        const updated = await setDefaultManageAiModel(modelId);
        setModels((current) =>
          current.map((item) =>
            item.id === modelId
              ? { ...item, ...mapApiModel(updated), isDefault: true }
              : item,
          ),
        );
        return updated;
      } catch (error) {
        setModels(previous);
        throw error;
      } finally {
        setSettingDefaultId(null);
      }
    };

    toast.promise(setDefaultPromise(), {
      loading: "Updating default model...",
      success: "Default model updated.",
      error: (err) => err instanceof Error ? err.message : "Failed to set default model.",
    });
  }

  async function onDelete(target: ModelRecord) {
    setDeletingId(target.id);
    setDeleteTarget(null);
    const previous = models;
    setModels((current) => current.filter((item) => item.id !== target.id));

    const deletePromise = async () => {
      try {
        await deleteManageAiModel(target.id);
        return true;
      } catch (deleteError) {
        setModels(previous);
        throw deleteError;
      } finally {
        setDeletingId(null);
      }
    };

    toast.promise(deletePromise(), {
      loading: "Deleting AI model...",
      success: "AI model deleted.",
      error: (err) => err instanceof Error ? err.message : "Failed to delete model.",
    });
  }

  return (
    <ManagerShell
      title={pageTitle}
      description={pageSubtitle}
      actions={null}
    >
      {/* Search and Filters Bar */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 mb-6 select-none">
        {/* Left Group */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative w-full xl:w-80 shrink-0">
            <Search className="absolute left-3 top-2 size-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search model name, slug, or provider"
              className="h-8 w-full rounded-sm border border-slate-200 bg-white pl-9.5 pr-3 text-xs shadow-3xs transition-colors outline-none focus-visible:ring-3 focus-visible:ring-brand/5 placeholder:text-slate-400"
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* Select Filters Wrapper */}
          <div className="flex items-center gap-3 w-full xl:w-auto">
            {/* Sort Select */}
            <div className="flex items-center gap-2 flex-1 xl:flex-initial">
              <span className="text-xs font-semibold text-slate-500 shrink-0">Sort By</span>
              <div className="flex-1 xl:w-40">
                <Select
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value ?? "sort-asc")}
                >
                  <SelectTrigger className="h-8 rounded-sm border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 w-full shadow-3xs flex items-center justify-between cursor-pointer">
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
            </div>

            {/* Provider Filter Select */}
            <div className="flex items-center gap-2 flex-1 xl:flex-initial">
              <span className="text-xs font-semibold text-slate-500 shrink-0">Provider</span>
              <div className="flex-1 xl:w-40">
                <Select
                  value={providerFilter}
                  onValueChange={(value) => setProviderFilter(value ?? "all")}
                >
                  <SelectTrigger className="h-8 rounded-sm border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 w-full shadow-3xs flex items-center justify-between cursor-pointer">
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

            {/* Reset Filter Icon Button */}
            {(searchInput || providerFilter !== "all") && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={clearFilters}
                className="size-8 rounded-sm border border-slate-200 hover:bg-slate-50 cursor-pointer text-slate-500 shadow-3xs flex items-center justify-center shrink-0"
                title="Reset Filters"
              >
                <SlidersHorizontal className="size-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Right Group */}
        <div className="flex items-center gap-3 justify-between xl:justify-end shrink-0 select-none">
          {/* Last updated timestamp and refresh button */}
          <div className="flex items-center gap-2">
            {lastUpdatedString && (
              <span className="text-[10px] font-medium text-slate-400">
                {lastUpdatedString}
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={isLoading || isRefreshing}
              onClick={() => void loadModels({ silent: true })}
              className="size-8 border-slate-200 bg-white hover:bg-slate-50 cursor-pointer shadow-3xs flex items-center justify-center shrink-0"
              title="Refresh Models"
            >
              <RotateCw className={`size-3.5 text-slate-500 ${isRefreshing ? "animate-spin text-brand" : ""}`} />
            </Button>
          </div>

          <Button
            type="button"
            disabled={
              isSubmitting || settingDefaultId !== null || deletingId !== null
            }
            onClick={openCreateForm}
            className="h-8 bg-brand hover:bg-brand/90 text-white text-xs font-semibold px-4.5 rounded-sm flex items-center gap-1.5 cursor-pointer shadow-sm shadow-brand/10 transition-all select-none flex-1 xl:flex-none justify-center"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-1.5">
                <ButtonSpinner />
                Saving...
              </span>
            ) : (
              <>
                <Plus className="size-4 shrink-0" />
                Add Model
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <ManagerModelTable
          models={isLoading ? [] : pagedModels}
          isLoading={isLoading}
          isSubmitting={isSubmitting}
          settingDefaultId={settingDefaultId}
          deletingId={deletingId}
          loadError={!!loadError}
          hasActiveFilter={hasActiveFilter}
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

        {/* Premium Custom Pagination Footer */}
        {!isLoading && (
          <ManagerPagination
            currentPage={safeCurrentPage}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>

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
              onChange={handleDraftChange}
            />
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </ManagerForm>
        </SheetContent>
      </Sheet>
    </ManagerShell>
  );
}
