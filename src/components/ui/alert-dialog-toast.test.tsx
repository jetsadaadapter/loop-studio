import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import {
  AlertDialogToastProvider,
  useDialogToast,
  type AlertDialogToastTone,
} from "@/components/ui/alert-dialog-toast";

// Safety net for AlertDialogToastProvider (Yellow/Green tier — logic-bearing).
// Real logic: the context + pushDialogToast, tone -> title/UI, the credit-error
// special case, close-removes-dialog, and the hook guard outside the provider.

// Harness that surfaces pushDialogToast via a button.
function Pusher({
  message,
  tone,
}: {
  message: string;
  tone?: AlertDialogToastTone;
}) {
  const { pushDialogToast } = useDialogToast();
  return <button onClick={() => pushDialogToast(message, tone)}>push</button>;
}

function renderWithProvider(ui: React.ReactNode) {
  return render(<AlertDialogToastProvider>{ui}</AlertDialogToastProvider>);
}

describe("useDialogToast", () => {
  it("throws when used outside the provider", () => {
    function Bad() {
      useDialogToast();
      return null;
    }
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Bad />)).toThrow(/must be used inside/);
    spy.mockRestore();
  });
});

describe("AlertDialogToastProvider", () => {
  it("shows a success dialog with the message", () => {
    renderWithProvider(<Pusher message="Saved ok" tone="success" />);
    fireEvent.click(screen.getByText("push"));
    expect(screen.getByText("Success")).toBeInTheDocument();
    expect(screen.getByText("Saved ok")).toBeInTheDocument();
  });

  it("shows an error dialog for a generic error", () => {
    renderWithProvider(<Pusher message="Boom" tone="error" />);
    fireEvent.click(screen.getByText("push"));
    expect(screen.getByText("Error")).toBeInTheDocument();
  });

  it("defaults to the info tone", () => {
    renderWithProvider(<Pusher message="fyi" />);
    fireEvent.click(screen.getByText("push"));
    expect(screen.getByText("Info")).toBeInTheDocument();
  });

  it("renders the credit-specific UI for insufficient-credits errors", () => {
    renderWithProvider(
      <Pusher message="You have insufficient credits" tone="error" />,
    );
    fireEvent.click(screen.getByText("push"));
    expect(screen.getByText("Insufficient Credits")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Got it" })).toBeInTheDocument();
  });

  it("closes the dialog when the action button is clicked", () => {
    renderWithProvider(<Pusher message="Bye" tone="success" />);
    fireEvent.click(screen.getByText("push"));
    expect(screen.getByText("Bye")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByText("Bye")).toBeNull();
  });
});
