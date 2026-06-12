"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
import { LibraryFooter } from "@/components/library-footer";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
} from "@/components/ui/sheet";
import { type MainTabKey } from "./apps/data";

type LibraryShellContextValue = {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  visibleCategoryKeys: MainTabKey[];
  setVisibleCategoryKeys: (keys: MainTabKey[]) => void;
  activeCategory: MainTabKey | null;
  setActiveCategory: (key: MainTabKey | null) => void;
  isFullWidth?: boolean;
  setIsFullWidth?: (val: boolean) => void;
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
  const [isFullWidth, setIsFullWidth] = useState(false);
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
      isFullWidth,
      setIsFullWidth,
    }),
    [searchQuery, visibleCategoryKeys, activeCategory, isFullWidth],
  );

  return (
    <LibraryShellContext.Provider value={value}>
      <div className="min-h-screen bg-white">
        <header
          className={`sticky top-0 z-30 transition-all duration-200 ${hasScrolled
            ? "border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur"
            : "border-b border-transparent bg-transparent shadow-none backdrop-blur-0"
            }`}
        >
          <div className="flex h-16 w-full items-center gap-4 px-4 sm:px-4">
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
            <div className="hidden h-5 w-px shrink-0 bg-slate-200 md:block" />

            {/* Desktop nav — hidden on mobile */}
            <nav className="hidden h-full flex-1 items-stretch gap-6 md:flex">
              {pathname !== "/apps" && pathname !== "/" && (
                <Link
                  href="/apps"
                  className={`relative inline-flex h-full items-center px-0 text-sm font-semibold transition-colors motion-enter-1 after:absolute after:bottom-0 after:left-1/2 after:h-1 after:w-8 after:-translate-x-1/2 after:rounded-t-full after:bg-brand after:origin-center after:transition-transform after:duration-300 ${pathname === "/apps" || pathname === "/"
                    ? "text-slate-900 after:scale-x-100"
                    : "text-slate-500 after:scale-x-0 hover:text-slate-900 hover:after:scale-x-100"
                    }`}
                >
                  Home
                </Link>
              )}
              <Link
                href="/about"
                className={`relative inline-flex h-full items-center px-0 text-sm font-semibold transition-colors after:absolute after:bottom-0 after:left-1/2 after:h-1 after:w-8 after:-translate-x-1/2 after:rounded-t-full after:bg-brand after:origin-center after:transition-transform after:duration-300 ${pathname?.startsWith("/about")
                  ? "text-slate-900 after:scale-x-100 motion-enter-1"
                  : "text-slate-500 after:scale-x-0 hover:text-slate-900 hover:after:scale-x-100 motion-enter-2"
                  }`}
              >
                About us
              </Link>
            </nav>

            {/* Right side */}
            <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0">
              {/* Avatar — desktop only */}
              <div className="hidden motion-enter-3 md:block">
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
                  className="max-w-75! flex flex-col gap-0 p-0 duration-500!"
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
                    <nav className="space-y-0">
                      {pathname !== "/apps" && pathname !== "/" && (
                        <Link
                          href="/apps"
                          className={`relative flex items-center gap-0 rounded-xl px-5 py-3 text-sm transition-all motion-enter-1 ${pathname === "/apps" || pathname === "/"
                            ? "font-bold text-slate-900"
                            : "font-medium text-slate-600 hover:text-slate-900"
                            }`}
                        >
                          {(pathname === "/apps" || pathname === "/") && (
                            <span className="absolute left-0 h-4 w-1 rounded-r-full bg-brand" />
                          )}
                          Home
                        </Link>
                      )}
                      <Link
                        href="/about"
                        className={`relative flex items-center gap-0 rounded-xl px-5 py-3 text-sm transition-all ${pathname?.startsWith("/about")
                          ? "font-bold text-slate-900 motion-enter-1"
                          : "font-medium text-slate-600 hover:text-slate-900 motion-enter-2"
                          }`}
                      >
                        {pathname?.startsWith("/about") && (
                          <span className="absolute left-0 h-4 w-1 rounded-r-full bg-brand" />
                        )}
                        About us
                      </Link>
                    </nav>
                  </div>

                  {/* Profile panel — pinned to bottom */}
                  <MobileProfilePanel />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>

        <main
          className={cn(
            "mx-auto w-full transition-all duration-300 px-0 xs:px-4",
            isFullWidth ? "max-w-none px-0 xs:px-4 md:px-10" : "max-w-6xl"
          )}
        >
          {children}
        </main>

        <LibraryFooter />
      </div>
    </LibraryShellContext.Provider>
  );
}
