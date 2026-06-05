"use client";

import { useState } from "react";
import Image from "next/image";
import { Eye, Edit3, Trash2, Globe, Lock, Clock, Sparkles, Copy } from "lucide-react";
import type { PromptItem } from "@/core/interfaces/prompt";

const CopyableIdBadge = ({ id }: { id: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <span
      onClick={handleCopy}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-[8px] font-bold text-slate-500 font-sans cursor-pointer hover:bg-slate-200 hover:text-slate-700 transition-colors select-none"
      title={`Copy Prompt ID: ${id}`}
    >
      <span>ID: {id.slice(0, 8)}...</span>
      {copied ? (
        <span className="text-[8px] text-emerald-600 font-sans font-extrabold uppercase tracking-tight">Copied!</span>
      ) : (
        <Copy className="size-2 shrink-0 opacity-60" />
      )}
    </span>
  );
};
import { PromptPreviewDialog } from "@/app/manage/tools/components/prompt-preview-dialog";
import { ManagerActionsDropdown } from "@/components/manager-actions-dropdown";

interface PromptCardProps {
  promptItem: PromptItem;
  onEdit: (item: PromptItem) => void;
  onDelete: (id: string) => void;
}

export function PromptCard({ promptItem, onEdit, onDelete }: PromptCardProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const modelSlug = promptItem.model?.modelSlug || "gemini-1.5-flash";
  const modelName = promptItem.model?.name || "Gemini 1.5 Flash";

  return (
    <>
      <div className="flex flex-col justify-between p-5 bg-white border border-slate-200/80 rounded-2xl shadow-3xs hover:shadow-2xs transition-all duration-300 h-full group">
        <div className="space-y-3">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 min-w-0">
              <h3 className="text-sm font-bold text-slate-800 tracking-tight leading-tight truncate group-hover:text-brand transition-colors">
                {promptItem.name}
              </h3>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-100 text-[9px] font-bold text-slate-500 font-sans">
                  <Clock className="size-2.5" /> v{promptItem.version}
                </span>
                <CopyableIdBadge id={promptItem.id} />
                {promptItem.visibility === "public" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-600 border border-emerald-100/50">
                    <Globe className="size-2.5" /> Public
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-[10px] font-bold text-rose-600 border border-rose-100/50">
                    <Lock className="size-2.5" /> Private
                  </span>
                )}
              </div>
            </div>
            
            {promptItem.type === "system" ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-[10px] font-bold text-amber-600 border border-amber-100/50 shrink-0">
                <Sparkles className="size-2.5" /> System
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-[10px] font-bold text-blue-600 border border-blue-100/40 shrink-0">
                <Sparkles className="size-2.5" /> User
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-xs text-slate-500 font-normal line-clamp-3 min-h-[4.5rem]">
            {promptItem.description || "No description provided."}
          </p>
        </div>

        {/* Footer info & actions */}
        <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between gap-2">
          {/* Model info badge */}
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Target Model</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200 w-fit truncate">
              <Image
                src="/images/icons/gemini-color.svg"
                width={12}
                height={12}
                alt="Gemini Logo"
                className="shrink-0"
              />
              <span className="truncate">{modelName}</span>
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center shrink-0">
            <ManagerActionsDropdown
              triggerClassName="flex size-7 items-center justify-center rounded-sm text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer border-0 shadow-none bg-transparent p-0"
              actions={[
                {
                  label: "Preview",
                  icon: Eye,
                  onClick: () => setIsPreviewOpen(true),
                },
                {
                  label: "Edit",
                  icon: Edit3,
                  onClick: () => onEdit(promptItem),
                },
                {
                  label: "Delete",
                  icon: Trash2,
                  onClick: () => onDelete(promptItem.id),
                  variant: "destructive",
                },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <PromptPreviewDialog
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        label={promptItem.name}
        model={modelSlug}
        prompt={promptItem.prompt}
      />
    </>
  );
}
