import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  FolderKanban,
  LayoutGrid,
  BookOpen,
  type LucideIcon,
} from "lucide-react";

interface LinkItem {
  href: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  chip: string;
}

const LINKS: LinkItem[] = [
  {
    href: "/apps",
    title: "Browse Apps",
    desc: "Explore the internal library of MCPs, tools, and platforms",
    icon: LayoutGrid,
    chip: "bg-brand/10 text-brand",
  },
  {
    href: "/projects",
    title: "My Projects",
    desc: "View your projects and manage their credit balances",
    icon: FolderKanban,
    chip: "bg-violet-100 text-violet-600",
  },
  {
    href: "/docs",
    title: "Documentation",
    desc: "Read guides and API references to get started",
    icon: BookOpen,
    chip: "bg-emerald-100 text-emerald-600",
  },
];

export function OverviewUserLinks() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {LINKS.map(({ href, title, desc, icon: Icon, chip }) => (
        <Link key={href} href={href} className="group block outline-none">
          <div className="flex h-full flex-col gap-2.5 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className={`flex size-9 items-center justify-center rounded-xl ${chip}`}>
                <Icon className="size-4" />
              </span>
              <ArrowRight className="size-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-900" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{desc}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
