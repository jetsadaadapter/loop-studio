"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LogOut } from "lucide-react";
import type { UserProfile } from "@/core/interfaces/auth.interface";
import { getUserProfile } from "@/core/services/library.service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LEGAL_LINKS } from "@/lib/legal-links";

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

function getProfileMonogram(profile: UserProfile | null): string {
  if (!profile) return "UP";

  const firstName = profile.firstName.trim();
  const lastName = profile.lastName.trim();
  const firstInitial = firstName.charAt(0);
  const lastInitial = lastName.charAt(0);
  const monogram = `${firstInitial}${lastInitial}`.trim().toUpperCase();

  if (monogram) return monogram;
  if (firstName) return firstName.slice(0, 2).toUpperCase();
  if (lastName) return lastName.slice(0, 2).toUpperCase();

  return "UP";
}

export function MobileProfilePanel() {
  const {
    profileName,
    profileEmail,
    profileDepartment,
    profilePosition,
    profileImage,
    profileInitials,
  } = useProfileData();

  return (
    <div className="border-t border-slate-200">
      {/* Profile card */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-4">
          <div className="shrink-0 rounded-full bg-brand/20 p-1 shadow-inner ring-1 ring-slate-200/80">
            <Avatar className="size-14 bg-white">
              {profileImage ? (
                <AvatarImage src={profileImage} alt={profileName} />
              ) : null}
              <AvatarFallback className="bg-brand text-base font-semibold tracking-tight text-white shadow-inner">
                {profileInitials}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold leading-tight text-slate-900">
              {profileName}
            </p>
            <p className="mt-0.5 text-sm text-slate-500">{profileEmail}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[11px] text-slate-500">
              <span className="rounded-full bg-slate-100/90 px-2.5 py-1 font-medium text-slate-700 ring-1 ring-slate-200/80">
                {profileDepartment}
              </span>
              <span className="font-medium text-slate-500">
                {profilePosition}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sign out */}
      <div className="border-t border-slate-200 px-3 py-2">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-100"
        >
          <LogOut className="size-5 text-slate-500" />
          <span>Sign out</span>
        </button>
      </div>

      {/* Legal links */}
      <div className="border-t border-slate-200 px-5 py-4 text-center text-xs text-slate-500">
        <a
          href={LEGAL_LINKS.privacyPolicy}
          target="_blank"
          rel="noreferrer"
          className="transition hover:text-slate-800"
        >
          Privacy Policy
        </a>
        <span className="px-2">·</span>
        <a
          href={LEGAL_LINKS.termsOfService}
          target="_blank"
          rel="noreferrer"
          className="transition hover:text-slate-800"
        >
          Terms of Service
        </a>
      </div>
    </div>
  );
}

function useProfileData() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getUserProfile()
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const profileName = useMemo(() => {
    if (!profile) return "User Profile";
    return `${profile.firstName} ${profile.lastName}`.trim();
  }, [profile]);

  const profileEmail = useMemo(() => {
    if (!profile) return "user@adapterdigital.com";
    return profile.email;
  }, [profile]);

  const profileDepartment = useMemo(
    () => profile?.department?.trim() || "Department",
    [profile],
  );
  const profilePosition = useMemo(
    () => profile?.position?.trim() || "Position",
    [profile],
  );
  const profileImage = useMemo(() => profile?.image?.trim() || null, [profile]);
  const profileInitials = useMemo(() => getProfileMonogram(profile), [profile]);

  return {
    profile,
    profileName,
    profileEmail,
    profileDepartment,
    profilePosition,
    profileImage,
    profileInitials,
  };
}

export function ProfileAvatarMenu() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const {
    profileName,
    profileEmail,
    profileDepartment,
    profilePosition,
    profileImage,
    profileInitials,
  } = useProfileData();

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
        className="inline-flex size-11.5 items-center justify-center rounded-full bg-brand/20 p-0.75 shadow-[0_10px_24px_-14px_rgba(15,23,42,0.55)] ring-1 ring-slate-200/80 transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-16px_rgba(15,23,42,0.65)]"
      >
        <Avatar className="h-full w-full bg-white">
          {profileImage ? (
            <AvatarImage src={profileImage} alt={profileName} />
          ) : null}
          <AvatarFallback className="bg-brand text-[11px] font-semibold tracking-tight text-white shadow-inner">
            {profileInitials}
          </AvatarFallback>
        </Avatar>
      </button>

      {open ? (
        <div className="absolute right-0 top-14 z-50 w-80 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="bg-linear-to-br from-slate-50 via-white to-sky-50/70 px-5 pb-5 pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-brand/20 p-1 shadow-inner ring-1 ring-slate-200/80">
                <Avatar className="size-13 bg-white">
                  {profileImage ? (
                    <AvatarImage src={profileImage} alt={profileName} />
                  ) : null}
                  <AvatarFallback className="bg-brand text-base font-semibold tracking-tight text-white shadow-inner">
                    {profileInitials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="min-w-0">
                <p className="text-lg font-semibold leading-tight text-slate-900">
                  {profileName}
                </p>
                <p className="mt-1 text-sm text-slate-600">{profileEmail}</p>
                <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[11px] text-slate-500">
                  <span className="rounded-full bg-slate-100/90 px-2.5 py-1 font-medium text-slate-700 ring-1 ring-slate-200/80">
                    {profileDepartment}
                  </span>
                  <span className="font-medium text-slate-500">
                    {profilePosition}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <MenuSection items={menuItems} />

          <div className="border-t border-slate-200 px-5 py-4 text-center text-xs text-slate-500">
            <a
              href={LEGAL_LINKS.privacyPolicy}
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-slate-800"
            >
              Privacy Policy
            </a>
            <span className="px-2">•</span>
            <a
              href={LEGAL_LINKS.termsOfService}
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-slate-800"
            >
              Terms of Service
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
