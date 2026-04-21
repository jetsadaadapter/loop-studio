"use client";

import { useEffect, useState } from "react";

type ZeroTrustInitOptions = {
  authBaseURL: string;
  clientId: string;
  callbackPath?: string;
  onBeforeRedirect?: (payload: {
    returnTo: string;
    token: string;
    tokenType?: string;
    expiresIn?: number;
  }) => boolean | void;
};

type ZeroTrustApi = {
  init: (opts: ZeroTrustInitOptions) => void;
};

const AUTH_BASE_URL =
  process.env.NEXT_PUBLIC_ZT_AUTH_BASE_URL ??
  "https://auth.adapterinternal.com";
const CLIENT_ID =
  process.env.NEXT_PUBLIC_ZT_CLIENT_ID ?? "5bef7ad454c6caff4909ee31e47d48dc";
const CALLBACK_PATH = process.env.NEXT_PUBLIC_ZT_CALLBACK_PATH ?? "/callback";
const SCRIPT_SRC = "/login-adapterstore/login-button.js";
const IS_DEBUG_CALLBACK = process.env.NEXT_PUBLIC_ZT_DEBUG_CALLBACK === "true";

type CallbackPreview = {
  returnTo: string;
  tokenType?: string;
  expiresIn?: number;
  hasToken: boolean;
  code: string | null;
  state: string | null;
};

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

export default function CallbackPage() {
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<CallbackPreview | null>(null);

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
        if (!zeroTrust) {
          setError("Google login callback is unavailable.");
          return;
        }

        // init() triggers callback handling when pathname matches callbackPath.
        zeroTrust.init({
          authBaseURL: AUTH_BASE_URL,
          clientId: CLIENT_ID,
          callbackPath: CALLBACK_PATH,
          onBeforeRedirect: IS_DEBUG_CALLBACK
            ? (payload) => {
                const params = new URLSearchParams(window.location.search);
                setPreview({
                  returnTo: payload.returnTo,
                  tokenType: payload.tokenType,
                  expiresIn: payload.expiresIn,
                  hasToken: Boolean(payload.token),
                  code: params.get("code"),
                  state: params.get("state"),
                });
                return false;
              }
            : undefined,
        });
      } catch {
        if (!cancelled) {
          setError("Unable to complete Google login callback.");
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted p-6 text-center">
      <div className="max-w-md space-y-3 rounded-xl border bg-card p-6 text-left shadow-sm">
        <h1 className="text-lg font-semibold">
          {IS_DEBUG_CALLBACK ? "Callback details" : "Signing you in..."}
        </h1>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : preview ? (
          <>
            <p className="text-sm text-muted-foreground">
              Login callback completed. Review the data below before continuing.
            </p>
            <div className="space-y-1 rounded-md bg-muted p-3 text-xs">
              <p>
                <span className="font-medium">code:</span> {preview.code ?? "-"}
              </p>
              <p>
                <span className="font-medium">state:</span>{" "}
                {preview.state ?? "-"}
              </p>
              <p>
                <span className="font-medium">token type:</span>{" "}
                {preview.tokenType ?? "-"}
              </p>
              <p>
                <span className="font-medium">expires in:</span>{" "}
                {typeof preview.expiresIn === "number"
                  ? `${preview.expiresIn}s`
                  : "-"}
              </p>
              <p>
                <span className="font-medium">token stored:</span>{" "}
                {preview.hasToken ? "yes" : "no"}
              </p>
              <p className="break-all">
                <span className="font-medium">return to:</span>{" "}
                {preview.returnTo}
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.location.replace(preview.returnTo)}
              className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Continue to app
            </button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Please wait while we complete your Google login callback.
          </p>
        )}
      </div>
    </main>
  );
}
