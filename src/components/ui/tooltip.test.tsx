import { describe, it, expect, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

// Safety net for the Tooltip (fan-out 7, Orange tier per LOOP-ENGINEERING.md).
// Composes @base-ui/react/tooltip (portal + floating-ui). Polyfill the browser APIs
// jsdom lacks (scoped); no snapshot (base-ui embeds an order-dependent useId).
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

function renderOpenTooltip() {
  return render(
    <TooltipProvider>
      <Tooltip open>
        <TooltipTrigger>Trigger</TooltipTrigger>
        <TooltipContent>Tip text</TooltipContent>
      </Tooltip>
    </TooltipProvider>,
  );
}

describe("TooltipTrigger", () => {
  it("renders with the trigger data-slot and its children", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Trigger</TooltipTrigger>
        </Tooltip>
      </TooltipProvider>,
    );
    const el = document.querySelector('[data-slot="tooltip-trigger"]');
    expect(el).not.toBeNull();
    expect(el).toHaveTextContent("Trigger");
  });
});

describe("TooltipContent", () => {
  it("does not render content when the tooltip is closed", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Trigger</TooltipTrigger>
          <TooltipContent>Tip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    expect(screen.queryByText("Tip text")).toBeNull();
  });

  it("renders content in a portal when open", () => {
    renderOpenTooltip();
    expect(screen.getByText("Tip text")).toBeInTheDocument();
    expect(
      document.querySelector('[data-slot="tooltip-content"]'),
    ).not.toBeNull();
  });

  it("locks the base class tokens on the content", () => {
    renderOpenTooltip();
    const cls =
      document.querySelector('[data-slot="tooltip-content"]')?.className ?? "";
    for (const token of [
      "rounded-md",
      "bg-foreground",
      "data-[side=top]:slide-in-from-bottom-2",
    ]) {
      expect(cls).toContain(token);
    }
  });
});
