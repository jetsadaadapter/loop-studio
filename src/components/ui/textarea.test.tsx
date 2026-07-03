import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { createRef } from "react";

import { Textarea } from "@/components/ui/textarea";

// Safety net for the Textarea primitive (fan-out 5, Orange tier per LOOP-ENGINEERING.md).
// Plain forwardRef <textarea>: lock the cn()-composed class + the ref/prop forwarding.
describe("Textarea", () => {
  it("renders a <textarea> and matches the default snapshot", () => {
    const { container } = render(<Textarea />);
    const el = container.firstChild as HTMLElement;
    expect(el.tagName).toBe("TEXTAREA");
    expect(el).toMatchSnapshot();
  });

  it("merges a custom className while keeping base classes", () => {
    const { container } = render(<Textarea className="custom-x" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("custom-x");
    expect(el.className).toContain("rounded-md");
  });

  it("forwards a ref to the textarea element", () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it("forwards standard textarea props", () => {
    render(<Textarea placeholder="Notes" disabled />);
    const el = screen.getByPlaceholderText("Notes");
    expect(el).toBeDisabled();
  });

  it("fires onChange", () => {
    const onChange = vi.fn();
    render(<Textarea onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "hello" },
    });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
