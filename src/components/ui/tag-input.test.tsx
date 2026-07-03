import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { TagInput } from "@/components/ui/tag-input";

// Safety net for TagInput (Yellow/Green tier — logic-bearing). Exercises the real
// behavior: add on Enter, remove-last on Backspace, remove button, dedupe
// (case-insensitive), strictSuggestions gate, canonical casing, and the suggestions
// dropdown. Rendering is incidental; the add/remove logic is the risk surface.

function typeAndEnter(value: string) {
  const input = screen.getByRole("textbox");
  fireEvent.change(input, { target: { value } });
  fireEvent.keyDown(input, { key: "Enter" });
}

describe("TagInput", () => {
  it("renders the existing tags", () => {
    render(<TagInput value={["alpha", "beta"]} onChange={vi.fn()} />);
    expect(screen.getByText("alpha")).toBeInTheDocument();
    expect(screen.getByText("beta")).toBeInTheDocument();
  });

  it("adds a new tag on Enter", () => {
    const onChange = vi.fn();
    render(<TagInput value={[]} onChange={onChange} />);
    typeAndEnter("new");
    expect(onChange).toHaveBeenCalledWith(["new"]);
  });

  it("does not add a duplicate tag (case-insensitive)", () => {
    const onChange = vi.fn();
    render(<TagInput value={["React"]} onChange={onChange} />);
    typeAndEnter("react");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("removes a tag via its remove button", () => {
    const onChange = vi.fn();
    render(<TagInput value={["alpha", "beta"]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove tag alpha" }));
    expect(onChange).toHaveBeenCalledWith(["beta"]);
  });

  it("removes the last tag on Backspace when the input is empty", () => {
    const onChange = vi.fn();
    render(<TagInput value={["alpha", "beta"]} onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Backspace" });
    expect(onChange).toHaveBeenCalledWith(["alpha"]);
  });

  it("rejects a non-suggestion when strictSuggestions is set", () => {
    const onChange = vi.fn();
    render(
      <TagInput
        value={[]}
        onChange={onChange}
        suggestions={["React", "Vue"]}
        strictSuggestions
      />,
    );
    typeAndEnter("Svelte");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("adds a suggestion using its canonical casing", () => {
    const onChange = vi.fn();
    render(
      <TagInput value={[]} onChange={onChange} suggestions={["React"]} />,
    );
    typeAndEnter("react");
    expect(onChange).toHaveBeenCalledWith(["React"]);
  });

  it("shows suggestions on focus and adds one on click", () => {
    const onChange = vi.fn();
    render(
      <TagInput
        value={[]}
        onChange={onChange}
        suggestions={["React", "Vue"]}
      />,
    );
    fireEvent.focus(screen.getByRole("textbox"));
    const option = screen.getByRole("button", { name: "Vue" });
    fireEvent.click(option);
    expect(onChange).toHaveBeenCalledWith(["Vue"]);
  });
});
