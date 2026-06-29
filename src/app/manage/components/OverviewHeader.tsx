import React from "react";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function OverviewHeader() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-tr from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 shadow-md">
      <div className="absolute -right-20 -top-20 size-80 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="absolute -left-20 -bottom-20 size-80 rounded-full bg-emerald-500/5 blur-3xl" />
      
      <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Badge className="bg-white/10 hover:bg-white/15 text-slate-200 border-none px-3 py-1 text-xs font-semibold backdrop-blur-md">
            Control Workspace
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-2">
            Management & Operations Console
          </h1>
          <p className="max-w-2xl text-sm text-slate-400">
            Operational control center to manage live application catalog entries, active banner promotions, AI model routing algorithms, and planned core services.
          </p>
        </div>
        <div className="inline-flex shrink-0 self-start md:self-center items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 backdrop-blur-md">
          <Sparkles className="size-3.5 text-indigo-400 animate-pulse" />
          Active Syncing Operations
        </div>
      </div>
    </section>
  );
}
