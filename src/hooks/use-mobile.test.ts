import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useIsMobile } from "@/hooks/use-mobile";

// Safety net for the useIsMobile hook (Yellow/Green tier — logic-bearing).
// Drives real logic: it reads matchMedia at the 768px breakpoint, seeds state,
// and re-reads on the media "change" event. matchMedia is mocked (absent in jsdom).
function mockMatchMedia(initialMatches: boolean) {
  let handler: (() => void) | null = null;
  const mql = {
    matches: initialMatches,
    media: "",
    onchange: null,
    addEventListener: (_ev: string, cb: () => void) => {
      handler = cb;
    },
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
  window.matchMedia = vi
    .fn()
    .mockReturnValue(mql) as unknown as typeof window.matchMedia;
  return {
    mql,
    fireChange(matches: boolean) {
      mql.matches = matches;
      act(() => handler?.());
    },
  };
}

describe("useIsMobile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true when the viewport matches the mobile query", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("returns false on a desktop viewport", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("queries the 768px breakpoint (max-width: 767px)", () => {
    mockMatchMedia(false);
    renderHook(() => useIsMobile());
    expect(window.matchMedia).toHaveBeenCalledWith("(max-width: 767px)");
  });

  it("updates when the media query changes", () => {
    const ctl = mockMatchMedia(false);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
    ctl.fireChange(true);
    expect(result.current).toBe(true);
  });

  it("removes its listener on unmount", () => {
    const ctl = mockMatchMedia(false);
    const { unmount } = renderHook(() => useIsMobile());
    unmount();
    expect(ctl.mql.removeEventListener).toHaveBeenCalled();
  });
});
