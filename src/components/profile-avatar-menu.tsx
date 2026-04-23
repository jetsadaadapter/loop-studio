"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { LogOut } from "lucide-react";

async function handleSignOut() {
  const zt = (window as { ZeroTrust?: { logout: (path?: string) => void } })
    .ZeroTrust;

  // Clear HttpOnly cookie on our server
  await fetch("/api/auth/zt-cookie", { method: "DELETE" }).catch(() => {});

  if (zt?.logout) {
    zt.logout("/login");
  } else {
    // Fallback: clear manually (in case of old non-HttpOnly cookie leftovers) and redirect
    document.cookie =
      "zt_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    window.location.href = "/login";
  }
}

type MenuItem = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
};

function MenuSection({ items }: { items: MenuItem[] }) {
  return (
    <div className="border-t border-slate-200 px-2 py-3">
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={item.onClick}
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

  const menuItems: MenuItem[] = [
    { label: "Sign out", icon: LogOut, onClick: handleSignOut },
  ];

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
