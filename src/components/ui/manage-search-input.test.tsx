import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { ManageSearchInput } from "@/components/ui/manage-search-input";

// Safety net for ManageSearchInput (fan-out 9, Orange tier per LOOP-ENGINEERING.md).
// Plain native <input> + icon. The wrapper's own logic is unwrapping the change
// event to a string (onChange(e.target.value)) + placeholder/className handling.
describe("ManageSearchInput", () => {
  it("renders the input with the given value", () => {
    render(<ManageSearchInput value="hello" onChange={vi.fn()} />);
    expect(screen.getByRole("textbox")).toHaveValue("hello");
  });

  it("calls onChange with the new string value (not the event)", () => {
    const onChange = vi.fn();
    render(<ManageSearchInput value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "query" },
    });
    expect(onChange).toHaveBeenCalledWith("query");
  });

  it("uses the default placeholder", () => {
    render(<ManageSearchInput value="" onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText("Search…")).toBeInTheDocument();
  });

  it("honors a custom placeholder", () => {
    render(
      <ManageSearchInput value="" onChange={vi.fn()} placeholder="Find apps" />,
    );
    expect(screen.getByPlaceholderText("Find apps")).toBeInTheDocument();
  });

  it("applies a custom className to the wrapper", () => {
    const { container } = render(
      <ManageSearchInput value="" onChange={vi.fn()} className="custom-x" />,
    );
    expect((container.firstChild as HTMLElement).className).toContain(
      "custom-x",
    );
  });

  it("renders the search icon", () => {
    const { container } = render(
      <ManageSearchInput value="" onChange={vi.fn()} />,
    );
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("matches the default snapshot", () => {
    const { container } = render(
      <ManageSearchInput value="" onChange={vi.fn()} />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
