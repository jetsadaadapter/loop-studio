"use client";

import {
  useRef,
  useState,
  useEffect,
  ReactNode,
  createContext,
  useContext,
} from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

interface DialogContentProps {
  className?: string;
  hideCloseButton?: boolean;
  children: ReactNode;
}

interface DialogHeaderProps {
  className?: string;
  children: ReactNode;
}

interface DialogTitleProps {
  className?: string;
  children: ReactNode;
}

function Dialog({ open = false, onOpenChange, children }: DialogProps) {
  const [isOpen, setIsOpen] = useState(open);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setIsOpen(open);
    setPrevOpen(open);
  }

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  return (
    <DialogContext.Provider
      value={{ open: isOpen, onOpenChange: handleOpenChange }}
    >
      {children}
    </DialogContext.Provider>
  );
}

function DialogContent({ className, hideCloseButton, children }: DialogContentProps) {
  const context = useContext(DialogContext);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!context?.open) return;

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        context.onOpenChange(false);
      }
    };

    const handleBackdropClick = (event: MouseEvent) => {
      if (dialogRef.current === event.target) {
        context.onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    document.addEventListener("click", handleBackdropClick);

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.removeEventListener("click", handleBackdropClick);
    };
  }, [context?.open, context?.onOpenChange]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!context?.open) return null;

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 sm:px-6"
    >
      <div
        className={cn(
          "relative w-full max-w-lg rounded-lg bg-white shadow-lg p-6",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {!hideCloseButton && (
          <button
            type="button"
            onClick={() => context.onOpenChange(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 cursor-pointer text-slate-400 hover:text-slate-650 focus:outline-none"
          >
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

function DialogHeader({ className, children }: DialogHeaderProps) {
  return <div className={cn("mb-4 space-y-2", className)}>{children}</div>;
}

function DialogTitle({ className, children }: DialogTitleProps) {
  return (
    <h2 className={cn("text-lg font-semibold text-slate-900", className)}>
      {children}
    </h2>
  );
}

interface DialogDescriptionProps {
  className?: string;
  children: ReactNode;
}

function DialogDescription({ className, children }: DialogDescriptionProps) {
  return (
    <p className={cn("text-sm text-slate-500", className)}>
      {children}
    </p>
  );
}

// Simple context for dialog state
interface DialogContextType {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription };
