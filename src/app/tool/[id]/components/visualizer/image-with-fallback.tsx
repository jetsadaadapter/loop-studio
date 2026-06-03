"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ImageOff } from "lucide-react";

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

  const handleError = () => {
    setErrored(true);
    onError?.();
  };

  if (errored || !safeSrc) {
    return (
      <div className={cn("flex flex-col items-center justify-center bg-slate-100 text-slate-400", className)}>
        <ImageOff className="size-4" />
      </div>
    );
  }
  return (
    <img
      src={safeSrc}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
}
