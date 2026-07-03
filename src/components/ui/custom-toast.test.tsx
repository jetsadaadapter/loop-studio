import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock the 3rd-party sonner so we can assert how customToast routes into it.
vi.mock("sonner", () => ({
  toast: {
    custom: vi.fn(() => "toast-id"),
    dismiss: vi.fn(),
    loading: vi.fn(),
  },
}));

import { toast as sonnerToast } from "sonner";
import { customToast } from "@/components/ui/custom-toast";

// Safety net for customToast (Yellow/Green tier — logic-bearing). It wraps sonner
// with custom-rendered toasts + a promise flow. We assert the routing into sonner,
// render one toast's content function, and the resolve/reject promise behavior.
const custom = sonnerToast.custom as unknown as ReturnType<typeof vi.fn>;
const dismiss = sonnerToast.dismiss as unknown as ReturnType<typeof vi.fn>;
const loading = sonnerToast.loading as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("customToast routing", () => {
  it("success() renders a custom toast whose content shows the message", () => {
    customToast.success("Saved!");
    expect(custom).toHaveBeenCalledTimes(1);
    // The first arg is a (id) => ReactNode render function — render it and check.
    const renderFn = custom.mock.calls[0][0] as (id: string) => React.ReactNode;
    render(<>{renderFn("id-1")}</>);
    expect(screen.getByText("Saved!")).toBeInTheDocument();
  });

  it("error() routes through toast.custom", () => {
    customToast.error("Boom");
    expect(custom).toHaveBeenCalledTimes(1);
  });

  it("dismiss(id) forwards to sonner", () => {
    customToast.dismiss("abc");
    expect(dismiss).toHaveBeenCalledWith("abc");
  });

  it("loading() forwards to sonner", () => {
    customToast.loading("Working…");
    expect(loading).toHaveBeenCalledWith("Working…", undefined);
  });

  it("custom is the sonner custom fn", () => {
    expect(customToast.custom).toBe(sonnerToast.custom);
  });
});

describe("customToast.promise", () => {
  it("dismisses the pending toast and shows success on resolve", async () => {
    customToast.promise(Promise.resolve("data"), {
      loading: "Loading…",
      success: "Done",
      error: "Failed",
    });
    await vi.waitFor(() => {
      // the pending toast id ("toast-id") is dismissed...
      expect(dismiss).toHaveBeenCalledWith("toast-id");
    });
    // ...and a success toast is rendered (a second custom call: pending + success)
    expect(custom.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("dismisses the pending toast and shows error on reject", async () => {
    customToast.promise(Promise.reject(new Error("nope")), {
      loading: "Loading…",
      success: "Done",
      error: "Failed",
    });
    await vi.waitFor(() => {
      expect(dismiss).toHaveBeenCalledWith("toast-id");
    });
    expect(custom.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
