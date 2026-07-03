import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { ManageCreateButton } from "@/components/ui/manage-create-button";

// Safety net for ManageCreateButton (fan-out 5, Orange tier per LOOP-ENGINEERING.md).
// Plain native <button> + Plus icon. Behavior (onClick / disabled) is the risk.
describe("ManageCreateButton", () => {
  it("renders its children", () => {
    render(<ManageCreateButton onClick={vi.fn()}>New app</ManageCreateButton>);
    expect(screen.getByRole("button")).toHaveTextContent("New app");
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<ManageCreateButton onClick={onClick}>New</ManageCreateButton>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled and does not fire onClick when disabled", () => {
    const onClick = vi.fn();
    render(
      <ManageCreateButton onClick={onClick} disabled>
        New
      </ManageCreateButton>,
    );
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders the plus icon", () => {
    const { container } = render(
      <ManageCreateButton onClick={vi.fn()}>New</ManageCreateButton>,
    );
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("matches the default snapshot", () => {
    const { container } = render(
      <ManageCreateButton onClick={vi.fn()}>New</ManageCreateButton>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
