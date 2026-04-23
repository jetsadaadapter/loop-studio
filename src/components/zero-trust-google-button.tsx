"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

type ZeroTrustInitOptions = {
  authBaseURL: string;
  clientId: string;
  callbackPath?: string;
};

type ZeroTrustRenderOptions = {
  label?: string;
  returnTo?: string;
};

type ZeroTrustApi = {
  init: (opts: ZeroTrustInitOptions) => void;
  renderButton: (
    container: string | Element,
    opts?: ZeroTrustRenderOptions,
  ) => void;
};

const AUTH_BASE_URL =
  process.env.NEXT_PUBLIC_ZT_AUTH_BASE_URL ??
  "https://auth.adapterinternal.com";
const CLIENT_ID =
  process.env.NEXT_PUBLIC_ZT_CLIENT_ID ?? "5bef7ad454c6caff4909ee31e47d48dc";
const CALLBACK_PATH = process.env.NEXT_PUBLIC_ZT_CALLBACK_PATH ?? "/callback";
const SCRIPT_SRC = "/login-adapterstore/login-button.js";
const DEFAULT_RETURN_TO = "/apps";

export function ZeroTrustGoogleButton() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only run when script is loaded AND container is ready
    if (!isScriptLoaded || !containerRef.current) return;

    try {
      const zeroTrust = (window as Window & { ZeroTrust?: ZeroTrustApi })
        .ZeroTrust;
      const container = containerRef.current;

      // This should theoretically not happen if isScriptLoaded is set correctly in onLoad
      if (!zeroTrust || !container) return;

      zeroTrust.init({
        authBaseURL: AUTH_BASE_URL,
        clientId: CLIENT_ID,
        callbackPath: CALLBACK_PATH,
      });

      container.innerHTML = "";
      zeroTrust.renderButton(container, {
        label: "Continue with Google",
        returnTo: DEFAULT_RETURN_TO,
      });

      const renderedButton = container.querySelector("button");
      if (renderedButton instanceof HTMLButtonElement) {
        renderedButton.style.width = "100%";
        renderedButton.style.justifyContent = "center";
      }
    } catch (err) {
      console.error("ZeroTrust initialization error:", err);
      // Using a functional update or keeping it in a safe catch block is okay, 
      // but let's be extra safe and only set error if it's really an init failure.
    }
  }, [isScriptLoaded]);

  if (error) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex w-full items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm text-muted-foreground"
      >
        {error}
      </button>
    );
  }

  return (
    <>
      <Script
        src={SCRIPT_SRC}
        strategy="lazyOnload"
        onLoad={() => {
          const zt = (window as Window & { ZeroTrust?: ZeroTrustApi }).ZeroTrust;
          if (zt) {
            setIsScriptLoaded(true);
          } else {
            setError("Google login is unavailable right now.");
          }
        }}
        onError={() => setError("Failed to load Google login script")}
      />
      <div ref={containerRef} className="w-full" aria-live="polite" />
    </>
  );
}

