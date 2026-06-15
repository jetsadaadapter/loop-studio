"use client";

import { useEffect, useMemo, useState } from "react";
import type { UserProfile } from "@/core/interfaces/auth.interface";
import { getUserProfile } from "@/core/services/users.service";

export async function handleSignOut() {
  const zt = (window as { ZeroTrust?: { logout: (path?: string) => void } })
    .ZeroTrust;

  // Clear HttpOnly cookie on our server
  await fetch("/api/auth/zt-cookie", { method: "DELETE" }).catch(() => { });

  if (zt?.logout) {
    zt.logout("/login");
  } else {
    // Fallback: clear manually (in case of old non-HttpOnly cookie leftovers) and redirect
    document.cookie =
      "zt_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    window.location.href = "/login";
  }
}

export function getProfileMonogram(profile: UserProfile | null): string {
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

export function useProfileData() {
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
  const isAdmin = useMemo(
    () => profile?.roles?.includes("admin") ?? false,
    [profile],
  );

  return {
    profile,
    profileName,
    profileEmail,
    profileDepartment,
    profilePosition,
    profileImage,
    profileInitials,
    isAdmin,
  };
}
