"use client";

import {
  useState,
  useCallback,
  useMemo,
  createContext,
  useContext,
  ReactNode,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, Info } from "lucide-react";

export type AlertDialogToastTone = "success" | "error" | "info";

export interface AlertDialogToastItem {
  id: string;
  message: string;
  tone: AlertDialogToastTone;
}

interface AlertDialogToastContextValue {
  pushDialogToast: (message: string, tone?: AlertDialogToastTone) => void;
}

const AlertDialogToastContext =
  createContext<AlertDialogToastContextValue | null>(null);

export function AlertDialogToastProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [dialogs, setDialogs] = useState<AlertDialogToastItem[]>([]);

  const pushDialogToast = useCallback(
    (message: string, tone: AlertDialogToastTone = "info") => {
      const id = `${Date.now()}-${Math.random()}`;
      setDialogs((current) => [...current, { id, message, tone }]);
    },
    [],
  );

  const handleClose = (id: string) => {
    setDialogs((current) => current.filter((d) => d.id !== id));
  };

  const value = useMemo(() => ({ pushDialogToast }), [pushDialogToast]);

  return (
    <AlertDialogToastContext.Provider value={value}>
      {children}
      {dialogs.map((dialog) => (
        <Dialog
          key={dialog.id}
          open={true}
          onOpenChange={() => handleClose(dialog.id)}
        >
          <DialogContent className="bg-background data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 ring-foreground/10 grid max-w-[calc(100%-2rem)] gap-4 rounded-xl p-4 text-sm ring-1 fixed top-1/2 left-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 outline-none sm:max-w-xs data-open:zoom-in-50! data-closed:zoom-out-50 duration-300">
            <div className="flex flex-col items-center text-center gap-4 py-2">
              <div
                className={`flex items-center justify-center size-16 rounded-full ${
                  dialog.tone === "success"
                    ? "bg-teal-400/10 text-teal-400"
                    : dialog.tone === "error"
                      ? "bg-red-400/10 text-red-400"
                      : "bg-blue-400/10 text-blue-400"
                }`}
              >
                {dialog.tone === "success" ? (
                  <CheckCircle className="size-8" />
                ) : dialog.tone === "error" ? (
                  <XCircle className="size-8" />
                ) : (
                  <Info className="size-8" />
                )}
              </div>
              <DialogHeader className="gap-2 flex flex-col items-center">
                <DialogTitle className="font-medium text-lg">
                  {dialog.tone === "success"
                    ? "Success"
                    : dialog.tone === "error"
                      ? "Error"
                      : "Info"}
                </DialogTitle>
                <p className="text-muted-foreground text-sm">
                  {dialog.message}
                </p>
              </DialogHeader>
              <button
                type="button"
                className="rounded-lg border border-transparent bg-clip-padding text-sm font-medium focus-visible:ring-3 aria-invalid:ring-3 inline-flex items-center justify-center whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 shrink-0 outline-none group/button select-none bg-primary text-primary-foreground h-8 gap-1.5 px-2.5 w-full cursor-pointer hover:bg-primary/80"
                onClick={() => handleClose(dialog.id)}
              >
                Done
              </button>
            </div>
          </DialogContent>
        </Dialog>
      ))}
    </AlertDialogToastContext.Provider>
  );
}

export function useDialogToast() {
  const context = useContext(AlertDialogToastContext);
  if (!context)
    throw new Error(
      "useDialogToast must be used inside AlertDialogToastProvider",
    );
  return context;
}
