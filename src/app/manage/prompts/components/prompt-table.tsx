"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Eye, Clock, Sparkles, Globe, Lock, Edit3, Trash2, Copy } from "lucide-react";
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

interface PromptTableProps {
  prompts: PromptItem[];
  isLoading: boolean;
  onEdit: (item: PromptItem) => void;
  onDelete: (id: string) => void;
}

export function PromptTable({
  prompts,
  isLoading,
  onEdit,
  onDelete,
}: PromptTableProps) {
  const [previewItem, setPreviewItem] = useState<PromptItem | null>(null);

  return (
    <>
      <div className="relative w-full overflow-x-auto border border-slate-200 rounded-sm bg-white shadow-3xs">
        <table className="w-full caption-bottom text-xs min-w-full md:min-w-3xl">
          <thead className="[&_tr]:border-b bg-slate-50/50">
            <tr className="border-b transition-colors hover:bg-transparent">
              <th className="text-foreground h-10 text-left align-middle font-semibold whitespace-nowrap p-3 px-4 w-12 hidden xs:table-cell">
                #
              </th>
              <th className="text-foreground h-10 text-left align-middle font-semibold whitespace-nowrap p-3">
                Prompt Name
              </th>
              <th className="text-foreground h-10 text-left align-middle font-semibold whitespace-nowrap p-3 w-40 hidden md:table-cell">
                Persona Type
              </th>
              <th className="text-foreground h-10 text-left align-middle font-semibold whitespace-nowrap p-3 w-48 hidden md:table-cell">
                Target Model
              </th>
              <th className="text-foreground h-10 text-left align-middle font-semibold whitespace-nowrap p-3 w-36 hidden md:table-cell">
                Visibility
              </th>
              <th className="text-foreground h-10 text-right align-middle font-semibold whitespace-nowrap p-3 px-4 w-12">
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="p-3 px-4 hidden xs:table-cell"><div className="h-4 w-4 bg-slate-100 rounded" /></td>
                  <td className="p-3">
                    <div className="space-y-1.5">
                      <div className="h-4 w-40 bg-slate-100 rounded" />
                      <div className="h-3 w-60 bg-slate-100 rounded" />
                      {/* Mobile-only loading attributes skeleton */}
                      <div className="flex gap-1.5 mt-1.5 md:hidden">
                        <div className="h-3.5 w-12 bg-slate-100 rounded-sm" />
                        <div className="h-3.5 w-16 bg-slate-100 rounded-sm" />
                        <div className="h-3.5 w-12 bg-slate-100 rounded-sm" />
                      </div>
                    </div>
                  </td>
                  <td className="p-3 hidden md:table-cell"><div className="h-6 w-24 bg-slate-100 rounded-full" /></td>
                  <td className="p-3 hidden md:table-cell"><div className="h-6 w-32 bg-slate-100 rounded-full" /></td>
                  <td className="p-3 hidden md:table-cell"><div className="h-6 w-20 bg-slate-100 rounded-full" /></td>
                  <td className="p-3 px-4 text-right"><div className="h-8 w-8 ml-auto bg-slate-100 rounded" /></td>
                </tr>
              ))
            ) : prompts.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400 select-none">
                  No prompt personas match the active search or filters.
                </td>
              </tr>
            ) : (
              prompts.map((row, index) => {
                const modelName = row.model?.name || "Gemini 1.5 Flash";
                return (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50/50 transition-colors border-b last:border-0"
                  >
                    <td className="p-3 px-4 align-middle whitespace-nowrap text-xs font-semibold text-slate-400 hidden xs:table-cell">
                      {index + 1}
                    </td>
                    <td className="p-3 align-middle min-w-0 sm:min-w-[240px]">
                      <div className="flex items-center gap-3">
                        <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg border shadow-3xs ${
                          row.type === "system"
                            ? "bg-amber-50/50 border-amber-100/50 text-amber-600"
                            : "bg-blue-50/50 border-blue-100/40 text-blue-600"
                        }`}>
                          <Sparkles className="size-4 drop-shadow-xs" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-semibold text-slate-800 tracking-tight block leading-tight">
                              {row.name}
                            </span>
                            <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded-sm bg-slate-100 text-[8px] font-bold text-slate-500 font-sans">
                              <Clock className="size-2" /> v{row.version}
                            </span>
                            <CopyableIdBadge id={row.id} />
                          </div>
                          <p className="text-[10px] text-slate-400 font-normal line-clamp-1 mt-0.5 leading-none">
                            {row.description || "No description provided."}
                          </p>
                          {/* Mobile-only inline attributes */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5 md:hidden">
                            {row.type === "system" ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-amber-50 text-[8px] font-bold text-amber-600 border border-amber-100/30">
                                System
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-blue-50 text-[8px] font-bold text-blue-600 border border-blue-100/30">
                                User
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 rounded-sm bg-slate-50 px-1.5 py-0.5 text-[8px] font-bold text-slate-600 border border-slate-200">
                              {modelName}
                            </span>
                            {row.visibility === "public" ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-emerald-50 text-[8px] font-bold text-emerald-600 border border-emerald-100/30">
                                Public
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-rose-50 text-[8px] font-bold text-rose-600 border border-rose-100/30">
                                Private
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 align-middle whitespace-nowrap hidden md:table-cell">
                      {row.type === "system" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-[10px] font-bold text-amber-600 border border-amber-100/50">
                          <Sparkles className="size-2.5" /> System Persona
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-[10px] font-bold text-blue-600 border border-blue-100/40">
                          <Sparkles className="size-2.5" /> User Prompt
                        </span>
                      )}
                    </td>
                    <td className="p-3 align-middle whitespace-nowrap hidden md:table-cell">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                        <Image
                          src="/images/icons/gemini-color.svg"
                          width={12}
                          height={12}
                          alt="Gemini Logo"
                          className="shrink-0"
                        />
                        {modelName}
                      </span>
                    </td>
                    <td className="p-3 align-middle whitespace-nowrap hidden md:table-cell">
                      {row.visibility === "public" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-600 border border-emerald-100/50">
                          <Globe className="size-2.5" /> Public
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-[10px] font-bold text-rose-600 border border-rose-100/50">
                          <Lock className="size-2.5" /> Private
                        </span>
                      )}
                    </td>
                    <td className="p-3 px-4 align-middle whitespace-nowrap text-right">
                      <div className="flex justify-end">
                        <ManagerActionsDropdown
                          triggerClassName="flex size-7 items-center justify-center rounded-sm text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer border-0 shadow-none bg-transparent p-0"
                          actions={[
                            {
                              label: "Preview",
                              icon: Eye,
                              onClick: () => setPreviewItem(row),
                            },
                            {
                              label: "Edit",
                              icon: Edit3,
                              onClick: () => onEdit(row),
                            },
                            {
                              label: "Delete",
                              icon: Trash2,
                              onClick: () => onDelete(row.id),
                              variant: "destructive",
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {previewItem && (
        <PromptPreviewDialog
          open={!!previewItem}
          onOpenChange={(open) => !open && setPreviewItem(null)}
          label={previewItem.name}
          model={previewItem.model?.modelSlug || "gemini-1.5-flash"}
          prompt={previewItem.prompt}
        />
      )}
    </>
  );
}
