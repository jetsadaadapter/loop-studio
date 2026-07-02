import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

// Safety net for the Sheet (fan-out 16, Orange tier per LOOP-ENGINEERING.md).
// Sheet composes @base-ui/react/dialog, so it renders in a portal and only when
// open. We assert the side/close-button contract + portal visibility, and lock
// the plain SheetHeader class via snapshot (base-ui's popup markup carries volatile
// ids/positioning, so we assert its class tokens rather than snapshot it).

function renderOpenSheet(
  props: {
    side?: "top" | "right" | "bottom" | "left";
    showCloseButton?: boolean;
  } = {},
) {
  return render(
    <Sheet open>
      <SheetContent side={props.side} showCloseButton={props.showCloseButton}>
        <SheetHeader>
          <SheetTitle>Panel Title</SheetTitle>
          <SheetDescription>Panel description</SheetDescription>
        </SheetHeader>
        <span>Body content</span>
      </SheetContent>
    </Sheet>,
  );
}

const contentEl = () =>
  document.querySelector('[data-slot="sheet-content"]') as HTMLElement | null;

describe("SheetContent", () => {
  it("does not render content when closed", () => {
    render(
      <Sheet>
        <SheetContent>
          <span>hidden</span>
        </SheetContent>
      </Sheet>,
    );
    expect(screen.queryByText("hidden")).toBeNull();
  });

  it("renders content in a portal when open", () => {
    renderOpenSheet();
    expect(screen.getByText("Body content")).toBeInTheDocument();
    expect(screen.getByText("Panel Title")).toBeInTheDocument();
  });

  it("defaults to the right side and includes right-side classes", () => {
    renderOpenSheet();
    const el = contentEl();
    expect(el).toHaveAttribute("data-side", "right");
    expect(el?.className).toContain("data-[side=right]:right-0");
  });

  it("honors the side prop", () => {
    renderOpenSheet({ side: "left" });
    expect(contentEl()).toHaveAttribute("data-side", "left");
  });

  it("shows a close button by default", () => {
    renderOpenSheet();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("hides the close button when showCloseButton is false", () => {
    renderOpenSheet({ showCloseButton: false });
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
  });
});

describe("Sheet subcomponents", () => {
  it("SheetTitle and SheetDescription carry their data-slots", () => {
    renderOpenSheet();
    expect(
      screen.getByText("Panel Title").closest('[data-slot="sheet-title"]'),
    ).not.toBeNull();
    expect(
      screen
        .getByText("Panel description")
        .closest('[data-slot="sheet-description"]'),
    ).not.toBeNull();
  });

  it("SheetHeader renders with data-slot, merges className (snapshot)", () => {
    const { container } = render(<SheetHeader className="cx">h</SheetHeader>);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-slot", "sheet-header");
    expect(el.className).toContain("cx");
    expect(el).toMatchSnapshot();
  });

  it("SheetFooter renders with its data-slot", () => {
    const { container } = render(<SheetFooter>f</SheetFooter>);
    expect(container.firstChild).toHaveAttribute("data-slot", "sheet-footer");
  });
});
