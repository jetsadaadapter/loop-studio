"use client";

import { useState } from "react";
import Image from "next/image";
import { Eye, Edit3, Trash2, Globe, Lock, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PromptItem } from "@/core/interfaces/prompt";
import { PromptPreviewDialog } from "@/app/manage/tools/components/prompt-preview-dialog";

interface PromptRowProps {
  promptItem: PromptItem;
  onEdit: (item: PromptItem) => void;
  onDelete: (id: string) => void;
}

export function PromptRow({ promptItem, onEdit, onDelete }: PromptRowProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const modelSlug = promptItem.model?.modelSlug || "gemini-1.5-flash";
  const modelName = promptItem.model?.name || "Gemini 1.5 Flash";

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4.5 bg-white border border-slate-200/80 rounded-2xl shadow-3xs hover:shadow-2xs transition-all duration-300">
        {/* Left Side: Info */}
        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight leading-none">
              {promptItem.name}
            </h3>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-[9px] font-bold text-slate-500 font-sans">
              <Clock className="size-2.5" /> v{promptItem.version}
            </span>
            {promptItem.visibility === "public" ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-[9px] font-bold text-emerald-600 border border-emerald-100/50">
                <Globe className="size-2.5" /> Public
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-50 text-[9px] font-bold text-rose-600 border border-rose-100/50">
                <Lock className="size-2.5" /> Private
              </span>
            )}
            {promptItem.type === "system" ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-[9px] font-bold text-amber-600 border border-amber-100/50">
                <Sparkles className="size-2.5" /> System Persona
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 text-[9px] font-bold text-blue-600 border border-blue-100/40">
                <Sparkles className="size-2.5" /> User Prompt
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 font-normal line-clamp-2">
            {promptItem.description || "No description provided."}
          </p>

          {/* Model info badge */}
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[10px] text-slate-400 font-medium font-sans">Model:</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/5 px-2 py-0.5 text-[10px] font-bold text-brand border border-brand/10">
              <Image
                src="/images/icons/gemini-color.svg"
                width={12}
                height={12}
                alt="Gemini Logo"
                className="shrink-0"
              />
              {modelName}
            </span>
            {promptItem.remark && (
              <span className="text-[10px] text-slate-400 italic font-sans font-normal truncate">
                • {promptItem.remark}
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end sm:justify-start">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsPreviewOpen(true)}
            className="size-8.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 cursor-pointer transition-colors"
            title="Preview Prompt"
          >
            <Eye className="size-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onEdit(promptItem)}
            className="size-8.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 cursor-pointer transition-colors"
            title="Edit Prompt"
          >
            <Edit3 className="size-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onDelete(promptItem.id)}
            className="size-8.5 rounded-xl text-slate-400 hover:text-brand hover:bg-brand/5 cursor-pointer transition-colors"
            title="Delete Prompt"
          >
            <Trash2 className="size-4" />
          </Button>
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
