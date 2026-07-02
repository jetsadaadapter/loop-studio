"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { Plus, SlidersHorizontal } from "lucide-react";
import { ManageSearchInput } from "@/components/ui/manage-search-input";
import { ManageRefreshButton } from "@/components/ui/manage-refresh-button";
import { ManageFilterSelect } from "@/components/ui/manage-filter-select";
import { getLocalizedText, getManageRouteMeta } from "@/app/manage/config";
import { ManagerShell } from "@/components/manager-shell";
import { ModelCardGrid } from "./model-card-grid";
import { ManagerForm } from "@/components/manager-form";
import { ManagerPagination } from "@/components/manager-pagination";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ModelFormFields } from "./ModelFormFields";
import { ManagerDeleteConfirm } from "@/components/manager-delete-confirm";
import { Button } from "@/components/ui/button";
import { useManageAi } from "./use-manage-ai";
import { ModelStats } from "./ModelStats";

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
  const routeMeta = useMemo(() => getManageRouteMeta(pathname), [pathname]);
  const pageTitle = useMemo(() => getLocalizedText(routeMeta.title), [routeMeta]);
  const pageSubtitle = useMemo(() => getLocalizedText(routeMeta.subtitle), [routeMeta]);

  const {
    pagedModels,
    isLoading,
    isRefreshing,
    lastUpdatedString,
    loadError,
    searchInput,
    providerFilter,
    sortBy,
    currentPage,
    pageSize,
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
    handleToggleActive,
    mode,
    totalItems,
  } = useManageAi();

  return (
    <ManagerShell title={pageTitle} description={pageSubtitle} className="relative">
      {/* Stats Summary Cards */}
      <ModelStats stats={stats} isLoading={isLoading} />

      {/* Search and Filters Bar */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 mt-8 mb-6 select-none">
        {/* Left Group */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3 flex-1">
          <ManageSearchInput value={searchInput} onChange={onSearchChange} placeholder="Search model name, slug, or provider" />
          <div className="flex items-center gap-3 w-full xl:w-auto">
            <ManageFilterSelect label="Sort By" value={sortBy} options={[{ value: "sort-asc", label: "Sort: Low-High" }, { value: "newest", label: "Newest" }, { value: "name-asc", label: "Name: A-Z" }, { value: "name-desc", label: "Name: Z-A" }]} onChange={(v) => setSortBy(v ?? "sort-asc")} />
            <ManageFilterSelect label="Provider" value={providerFilter} options={providerOptions} onChange={(v) => setProviderFilter(v ?? "all")} />
            {hasActiveFilter && (
              <Button type="button" variant="ghost" size="icon" onClick={clearFilters} className="size-8 rounded-sm border border-slate-200 hover:bg-slate-50 cursor-pointer text-slate-500 shadow-3xs flex items-center justify-center shrink-0" title="Reset Filters">
                <SlidersHorizontal className="size-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 justify-between xl:justify-end shrink-0 select-none">
          {lastUpdatedString && <span className="text-[10px] font-medium text-slate-400">{lastUpdatedString}</span>}
          <ManageRefreshButton isLoading={isLoading} isRefreshing={isRefreshing} onRefresh={() => void loadModels({ silent: true })} title="Refresh Models" />
          <Button type="button" disabled={isSubmitting || settingDefaultId !== null || deletingId !== null} onClick={openCreateForm} className="h-8 bg-brand hover:bg-brand/90 text-white text-xs font-semibold px-4.5 rounded-sm flex items-center gap-1.5 cursor-pointer shadow-sm shadow-brand/10 transition-all select-none flex-1 xl:flex-none justify-center">
            {isSubmitting ? <span className="inline-flex items-center gap-1.5"><ButtonSpinner />Saving...</span> : <span className="flex items-center gap-1.5"><Plus className="size-4 shrink-0" />Add Model</span>}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <ModelCardGrid
          models={pagedModels}
          isLoading={isLoading}
          settingDefaultId={settingDefaultId}
          deletingId={deletingId}
          hasActiveFilter={hasActiveFilter}
          onEdit={handleEdit}
          onSetDefault={onSetDefault}
          onDelete={handleDeleteTrigger}
          onToggleActive={handleToggleActive}
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

      {deleteTarget && (
        <ManagerDeleteConfirm
          itemTypeLabel="model"
          itemName={deleteTarget.name}
          itemId={deleteTarget.id}
          isLoading={deletingId === deleteTarget.id}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void onDelete(deleteTarget)}
        />
      )}

      <Sheet open={!!mode} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <SheetContent side="right" className="max-w-xl w-full">
          <SheetHeader>
            <SheetTitle>{mode === "create" ? "Add Model" : "Edit Model"}</SheetTitle>
            {mode === "edit" && <SheetDescription>{selectedModel.name}</SheetDescription>}
          </SheetHeader>
          <ManagerForm
            hideHeader
            onSubmit={handleSubmit}
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
