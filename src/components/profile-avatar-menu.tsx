"use client";

import Image from "next/image";
import { type ComponentType, useEffect, useRef, useState } from "react";
import { LogOut, Settings } from "lucide-react";

type MenuItem = {
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const menuItems: MenuItem[] = [
  { label: "Settings", icon: Settings },
  { label: "Sign out", icon: LogOut },
];

function MenuSection({ items }: { items: MenuItem[] }) {
  return (
    <div className="border-t border-slate-200 px-2 py-3">
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          className="flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left text-xs text-slate-700 transition hover:bg-slate-100"
        >
          <item.icon className="size-5 text-slate-500" />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

export function ProfileAvatarMenu() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEsc);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        aria-label="Open profile menu"
        aria-haspopup="menu"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white p-0.5 shadow-sm transition hover:border-slate-300"
      >
        <Image
          src="/images/profile/avatar-jetsada.svg"
          alt="Jetsada Saokaew"
          width={40}
          height={40}
          className="h-9 w-9 rounded-full object-cover"
        />
      </button>

      {open ? (
        <div className="absolute right-0 top-14 z-50 w-80 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="px-5 pb-5 pt-6">
            <div className="flex items-center gap-4">
              <Image
                src="/images/profile/avatar-jetsada.svg"
                alt="Jetsada Saokaew"
                width={52}
                height={52}
                className="size-13 rounded-full object-cover"
              />
              <div>
                <p className="text-lg font-semibold leading-tight text-slate-900">
                  Jetsada Saokaew
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  jetsada@adapterdigital.com
                </p>
              </div>
            </div>

            <button
              type="button"
              className="mt-5 w-full rounded-full border border-slate-300 px-4 py-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Manage your Google Account
            </button>
          </div>

          <MenuSection items={menuItems} />

          <div className="border-t border-slate-200 px-5 py-4 text-center text-xs text-slate-500">
            <button type="button" className="transition hover:text-slate-800">
              Privacy Policy
            </button>
            <span className="px-2">•</span>
            <button type="button" className="transition hover:text-slate-800">
              Terms of Service
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
