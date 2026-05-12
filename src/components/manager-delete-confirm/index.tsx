import { useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ManagerDeleteConfirmProps = {
  itemName: string;
  itemId: string;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  itemTypeLabel?: string;
};

export function ManagerDeleteConfirm({
  itemName,
  itemId,
  onCancel,
  onConfirm,
  isLoading = false,
  itemTypeLabel = "app",
}: ManagerDeleteConfirmProps) {
  const [confirmationInput, setConfirmationInput] = useState("");
  const isConfirmationValid = confirmationInput.trim() === itemName.trim();

  return (
    <DialogPrimitive.Root
      open
      onOpenChange={(open: boolean) => !open && onCancel()}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          data-slot="dialog-overlay"
          className="fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        />
        <DialogPrimitive.Popup
          data-slot="dialog-content"
          className="fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-background p-4 text-sm shadow-lg ring-1 ring-foreground/10 outline-none duration-300 sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-bottom-8 data-open:zoom-in-100 data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-bottom-8 data-closed:zoom-out-100"
          role="dialog"
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Trash2Icon className="size-5" aria-hidden />
            </div>

            <div
              data-slot="dialog-header"
              className="flex flex-col items-center gap-2"
            >
              <h2
                data-slot="dialog-title"
                className="text-base leading-none font-medium"
              >
                Delete {itemTypeLabel}
              </h2>
              <p
                data-slot="dialog-description"
                className="text-muted-foreground text-sm"
              >
                You are deleting <strong>{itemName}</strong> ({itemId}). This
                action cannot be undone and the data will be permanently
                removed.
              </p>
            </div>

            <div className="w-full space-y-4">
              <div className="grid gap-1.5 text-left">
                <label htmlFor="confirm-input" className="text-xs font-medium">
                  Type the {itemTypeLabel} name to confirm:
                </label>
                <Input
                  id="confirm-input"
                  type="text"
                  placeholder={itemName}
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  disabled={isLoading}
                  autoComplete="off"
                />
                {confirmationInput.trim() !== "" && !isConfirmationValid ? (
                  <p className="text-xs text-destructive">
                    Input does not match. Please type:{" "}
                    <strong>{itemName}</strong>
                  </p>
                ) : null}
              </div>

              <div className="flex w-full gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="flex-1"
                  onClick={onConfirm}
                  disabled={isLoading || !isConfirmationValid}
                >
                  {isLoading ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
