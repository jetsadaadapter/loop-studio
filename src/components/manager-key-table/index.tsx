"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import {
  KeyRound,
  Edit3,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Layers,
} from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { ManagerActionsDropdown } from "../manager-actions-dropdown";
import type { ProjectItem } from "@/core/interfaces/projects.interface";

const CopyableAppIdBadge = ({ appId }: { appId: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(appId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <span
      onClick={handleCopy}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-[8px] font-bold text-slate-500 font-sans cursor-pointer hover:bg-slate-200 hover:text-slate-700 transition-colors select-none"
      title={`Copy App ID: ${appId}`}
    >
      <span>ID: {appId.slice(0, 8)}...</span>
      {copied ? (
        <Check className="size-2 shrink-0 text-emerald-600" />
      ) : (
        <Copy className="size-2 shrink-0 opacity-60" />
      )}
    </span>
  );
};

export interface ApiKeyRecord {
  id: string;
  appId: string;
  name: string;
  ownerId: string;
  isActive: boolean;
  webhookUrl?: string;
  projectId?: string | null;
  project?: ProjectItem | null;
  createdAt: string;
  updatedAt: string;
}

interface ManagerKeyTableProps {
  keys: ApiKeyRecord[];
  projects?: { id: string; name: string }[];
  isLoading: boolean;
  isSubmitting: boolean;
  deletingId: string | null;
  loadError?: boolean;
  hasActiveFilter: boolean;
  onEdit: (appId: string) => void;
  onToggleStatus: (appId: string) => void;
  onDelete: (appId: string) => void;
  onRetry: () => void;
  onAdd: () => void;
  onClearFilters: () => void;
}

const getDisplayUrl = (url?: string) => {
  if (!url) return "api.adapterdigital.com";
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return url.replace(/https?:\/\//, "").split("/")[0] || "api.adapterdigital.com";
  }
};

const getGradientStyle = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "from-blue-500 to-indigo-600 text-white",
    "from-emerald-500 to-teal-600 text-white",
    "from-rose-500 to-pink-600 text-white",
    "from-amber-500 to-orange-600 text-white",
    "from-violet-500 to-purple-600 text-white",
    "from-cyan-500 to-sky-600 text-white",
  ];
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export function ManagerKeyTable({
  keys,
  isLoading,
  isSubmitting,
  deletingId,
  loadError,
  hasActiveFilter,
  onEdit,
  onToggleStatus,
  onDelete,
  onRetry,
  onAdd,
  onClearFilters,
  projects = [],
}: ManagerKeyTableProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-300">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse bg-white border border-slate-200/60 rounded-2xl p-4 h-40 flex flex-col justify-between shadow-3xs"
          >
            <div className="flex items-start justify-between">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="space-y-2 mt-3 flex-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="border-t border-slate-100 pt-2.5 mt-3 flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-9 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (loadError || keys.length === 0) {
    return (
      <div className="border border-slate-200/60 rounded-2xl bg-white p-8 text-center text-slate-400 shadow-xs animate-in fade-in duration-300">
        {loadError
          ? "Unable to load API Keys right now."
          : "No API Keys configured yet. Create one to begin authentication."}
        <div className="flex gap-2 justify-center mt-3">
          {loadError ? (
            <Button type="button" size="sm" onClick={onRetry} className="h-8 cursor-pointer">
              Retry
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              disabled={isSubmitting || deletingId !== null}
              onClick={onAdd}
              className="h-8 cursor-pointer bg-brand hover:bg-brand/90 text-white font-sans"
            >
              Create API Key
            </Button>
          )}
          {hasActiveFilter && !loadError && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onClearFilters}
              className="h-8 border-slate-200/60 cursor-pointer font-sans"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-300">
      {keys.map((row) => {
        const displayUrl = getDisplayUrl(row.webhookUrl);
        const connectedProject = row.project || projects.find((p) => p.id === row.projectId);
        return (
          <div
            key={row.id}
            className="relative flex flex-col justify-between rounded-2xl border border-slate-200/60 bg-white p-4 shadow-3xs hover:-translate-y-0.5 hover:shadow-xs hover:border-slate-350 transition-all duration-300"
          >
            {/* Top row */}
            <div className="flex items-start justify-between w-full">
              {/* Clean professional icon container with border and iOS squircle style */}
              <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 bg-white border border-slate-200/80 shadow-3xs">
                <div
                  className={`h-7.5 w-7.5 rounded-md flex items-center justify-center bg-gradient-to-br ${getGradientStyle(
                    row.name,
                  )}`}
                >
                  <KeyRound className="size-4" aria-hidden="true" />
                </div>
              </div>

              {/* URL Link and Actions */}
              <div className="flex items-center gap-2">
                <a
                  href={row.webhookUrl || undefined}
                  target={row.webhookUrl ? "_blank" : undefined}
                  rel="noreferrer"
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold transition-colors ${
                    row.webhookUrl
                      ? "text-indigo-600 hover:text-indigo-800"
                      : "text-slate-400 cursor-default"
                  }`}
                  onClick={(e) => {
                    if (!row.webhookUrl) {
                      e.preventDefault();
                    }
                  }}
                >
                  <span className="truncate max-w-[120px]">{displayUrl}</span>
                  {row.webhookUrl && <ExternalLink className="size-3" />}
                </a>

                <ManagerActionsDropdown
                  triggerClassName="flex size-7 items-center justify-center rounded-sm text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer border-0 shadow-none bg-transparent p-0"
                  actions={[
                    {
                      label: "Edit",
                      icon: Edit3,
                      onClick: () => onEdit(row.appId),
                      disabled: isSubmitting || deletingId !== null,
                    },
                    {
                      label: deletingId === row.appId ? "Revoking…" : "Revoke",
                      icon: Trash2,
                      onClick: () => onDelete(row.appId),
                      disabled: isSubmitting || deletingId !== null,
                      variant: "destructive" as const,
                    },
                  ]}
                />
              </div>
            </div>

            {/* Title & Description */}
            <div className="flex-1 mt-3">
              <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
                {row.name}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed font-sans line-clamp-2">
                {row.webhookUrl
                  ? `Dispatches real-time event notifications to the configured webhook endpoint.`
                  : `Authorized API client for secure programmatic access and integration.`}
              </p>
              
              <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                <CopyableAppIdBadge appId={row.appId} />
                 {connectedProject && (
                  <span className="inline-flex items-center gap-1 rounded bg-indigo-50/50 border border-indigo-100/60 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-600 font-sans shadow-3xs transition-colors hover:bg-indigo-50">
                    <Layers className="size-2.5 text-indigo-500 shrink-0" />
                    <span>Project: {connectedProject.name}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Footer with category-tag and toggle switch */}
            <div className="border-t border-slate-100 pt-2.5 mt-3 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-sans">
                {row.webhookUrl ? "Webhook Channel" : "API Access Client"}
              </span>
              <div className="flex items-center">
                 <Switch
                  id={`key-toggle-${row.appId}`}
                  checked={row.isActive}
                  disabled={isSubmitting || deletingId !== null}
                  onCheckedChange={() => onToggleStatus(row.appId)}
                  className="cursor-pointer"
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
