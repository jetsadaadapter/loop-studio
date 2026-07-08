"use client";

import { X } from "lucide-react";

interface ModalCloseButtonProps {
    onClose: () => void;
    disabled?: boolean;
    className?: string;
}

// The one close button every modal header uses — identical size, icon, and
// hover treatment across the app.
export function ModalCloseButton({ onClose, disabled = false, className = "" }: ModalCloseButtonProps) {
    return (
        <button
            type="button"
            onClick={onClose}
            disabled={disabled}
            aria-label="Close modal"
            title="Close modal"
            className={`flex size-7 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 ${className}`}
        >
            <X className="size-4" />
        </button>
    );
}
