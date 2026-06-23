"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Server,
  Layers,
  Wrench,
  Calendar,
  Search,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { getValidatedChangelogs, type ChangelogCategory } from "./data";

// ── Category config ────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<ChangelogCategory | "All", {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  pill: string;        // active tab bg
  badge: string;       // card badge
  bullet: string;      // timeline dot
  accent: string;      // left card stripe
}> = {
  All: {
    label: "ทั้งหมด",
    icon: Sparkles,
    pill: "bg-slate-900 text-white",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    bullet: "bg-slate-500",
    accent: "from-slate-400 to-slate-500",
  },
  MCP: {
    label: "MCP",
    icon: Server,
    pill: "bg-indigo-600 text-white",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200/70",
    bullet: "bg-indigo-500",
    accent: "from-indigo-500 to-violet-500",
  },
  Platform: {
    label: "Platform",
    icon: Layers,
    pill: "bg-brand text-white",
    badge: "bg-rose-50 text-brand border-rose-200/70",
    bullet: "bg-brand",
    accent: "from-brand to-rose-400",
  },
  Tool: {
    label: "Tool",
    icon: Wrench,
    pill: "bg-amber-500 text-white",
    badge: "bg-amber-50 text-amber-700 border-amber-200/70",
    bullet: "bg-amber-500",
    accent: "from-amber-400 to-orange-500",
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

export function ChangelogsClient() {
  const [selectedCategory, setSelectedCategory] = useState<ChangelogCategory | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");

  const changelogs = useMemo(() => getValidatedChangelogs(), []);

  const filteredChangelogs = useMemo(() => {
    return changelogs.filter((item) => {
      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.changes.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [changelogs, selectedCategory, searchQuery]);

  return (
    <div className="relative isolate min-h-screen px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="about-bubble-1 animate-blob rounded-full blur-3xl absolute opacity-40" />
        <div className="about-bubble-2 animate-blob-reverse rounded-full blur-3xl absolute opacity-35" />
        <div className="about-bubble-3 animate-blob rounded-full blur-3xl absolute opacity-30" />
      </div>

      <div className="mx-auto max-w-3xl">
        {/* Back link */}
        <div className="mb-8 motion-hero-enter">
          <Link
            href="/apps"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 transition hover:text-brand"
          >
            <ArrowLeft className="size-3.5" />
            กลับไปหน้าหลัก
          </Link>
        </div>

        {/* Hero */}
        <div className="mb-10 motion-hero-enter">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-px w-6 bg-brand" />
            <p className="text-brand text-[10px] font-bold uppercase tracking-widest">Updates & Changes</p>
          </div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            Changelogs
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-500 max-w-xl">
            ติดตามประวัติการอัปเดตระบบ ฟีเจอร์ใหม่ การแก้บั๊ก และเครื่องมือใหม่ล่าสุดของ Adapter Library
          </p>
        </div>

        {/* Filters */}
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between motion-enter-1">
          {/* Category tabs */}
          <div className="inline-flex flex-wrap gap-1.5">
            {(Object.keys(CATEGORY_CONFIG) as Array<ChangelogCategory | "All">).map((cat) => {
              const cfg = CATEGORY_CONFIG[cat];
              const Icon = cfg.icon;
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold transition-all duration-200 border cursor-pointer ${
                    isActive
                      ? `${cfg.pill} border-transparent shadow-sm`
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-800"
                  }`}
                >
                  <Icon className="size-3" />
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาการอัปเดต..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8.5 w-full rounded-full border border-slate-200 bg-white/90 pl-9 pr-4 text-xs shadow-xs transition focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>

        {/* Timeline */}
        <div className="relative pl-7 sm:pl-9 motion-enter-2">
          {/* vertical line */}
          <div className="absolute left-[11px] sm:left-[13px] top-0 bottom-0 w-px bg-gradient-to-b from-slate-200 via-slate-200/60 to-transparent" />

          {filteredChangelogs.length > 0 ? (
            filteredChangelogs.map((item, idx) => {
              const cfg = CATEGORY_CONFIG[item.category];
              const CatIcon = cfg.icon;
              const isFirst = idx === 0;

              return (
                <div key={item.id} className="relative mb-10 last:mb-0">
                  {/* Timeline bullet */}
                  <div className={`absolute -left-7 sm:-left-9 top-4 flex size-6 items-center justify-center rounded-full border-2 border-white shadow-sm ring-4 ring-white/80 bg-gradient-to-br ${cfg.accent}`}>
                    <CatIcon className="size-2.5 text-white" />
                  </div>

                  {/* Card */}
                  <div className={`group/card relative overflow-hidden bg-white rounded-2xl border shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
                    isFirst ? "border-brand/20 shadow-brand/5" : "border-slate-200/70"
                  }`}>
                    {/* Left accent stripe */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${cfg.accent}`} />

                    <div className="pl-5 pr-5 pt-5 pb-5">
                      {/* Top row: version + date + category */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                        <div className="flex items-center gap-2.5">
                          {/* Version pill */}
                          <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-[11px] font-black text-white bg-gradient-to-r ${cfg.accent} shadow-xs`}>
                            {item.version}
                          </span>
                          {isFirst && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 text-[9px] font-bold text-emerald-700 uppercase tracking-wide">
                              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Latest
                            </span>
                          )}
                          <div className="flex items-center gap-1 text-slate-400 text-[10px] font-medium">
                            <Calendar className="size-3" />
                            <span>{item.date}</span>
                          </div>
                        </div>

                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${cfg.badge}`}>
                          <CatIcon className="size-2.5" />
                          {item.category}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-sm font-bold text-slate-900 leading-snug group-hover/card:text-brand transition-colors duration-200">
                        {item.title}
                      </h3>

                      {/* Description */}
                      <p className="mt-2 text-xs leading-relaxed text-slate-500">
                        {item.description}
                      </p>

                      {/* Changes */}
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <ul className="space-y-2">
                          {item.changes.map((change, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-slate-600">
                              <CheckCircle2 className={`mt-0.5 size-3 shrink-0 ${cfg.bullet === "bg-brand" ? "text-brand" : cfg.bullet === "bg-indigo-500" ? "text-indigo-500" : cfg.bullet === "bg-amber-500" ? "text-amber-500" : "text-slate-400"}`} />
                              <span>{change}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="relative -ml-7 sm:-ml-9 rounded-2xl border border-dashed border-slate-200 p-12 text-center bg-white/60">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-50 border border-slate-100">
                <Search className="size-5 text-slate-400" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900">ไม่พบประวัติการอัปเดต</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
                ไม่พบผลลัพธ์ที่ตรงกับตัวกรองหรือคำค้นหาของคุณ ลองค้นหาคำอื่นหรือรีเซ็ตตัวกรอง
              </p>
              <button
                onClick={() => { setSelectedCategory("All"); setSearchQuery(""); }}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <RefreshCw className="size-3.5" />
                รีเซ็ตการค้นหา
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
