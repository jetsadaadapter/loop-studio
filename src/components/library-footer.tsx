"use client";

import Image from "next/image";
import { libraryFooterLinks, libraryShellCopy } from "@/app/library/layout.data";

export function LibraryFooter() {
  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-4 py-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Image
              src="/images/logo/logo-white-330x99.svg"
              alt="Adapter Digital Group"
              width={110}
              height={30}
              className="h-6 w-auto"
            />
            <div className="mt-3 text-xs leading-relaxed text-white/75">
              <span className="block font-semibold text-white">
                {libraryShellCopy.tagline}
              </span>
              <span className="mt-1 block">
                {libraryShellCopy.description}
              </span>
            </div>
          </div>

          {Object.entries(libraryFooterLinks).map(([heading, links]) => (
            <div key={heading}>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-white">
                {heading}
              </h2>
              <ul className="mt-3 space-y-2 text-xs text-white/75">
                {links.map((item, index) => (
                  <li key={`${heading}:${item.label}:${index}`}>
                    <a
                      href={item.href}
                      target={
                        item.href.startsWith("http") ? "_blank" : undefined
                      }
                      rel={
                        item.href.startsWith("http")
                          ? "noreferrer"
                          : undefined
                      }
                      className="transition hover:text-white"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="relative mt-8 flex flex-col items-start justify-between gap-3 pt-6 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.95),transparent)] sm:flex-row sm:items-center">
          <p className="text-xs text-white">
            &copy; {new Date().getFullYear()} Adapter Digital Group. All
            rights reserved.
          </p>
          <div className="flex items-center gap-1">
            <span className="inline-block size-2 rounded-full bg-brand" />
            <span className="text-xs font-medium text-white">
              {libraryShellCopy.title}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
