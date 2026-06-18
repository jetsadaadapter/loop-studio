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

  // CRUD state
  const [formMode, setFormMode] = useState<ToolFormMode | null>(null);
  const [editTarget, setEditTarget] = useState<ManageToolApiItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingEdit, setIsFetchingEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ManageToolApiItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
      setTools((prev) => [created, ...prev]);
      setFormMode(null);
      pushToast(`"${created.name}" created.`, "success");
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
    const term = search.trim().toLowerCase();
    if (!term) return tools;
    return tools.filter(
      (t) => t.name.toLowerCase().includes(term) || (t.description ?? "").toLowerCase().includes(term),
    );
  }, [tools, search]);

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
    formMode,
    setFormMode,
    editTarget,
    setEditTarget,
    isSubmitting,
    isFetchingEdit,
    deleteTarget,
    setDeleteTarget,
    deletingId,
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
    handleOpenEdit,
    handlePreviewPrompt,
    filteredTools,
    emptyVariant,
    stats,
    pathname,
  };
}
