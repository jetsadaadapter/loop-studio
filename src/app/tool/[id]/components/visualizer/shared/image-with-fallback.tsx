"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ImageOff } from "lucide-react";

const PROXY_PATTERNS = [
  /(^|\.)fbcdn\.net$/,
  /(^|\.)facebook\.com$/,
  /(^|\.)akamaihd\.net$/,
];

/** Utility to rewrite Facebook/CDN image URLs to go through our secure proxy endpoint */
export function getProxiedUrl(src?: string | null): string {
  if (!src) return "";
  const trimmed = src.trim();

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const url = new URL(trimmed);
      const hostname = url.hostname.toLowerCase();
      const needsProxy = PROXY_PATTERNS.some((pattern) => pattern.test(hostname));

      if (needsProxy) {
        return `/api/image-proxy?url=${encodeURIComponent(trimmed)}`;
      }
    } catch {
      // Return original URL if parsing fails
    }
  }

  return trimmed;
}

/** Gracefully handles expired/broken signed URLs with an elegant placeholder */
export function ImageWithFallback({
  src,
  alt,
  className,
  onError,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  onError?: () => void;
}) {
  const [errored, setErrored] = useState(false);
  const safeSrc = typeof src === "string" ? src.trim() : "";
  const proxiedSrc = getProxiedUrl(safeSrc);

  const handleError = () => {
    setErrored(true);
    onError?.();
  };

  if (errored || !proxiedSrc) {
    return (
      <div className={cn("flex flex-col items-center justify-center bg-slate-100 text-slate-400", className)}>
        <ImageOff className="size-4" />
      </div>
    );
  }
  return (
    <img
      src={proxiedSrc}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
}

