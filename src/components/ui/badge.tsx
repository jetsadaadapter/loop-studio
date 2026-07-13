import React from "react";

export type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "orange";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
    children: React.ReactNode;
}

export function Badge({ variant = "default", children, className = "", ...props }: BadgeProps) {
    const baseStyle = "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold font-sans uppercase border transition-colors select-none";
    
    const variantStyles: Record<BadgeVariant, string> = {
        default: "text-slate-600 bg-slate-50 border-slate-200/80",
        success: "text-[#499A13] bg-[#499A13]/5 border-[#499A13]/20",
        info: "text-indigo-600 bg-indigo-50 border-indigo-200/60",
        warning: "text-amber-700 bg-amber-50 border-amber-200/60",
        orange: "text-orange-700 bg-orange-50 border-orange-200/60",
        error: "text-red-700 bg-red-50 border-red-200/60",
    };

    const finalClass = `${baseStyle} ${variantStyles[variant]} ${className}`;

    return (
        <span className={finalClass} {...props}>
            {children}
        </span>
    );
}
