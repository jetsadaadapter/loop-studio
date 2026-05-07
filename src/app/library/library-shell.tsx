"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useEffect,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MenuIcon } from "lucide-react";
import {
  ProfileAvatarMenu,
  MobileProfilePanel,
} from "@/components/profile-avatar-menu";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
} from "@/components/ui/sheet";
import { libraryFooterLinks, libraryShellCopy } from "./layout.data";
import { mainTabs, type MainTabKey } from "./apps/data";

type LibraryShellContextValue = {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  visibleCategoryKeys: MainTabKey[];
  setVisibleCategoryKeys: (keys: MainTabKey[]) => void;
  activeCategory: MainTabKey | null;
  setActiveCategory: (key: MainTabKey | null) => void;
};

const LibraryShellContext = createContext<LibraryShellContextValue | null>(
  null,
);

export function useLibraryShell() {
  const context = useContext(LibraryShellContext);

  if (!context) {
    throw new Error("useLibraryShell must be used within LibraryShell");
  }

  return context;
}

export function LibraryShell({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [hasScrolled, setHasScrolled] = useState(false);
  const [visibleCategoryKeys, setVisibleCategoryKeys] = useState<MainTabKey[]>(
    [],
  );
  const [activeCategory, setActiveCategory] = useState<MainTabKey | null>(null);
  const pathname = usePathname();
  // Edge Middleware handles auth protection

  useEffect(() => {
    const onScroll = () => {
      setHasScrolled(window.scrollY > 8);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const value = useMemo(
    () => ({
      searchQuery,
      setSearchQuery,
      visibleCategoryKeys,
      setVisibleCategoryKeys,
      activeCategory,
      setActiveCategory,
    }),
    [searchQuery, visibleCategoryKeys, activeCategory],
  );

  const navItems = [
    { label: "About us", href: "/about", isLink: true as const },
    ...visibleCategoryKeys.map((key) => {
      const tab = mainTabs.find((t) => t.key === key)!;
      return { label: tab.label, key, isLink: false as const };
    }),
  ];

  return (
    <LibraryShellContext.Provider value={value}>
      <div className="min-h-screen bg-white">
        <header
          className={`sticky top-0 z-30 transition-all duration-200 ${
            hasScrolled
              ? "border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur"
              : "border-b border-transparent bg-transparent shadow-none backdrop-blur-0"
          }`}
        >
          <div className="flex h-16 w-full items-center gap-4 px-4 md:px-6">
            {/* Logo */}
            <Link href="/apps" className="flex shrink-0 items-center">
              <h1 className="sr-only">Adapter Library</h1>
              <Image
                src="/images/logo/logo-black-383x115.svg"
                alt="Adapter Digital Group"
                width={120}
                height={36}
                className="h-7 w-auto"
                priority
              />
            </Link>

            {/* Divider */}
            <div className="h-5 w-px shrink-0 bg-slate-200" />

            {/* Desktop nav — hidden on mobile */}
            <nav className="hidden flex-1 items-center gap-1 md:flex">
              <Link
                href="/about"
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  pathname?.startsWith("/about")
                    ? "bg-slate-100 text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                About us
              </Link>
              {visibleCategoryKeys.map((key) => {
                const tab = mainTabs.find((t) => t.key === key);
                if (!tab) return null;
                const isActive =
                  activeCategory === key && !pathname?.startsWith("/about");
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveCategory(isActive ? null : key)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-slate-100 text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0">
              {/* Avatar — desktop only */}
              <div className="hidden md:block">
                <ProfileAvatarMenu />
              </div>

              {/* Hamburger — mobile only */}
              <Sheet>
                <SheetTrigger
                  className="flex size-5 items-center justify-center rounded-full text-gray-600 transition hover:bg-slate-100 hover:text-gray-900 md:hidden"
                  aria-label="Open menu"
                >
                  <MenuIcon className="size-5" />
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="max-w-75! flex flex-col gap-0 p-0"
                >
                  {/* Sheet header — logo only */}
                  <SheetHeader className="shrink-0 border-b border-slate-100 px-5 py-4">
                    <Link href="/apps" className="flex items-center">
                      <Image
                        src="/images/logo/logo-black-383x115.svg"
                        alt="Adapter Digital Group"
                        width={120}
                        height={36}
                        className="h-7 w-auto"
                      />
                    </Link>
                  </SheetHeader>

                  {/* Nav items — scrollable middle */}
                  <div className="flex-1 overflow-y-auto px-3 py-3">
                    <nav className="space-y-1">
                      {navItems.map((item) =>
                        item.isLink ? (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium text-gray-900 transition hover:bg-slate-100"
                          >
                            {item.label}
                          </Link>
                        ) : (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => {
                              const isActive = activeCategory === item.key;
                              setActiveCategory(isActive ? null : item.key);
                            }}
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-medium text-gray-900 transition hover:bg-slate-100"
                          >
                            {item.label}
                          </button>
                        ),
                      )}
                    </nav>
                  </div>

                  {/* Profile panel — pinned to bottom */}
                  <MobileProfilePanel />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-5 md:px-6">
          {children}
        </main>

        <footer className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              <div className="col-span-2 sm:col-span-1">
                <Image
                  src="/images/logo/logo-black-383x115.svg"
                  alt="Adapter Digital Group"
                  width={110}
                  height={30}
                  className="h-6 w-auto"
                />
                <p className="mt-3 text-xs leading-relaxed text-slate-600">
                  <span className="block font-semibold text-slate-800">
                    {libraryShellCopy.tagline}
                  </span>
                  <span className="mt-1 block">
                    {libraryShellCopy.description}
                  </span>
                </p>
              </div>

              {Object.entries(libraryFooterLinks).map(([heading, links]) => (
                <div key={heading}>
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-900">
                    {heading}
                  </h2>
                  <ul className="mt-3 space-y-2 text-xs text-slate-600">
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
                          className="transition hover:text-slate-900"
                        >
                          {item.label}
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
