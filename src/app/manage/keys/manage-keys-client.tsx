"use client";

import { useCallback, useEffect, useMemo, useState, startTransition } from "react";
import { KeyRound, Copy, Check, Eye, EyeOff, BookOpen } from "lucide-react";
import { ManageSearchInput } from "@/components/ui/manage-search-input";
import { ManageRefreshButton } from "@/components/ui/manage-refresh-button";
import { ManageCreateButton } from "@/components/ui/manage-create-button";
import { ManageFilterSelect } from "@/components/ui/manage-filter-select";
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
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
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
  const [createdKeyData, setCreatedKeyData] = useState<{ appId: string; secret: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedAppId, setCopiedAppId] = useState(false);
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
      setLastUpdatedAt(new Date());
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
        setCreatedKeyData({ appId: created.appId, secret: created.secret });
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
    if (!createdKeyData) return;
    navigator.clipboard.writeText(createdKeyData.secret);
    setCopied(true);
    toast.success("Secret key copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  };

  const copyAppIdToClipboard = () => {
    if (!createdKeyData) return;
    navigator.clipboard.writeText(createdKeyData.appId);
    setCopiedAppId(true);
    toast.success("App ID copied to clipboard.");
    setTimeout(() => setCopiedAppId(false), 2000);
  };

  return (
    <ManagerShell title={pageTitle} description={pageSubtitle} actions={
      <Button type="button" variant="outline" onClick={() => setIsGuideOpen(true)} className="h-8 bg-white border-slate-200/60 hover:bg-slate-50 text-xs font-semibold px-3.5 rounded-sm flex items-center gap-1.5 cursor-pointer shadow-xs">
        <BookOpen className="size-3.5 shrink-0 text-brand" />
        Integration Guide
      </Button>
    }>
      {/* Search and Filters */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 mb-6 select-none">
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3 flex-1">
          <ManageSearchInput value={search} onChange={setSearch} placeholder="Search API keys by name or App ID..." />
          <ManageFilterSelect label="Status" value={statusFilter} options={[{ value: "all", label: "All Status" }, { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} onChange={(v) => setStatusFilter(v || "all")} width="xl:w-32" />
          <ManageFilterSelect label="Sort By" value={sortBy} options={[{ value: "newest", label: "Newest Created" }, { value: "name-asc", label: "Name (A-Z)" }, { value: "name-desc", label: "Name (Z-A)" }]} onChange={(v) => setSortBy(v || "newest")} />
        </div>
        <div className="flex items-center gap-3 justify-between xl:justify-end shrink-0">
          <ManageRefreshButton lastUpdatedAt={lastUpdatedAt} isLoading={isLoading} isRefreshing={isRefreshing} onRefresh={() => void loadKeys({ silent: true })} title="Refresh Data" />
          <ManageCreateButton onClick={() => { setMode("create"); setDraft(EMPTY_KEY); setFieldErrors({}); }}>Create API Key</ManageCreateButton>
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
      <Dialog open={!!createdKeyData} onOpenChange={(open) => { if (!open) { setCreatedKeyData(null); setShowKey(false); } }}>
        <DialogContent className="max-w-[460px] w-full rounded-3xl bg-white p-0 overflow-hidden border-0 shadow-2xl select-none">

          {/* Header gradient band */}
          <div className="relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 px-8 pt-8 pb-10">
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
                  Store these credentials safely — the secret <strong className="text-white font-semibold">won&apos;t be shown again.</strong>
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
                Copy and save both credentials now. Use <strong>X-App-Id</strong> and <strong>X-App-Secret</strong> headers to authenticate API requests.
              </p>
            </div>

            {/* App ID field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-sans">
                App ID <span className="normal-case font-medium text-slate-400">(X-App-Id header)</span>
              </label>
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/70 rounded-xl px-3.5 py-2.5">
                <code className="flex-1 min-w-0 font-mono text-xs text-slate-700 font-semibold tracking-wide select-all truncate">
                  {createdKeyData?.appId ?? ""}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={copyAppIdToClipboard}
                  className="size-7 rounded-lg hover:bg-slate-200 cursor-pointer text-slate-400 hover:text-slate-700 transition-colors border-0 p-0 shadow-none bg-transparent shrink-0"
                  title="Copy App ID"
                >
                  {copiedAppId ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                </Button>
              </div>
            </div>

            {/* Secret key field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-sans">
                Secret Key <span className="normal-case font-medium text-slate-400">(X-App-Secret header)</span>
              </label>
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/70 rounded-xl px-3.5 py-2.5">
                <code className="flex-1 min-w-0 font-mono text-xs text-slate-700 font-semibold tracking-wide select-all truncate">
                  {showKey
                    ? createdKeyData?.secret
                    : (createdKeyData ? ("•".repeat(24) + createdKeyData.secret.slice(-6)) : "")}
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
                    title="Copy Secret Key"
                  >
                    {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                  </Button>
                </div>
              </div>
              {copied && (
                <p className="text-[10px] text-emerald-600 font-sans font-semibold pl-1 animate-in fade-in slide-in-from-bottom-1 duration-200">
                  ✓ Secret key copied to clipboard
                </p>
              )}
            </div>

            {/* Confirm button */}
            <Button
              type="button"
              onClick={() => { setCreatedKeyData(null); setShowKey(false); }}
              className="w-full h-10 bg-brand hover:bg-brand/90 text-white font-bold rounded-xl shadow-sm font-sans text-sm tracking-wide transition-all active:scale-[0.98]"
            >
              I&apos;ve saved my credentials — done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ManagerShell>
  );
}
