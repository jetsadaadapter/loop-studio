import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { Switch } from "@/components/ui/switch";

// Safety net for the Switch (fan-out 11, Orange tier per LOOP-ENGINEERING.md).
// Built on @base-ui/react/switch. No toMatchSnapshot: base-ui may embed an
// order-dependent React.useId, so we assert the class-regression tokens + the
// data contracts + the real toggle/disabled behavior instead.

describe("Switch", () => {
  it("renders a switch with data-slot and default size", () => {
    render(<Switch />);
    const el = screen.getByRole("switch");
    expect(el).toHaveAttribute("data-slot", "switch");
    expect(el).toHaveAttribute("data-size", "default");
  });

  it("honors the sm size", () => {
    render(<Switch size="sm" />);
    expect(screen.getByRole("switch")).toHaveAttribute("data-size", "sm");
  });

  it("locks the base class tokens", () => {
    render(<Switch />);
    const cls = screen.getByRole("switch").className;
    for (const token of [
      "rounded-full",
      "data-[size=default]:h-[18.4px]",
      "data-[size=sm]:h-[14px]",
      "data-checked:bg-emerald-500",
    ]) {
      expect(cls).toContain(token);
    }
  });

  it("merges a custom className", () => {
    render(<Switch className="custom-x" />);
    expect(screen.getByRole("switch").className).toContain("custom-x");
  });

  it("renders the thumb with its data-slot", () => {
    const { container } = render(<Switch />);
    expect(
      container.querySelector('[data-slot="switch-thumb"]'),
    ).not.toBeNull();
  });

  it("reflects the checked state", () => {
    render(<Switch defaultChecked />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("fires onCheckedChange when toggled", () => {
    const onCheckedChange = vi.fn();
    render(<Switch onCheckedChange={onCheckedChange} />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it("does not toggle when disabled", () => {
    const onCheckedChange = vi.fn();
    render(<Switch disabled onCheckedChange={onCheckedChange} />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
