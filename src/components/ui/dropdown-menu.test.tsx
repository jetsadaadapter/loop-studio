import { describe, it, expect, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";

// Safety net for the DropdownMenu (fan-out 3, Yellow/Green — logic-bearing).
// Composes @base-ui/react/menu (portal + floating-ui). The own-logic is the item
// `variant` (data-variant) + the data-slot contract; base-ui behavior is upstream.
// Polyfill jsdom gaps (scoped); no snapshot (base-ui order-dependent useId).
beforeAll(() => {
  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
});

function renderOpenMenu() {
  return render(
    <DropdownMenu open>
      <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Edit</DropdownMenuItem>
        <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  );
}

describe("DropdownMenu", () => {
  it("renders the trigger with its data-slot", () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
      </DropdownMenu>,
    );
    expect(
      document.querySelector('[data-slot="dropdown-menu-trigger"]'),
    ).not.toBeNull();
  });

  it("renders content and items in a portal when open", () => {
    renderOpenMenu();
    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
    expect(
      document.querySelector('[data-slot="dropdown-menu-content"]'),
    ).not.toBeNull();
  });

  it("marks items with the default variant, and destructive when requested", () => {
    renderOpenMenu();
    const edit = screen.getByText("Edit").closest('[data-slot="dropdown-menu-item"]');
    const del = screen
      .getByText("Delete")
      .closest('[data-slot="dropdown-menu-item"]');
    expect(edit).toHaveAttribute("data-variant", "default");
    expect(del).toHaveAttribute("data-variant", "destructive");
  });

  it("DropdownMenuShortcut carries its data-slot", () => {
    const { container } = render(<DropdownMenuShortcut>⌘K</DropdownMenuShortcut>);
    expect(container.firstChild).toHaveAttribute(
      "data-slot",
      "dropdown-menu-shortcut",
    );
  });
});
