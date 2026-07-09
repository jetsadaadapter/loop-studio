import { useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Trash2Icon, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModalCloseButton } from "@/components/ui/modal-close-button";

type ManagerDeleteConfirmProps = {
  itemName: string;
  itemId: string;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  itemTypeLabel?: string;
  actionLabel?: string;
  confirmingLabel?: string;
  /** Override the consequence line under the item name (e.g. when data is kept). */
  description?: string;
};

export function ManagerDeleteConfirm({
  itemName,
  itemId,
  onCancel,
  onConfirm,
  isLoading = false,
  itemTypeLabel = "app",
  actionLabel = "Delete",
  confirmingLabel = "Deleting...",
  description,
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
          className="fixed inset-0 isolate z-50 bg-slate-900/40 backdrop-blur-xs duration-300 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        />
        <DialogPrimitive.Popup
          data-slot="dialog-content"
          className="fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2.5rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-2xl border border-slate-100 bg-white/95 backdrop-blur-md p-5 text-xs shadow-2xl outline-none duration-300 sm:max-w-[320px] data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-bottom-8 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-bottom-8 data-closed:zoom-out-95"
          role="dialog"
        >
          <ModalCloseButton onClose={onCancel} disabled={isLoading} className="absolute right-3 top-3" />
          <div className="flex flex-col items-center gap-4 text-center">
            {/* Glowing Danger Circle */}
            <div className="flex size-11 items-center justify-center rounded-full bg-brand/5 border border-brand/10 text-brand shadow-2xs animate-in zoom-in-50 duration-300">
              <Trash2Icon className="size-4.5 animate-pulse" aria-hidden />
            </div>

            <div
              data-slot="dialog-header"
              className="flex flex-col items-center gap-1"
            >
              <h2
                data-slot="dialog-title"
                className="text-sm font-bold tracking-tight text-slate-800 capitalize leading-none"
              >
                {actionLabel} {itemTypeLabel}
              </h2>
              <p
                data-slot="dialog-description"
                className="text-slate-500 text-xs leading-relaxed font-medium mt-1 select-text max-w-[280px]"
              >
                You are about to {actionLabel.toLowerCase()} <span className="text-slate-800 font-bold bg-slate-50 border border-slate-100 px-1 py-0.2 rounded mx-0.5">{itemName}</span>
                {itemId && (
                  <span className="text-xs font-sans font-bold bg-slate-100 text-slate-500 border border-slate-200/40 px-1 py-0.2 rounded select-all ml-1.5 shrink-0 uppercase">
                    #{itemId.slice(0, 8)}
                  </span>
                )}
                <span className="block mt-1.5 text-slate-400 font-medium">
                  {description ??
                    (actionLabel === "Revoke"
                      ? "This action cannot be undone. The key will be permanently revoked and all access will be disabled immediately."
                      : "This action cannot be undone and all data will be permanently removed.")}
                </span>
              </p>
            </div>

            <div className="w-full space-y-4">
              <div className="grid gap-1.5 text-left">
                <label htmlFor="confirm-input" className="text-xs font-bold text-slate-500 uppercase tracking-wider leading-none">
                  Type the {itemTypeLabel} name to {actionLabel.toLowerCase()}:
                </label>
                <Input
                  id="confirm-input"
                  type="text"
                  placeholder={itemName}
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  disabled={isLoading}
                  autoComplete="off"
                  className="h-8.5 border-slate-200 bg-white/50 focus-visible:ring-brand focus-visible:border-brand-strong/30 text-xs rounded-lg shadow-2xs transition-all placeholder:text-slate-350"
                />
                {confirmationInput.trim() !== "" && !isConfirmationValid ? (
                  <p className="text-[9.5px] font-medium text-brand mt-0.5 flex items-center gap-1 animate-fade-in">
                    <AlertTriangle className="size-3 shrink-0" />
                    <span>Input does not match target name exactly.</span>
                  </p>
                ) : null}
              </div>

              <div className="flex w-full gap-2.5 pt-0.5 select-none">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-8.5 rounded-lg text-xs font-bold border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:scale-95 duration-200 transition-all shadow-3xs cursor-pointer bg-white"
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-1 h-8.5 rounded-lg text-xs font-bold bg-brand hover:bg-brand-strong text-white active:scale-95 duration-200 transition-all shadow-sm shadow-brand/10 border-none disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  onClick={onConfirm}
                  disabled={isLoading || !isConfirmationValid}
                >
                  {isLoading ? confirmingLabel : actionLabel}
                </Button>
              </div>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
