import Link from "next/link";
import type { ReactNode } from "react";

const tabs = [
  { href: "/manage/apps", label: "App Manager" },
  { href: "/manage/ai", label: "AI Model Manager" },
];

export default function ManageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <nav className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
