"use client";

import Link from "next/link";
import { useState } from "react";
import { aboutCopy, type Lang, type AboutSection } from "./copy";

function hasItems(
  section: AboutSection,
): section is Extract<AboutSection, { items: unknown[] }> {
  return "items" in section && Array.isArray(section.items);
}

export function AboutPageClient() {
  const [lang, setLang] = useState<Lang>("en");
  const copy = aboutCopy[lang];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-24 sm:px-6">
      {/* Language toggle */}
      <div className="flex justify-end pt-6">
        <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
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

      {/* Hero */}
      <header className="pt-14 pb-16 sm:pt-20 sm:pb-20">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
          {copy.hero.title}
        </p>
        <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
          {copy.hero.tagline}
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-500">
          {copy.hero.lead}
        </p>
      </header>

      {/* Sections */}
      <div className="space-y-20">
        {copy.sections.map((section, i) => (
          <section key={i} className="border-t border-slate-100 pt-10">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
              {section.label}
            </p>
            <h2 className="mb-6 text-2xl font-semibold leading-snug tracking-tight text-slate-900 sm:text-3xl">
              {section.heading}
            </h2>

            {hasItems(section) ? (
              <>
                <dl className="space-y-5">
                  {section.items.map((item) => (
                    <div key={item.term} className="flex gap-4">
                      <dt className="w-40 shrink-0 text-sm font-semibold text-slate-900">
                        {item.term}
                      </dt>
                      <dd className="text-sm leading-relaxed text-slate-500">
                        {item.detail}
                      </dd>
                    </div>
                  ))}
                </dl>
                {"footer" in section && section.footer && (
                  <p className="mt-6 text-sm leading-relaxed text-slate-400">
                    {section.footer}
                  </p>
                )}
              </>
            ) : (
              <div className="space-y-4">
                {"body" in section &&
                  Array.isArray(section.body) &&
                  section.body.map((paragraph, j) => (
                    <p
                      key={j}
                      className="text-base leading-relaxed text-slate-600"
                    >
                      {paragraph}
                    </p>
                  ))}
              </div>
            )}
          </section>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-24 border-t border-slate-100 pt-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <Link
            href={copy.cta.primary.href}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            <span>{copy.cta.primary.label}</span>
            <span className="opacity-60">→</span>
            <span className="opacity-60">{copy.cta.primary.action}</span>
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
      </div>
    </div>
  );
}
