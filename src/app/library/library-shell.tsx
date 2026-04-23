"use client";

import Image from "next/image";
import Link from "next/link";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { ProfileAvatarMenu } from "@/components/profile-avatar-menu";
import { libraryFooterLinks, libraryShellCopy } from "./layout.data";

type LibraryShellContextValue = {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
};

const LibraryShellContext = createContext<LibraryShellContextValue | null>(null);

export function useLibraryShell() {
  const context = useContext(LibraryShellContext);

  if (!context) {
    throw new Error("useLibraryShell must be used within LibraryShell");
  }

  return context;
}

export function LibraryShell({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("");
  // Edge Middleware handles auth protection

  const value = useMemo(() => ({ searchQuery, setSearchQuery }), [searchQuery]);

  return (
    <LibraryShellContext.Provider value={value}>
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-16 w-full items-center gap-3 px-4 md:px-6">
            <Link href="/apps" className="flex items-center gap-3">
              <h1 className="sr-only">Adapter Library</h1>
              <Image
                src="/images/logo/logo-black-110x30.png"
                alt="Adapter Digital Group"
                width={120}
                height={36}
                className="h-7 w-auto"
                priority
              />
            </Link>
            <div className="ml-auto flex items-center gap-2">
              <ProfileAvatarMenu />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-10 pt-5 md:px-6">
          {children}
        </main>

        <footer className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              <div className="col-span-2 sm:col-span-1">
                <Image
                  src="/images/logo/logo-black-110x30.png"
                  alt="Adapter Digital Group"
                  width={110}
                  height={30}
                  className="h-6 w-auto"
                />
                <p className="mt-3 text-xs leading-relaxed text-slate-600">
                  {libraryShellCopy.description}
                </p>
              </div>

              {Object.entries(libraryFooterLinks).map(([heading, links]) => (
                <div key={heading}>
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-900">
                    {heading}
                  </h2>
                  <ul className="mt-3 space-y-2 text-xs text-slate-600">
                    {links.map((item) => (
                      <li key={item}>
                        <a href="#" className="transition hover:text-slate-900">
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center">
              <p className="text-xs text-slate-500">
                &copy; {new Date().getFullYear()} Adapter Digital Group. All
                rights reserved.
              </p>
              <div className="flex items-center gap-1">
                <span className="inline-block size-2 rounded-full bg-brand" />
                <span className="text-xs font-medium text-slate-600">
                  {libraryShellCopy.title}
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </LibraryShellContext.Provider>
  );
}
