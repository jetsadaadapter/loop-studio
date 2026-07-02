import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Safety net for the custom Dialog (fan-out 16, Orange tier per LOOP-ENGINEERING.md).
// This is a hand-rolled dialog (React context, not base-ui), so the real risk is
// behavioral: open/close state sync, Escape + backdrop dismissal, stopPropagation
// on the inner panel, and the optional close button.

function openDialog(
  onOpenChange = vi.fn(),
  extra: { hideCloseButton?: boolean } = {},
) {
  const utils = render(
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent hideCloseButton={extra.hideCloseButton}>
        <DialogTitle>My Title</DialogTitle>
        <DialogDescription>My description</DialogDescription>
        <span>Body content</span>
      </DialogContent>
    </Dialog>,
  );
  return { ...utils, onOpenChange };
}

describe("DialogContent visibility", () => {
  it("renders nothing when the dialog is closed", () => {
    const { container } = render(
      <Dialog open={false}>
        <DialogContent>
          <span>hidden</span>
        </DialogContent>
      </Dialog>,
    );
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText("hidden")).toBeNull();
  });

  it("renders content and a close button when open", () => {
    openDialog();
    expect(screen.getByText("Body content")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("hides the close button when hideCloseButton is set", () => {
    openDialog(vi.fn(), { hideCloseButton: true });
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
    expect(screen.getByText("Body content")).toBeInTheDocument();
  });

  it("syncs open state when the open prop flips false -> true", () => {
    const { rerender } = render(
      <Dialog open={false}>
        <DialogContent>
          <span>Body content</span>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.queryByText("Body content")).toBeNull();

    rerender(
      <Dialog open>
        <DialogContent>
          <span>Body content</span>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText("Body content")).toBeInTheDocument();
  });
});

describe("DialogContent dismissal", () => {
  it("closes via the close button", () => {
    const { onOpenChange } = openDialog();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByText("Body content")).toBeNull();
  });

  it("closes on the Escape key", () => {
    const { onOpenChange } = openDialog();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes when the backdrop is clicked", () => {
    const { container, onOpenChange } = openDialog();
    // container.firstChild is the backdrop div (holds the ref checked in the handler).
    fireEvent.click(container.firstChild as HTMLElement);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does NOT close when the inner panel is clicked (stopPropagation)", () => {
    const { onOpenChange } = openDialog();
    fireEvent.click(screen.getByText("Body content"));
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

describe("Dialog subcomponents", () => {
  it("DialogTitle renders an <h2> with its text", () => {
    render(<DialogTitle>Heading</DialogTitle>);
    const h = screen.getByRole("heading", { level: 2 });
    expect(h).toHaveTextContent("Heading");
    expect(h.className).toContain("font-semibold");
  });

  it("DialogDescription renders a <p> with its text", () => {
    const { container } = render(<DialogDescription>desc</DialogDescription>);
    expect(container.querySelector("p")).toHaveTextContent("desc");
  });

  it("DialogHeader merges a custom className", () => {
    const { container } = render(
      <DialogHeader className="cx">h</DialogHeader>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("cx");
    expect(el.className).toContain("mb-4");
  });

  it("matches the open-dialog snapshot", () => {
    const { container } = openDialog();
    expect(container.firstChild).toMatchSnapshot();
  });
});
