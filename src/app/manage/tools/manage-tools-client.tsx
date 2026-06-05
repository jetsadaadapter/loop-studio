"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  startTransition,
} from "react";
import { usePathname } from "next/navigation";

import { getLocalizedText, getManageRouteMeta } from "@/app/manage/config";
import { ManagerShell } from "@/components/manager-shell";
import { ManagerDeleteConfirm } from "@/components/manager-delete-confirm";
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

import { ToolListSkeleton } from "./components/tool-list-skeleton";
import { ToolListEmpty } from "./components/tool-list-empty";
import { ToolFormDrawer } from "./components/tool-form-drawer";
import type { ToolFormMode } from "./components/types";
import { PromptPreviewDialog } from "./components/prompt-preview-dialog";
import { ToolList } from "./components/tool-list-grid";
import { ToolParamsDrawer } from "./components/tool-params-drawer";
import { ToolScriptsDrawer } from "./components/tool-scripts-drawer";
import { ToolSearchFilters } from "./components/tool-search-filters";
import { resolvePromptPreview } from "./components/model-prompt-utils";


// ── Main ───────────────────────────────────────────────────────────────────────

export function ManageToolsClient() {
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
    startTransition(() => { void fetchTools(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  // ── CRUD handlers ────────────────────────────────────────────────────────────

  async function handleCreate(payload: CreateToolPayload) {
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
  }

  async function handleUpdate(id: string, payload: UpdateToolPayload) {
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
  }

  async function handleDelete() {
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
  }

  async function handleOpenEdit(tool: ManageToolApiItem) {
    setIsFetchingEdit(true);
    try {
      const fresh = await getManageTool(tool.id);
      setEditTarget(fresh);
      setFormMode("edit"); // open drawer only after fresh data is ready
    } catch {
      // fallback: open with cached data if fetch fails
      setEditTarget(tool);
      setFormMode("edit");
      pushToast("Could not refresh tool data. Showing cached version.", "error");
    } finally {
      setIsFetchingEdit(false);
    }
  }

  // ── Derived ──────────────────────────────────────────────────────────────────

  const filteredTools = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return tools;
    return tools.filter(
      (t) => t.name.toLowerCase().includes(term) || (t.description ?? "").toLowerCase().includes(term),
    );
  }, [tools, search]);

  const routeMeta = useMemo(() => getManageRouteMeta(pathname), [pathname]);
  const pageTitle = useMemo(() => getLocalizedText(routeMeta.title), [routeMeta]);
  const pageSubtitle = useMemo(() => getLocalizedText(routeMeta.subtitle), [routeMeta]);
  const emptyVariant = loadError ? "error" : tools.length === 0 ? "empty" : "no-results";

  return (
    <ManagerShell
      title={pageTitle}
      description={pageSubtitle}
      actions={null}
    >
      <ToolSearchFilters
        search={search}
        onSearchChange={setSearch}
        lastUpdatedAt={lastUpdatedAt}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onRefresh={() => void fetchTools(true)}
        onCreateTool={() => {
          setEditTarget(null);
          setFormMode("create");
        }}
      />


      {/* Summary */}
      {!isLoading && (
        <div className="text-xs font-semibold text-slate-500 mb-4 select-none">
          {filteredTools.length === tools.length ? (
            <span>Showing {tools.length} {tools.length === 1 ? "tool" : "tools"}</span>
          ) : (
            <span>Found {filteredTools.length} matching {filteredTools.length === 1 ? "tool" : "tools"} (out of {tools.length})</span>
          )}
        </div>
      )}

      {/* List */}
      {isLoading ? <ToolListSkeleton count={5} />
        : filteredTools.length === 0 ? <ToolListEmpty variant={emptyVariant} />
        : <ToolList
            tools={filteredTools}
            onEdit={(t) => void handleOpenEdit(t)}
            onDelete={(t) => setDeleteTarget(t)}
            onManageParams={(t) => setParamsTarget(t)}
            onManageScripts={(t) => setScriptsTarget(t)}
            onPreviewPrompt={async (param) => {
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
            }}
          />}

      <ToolFormDrawer
        mode={formMode}
        tool={editTarget}
        isSubmitting={isSubmitting || isFetchingEdit}
        onClose={() => { setFormMode(null); setEditTarget(null); }}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />

      {/* Delete confirm */}
      {deleteTarget && (
        <ManagerDeleteConfirm
          itemName={deleteTarget.name}
          itemId={deleteTarget.id}
          itemTypeLabel="tool"
          isLoading={deletingId === deleteTarget.id}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void handleDelete()}
        />
      )}

      {/* Prompt Preview Dialog */}
      <PromptPreviewDialog
        open={previewPrompt !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewPrompt(null);
        }}
        label={previewPrompt?.label || ""}
        model={previewPrompt?.model}
        prompt={previewPrompt?.prompt}
        isLoading={previewPrompt?.isLoading}
      />

      {/* Tool Parameters Sheet Drawer */}
      <ToolParamsDrawer
        tool={paramsTarget}
        onClose={() => setParamsTarget(null)}
        onSaveSuccess={fetchTools}
      />

      {/* Tool Scripts Sheet Drawer */}
      <ToolScriptsDrawer
        tool={scriptsTarget}
        onClose={() => setScriptsTarget(null)}
        onSaveSuccess={fetchTools}
      />
    </ManagerShell>
  );
}
