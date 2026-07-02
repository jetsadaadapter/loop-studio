import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";

// Dev-only visual-regression fixture. NOT a product route.
// Gated three ways so it can never render in production:
//   1. proxy.ts only adds "/dev" to PUBLIC_PATHS when NODE_ENV !== "production"
//   2. this notFound() guard
//   3. no navigation ever links here
export const dynamic = "force-dynamic";

// Mirrors the cva() config in src/components/ui/button.tsx exactly — read from
// the real source, not guessed. Keep in sync if buttonVariants() changes.
const VARIANTS = [
  "default",
  "outline",
  "secondary",
  "ghost",
  "destructive",
  "link",
] as const;

const SIZES = [
  "default",
  "xs",
  "sm",
  "lg",
  "icon",
  "icon-xs",
  "icon-sm",
  "icon-lg",
] as const;

// Fixed inline glyph for the icon-* sizes (square buttons that expect an icon).
// Inline SVG avoids any icon-font/network load timing that could flake screenshots.
function Glyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="6" fill="currentColor" />
    </svg>
  );
}

export default function ComponentGalleryPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div
      data-testid="gallery-root"
      className="bg-white p-8 text-slate-900"
      style={{ minWidth: 1024 }}
    >
      <h1 className="mb-6 text-xl font-semibold">Button Gallery</h1>
      <div className="flex flex-col gap-6">
        {VARIANTS.map((variant) => (
          <section key={variant} className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-slate-500">{variant}</h2>
            <div className="flex flex-wrap items-center gap-3">
              {SIZES.map((size) => (
                <Button
                  key={size}
                  variant={variant}
                  size={size}
                  data-testid={`button-${variant}-${size}`}
                >
                  {size.startsWith("icon") ? <Glyph /> : variant}
                </Button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
