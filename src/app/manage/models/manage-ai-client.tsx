"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { Search, RotateCw, Plus, SlidersHorizontal } from "lucide-react";
import { getLocalizedText, getManageRouteMeta } from "@/app/manage/config";
import { ManagerShell } from "@/components/manager-shell";
import { ManagerModelTable } from "@/components/manager-model-table";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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
                <Select value={sortBy} onValueChange={(value) => setSortBy(value ?? "sort-asc")}>
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
            {hasActiveFilter && (
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
              <RotateCw
                className={`size-3.5 text-slate-500 ${isRefreshing ? "animate-spin text-brand" : ""}`}
              />
            </Button>
          </div>

          <Button
            type="button"
            disabled={isSubmitting || settingDefaultId !== null || deletingId !== null}
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
          onEdit={handleEdit}
          onSetDefault={onSetDefault}
          onDelete={handleDeleteTrigger}
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
