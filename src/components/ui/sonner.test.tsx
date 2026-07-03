import { describe, it, expect, beforeAll } from "vitest";
import { render } from "@testing-library/react";

import { Toaster, customToast } from "@/components/ui/sonner";

// Safety net for the Toaster wrapper (fan-out 8, Orange tier per LOOP-ENGINEERING.md).
// This is a thin CONFIG wrapper over the 3rd-party `sonner` Toaster (icons/theme/
// style/toastOptions) plus a re-export of customToast — it has almost no own-logic.
// We assert what is actually ours and non-brittle: the wrapper mounts without
// throwing (config + useTheme integrate cleanly) and the re-export contract holds.
// We deliberately do NOT assert sonner's internal DOM (3rd-party, version-specific).
beforeAll(() => {
  // next-themes/sonner resolve the "system" theme via matchMedia, absent in jsdom.
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return false;
      },
    })) as unknown as typeof window.matchMedia;
  }
});

describe("Toaster wrapper", () => {
  it("mounts without throwing (config + useTheme integrate)", () => {
    expect(() => render(<Toaster />)).not.toThrow();
  });

  it("mounts without throwing when props are forwarded", () => {
    expect(() => render(<Toaster position="top-center" />)).not.toThrow();
  });

  it("re-exports customToast from ./custom-toast", () => {
    expect(customToast).toBeDefined();
  });
});
