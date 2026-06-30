"use client";

import { useCallback, useEffect, useMemo, useState, startTransition } from "react";
import { usePathname } from "next/navigation";
import { useToast } from "@/components/toast-provider";
import {
  getManageTools,
  getManageTool,
  createManageTool,
  updateManageTool,
  deleteManageTool,
  getManageToolParams,
  upsertManageToolParams,
  createManageToolScript,
} from "@/core/services/manage-tools.service";
import type {
  ManageToolApiItem,
  CreateToolPayload,
  UpdateToolPayload,
} from "@/core/interfaces/tool";
import type { ToolFormMode } from "./components/types";
import { resolvePromptPreview } from "./components/model-prompt-utils";

export function useManageTools() {
  const pathname = usePathname();
  const { pushToast } = useToast();

  // List state
  const [tools, setTools] = useState<ManageToolApiItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortFilter, setSortFilter] = useState("updated-desc");

  // CRUD state
  const [formMode, setFormMode] = useState<ToolFormMode | null>(null);
  const [editTarget, setEditTarget] = useState<ManageToolApiItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingEdit, setIsFetchingEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ManageToolApiItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [previewPrompt, setPreviewPrompt] = useState<{
    label: string;
    model?: string;
    prompt?: string;
    isLoading?: boolean;
  } | null>(null);
  const [paramsTarget, setParamsTarget] = useState<ManageToolApiItem | null>(null);
  const [scriptsTarget, setScriptsTarget] = useState<ManageToolApiItem | null>(null);

  const fetchTools = useCallback(async (silent = false) => {
    if (silent) setIsRefreshing(true); else setIsLoading(true);
    setLoadError(false);
    try {
      const data = await getManageTools();
      setTools(data);
      setLastUpdatedAt(new Date());
    } catch {
      setLoadError(true);
      pushToast("Failed to load tools.", "error");
    } finally {
      if (silent) setIsRefreshing(false); else setIsLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    startTransition(() => {
      void fetchTools();
    });
  }, [fetchTools]);

  const handleCreate = useCallback(async (payload: CreateToolPayload) => {
    setIsSubmitting(true);
    try {
      const created = await createManageTool(payload);
      
      // Inject default parameters for new tools
      await upsertManageToolParams(created.id, [
        {
          key: "outputFormat",
          label: "Output Format",
          type: "select",
          required: true,
          options: ["text/plain", "application/json"],
          defaultValue: "text/plain",
          sortOrder: 1,
        }
      ]);

      const fresh = await getManageTool(created.id);
      
      setTools((prev) => [fresh, ...prev]);
      setFormMode(null);
      pushToast(`"${fresh.name}" created.`, "success");
    } catch {
      pushToast("Failed to create tool.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }, [pushToast]);

  const handleUpdate = useCallback(async (id: string, payload: UpdateToolPayload) => {
    setIsSubmitting(true);
    try {
      const updated = await updateManageTool(id, payload);
      setTools((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setFormMode(null);
      setEditTarget(null);
      pushToast(`"${updated.name}" saved.`, "success");
    } catch {
      pushToast("Failed to update tool.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }, [pushToast]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const { id, name } = deleteTarget;
    setDeletingId(id);
    setDeleteTarget(null);
    const prev = tools;
    setTools((list) => list.filter((t) => t.id !== id));
    try {
      await deleteManageTool(id);
      pushToast(`"${name}" deleted.`, "success");
    } catch {
      setTools(prev);
      pushToast("Failed to delete tool.", "error");
    } finally {
      setDeletingId(null);
    }
  }, [deleteTarget, tools, pushToast]);

  const handleToggleActive = useCallback(async (tool: ManageToolApiItem) => {
    const next = !tool.isActive;
    // Optimistic update
    setTools((prev) => prev.map((t) => t.id === tool.id ? { ...t, isActive: next } : t));
    try {
      await updateManageTool(tool.id, { name: tool.name, isActive: next });
    } catch {
      // Rollback
      setTools((prev) => prev.map((t) => t.id === tool.id ? { ...t, isActive: tool.isActive } : t));
      pushToast(`Failed to ${next ? "activate" : "deactivate"} "${tool.name}".`, "error");
    }
  }, [pushToast]);

  const handleDuplicate = useCallback(async (tool: ManageToolApiItem) => {
    setDuplicatingId(tool.id);
    try {
      // Fetch fresh data to get all params + scripts
      const source = await getManageTool(tool.id);

      // Create new tool (inactive by default so user can review before activating)
      const newTool = await createManageTool({
        name: `Copy of ${source.name}`,
        description: source.description,
        isActive: false,
        sortOrder: source.sortOrder,
      });

      // Copy params (strip id/toolId so API assigns new ones)
      if (source.params?.length) {
        await upsertManageToolParams(
          newTool.id,
          source.params.map(({ key, label, type, required, sortOrder, defaultValue, placeholder, options, transform, config }) => ({
            key, label, type, required, sortOrder, defaultValue, placeholder, transform, config,
            options: options ? options.map(String) : null,
          })),
        );
      }

      // Copy scripts one by one (bulk PUT not supported for new tools)
      if (source.scripts?.length) {
        const sorted = [...source.scripts].sort((a, b) => a.sortOrder - b.sortOrder);
        for (const { plugin, config, label, description, sortOrder, creditCost } of sorted) {
          await createManageToolScript(newTool.id, { plugin, config, label, description, sortOrder, creditCost });
        }
      }

      // Refresh the new tool (now has params + scripts populated)
      const fresh = await getManageTool(newTool.id);
      setTools((prev) => [fresh, ...prev]);
      pushToast(`Duplicated as "${fresh.name}".`, "success");
    } catch {
      pushToast("Failed to duplicate tool.", "error");
    } finally {
      setDuplicatingId(null);
    }
  }, [pushToast]);

  const handleOpenEdit = useCallback(async (tool: ManageToolApiItem) => {
    setIsFetchingEdit(true);
    try {
      const fresh = await getManageTool(tool.id);
      setEditTarget(fresh);
      setFormMode("edit");
    } catch {
      setEditTarget(tool);
      setFormMode("edit");
      pushToast("Could not refresh tool data. Showing cached version.", "error");
    } finally {
      setIsFetchingEdit(false);
    }
  }, [pushToast]);

  const handlePreviewPrompt = useCallback(async (param: {
    toolId: string;
    id: string;
    key: string;
    label: string;
    config: Record<string, unknown> | null;
  }) => {
    setPreviewPrompt({
      label: param.label,
      isLoading: true,
    });
    try {
      const freshParams = await getManageToolParams(param.toolId);
      const matched = freshParams.find((p) => p.id === param.id || p.key === param.key);
      const target = matched || param;
      const { model, prompt } = resolvePromptPreview(target.config);
      setPreviewPrompt({
        label: target.label,
        model,
        prompt,
        isLoading: false,
      });
    } catch (err) {
      console.error("Failed to dynamically fetch parameters:", err);
      const { model, prompt } = resolvePromptPreview(param.config);
      setPreviewPrompt({
        label: param.label,
        model,
        prompt,
        isLoading: false,
      });
      pushToast("Failed to fetch fresh parameters. Showing cached version.", "error");
    }
  }, [pushToast]);

  const filteredTools = useMemo(() => {
    let result = tools;

    if (statusFilter === "active") {
      result = result.filter((t) => t.isActive);
    } else if (statusFilter === "inactive") {
      result = result.filter((t) => !t.isActive);
    }

    const term = search.trim().toLowerCase();
    if (term) {
      result = result.filter(
        (t) => t.name.toLowerCase().includes(term) || (t.description ?? "").toLowerCase().includes(term),
      );
    }

    if (sortFilter !== "default") {
      result = [...result].sort((a, b) => {
        if (sortFilter === "name-asc") {
          return a.name.localeCompare(b.name);
        } else if (sortFilter === "name-desc") {
          return b.name.localeCompare(a.name);
        } else if (sortFilter === "updated-desc") {
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        } else if (sortFilter === "updated-asc") {
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        } else if (sortFilter === "created-desc") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
      });
    }
    
    return result;
  }, [tools, search, statusFilter, sortFilter]);

  const emptyVariant = useMemo(() => {
    return (loadError ? "error" : tools.length === 0 ? "empty" : "no-results") as "error" | "empty" | "no-results";
  }, [loadError, tools]);

  // High-level stats calculation
  const stats = useMemo(() => {
    const total = tools.length;
    const active = tools.filter((t) => t.isActive).length;
    const totalParams = tools.reduce((sum, t) => sum + (t.params?.length || 0), 0);
    const totalScripts = tools.reduce((sum, t) => sum + (t.scripts?.length || 0), 0);

    return {
      total,
      active,
      totalParams,
      totalScripts,
    };
  }, [tools]);

  return {
    tools,
    isLoading,
    isRefreshing,
    loadError,
    lastUpdatedAt,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sortFilter,
    setSortFilter,
    formMode,
    setFormMode,
    editTarget,
    setEditTarget,
    isSubmitting,
    isFetchingEdit,
    deleteTarget,
    setDeleteTarget,
    deletingId,
    duplicatingId,
    previewPrompt,
    setPreviewPrompt,
    paramsTarget,
    setParamsTarget,
    scriptsTarget,
    setScriptsTarget,
    fetchTools,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleToggleActive,
    handleDuplicate,
    handleOpenEdit,
    handlePreviewPrompt,
    filteredTools,
    emptyVariant,
    stats,
    pathname,
  };
}
