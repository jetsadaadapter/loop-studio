"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, LayoutGrid, Search } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getAppItemId } from "@/core/interfaces/apps.interface";
import type { ManageAppApiItem } from "@/core/interfaces/apps.interface";

function AppLoadingState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center gap-2 py-10">
      <span
        aria-hidden
        className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent text-slate-400"
      />
      <p className="text-xs text-slate-400">Loading apps…</p>
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center gap-1 py-10 text-slate-400">
      <LayoutGrid className="size-6" />
      <p className="text-xs">{query ? `No apps match "${query}"` : "No apps available."}</p>
    </div>
  );
}

type AppSelectionSectionProps = {
  selectedAppId: string;
  apps: ManageAppApiItem[];
  isLoadingApps: boolean;
  touched: Partial<Record<string, boolean>>;
  fieldErrors: Record<string, string>;
  onChange: (appId: string) => void;
};

export function AppSelectionSection({
  selectedAppId,
  apps,
  isLoadingApps,
  touched,
  fieldErrors,
  onChange,
}: AppSelectionSectionProps) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? apps.filter((app) => app.name.toLowerCase().includes(query.trim().toLowerCase()))
    : apps;

  return (
    <Card className="rounded-xl border border-slate-200/70 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <LayoutGrid className="size-4" />
          </div>
          <div>
            <h5 className="text-base font-semibold leading-tight">
              App Selection <span className="text-destructive">*</span>
            </h5>
            <p className="text-xs text-muted-foreground">Choose the app this banner links to</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            placeholder="Search apps…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 text-xs"
          />
        </div>

        <div className="grid max-h-[380px] grid-cols-1 gap-2.5 overflow-y-auto p-0.5 sm:grid-cols-2">
          {isLoadingApps ? (
            <AppLoadingState />
          ) : filtered.length === 0 ? (
            <EmptyState query={query} />
          ) : (
            filtered.map((app) => {
              const appId = getAppItemId(app);
              const isSelected = selectedAppId === appId;
              const iconUrl = app.iconId
                ? `/images/${encodeURIComponent(app.iconId.trim())}`
                : null;

              return (
                <button
                  key={appId}
                  type="button"
                  onClick={() => onChange(appId)}
                  className={cn(
                    "relative flex flex-col overflow-hidden rounded-xl border p-3.5 text-left transition-all",
                    isSelected
                      ? "border-zinc-900 bg-white ring-1 ring-zinc-900"
                      : "border-slate-200 bg-white shadow-sm hover:border-slate-300",
                  )}
                >
                  <div className="mb-2.5 flex w-full items-start justify-between">
                    <div className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-100 bg-zinc-50">
                      {iconUrl ? (
                        <Image src={iconUrl} alt={app.name} fill className="object-cover" unoptimized />
                      ) : (
                        <LayoutGrid className="size-4 text-zinc-400" />
                      )}
                    </div>
                    <div
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full transition-colors",
                        isSelected ? "border border-zinc-900 bg-zinc-900" : "border border-zinc-200 bg-white",
                      )}
                    >
                      <Check className={cn("size-3", isSelected ? "text-white" : "text-zinc-300")} />
                    </div>
                  </div>
                  <p className="truncate text-[13px] font-semibold text-zinc-900">{app.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-zinc-500">
                    {app.description || "No description provided."}
                  </p>
                </button>
              );
            })
          )}
        </div>

        <FieldError errors={touched.appId ? [{ message: fieldErrors.appId }] : []} />
      </CardContent>
    </Card>
  );
}
