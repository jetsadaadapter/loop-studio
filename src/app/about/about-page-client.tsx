"use client";

import Link from "next/link";
import { useState, useEffect, useRef, type ReactNode } from "react";
import { aboutCopy, type Lang, type AboutSection } from "./copy";
import {
  AppWindowMac,
  BarChart3,
  Image,
  SwatchBook,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";

function hasItems(
  section: AboutSection,
): section is Extract<AboutSection, { items: unknown[] }> {
  return "items" in section && Array.isArray(section.items);
}

// ─── Scroll-reveal wrapper ────────────────────────────────────────────────────
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`about-section-enter${inView ? " in-view" : ""}${delay > 0 ? ` delay-[${delay}ms]` : ""} ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Floating bubbles ─────────────────────────────────────────────────────────
// Positions/sizes/colors defined as CSS classes in globals.css (.about-bubble-N)
const BUBBLE_CLASSES = [
  "about-bubble-1 animate-blob",
  "about-bubble-2 animate-blob-reverse",
  "about-bubble-3 animate-blob",
  "about-bubble-4 animate-blob-reverse",
  "about-bubble-5 animate-blob",
  "about-bubble-6 animate-blob-reverse",
] as const;

const TOOL_CARD_STYLES: Array<{
  icon: LucideIcon;
  bgClass: string;
  textClass: string;
}> = [
  {
    icon: SwatchBook,
    bgClass: "bg-[#e6edf8]",
    textClass: "text-[#4b77cc]",
  },
  {
    icon: WandSparkles,
    bgClass: "bg-[#f2e8de]",
    textClass: "text-[#dd8f43]",
  },
  {
    icon: BarChart3,
    bgClass: "bg-[#dff0ee]",
    textClass: "text-[#33a89c]",
  },
  {
    icon: Image,
    bgClass: "bg-[#ddebf4]",
    textClass: "text-[#4995c9]",
  },
  {
    icon: AppWindowMac,
    bgClass: "bg-[#f4e4e8]",
    textClass: "text-[#d8656d]",
  },
];

export function AboutPageClient() {
  const [lang, setLang] = useState<Lang>("en");
  const copy = aboutCopy[lang];

  return (
    <div className="relative isolate -mt-5 -mx-4 overflow-x-clip overflow-y-hidden sm:mx-auto sm:max-w-3xl sm:overflow-visible">
      {/* ── Bubble background ───────────────────────────────────── */}
      <div
        className="pointer-events-none absolute -top-14 -right-12 bottom-0 -left-12 -z-10 overflow-hidden sm:-inset-x-28 sm:-inset-y-24 sm:overflow-visible"
        aria-hidden="true"
      >
        {BUBBLE_CLASSES.map((cls, i) => (
          <div key={i} className={`absolute rounded-full blur-[72px] ${cls}`} />
        ))}
      </div>

      <div className="px-4 pb-16 sm:px-6 sm:pb-20">
        {/* ── Language toggle ─────────────────────────────────────── */}
        <div className="relative z-10 flex justify-end pt-6">
          <div className="inline-flex rounded-full border border-slate-200 bg-white/80 p-0.5 text-xs font-medium shadow-sm backdrop-blur-sm">
            <button
              onClick={() => setLang("en")}
              className={`rounded-full px-3 py-1.5 transition-colors ${
                lang === "en"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang("th")}
              className={`rounded-full px-3 py-1.5 transition-colors ${
                lang === "th"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              TH
            </button>
          </div>
        </div>

        {/* ── Hero ────────────────────────────────────────────────── */}
        <Reveal className="relative z-10 pt-12 pb-10 sm:pt-18 sm:pb-12">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-px w-6 bg-brand" />
            <p className="text-brand text-xs font-semibold uppercase tracking-widest">
              {copy.hero.title}
            </p>
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            {copy.hero.tagline
              .split(".")
              .filter(Boolean)
              .map((part, i, arr) => (
                <span key={i}>
                  <span
                    className={
                      i === 0
                        ? "bg-linear-to-r from-brand to-dark-garnet-700 bg-clip-text text-transparent"
                        : "text-slate-800"
                    }
                  >
                    {part.trim()}
                  </span>
                  {i < arr.length - 1 && (
                    <span className="text-slate-300">.</span>
                  )}
                </span>
              ))}
            <span className="text-slate-300">.</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-snug text-slate-500">
            {copy.hero.lead}
          </p>
        </Reveal>

        {/* ── Sections ────────────────────────────────────────────── */}
        <div className="relative z-10 space-y-14 sm:space-y-16">
          {copy.sections.map((section, i) => (
            <Reveal key={i} delay={i * 60}>
              <section className="border-t border-slate-100 pt-8">
                {/* Label */}
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-px w-4 bg-brand/50" />
                  <p className="text-brand text-xs font-semibold uppercase tracking-widest">
                    {section.label}
                  </p>
                </div>

                {/* Heading */}
                <h2
                  className={`text-2xl font-semibold leading-snug tracking-tight sm:text-3xl ${
                    hasItems(section) ? "mb-7 sm:mb-8" : "mb-5"
                  }`}
                >
                  <span className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
                    {section.heading}
                  </span>
                </h2>

                {hasItems(section) ? (
                  <>
                    <div className="relative left-1/2 w-screen -translate-x-1/2 px-4 sm:px-6 lg:px-8">
                      <div className="mx-auto max-w-310">
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
                          {section.items.map((item, j) => {
                            const style =
                              TOOL_CARD_STYLES[j % TOOL_CARD_STYLES.length];
                            const Icon = style.icon;

                            return (
                              <Reveal key={item.term} delay={j * 70}>
                                <article
                                  className={`group/card flex h-full min-h-56 flex-col justify-between rounded-2xl p-7.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(15,23,42,0.08)] ${style.bgClass}`}
                                >
                                  <Icon className={style.textClass} size={32} />
                                  <div>
                                    <h3
                                      className={`text-[2.02rem] font-semibold leading-[1.12] tracking-[-0.01em] ${style.textClass}`}
                                    >
                                      {item.term}
                                    </h3>
                                    <p className="mt-3 text-sm leading-snug text-slate-600 lg:max-h-0 lg:translate-y-1 lg:overflow-hidden lg:opacity-0 lg:transition-all lg:duration-300 lg:group-hover/card:max-h-24 lg:group-hover/card:translate-y-0 lg:group-hover/card:opacity-100">
                                      {item.detail}
                                    </p>
                                  </div>
                                </article>
                              </Reveal>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    {"footer" in section && section.footer && (
                      <p className="mt-4 border-l-2 border-brand/30 pl-4 text-sm leading-snug text-slate-400 italic">
                        {section.footer}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="space-y-3">
                    {"body" in section &&
                      Array.isArray(section.body) &&
                      section.body.map((paragraph, j) => (
                        <Reveal key={j} delay={j * 40}>
                          <p className="text-base leading-snug text-slate-600">
                            {paragraph}
                          </p>
                        </Reveal>
                      ))}
                  </div>
                )}
              </section>
            </Reveal>
          ))}
        </div>

        {/* ── CTA ─────────────────────────────────────────────────── */}
        <Reveal
          delay={80}
          className="relative z-10 mt-18 border-t border-slate-100 pt-10"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <Link
              href={copy.cta.primary.href}
              className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand/25 transition hover:bg-brand-strong hover:shadow-brand/35"
            >
              <span>{copy.cta.primary.label}</span>
              <span className="opacity-70">→</span>
              <span className="opacity-70">{copy.cta.primary.action}</span>
            </Link>
            <Link
              href={copy.cta.secondary.href}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
            >
              <span>{copy.cta.secondary.label}</span>
              <span>→</span>
              <span className="font-semibold text-slate-900">
                {copy.cta.secondary.action}
              </span>
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
