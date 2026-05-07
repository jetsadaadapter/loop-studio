"use client";

import { usePathname, useSearchParams } from "next/navigation";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  startTransition,
} from "react";

import { getLocalizedText, getManageRouteMeta } from "@/app/manage/config";
import { ManagerShell } from "@/components/manager-shell";
import { ManagerToolbar } from "@/components/manager-toolbar";
import { ManagerDataTable } from "@/components/manager-data-table";
import { ManagerForm } from "@/components/manager-form";
import { ManagerFormSection } from "@/components/manager-form-section";
import { ManagerDeleteConfirm } from "@/components/manager-delete-confirm";
import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type {
  ManageAiModelApiItem,
  ManageAiModelPayload,
} from "@/core/interfaces/library.interface";
import {
  ApiError,
  createManageAiModel,
  deleteManageAiModel,
  getManageAiModels,
  setDefaultManageAiModel,
  updateManageAiModel,
} from "@/core/services/library.service";

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
  const { pushToast } = useToast();
  const [models, setModels] = useState<ModelRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState("all");
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
        pushToast("Failed to load AI models.", "error");
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
      void loadModels();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedModel = useMemo(
    () => models.find((item) => item.id === selectedId) ?? draft,
    [models, selectedId],
  );

  const pageTitle = useMemo(() => {
    return getLocalizedText(getManageRouteMeta(pathname).title);
  }, [pathname]);

  const visibleModels = useMemo(() => {
    return models
      .filter((item) =>
        `${item.name} ${item.modelSlug} ${item.provider}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
      .filter(
        (item) => providerFilter === "all" || item.provider === providerFilter,
      );
  }, [models, providerFilter, search]);

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

  function validateModel(value: ModelRecord): string {
    if (!value.modelSlug.trim()) return "Model slug is required.";
    if (!value.name.trim()) return "Name is required.";
    if (!value.provider.trim()) return "Provider is required.";
    return "";
  }

  function getInputError(field: string): string | null {
    return fieldErrors[field] ?? null;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const validationError = validateModel(draft);
    if (validationError) {
      setError(validationError);
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
        current.map((item) => (item.id === optimistic.id ? optimistic : item)),
      );

      try {
        const updated = await updateManageAiModel(optimistic.id, payload);
        setModels((current) =>
          current.map((item) =>
            item.id === optimistic.id ? mapApiModel(updated) : item,
          ),
        );
        pushToast("AI model updated.", "success");
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

    setModels((current) => [optimistic, ...current]);
    try {
      const created = await createManageAiModel(payload);
      setModels((current) =>
        current.map((item) =>
          item.id === optimistic.id ? mapApiModel(created) : item,
        ),
      );
      pushToast("AI model created.", "success");
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
      pushToast("Default model updated.", "success");
    } catch (error) {
      setModels(previous);
      pushToast(
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
      pushToast("AI model deleted.", "success");
    } catch (deleteError) {
      setModels(previous);
      pushToast(
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
      <ManagerToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, slug, provider"
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
              onClick={() => void loadModels({ silent: true })}
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
            key: "provider",
            label: "Provider",
            value: providerFilter,
            onChange: setProviderFilter,
            options: providerOptions,
          },
        ]}
      />

      <ManagerDataTable
        rows={visibleModels}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        emptyText={isLoading ? "Loading models..." : "No models found"}
        columns={[
          { key: "name", header: "Name", render: (row) => row.name },
          {
            key: "modelSlug",
            header: "Slug",
            render: (row) => (
              <span className="font-mono text-xs text-slate-600">
                {row.modelSlug || "-"}
              </span>
            ),
          },
          {
            key: "provider",
            header: "Provider",
            render: (row) => row.provider,
          },
          {
            key: "createdAt",
            header: "Created",
            render: (row) => row.createdAt || "-",
          },
          {
            key: "updatedAt",
            header: "Updated",
            render: (row) => row.updatedAt || "-",
          },
          {
            key: "default",
            header: "Default",
            render: (row) =>
              row.isDefault ? <Badge variant="secondary">Default</Badge> : "-",
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (row.isActive ? "Active" : "Inactive"),
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
                  disabled={
                    isSubmitting ||
                    settingDefaultId !== null ||
                    deletingId !== null
                  }
                  onClick={() => {
                    setMode("edit");
                    setSelectedId(row.id);
                    setDraft(row);
                  }}
                >
                  Edit
                </Button>
                {row.isDefault ? null : (
                  <Button
                    type="button"
                    size="sm"
                    disabled={
                      isSubmitting ||
                      settingDefaultId !== null ||
                      deletingId !== null
                    }
                    onClick={() => void onSetDefault(row.id)}
                  >
                    {settingDefaultId === row.id ? (
                      <span className="inline-flex items-center gap-1.5">
                        <ButtonSpinner />
                        Setting...
                      </span>
                    ) : (
                      "Set Default"
                    )}
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={
                    isSubmitting ||
                    settingDefaultId !== null ||
                    deletingId !== null
                  }
                  onClick={() => setDeleteTarget(row)}
                >
                  {deletingId === row.id ? "Deleting..." : "Delete"}
                </Button>
              </div>
            ),
          },
        ]}
        emptyState={
          isLoading ? null : (
            <div className="flex flex-col items-center gap-3 py-2">
              <p className="text-sm text-slate-500">
                {loadError
                  ? "Unable to load AI models right now."
                  : models.length === 0
                    ? "No AI models configured yet. Add one to begin testing and assignment."
                    : "No results for the current search or provider filter."}
              </p>
              <div className="flex gap-2">
                {loadError ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void loadModels()}
                  >
                    Retry
                  </Button>
                ) : models.length === 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={
                      isSubmitting ||
                      settingDefaultId !== null ||
                      deletingId !== null
                    }
                    onClick={openCreateForm}
                  >
                    Add Model
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
          itemTypeLabel="model"
          itemName={deleteTarget.name}
          itemId={deleteTarget.id}
          isLoading={deletingId === deleteTarget.id}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void onDelete(deleteTarget)}
        />
      ) : null}

      {mode ? (
        <ManagerForm
          title={
            mode === "create"
              ? "Add AI Model"
              : `Edit Model: ${selectedModel.name}`
          }
          description="AI model manager backed by /manage/models APIs"
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
        >
          <ManagerFormSection title="Model">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1">
                <Input
                  placeholder="Model Slug"
                  value={draft.modelSlug}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      modelSlug: event.target.value,
                    }))
                  }
                />
                {getInputError("modelSlug") ? (
                  <p className="text-xs text-red-600">
                    {getInputError("modelSlug")}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-1">
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
                {getInputError("name") ? (
                  <p className="text-xs text-red-600">
                    {getInputError("name")}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-1">
                <Input
                  placeholder="Provider"
                  value={draft.provider}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      provider: event.target.value,
                    }))
                  }
                />
                {getInputError("provider") ? (
                  <p className="text-xs text-red-600">
                    {getInputError("provider")}
                  </p>
                ) : null}
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={draft.isActive}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      isActive: event.target.checked,
                    }))
                  }
                />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={draft.isDefault}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      isDefault: event.target.checked,
                    }))
                  }
                />
                Default
              </label>
            </div>
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
      ) : null}
    </ManagerShell>
  );
}
