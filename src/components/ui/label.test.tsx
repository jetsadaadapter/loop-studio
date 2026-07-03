import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { Label } from "@/components/ui/label";

// Safety net for the Label primitive (fan-out 10, Orange tier per LOOP-ENGINEERING.md).
// Plain <label> wrapper: lock the cn()-composed class via snapshot + the forwarding
// contract (htmlFor, children) that every form field relies on for association.
describe("Label", () => {
  it("renders a <label> with data-slot and the default classes (snapshot)", () => {
    const { container } = render(<Label>Email</Label>);
    const el = container.firstChild as HTMLElement;
    expect(el.tagName).toBe("LABEL");
    expect(el).toHaveAttribute("data-slot", "label");
    expect(el).toMatchSnapshot();
  });

  it("merges a custom className while keeping base classes", () => {
    const { container } = render(<Label className="custom-x">Email</Label>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("custom-x");
    expect(el.className).toContain("font-medium");
  });

  it("forwards htmlFor for input association", () => {
    const { container } = render(<Label htmlFor="email">Email</Label>);
    expect(container.firstChild).toHaveAttribute("for", "email");
  });

  it("renders its children", () => {
    render(<Label>Email</Label>);
    expect(screen.getByText("Email")).toBeInTheDocument();
  });
});
