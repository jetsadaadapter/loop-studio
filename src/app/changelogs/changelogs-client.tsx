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
  Sparkles
} from "lucide-react";
import { getValidatedChangelogs, type ChangelogCategory } from "./data";

export function ChangelogsClient() {
  const [selectedCategory, setSelectedCategory] = useState<ChangelogCategory | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");

  const changelogs = useMemo(() => getValidatedChangelogs(), []);

  // Filter logic
  const filteredChangelogs = useMemo(() => {
    return changelogs.filter((item) => {
      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
      const matchesSearch = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.changes.some(change => change.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [changelogs, selectedCategory, searchQuery]);

  const categoryConfigs: Record<ChangelogCategory | "All", { label: string; icon: React.ComponentType<{ className?: string }>; colorClass: string; bgClass: string }> = {
    All: {
      label: "ทั้งหมด",
      icon: Sparkles,
      colorClass: "text-slate-700 dark:text-slate-300",
      bgClass: "bg-slate-100 border-slate-200 text-slate-800"
    },
    MCP: {
      label: "MCP",
      icon: Server,
      colorClass: "text-indigo-600 dark:text-indigo-400",
      bgClass: "bg-indigo-50 border-indigo-100 text-indigo-700"
    },
    Platform: {
      label: "Platform",
      icon: Layers,
      colorClass: "text-rose-600 dark:text-rose-400",
      bgClass: "bg-rose-50 border-rose-100 text-brand"
    },
    Tool: {
      label: "Tool",
      icon: Wrench,
      colorClass: "text-amber-600 dark:text-amber-400",
      bgClass: "bg-amber-50 border-amber-100 text-amber-700"
    }
  };

  return (
    <div className="relative isolate min-h-screen px-4 pb-16 pt-8 sm:px-6 sm:pb-24 sm:pt-12">
      {/* Background Bubble Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="about-bubble-1 animate-blob rounded-full blur-3xl absolute opacity-45" />
        <div className="about-bubble-2 animate-blob-reverse rounded-full blur-3xl absolute opacity-45" />
        <div className="about-bubble-3 animate-blob rounded-full blur-3xl absolute opacity-40" />
      </div>

      <div className="mx-auto max-w-3xl">
        {/* Back Link */}
        <div className="mb-6 motion-hero-enter">
          <Link
            href="/apps"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 transition hover:text-brand"
          >
            <ArrowLeft className="size-3.5" />
            กลับไปหน้าหลัก
          </Link>
        </div>

        {/* Hero Title */}
        <div className="mb-12 motion-hero-enter">
          <div className="flex items-center gap-2">
            <span className="h-px w-6 bg-brand" />
            <p className="text-brand text-xs font-semibold uppercase tracking-widest">
              Updates & Changes
            </p>
          </div>
          <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            Changelogs
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-500">
            ติดตามประวัติการอัปเดตระบบ ฟีเจอร์ใหม่ การแก้บั๊ก และเครื่องมือใหม่ล่าสุดของ Adapter Library ในที่เดียว
          </p>
        </div>

        {/* Filters and Search Bar Container */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between motion-enter-1">
          {/* Category tabs */}
          <div className="inline-flex flex-wrap rounded-full border border-slate-200 bg-white/80 p-0.5 shadow-xs backdrop-blur-xs">
            {(Object.keys(categoryConfigs) as Array<ChangelogCategory | "All">).map((cat) => {
              const config = categoryConfigs[cat];
              const Icon = config.icon;
              const isActive = selectedCategory === cat;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Icon className="size-3.5" />
                  {config.label}
                </button>
              );
            })}
          </div>

          {/* Search bar */}
          <div className="relative max-w-xs sm:w-64">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาข้อมูลการอัปเดต..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-full border border-slate-200 bg-white/80 pl-10 pr-4 text-xs shadow-xs backdrop-blur-xs transition focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>

        {/* Timeline List */}
        <div className="relative border-l border-slate-200/80 pl-6 sm:pl-8 motion-enter-2">
          {filteredChangelogs.length > 0 ? (
            filteredChangelogs.map((item) => {
              const catConfig = categoryConfigs[item.category];
              const CatIcon = catConfig.icon;

              return (
                <div key={item.id} className="relative mb-12 last:mb-0">
                  {/* Bullet indicator */}
                  <span className="absolute -left-[31px] sm:-left-[39px] top-1.5 flex size-6 sm:size-7 items-center justify-center rounded-full border border-white bg-slate-100 shadow-xs ring-4 ring-white">
                    <span className="size-2 rounded-full bg-brand" />
                  </span>

                  {/* Card wrapper */}
                  <div className="group/card bg-white rounded-2xl border border-slate-200/60 p-6 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-md">
                    {/* Header info */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4">
                      {/* Version and Date */}
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center rounded-md bg-slate-900 px-2.5 py-0.5 text-xs font-bold text-white">
                          {item.version}
                        </span>
                        <div className="flex items-center gap-1 text-slate-400 text-xs">
                          <Calendar className="size-3.5" />
                          <span>{item.date}</span>
                        </div>
                      </div>

                      {/* Category Badge */}
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${catConfig.bgClass}`}>
                        <CatIcon className="size-3" />
                        {item.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="typo-title text-slate-900 group-hover/card:text-brand transition-colors duration-250">
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="mt-2.5 text-sm leading-relaxed text-slate-500">
                      {item.description}
                    </p>

                    {/* Changes list */}
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <ul className="space-y-2.5">
                        {item.changes.map((change, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-600">
                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand/60" />
                            <span>{change}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            /* Premium Empty State */
            <div className="relative -ml-6 sm:-ml-8 rounded-2xl border border-dashed border-slate-200 p-12 text-center bg-white/40 backdrop-blur-xs">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-50 border border-slate-100 shadow-xs text-slate-400">
                <Search className="size-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900">ไม่พบประวัติการอัปเดต</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
                ไม่พบผลลัพธ์ที่ตรงกับตัวกรองหรือคำค้นหาของคุณในขณะนี้ ลองค้นหาคำอื่นหรือรีเซ็ตตัวกรอง
              </p>
              <div className="mt-6">
                <button
                  onClick={() => {
                    setSelectedCategory("All");
                    setSearchQuery("");
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition"
                >
                  <RefreshCw className="size-3.5" />
                  รีเซ็ตการค้นหา
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
