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
import { toast } from "sonner";
import { ApiError } from "@/core/services/api";
import {
  createManageAiModel,
  deleteManageAiModel,
  getManageAiModelsResponse,
  setDefaultManageAiModel,
  updateManageAiModel,
} from "@/core/services/models.service";
import type {
  ManageAiModelApiItem,
  ManageAiModelPayload,
} from "@/core/interfaces/models.interface";
import {
  validateModelForm,
  type ModelFormFieldsDraft,
} from "./ModelFormFields";

export type ModelRecord = {
  id: string;
  modelSlug: string;
  name: string;
  provider: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export const EMPTY_MODEL: ModelRecord = {
  id: "",
  modelSlug: "",
  name: "",
  provider: "google",
  isDefault: false,
  isActive: true,
  createdAt: "",
  updatedAt: "",
};

export function mapApiModel(item: ManageAiModelApiItem): ModelRecord {
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

export function mapModelPayload(model: ModelRecord): ManageAiModelPayload {
  return {
    modelSlug: model.modelSlug.trim(),
    name: model.name.trim(),
    provider: model.provider,
    isActive: model.isActive,
    isDefault: model.isDefault,
  };
}

export function parseApiFieldErrors(error: unknown): Record<string, string> {
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

export function useManageAi() {
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
  const [pageSize, setPageSize] = useState(12);
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
  }, [currentPage, pageSize, loadModels]);

  useEffect(() => {
    let formatted = "Not updated yet";
    if (lastUpdatedAt) {
      formatted = `Updated ${lastUpdatedAt.toLocaleDateString()} ${lastUpdatedAt.toLocaleTimeString()}`;
    }
    if (lastUpdatedStringRef.current !== formatted) {
      setLastUpdatedString(formatted);
      lastUpdatedStringRef.current = formatted;
    }
  }, [lastUpdatedAt]);

  const selectedModel = useMemo(
    () => models.find((item) => item.id === selectedId) ?? draft,
    [models, selectedId, draft],
  );

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

  useEffect(() => {
    startTransition(() => {
      setCurrentPage(1);
    });
  }, [search, providerFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const pagedModels = visibleModels;

  const openCreateForm = useCallback(() => {
    setMode("create");
    setDraft(EMPTY_MODEL);
    setSelectedId(null);
    setError("");
    setFieldErrors({});
  }, []);

  useEffect(() => {
    if (hasHandledCreateQuery.current) return;
    if (searchParams.get("action") !== "create") return;
    hasHandledCreateQuery.current = true;
    startTransition(() => {
      openCreateForm();
    });
  }, [searchParams, openCreateForm]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setSearchInput("");
    setProviderFilter("all");
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
  }, []);

  const onSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    setSearch(value);
  }, []);

  const resetForm = useCallback(() => {
    setMode(null);
    setSelectedId(null);
    setDraft(EMPTY_MODEL);
    setError("");
    setFieldErrors({});
  }, []);

  const handleDraftChange = useCallback(<K extends keyof ModelFormFieldsDraft>(
    field: K,
    value: ModelFormFieldsDraft[K],
  ) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setFieldErrors((prev) => {
      if (!prev[field as string]) return prev;
      const next = { ...prev };
      delete next[field as string];
      return next;
    });
  }, []);

  const handleEdit = useCallback((id: string) => {
    setModels((current) => {
      const row = current.find((m) => m.id === id);
      if (row) {
        setMode("edit");
        setSelectedId(row.id);
        setDraft(row);
      }
      return current;
    });
  }, []);

  const handleDeleteTrigger = useCallback((id: string) => {
    setModels((current) => {
      const row = current.find((m) => m.id === id);
      if (row) setDeleteTarget(row);
      return current;
    });
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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
      } catch (err) {
        setModels(previous);
        throw err;
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

  // Calculate high-level stats for the premium stats overview cards
  const stats = useMemo(() => {
    const total = models.length;
    const active = models.filter((m) => m.isActive).length;
    
    let geminiCount = 0;
    let othersCount = 0;
    
    models.forEach((m) => {
      const prov = m.provider.toLowerCase();
      const name = m.name.toLowerCase();
      const slug = m.modelSlug.toLowerCase();
      
      const isGemini = prov.includes("google") || prov.includes("gemini") || name.includes("gemini") || slug.includes("gemini");
      if (isGemini) {
        geminiCount++;
      } else {
        othersCount++;
      }
    });

    return { total, active, geminiCount, othersCount };
  }, [models]);

  return {
    models,
    pagedModels,
    isLoading,
    isRefreshing,
    lastUpdatedString,
    loadError,
    search,
    searchInput,
    providerFilter,
    sortBy,
    currentPage,
    pageSize,
    selectedId,
    mode,
    totalItems,
    draft,
    error,
    fieldErrors,
    isSubmitting,
    settingDefaultId,
    deletingId,
    deleteTarget,
    selectedModel,
    providerOptions,
    hasActiveFilter,
    safeCurrentPage,
    stats,
    loadModels,
    openCreateForm,
    clearFilters,
    onSearchChange,
    resetForm,
    handleDraftChange,
    handleSubmit,
    onSetDefault,
    onDelete,
    setSortBy,
    setProviderFilter,
    setCurrentPage,
    setPageSize,
    setDeleteTarget,
    handleEdit,
    handleDeleteTrigger,
    pathname,
  };
}
