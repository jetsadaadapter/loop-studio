"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  startTransition,
} from "react";
import { usePathname } from "next/navigation";
import { Search, Plus } from "lucide-react";

import { getLocalizedText, getManageRouteMeta } from "@/app/manage/config";
import { ManagerShell } from "@/components/manager-shell";
import { ManagerDeleteConfirm } from "@/components/manager-delete-confirm";
import { useToast } from "@/components/toast-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { ToolList, SummaryBar } from "./components/tool-list-grid";
import { ToolParamsDrawer } from "./components/tool-params-drawer";

// ── Main ───────────────────────────────────────────────────────────────────────

export function ManageToolsClient() {
  const pathname = usePathname();
  const { pushToast } = useToast();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // List state
  const [tools, setTools] = useState<ManageToolApiItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [searchInput, setSearchInput] = useState("");
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

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  function onSearchChange(value: string) {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setSearch(value); debounceRef.current = null; }, 220);
  }

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
      actions={
        <Button type="button" onClick={() => { setEditTarget(null); setFormMode("create"); }} className="gap-1.5">
          <Plus className="size-4" /> New Tool
        </Button>
      }
    >
      {/* Toolbar */}
      <div className="relative w-full sm:w-80">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input id="manage-tools-search" value={searchInput} onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tools…" className="bg-white pl-9" />
      </div>

      {/* Summary */}
      {!isLoading && (
        <SummaryBar total={tools.length} filtered={filteredTools.length} isRefreshing={isRefreshing}
          lastUpdatedAt={lastUpdatedAt} onRefresh={() => void fetchTools(true)} />
      )}

      {/* List */}
      {isLoading ? <ToolListSkeleton count={5} />
        : filteredTools.length === 0 ? <ToolListEmpty variant={emptyVariant} />
        : <ToolList
            tools={filteredTools}
            onEdit={(t) => void handleOpenEdit(t)}
            onDelete={(t) => setDeleteTarget(t)}
            onManageParams={(t) => setParamsTarget(t)}
            onPreviewPrompt={async (param) => {
              setPreviewPrompt({
                label: param.label,
                isLoading: true,
              });
              try {
                const freshParams = await getManageToolParams(param.toolId);
                const matched = freshParams.find((p) => p.id === param.id || p.key === param.key);
                if (matched) {
                  const config = matched.config || {};
                  const model = typeof config.model === "string" ? config.model : "gemini-1.5-flash";
                  const prompt = typeof config.prompt === "string" ? config.prompt : "";
                  setPreviewPrompt({
                    label: matched.label,
                    model,
                    prompt,
                    isLoading: false,
                  });
                } else {
                  const config = param.config || {};
                  const model = typeof config.model === "string" ? config.model : "gemini-1.5-flash";
                  const prompt = typeof config.prompt === "string" ? config.prompt : "";
                  setPreviewPrompt({
                    label: param.label,
                    model,
                    prompt,
                    isLoading: false,
                  });
                }
              } catch (err) {
                console.error("Failed to dynamically fetch parameters:", err);
                const config = param.config || {};
                const model = typeof config.model === "string" ? config.model : "gemini-1.5-flash";
                const prompt = typeof config.prompt === "string" ? config.prompt : "";
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
    </ManagerShell>
  );
}
