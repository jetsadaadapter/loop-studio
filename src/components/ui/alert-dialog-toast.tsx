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
import { Button } from "@/components/ui/button";

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
          <DialogContent className="bg-white/95 backdrop-blur-md data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 border border-slate-100/80 grid max-w-[calc(100%-2rem)] gap-4 rounded-2xl p-5 text-sm fixed top-1/2 left-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 outline-none sm:max-w-[320px] data-open:zoom-in-95 data-closed:zoom-out-95 duration-300 shadow-2xl">
            <div className="flex flex-col items-center text-center gap-5 py-1.5 select-none">
              {/* Glowing Icon Circle */}
              <div
                className={`flex items-center justify-center size-14 rounded-full border shadow-2xs animate-in zoom-in-50 duration-300 ${dialog.tone === "success"
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  : dialog.tone === "error"
                    ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                    : "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
                  }`}
              >
                {dialog.tone === "success" ? (
                  <CheckCircle className="size-6.5 text-emerald-500" aria-hidden />
                ) : dialog.tone === "error" ? (
                  <XCircle className="size-6.5 text-rose-500" aria-hidden />
                ) : (
                  <Info className="size-6.5 text-indigo-500" aria-hidden />
                )}
              </div>

              {/* Title & Message */}
              <DialogHeader className="gap-1 flex flex-col items-center">
                <DialogTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                  {dialog.tone === "success"
                    ? "Success"
                    : dialog.tone === "error"
                      ? "Error"
                      : "Info"}
                </DialogTitle>
                <p className="text-slate-500 text-[11px] leading-relaxed font-medium mt-1 select-text max-w-[280px]">
                  {dialog.message}
                </p>
              </DialogHeader>

              {/* Action Button */}
              <Button
                type="button"
                className={`px-8 min-w-[100px] h-8.5 rounded-sm text-[11px] font-bold border-none transition-all active:scale-95 duration-200 cursor-pointer ${dialog.tone === "success"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/10 hover:shadow-md"
                  : dialog.tone === "error"
                    ? "bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/10 hover:shadow-md"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/10 hover:shadow-md"
                  }`}
                onClick={() => handleClose(dialog.id)}
              >
                Done
              </Button>
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
