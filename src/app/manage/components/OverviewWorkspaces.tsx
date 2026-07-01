import React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Cpu,
  FolderOpen,
  Image as ImageIcon,
  Layers,
  Tag,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export interface WorkspaceItem {
  href: string;
  title: string;
  subtitle: string;
}

const META: Array<{
  match: string;
  icon: LucideIcon;
  type: string;
  chip: string;
}> = [
  { match: "apps", icon: Layers, type: "Catalog", chip: "bg-brand/10 text-brand" },
  { match: "models", icon: Cpu, type: "AI", chip: "bg-violet-100 text-violet-600" },
  { match: "banners", icon: ImageIcon, type: "Content", chip: "bg-emerald-100 text-emerald-600" },
  { match: "tools", icon: Wrench, type: "Automation", chip: "bg-amber-100 text-amber-600" },
  { match: "tags", icon: Tag, type: "Taxonomy", chip: "bg-rose-100 text-rose-600" },
  { match: "categories", icon: FolderOpen, type: "Taxonomy", chip: "bg-sky-100 text-sky-600" },
  { match: "users", icon: Users, type: "People", chip: "bg-blue-100 text-blue-600" },
];

function metaFor(href: string) {
  return (
    META.find((m) => href.includes(m.match)) ?? {
      icon: Layers,
      type: "Module",
      chip: "bg-slate-100 text-slate-600",
    }
  );
}

export function OverviewWorkspaces({ items }: { items: WorkspaceItem[] }) {
  if (items.length === 0) return null;

  return (
    <TableContainer>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Workspace</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Type</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const { icon: Icon, type, chip } = metaFor(item.href);
            return (
              <TableRow key={item.href}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span className={`flex size-8 items-center justify-center rounded-lg ${chip}`}>
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <span className="block font-semibold text-slate-900">
                        {item.title}
                      </span>
                      <span className="block max-w-xs truncate text-xs text-slate-500">
                        {item.subtitle}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 text-slate-600">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    Active
                  </span>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                    {type}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-1 font-semibold text-brand transition hover:text-brand-strong"
                  >
                    Open
                    <ArrowUpRight className="size-4" />
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
