import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { ManageRefreshButton } from "@/components/ui/manage-refresh-button";

// Safety net for ManageRefreshButton (fan-out 10, Orange tier per LOOP-ENGINEERING.md).
// No snapshot: it renders a locale/timezone-dependent date (CI runs UTC, would be
// brittle — Stage 6 lesson #2) and wraps the base-ui Button (order-dependent useId).
// Assert behavior + the TZ-safe "Updated " prefix instead.

describe("ManageRefreshButton", () => {
  it("calls onRefresh when clicked", () => {
    const onRefresh = vi.fn();
    render(<ManageRefreshButton onRefresh={onRefresh} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("is disabled and does not refresh while loading", () => {
    const onRefresh = vi.fn();
    render(<ManageRefreshButton onRefresh={onRefresh} isLoading />);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("is disabled while refreshing", () => {
    render(<ManageRefreshButton onRefresh={vi.fn()} isRefreshing />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("shows the last-updated timestamp when provided", () => {
    render(
      <ManageRefreshButton
        onRefresh={vi.fn()}
        lastUpdatedAt={new Date("2026-01-02T03:04:05Z")}
      />,
    );
    // TZ-safe: assert the label prefix, not the formatted date value.
    expect(screen.getByText(/^Updated /)).toBeInTheDocument();
  });

  it("omits the timestamp when lastUpdatedAt is not provided", () => {
    render(<ManageRefreshButton onRefresh={vi.fn()} />);
    expect(screen.queryByText(/^Updated /)).toBeNull();
  });

  it("uses a custom title on the button", () => {
    render(<ManageRefreshButton onRefresh={vi.fn()} title="Reload data" />);
    expect(screen.getByRole("button")).toHaveAttribute("title", "Reload data");
  });

  it("spins the icon while refreshing", () => {
    const { container } = render(
      <ManageRefreshButton onRefresh={vi.fn()} isRefreshing />,
    );
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("class")).toContain("animate-spin");
  });
});
