"use client";

import { useEffect, useRef, useState } from "react";

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

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-zt-script="${src}"]`,
    );

    if (existing) {
      if ((window as Window & { ZeroTrust?: ZeroTrustApi }).ZeroTrust) {
        resolve();
        return;
      }

      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load ZeroTrust script")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.ztScript = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load ZeroTrust script"));

    document.body.appendChild(script);
  });
}

export function ZeroTrustGoogleButton() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        await loadScript(SCRIPT_SRC);

        if (cancelled) {
          return;
        }

        const zeroTrust = (window as Window & { ZeroTrust?: ZeroTrustApi })
          .ZeroTrust;
        const container = containerRef.current;

        if (!zeroTrust || !container) {
          setError("Google login is unavailable right now.");
          return;
        }

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
      } catch {
        if (!cancelled) {
          setError("Unable to load Google login.");
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

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

  return <div ref={containerRef} className="w-full" aria-live="polite" />;
}
