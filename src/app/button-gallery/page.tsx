import React from "react";
import { Button } from "@/components/ui/button";

/**
 * Button Gallery page — used exclusively by Playwright visual regression tests.
 * Tests look for:
 *   data-testid="gallery-root"          (the entire gallery wrapper)
 *   data-testid="button-outline-default" (the outline/default-size button)
 */
export default function ButtonGalleryPage() {
    const variants = ["default", "outline", "secondary", "ghost", "destructive", "link"] as const;
    const sizes = ["xs", "sm", "default", "lg"] as const;

    return (
        <main
            data-testid="gallery-root"
            className="min-h-screen bg-white p-10 font-sans"
        >
            <h1 className="mb-8 text-2xl font-bold text-slate-800">Button Gallery</h1>

            {variants.map((variant) => (
                <section key={variant} className="mb-8">
                    <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
                        {variant}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3">
                        {sizes.map((size) => (
                            <Button
                                key={`${variant}-${size}`}
                                variant={variant}
                                size={size}
                                data-testid={
                                    variant === "outline" && size === "default"
                                        ? "button-outline-default"
                                        : `button-${variant}-${size}`
                                }
                            >
                                {variant} / {size}
                            </Button>
                        ))}
                    </div>
                </section>
            ))}
        </main>
    );
}
