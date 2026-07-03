import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { ManageFilterSelect } from "@/components/ui/manage-filter-select";

// Safety net for ManageFilterSelect (fan-out 9, Orange tier per LOOP-ENGINEERING.md).
// Thin wrapper over the base-ui Select family: label, width, placeholder, options
// mapping, and the `v && onChange(v)` guard. base-ui uses floating-ui, so a couple
// of browser APIs are polyfilled (scoped). No snapshot (base-ui useId brittleness).
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

const OPTIONS = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

describe("ManageFilterSelect", () => {
  it("renders the label", () => {
    render(
      <ManageFilterSelect
        label="Status"
        value=""
        options={OPTIONS}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("shows the placeholder when no value is selected", () => {
    render(
      <ManageFilterSelect
        label="Status"
        value=""
        options={OPTIONS}
        onChange={vi.fn()}
        placeholder="Any status"
      />,
    );
    expect(screen.getByText("Any status")).toBeInTheDocument();
  });

  it("applies the width class to the field wrapper", () => {
    const { container } = render(
      <ManageFilterSelect
        label="Status"
        value=""
        options={OPTIONS}
        onChange={vi.fn()}
        width="xl:w-64"
      />,
    );
    expect(container.querySelector(".xl\\:w-64")).not.toBeNull();
  });

  it("maps every option to a rendered item once opened", () => {
    render(
      <ManageFilterSelect
        label="Status"
        value=""
        options={OPTIONS}
        onChange={vi.fn()}
      />,
    );
    fireEvent.click(
      document.querySelector('[data-slot="select-trigger"]') as HTMLElement,
    );
    // Verifies the wrapper's own logic: options.map(...) -> SelectItem list.
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Archived")).toBeInTheDocument();
    expect(
      document.querySelectorAll('[data-slot="select-item"]'),
    ).toHaveLength(OPTIONS.length);
  });

  // NOTE: the actual value-selection -> onChange path is intentionally NOT tested
  // here. base-ui Select commits a selection via a pointer/keyboard composite that
  // jsdom + fireEvent don't drive reliably; that mechanism is base-ui's own concern
  // (covered upstream). The wrapper's unique logic (label, placeholder, width, and
  // options mapping) is covered above.
});
