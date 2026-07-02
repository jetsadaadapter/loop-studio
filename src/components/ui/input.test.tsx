import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";

import { Input } from "@/components/ui/input";

// Safety net for the shared Input primitive (fan-out 22, Orange tier per
// LOOP-ENGINEERING.md). Its className is composed entirely by cn() over a fixed
// base string, so a snapshot is the tripwire for a class regression; the rest
// lock the prop-forwarding contract every form field depends on.
describe("Input", () => {
  it("renders the default class set", () => {
    const { container } = render(<Input />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('tags the element with data-slot="input"', () => {
    const { container } = render(<Input />);
    expect(container.firstChild).toHaveAttribute("data-slot", "input");
  });

  it("merges a custom className while keeping the base classes", () => {
    const { container } = render(<Input className="custom-marker" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("custom-marker");
    expect(el.className).toContain("rounded-sm"); // a base class survives the merge
  });

  it("forwards the type prop", () => {
    const { container } = render(<Input type="password" />);
    expect(container.firstChild).toHaveAttribute("type", "password");
  });

  it("forwards arbitrary input attributes (placeholder / disabled / aria-invalid)", () => {
    const { container } = render(
      <Input placeholder="Email" disabled aria-invalid />,
    );
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("placeholder", "Email");
    expect(el).toBeDisabled();
    expect(el).toHaveAttribute("aria-invalid", "true");
  });

  it("fires onChange for controlled usage", () => {
    const onChange = vi.fn();
    const { container } = render(<Input value="" onChange={onChange} />);
    fireEvent.change(container.firstChild as HTMLElement, {
      target: { value: "hi" },
    });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
