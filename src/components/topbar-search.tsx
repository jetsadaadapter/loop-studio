"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function TopbarSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const closeSearch = () => {
    setIsOpen(false);
  };

  const clearSearch = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open search"
        className="inline-flex size-10 items-center justify-center rounded-full border border-slate-300 text-slate-700 transition hover:bg-slate-50"
      >
        <Search className="size-4" />
      </button>
    );
  }

  return (
    <div className="relative w-52 sm:w-72 md:w-96">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onBlur={() => {
          closeSearch();
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            closeSearch();
          }
        }}
        placeholder="Search for apps"
        className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm outline-none transition focus:border-brand focus:bg-white"
      />
      {query && (
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={clearSearch}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
