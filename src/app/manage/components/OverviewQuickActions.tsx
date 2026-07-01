import React from "react";
import Link from "next/link";
import { Plus, ArrowRight, Layers, ImageIcon, Cpu, type LucideIcon } from "lucide-react";

interface ActionItem {
  href: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  chip: string;
}

interface OverviewQuickActionsProps {
  hasAccessToApps: boolean;
  hasAccessToBanners: boolean;
  hasAccessToModels: boolean;
}

export function OverviewQuickActions({
  hasAccessToApps,
  hasAccessToBanners,
  hasAccessToModels,
}: OverviewQuickActionsProps) {
  const actions: ActionItem[] = [];
  if (hasAccessToApps) {
    actions.push({
      href: "/manage/apps/create",
      title: "Create App",
      desc: "Add a new app catalog item",
      icon: Layers,
      chip: "bg-brand/10 text-brand",
    });
  }
  if (hasAccessToBanners) {
    actions.push({
      href: "/manage/banners/create",
      title: "Create Banner",
      desc: "Add a sliding promotion",
      icon: ImageIcon,
      chip: "bg-emerald-100 text-emerald-600",
    });
  }
  if (hasAccessToModels) {
    actions.push({
      href: "/manage/models?action=create",
      title: "Create AI Model",
      desc: "Add an LLM model provider",
      icon: Cpu,
      chip: "bg-violet-100 text-violet-600",
    });
  }

  if (actions.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {actions.map(({ href, title, desc, icon: Icon, chip }) => (
        <Link key={href} href={href} className="group block outline-none">
          <div className="relative flex h-full items-center gap-3 overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <span className={`flex size-9 items-center justify-center rounded-xl ${chip}`}>
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <Plus className="size-3.5 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
              </div>
              <p className="mt-0.5 truncate text-xs text-slate-500">{desc}</p>
            </div>
            <ArrowRight className="size-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-900" />
          </div>
        </Link>
      ))}
    </div>
  );
}
