"use client";

import { useCallback, useEffect, useMemo, useState, startTransition } from "react";
import { Search, RotateCw, Plus, SlidersHorizontal, KeyRound, Copy, Check, Eye, EyeOff, BookOpen } from "lucide-react";
import { ManagerShell } from "@/components/manager-shell";
import { ManagerKeyTable, type ApiKeyRecord } from "@/components/manager-key-table";
import { ManagerForm } from "@/components/manager-form";
import { ManagerPagination } from "@/components/manager-pagination";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { KeyFormFields, validateApiKeyForm, type ApiKeyFormFieldsDraft } from "./KeyFormFields";
import { ManagerDeleteConfirm } from "@/components/manager-delete-confirm";
import { InstructionPreviewDialog } from "./instruction-preview-dialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  getManageApiKeysResponse,
  createManageApiKey,
  updateManageApiKey,
  deleteManageApiKey,
} from "@/core/services/keys.service";

const EMPTY_KEY: ApiKeyFormFieldsDraft = {
  id: "",
  appId: "",
  name: "",
  webhookUrl: "",
  isActive: true,
};

export function ManageKeysClient() {
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [draft, setDraft] = useState<ApiKeyFormFieldsDraft>(EMPTY_KEY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiKeyRecord | null>(null);
  const [createdRawKey, setCreatedRawKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const loadKeys = useCallback(async (options?: { silent?: boolean }) => {
    if (options?.silent) setIsRefreshing(true);
    else setIsLoading(true);
    setLoadError("");
    try {
      const response = await getManageApiKeysResponse(currentPage, pageSize);
      const data = Array.isArray(response.data)
        ? response.data
        : response.data
        ? [response.data as unknown as ApiKeyRecord]
        : [];
      setKeys(data);
      setTotalItems(response.meta?.total ?? data.length);
    } catch {
      setLoadError("Failed to load data.");
      toast.error("Failed to load API keys.");
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    startTransition(() => {
      void loadKeys();
    });
  }, [loadKeys]);

  const pageTitle = "API Keys Management";
  const pageSubtitle = "Manage access tokens and App Webhook notifications";

  const visibleKeys = useMemo(() => {
    const safeKeys = Array.isArray(keys) ? keys : [];
    let filtered = safeKeys.filter(item =>
      item && `${item.name || ""} ${item.appId || ""} ${item.webhookUrl || ""}`.toLowerCase().includes(search.toLowerCase())
    );
    if (statusFilter !== "all") {
      const activeVal = statusFilter === "active";
      filtered = filtered.filter(item => item.isActive === activeVal);
    }

    return [...filtered].sort((a, b) => {
      if (sortBy === "name-asc") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "name-desc") return (b.name || "").localeCompare(a.name || "");
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [keys, search, statusFilter, sortBy]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  const handleDraftChange = (field: keyof ApiKeyFormFieldsDraft, value: string | boolean | string[]) => {
    setDraft(current => ({ ...current, [field]: value }));
    if (fieldErrors[field as string]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[field as string];
        return next;
      });
    }
  };

  const handleToggleStatus = async (appId: string) => {
    const target = keys.find(k => k.appId === appId);
    if (!target) return;
    const nextActive = !target.isActive;
    
    try {
      await updateManageApiKey(appId, { isActive: nextActive });
      setKeys(current => current.map(k => k.appId === appId ? { ...k, isActive: nextActive } : k));
      toast.success(`API key ${nextActive ? "activated" : "deactivated"}.`);
    } catch {
      toast.error("Failed to toggle status.");
    }
  };

  const handleDelete = async (target: ApiKeyRecord) => {
    setDeletingId(target.appId);
    setDeleteTarget(null);
    try {
      await deleteManageApiKey(target.appId);
      setKeys(current => current.filter(k => k.appId !== target.appId));
      toast.success("API key deleted.");
    } catch {
      toast.error("Failed to delete API key.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const errors = validateApiKeyForm(draft);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "edit") {
        const updatedResult = await updateManageApiKey(draft.appId, {
          name: draft.name,
          webhookUrl: draft.webhookUrl,
          isActive: draft.isActive,
        });
        
        if (Array.isArray(updatedResult)) {
          setKeys(updatedResult);
        } else if (updatedResult && typeof updatedResult === "object") {
          const updatedItem = updatedResult as unknown as ApiKeyRecord;
          setKeys(current => {
            const safeCurrent = Array.isArray(current) ? current : [];
            const exists = safeCurrent.some(k => k.appId === updatedItem.appId);
            if (exists) {
              return safeCurrent.map(k => k.appId === updatedItem.appId ? updatedItem : k);
            }
            return [updatedItem, ...safeCurrent];
          });
        }
        
        toast.success("API key updated.");
        setMode(null);
      } else {
        const created = await createManageApiKey({
          name: draft.name,
        });
        
        const newItem: ApiKeyRecord = {
          id: created.appId,
          appId: created.appId,
          name: created.name,
          ownerId: "",
          isActive: true,
          webhookUrl: "",
          createdAt: created.createdAt,
          updatedAt: created.createdAt,
        };
        setKeys(current => {
          const safeCurrent = Array.isArray(current) ? current : [];
          return [newItem, ...safeCurrent];
        });
        setCreatedRawKey(created.secret);
        toast.success("API key generated.");
        setMode(null);
      }
    } catch {
      toast.error("Failed to save API key.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (!createdRawKey) return;
    navigator.clipboard.writeText(createdRawKey);
    setCopied(true);
    toast.success("Key copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ManagerShell title={pageTitle} description={pageSubtitle}>
      {/* Header Actions */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-700 font-sans">API Keys & Integration</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-sans">Manage access tokens and configure webhooks</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsGuideOpen(true)}
          className="h-8 bg-white border-slate-200/60 hover:bg-slate-50 text-xs font-semibold px-3.5 rounded-sm flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <BookOpen className="size-3.5 shrink-0 text-brand" />
          Integration Guide
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search API keys by name or App ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-9 pr-4 rounded-sm border border-slate-200/60 bg-white font-sans text-xs placeholder-slate-400 focus:outline-hidden focus:border-brand/50 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "all")}>
            <SelectTrigger className="h-8 w-28 text-xs border-slate-200/60 font-sans cursor-pointer bg-white">
              <SlidersHorizontal className="size-3 text-slate-400 shrink-0 mr-1" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs font-sans">All Status</SelectItem>
              <SelectItem value="active" className="text-xs font-sans">Active</SelectItem>
              <SelectItem value="inactive" className="text-xs font-sans">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Filter */}
          <Select value={sortBy} onValueChange={(val) => setSortBy(val || "newest")}>
            <SelectTrigger className="h-8 w-32 text-xs border-slate-200/60 font-sans cursor-pointer bg-white">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest" className="text-xs font-sans">Newest Created</SelectItem>
              <SelectItem value="name-asc" className="text-xs font-sans">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc" className="text-xs font-sans">Name (Z-A)</SelectItem>
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={isLoading || isRefreshing}
            onClick={() => void loadKeys({ silent: true })}
            className="size-8 border-slate-200/60 bg-white hover:bg-slate-50 cursor-pointer shadow-3xs flex items-center justify-center shrink-0"
            title="Refresh Data"
          >
            <RotateCw className={`size-3.5 text-slate-500 ${isRefreshing ? "animate-spin text-brand" : ""}`} />
          </Button>
          <Button
            type="button"
            onClick={() => {
              setMode("create");
              setDraft(EMPTY_KEY);
              setFieldErrors({});
            }}
            className="h-8 bg-brand hover:bg-brand/90 text-white text-xs font-semibold px-4.5 rounded-sm flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="size-4 shrink-0" />
            Create API Key
          </Button>
        </div>
      </div>

      <div className="space-y-6 mt-6">
        <ManagerKeyTable
          keys={isLoading ? [] : visibleKeys}
          isLoading={isLoading}
          isSubmitting={isSubmitting}
          deletingId={deletingId}
          loadError={!!loadError}
          hasActiveFilter={search !== "" || statusFilter !== "all"}
          onEdit={(appId) => {
            const matched = keys.find(k => k.appId === appId);
            if (matched) {
              setMode("edit");
              setDraft({
                id: matched.id,
                appId: matched.appId,
                name: matched.name,
                webhookUrl: matched.webhookUrl || "",
                isActive: matched.isActive,
              });
              setFieldErrors({});
            }
          }}
          onToggleStatus={handleToggleStatus}
          onDelete={(appId) => {
            const matched = keys.find(k => k.appId === appId);
            if (matched) setDeleteTarget(matched);
          }}
          onRetry={() => void loadKeys()}
          onAdd={() => setMode("create")}
          onClearFilters={clearFilters}
        />
        {!isLoading && totalItems > pageSize && (
          <ManagerPagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <ManagerDeleteConfirm
          itemName={deleteTarget.name}
          itemId={deleteTarget.appId}
          isLoading={deletingId === deleteTarget.appId}
          onConfirm={() => void handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
          itemTypeLabel="API Key"
        />
      )}

      {/* Instruction/Guide Preview Modal */}
      <InstructionPreviewDialog
        open={isGuideOpen}
        onOpenChange={setIsGuideOpen}
      />

      {/* Creation / Editing Sheet Drawer */}
      <Sheet open={!!mode} onOpenChange={(open) => { if (!open) setMode(null); }}>
        <SheetContent className="sm:max-w-md w-full border-l border-slate-100 shadow-xl p-6 flex flex-col h-full bg-white select-none">
          <SheetHeader className="pb-4 border-b border-slate-100">
            <SheetTitle className="text-lg font-bold text-slate-800">
              {mode === "create" ? "Create API Key" : "Edit API Key"}
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-450 mt-1 select-none font-sans">
              {mode === "create"
                ? "Configure and generate a new access token for authenticating integrations."
                : "Update configuration settings for the selected API key."}
            </SheetDescription>
          </SheetHeader>
          <ManagerForm
            onSubmit={(e) => void handleSubmit(e)}
            actions={
              <>
                <Button type="button" variant="outline" onClick={() => setMode(null)} className="font-sans">Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="font-sans">Save</Button>
              </>
            }
            className="shadow-none border-0 p-0"
          >
            <KeyFormFields
              draft={draft}
              fieldErrors={fieldErrors}
              onChange={handleDraftChange}
            />
          </ManagerForm>
        </SheetContent>
      </Sheet>

      {/* Copy Generated API Key Modal */}
      <Dialog open={!!createdRawKey} onOpenChange={(open) => { if (!open) { setCreatedRawKey(null); setShowKey(false); } }}>
        <DialogContent className="max-w-[420px] w-full rounded-3xl bg-white p-0 overflow-hidden border-0 shadow-2xl select-none">

          {/* Header gradient band */}
          <div className="relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 px-8 pt-8 pb-10">
            {/* Decorative circles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-6 -right-6 size-32 rounded-full bg-white/10" />
              <div className="absolute top-4 -right-2 size-16 rounded-full bg-white/5" />
              <div className="absolute bottom-0 left-10 size-20 rounded-full bg-emerald-400/30" />
            </div>
            <div className="relative flex flex-col items-center gap-3 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg">
                <KeyRound className="size-7 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white font-sans tracking-tight">Key Generated!</DialogTitle>
                <DialogDescription className="text-emerald-100 text-xs mt-1 font-sans leading-relaxed">
                  Store it safely — this secret <strong className="text-white font-semibold">won&apos;t be shown again.</strong>
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 pt-5 pb-6 space-y-4">

            {/* Warning banner */}
            <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200/60 px-3.5 py-2.5">
              <span className="mt-px text-amber-500 shrink-0 text-sm leading-none">⚠</span>
              <p className="text-[11px] text-amber-700 font-sans leading-relaxed">
                Copy and save your API key now. Once you close this dialog, <strong>you cannot retrieve it again.</strong>
              </p>
            </div>

            {/* Secret key field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-sans">
                Secret Key
              </label>
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/70 rounded-xl px-3.5 py-2.5 group">
                <code className="flex-1 min-w-0 font-mono text-xs text-slate-700 font-semibold tracking-wide select-all truncate">
                  {showKey
                    ? createdRawKey
                    : (createdRawKey ? ("•".repeat(24) + createdRawKey.slice(-6)) : "")}
                </code>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowKey(!showKey)}
                    className="size-7 rounded-lg hover:bg-slate-200 cursor-pointer text-slate-400 hover:text-slate-700 transition-colors border-0 p-0 shadow-none bg-transparent"
                    title={showKey ? "Hide key" : "Reveal key"}
                  >
                    {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={copyToClipboard}
                    className="size-7 rounded-lg hover:bg-slate-200 cursor-pointer text-slate-400 hover:text-slate-700 transition-colors border-0 p-0 shadow-none bg-transparent"
                    title="Copy to clipboard"
                  >
                    {copied
                      ? <Check className="size-3.5 text-emerald-500" />
                      : <Copy className="size-3.5" />}
                  </Button>
                </div>
              </div>
              {copied && (
                <p className="text-[10px] text-emerald-600 font-sans font-semibold pl-1 animate-in fade-in slide-in-from-bottom-1 duration-200">
                  ✓ Copied to clipboard
                </p>
              )}
            </div>

            {/* Confirm button */}
            <Button
              type="button"
              onClick={() => { setCreatedRawKey(null); setShowKey(false); }}
              className="w-full h-10 bg-brand hover:bg-brand/90 text-white font-bold rounded-xl shadow-sm font-sans text-sm tracking-wide transition-all active:scale-[0.98]"
            >
              I&apos;ve saved my key — done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ManagerShell>
  );
}
