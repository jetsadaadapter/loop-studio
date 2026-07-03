import { describe, it, expect, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// Safety net for the Select (fan-out 15, Orange tier per LOOP-ENGINEERING.md).
// Composes @base-ui/react/select. The trigger is the meaningful wrapper logic
// (size variant + data-slot); the dropdown renders in a portal via floating-ui,
// which needs a couple of browser APIs jsdom lacks — polyfilled below (scoped).
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

const triggerEl = () =>
  document.querySelector('[data-slot="select-trigger"]') as HTMLElement | null;

describe("SelectTrigger", () => {
  it("renders with default size and the trigger data-slot", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
      </Select>,
    );
    const el = triggerEl();
    expect(el).toHaveAttribute("data-slot", "select-trigger");
    expect(el).toHaveAttribute("data-size", "default");
    expect(el?.className).toContain("data-[size=default]:h-8");
  });

  it("honors the sm size", () => {
    render(
      <Select>
        <SelectTrigger size="sm">
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
      </Select>,
    );
    expect(triggerEl()).toHaveAttribute("data-size", "sm");
  });

  it("renders trigger children and a chevron icon", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Placeholder" />
        </SelectTrigger>
      </Select>,
    );
    // the ChevronDownIcon is rendered as an <svg> inside the trigger
    expect(triggerEl()?.querySelector("svg")).not.toBeNull();
  });

  it("locks the base class tokens (both size variants)", () => {
    // No toMatchSnapshot here: base-ui embeds an order-dependent React.useId
    // (id="base-ui-_r_N_") in the trigger, which would make a snapshot brittle
    // across test reordering / CI. Assert the distinctive class tokens instead —
    // this is the actual class-regression tripwire.
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Tokens" />
        </SelectTrigger>
      </Select>,
    );
    const cls = triggerEl()?.className ?? "";
    for (const token of [
      "rounded-sm",
      "border-input",
      "data-[size=default]:h-8",
      "data-[size=sm]:h-7",
      "focus-visible:ring-3",
    ]) {
      expect(cls).toContain(token);
    }
  });
});

describe("SelectContent / SelectItem (open)", () => {
  it("renders items in a portal when open", () => {
    render(
      <Select defaultOpen>
        <SelectTrigger>
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("Banana")).toBeInTheDocument();
    expect(
      document.querySelector('[data-slot="select-content"]'),
    ).not.toBeNull();
  });

  it("tags items with the select-item data-slot", () => {
    render(
      <Select defaultOpen>
        <SelectTrigger>
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(
      screen.getByText("Apple").closest('[data-slot="select-item"]'),
    ).not.toBeNull();
  });
});
