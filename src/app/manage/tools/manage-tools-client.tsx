"use client";

import { useMemo } from "react";
import { getLocalizedText, getManageRouteMeta } from "@/app/manage/config";
import { ManagerShell } from "@/components/manager-shell";
import { ManagerDeleteConfirm } from "@/components/manager-delete-confirm";
import { ToolListSkeleton } from "./components/tool-list-skeleton";
import { ToolListEmpty } from "./components/tool-list-empty";
import { ToolFormDrawer } from "./components/tool-form-drawer";
import { PromptPreviewDialog } from "./components/prompt-preview-dialog";
import { ToolList } from "./components/tool-list-grid";
import { ToolParamsDrawer } from "./components/tool-params-drawer";
import { ToolScriptsDrawer } from "./components/tool-scripts-drawer";
import { ToolSearchFilters } from "./components/tool-search-filters";
import { useManageTools } from "./use-manage-tools";
import { ToolStats } from "./components/ToolStats";

export function ManageToolsClient() {
  const {
    tools,
    isLoading,
    isRefreshing,
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
  } = useManageTools();

  const routeMeta = useMemo(() => getManageRouteMeta(pathname), [pathname]);
  const pageTitle = useMemo(() => getLocalizedText(routeMeta.title), [routeMeta]);
  const pageSubtitle = useMemo(() => getLocalizedText(routeMeta.subtitle), [routeMeta]);

  return (
    <ManagerShell title={pageTitle} description={pageSubtitle}>
      {/* Stats Summary Cards */}
      <ToolStats stats={stats} isLoading={isLoading} />

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
            <span>
              Found {filteredTools.length} matching {filteredTools.length === 1 ? "tool" : "tools"} (out
              of {tools.length})
            </span>
          )}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <ToolListSkeleton count={5} />
      ) : filteredTools.length === 0 ? (
        <ToolListEmpty variant={emptyVariant} />
      ) : (
        <ToolList
          tools={filteredTools}
          onEdit={(t) => void handleOpenEdit(t)}
          onDelete={(t) => setDeleteTarget(t)}
          onManageParams={(t) => setParamsTarget(t)}
          onManageScripts={(t) => setScriptsTarget(t)}
          onPreviewPrompt={handlePreviewPrompt}
        />
      )}

      <ToolFormDrawer
        mode={formMode}
        tool={editTarget}
        isSubmitting={isSubmitting || isFetchingEdit}
        onClose={() => {
          setFormMode(null);
          setEditTarget(null);
        }}
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
