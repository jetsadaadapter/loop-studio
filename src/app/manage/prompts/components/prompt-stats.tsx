"use client";

import { useMemo } from "react";
import { CheckCircle2, Sparkles, Globe, Lock } from "lucide-react";
import type { PromptItem } from "@/core/interfaces/prompt";

interface PromptStatsProps {
  prompts: PromptItem[];
}

export function PromptStats({ prompts }: PromptStatsProps) {
  const stats = useMemo(() => {
    const total = prompts.length;
    const systemCount = prompts.filter((p) => p.type === "system").length;
    const publicCount = prompts.filter((p) => p.visibility === "public").length;
    const privateCount = prompts.filter((p) => p.visibility === "private").length;

    return {
      total,
      systemCount,
      publicCount,
      privateCount,
    };
  }, [prompts]);

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6 select-none animate-in fade-in duration-300">
      {/* Active Prompts */}
      <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-white shadow-3xs shadow-slate-100/50 hover:shadow-2xs transition-all">
        <div className="min-w-0">
          <span className="text-3xl font-bold tracking-tight text-blue-600">
            {stats.total}
          </span>
          <h4 className="text-xs font-bold text-slate-700 mt-1 leading-none">
            Active Prompts
          </h4>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Running now
          </span>
        </div>
        <div className="flex size-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 shrink-0">
          <CheckCircle2 className="size-5" />
        </div>
      </div>

      {/* System Personas */}
      <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-white shadow-3xs shadow-slate-100/50 hover:shadow-2xs transition-all">
        <div className="min-w-0">
          <span className="text-3xl font-bold tracking-tight text-amber-600">
            {stats.systemCount}
          </span>
          <h4 className="text-xs font-bold text-slate-700 mt-1 leading-none">
            System Personas
          </h4>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Configuration
          </span>
        </div>
        <div className="flex size-10 items-center justify-center rounded-full bg-amber-50 text-amber-600 shrink-0">
          <Sparkles className="size-5" />
        </div>
      </div>

      {/* Public Prompts */}
      <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-white shadow-3xs shadow-slate-100/50 hover:shadow-2xs transition-all">
        <div className="min-w-0">
          <span className="text-3xl font-bold tracking-tight text-emerald-600">
            {stats.publicCount}
          </span>
          <h4 className="text-xs font-bold text-slate-700 mt-1 leading-none">
            Public Prompts
          </h4>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Shared templates
          </span>
        </div>
        <div className="flex size-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shrink-0">
          <Globe className="size-5" />
        </div>
      </div>

      {/* Private Prompts */}
      <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-white shadow-3xs shadow-slate-100/50 hover:shadow-2xs transition-all">
        <div className="min-w-0">
          <span className="text-3xl font-bold tracking-tight text-rose-600">
            {stats.privateCount}
          </span>
          <h4 className="text-xs font-bold text-slate-700 mt-1 leading-none">
            Private Prompts
          </h4>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Restricted access
          </span>
        </div>
        <div className="flex size-10 items-center justify-center rounded-full bg-rose-50 text-rose-600 shrink-0">
          <Lock className="size-5" />
        </div>
      </div>
    </div>
  );
}
