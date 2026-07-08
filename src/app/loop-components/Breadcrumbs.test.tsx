import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Breadcrumbs } from "./Breadcrumbs";

describe("Breadcrumbs", () => {
    it("always renders the Home root linking to /", () => {
        render(<Breadcrumbs items={[{ label: "Somewhere" }]} />);
        const home = screen.getByTitle("Dashboard");
        expect(home).toHaveAttribute("href", "/");
    });

    it("renders intermediate items as links and the last as plain text", () => {
        render(
            <Breadcrumbs
                items={[
                    { label: "My Project", href: "/proj-1" },
                    { label: "My Task" },
                ]}
            />,
        );
        expect(screen.getByRole("link", { name: "My Project" })).toHaveAttribute("href", "/proj-1");
        const current = screen.getByText("My Task");
        expect(current.tagName).toBe("SPAN");
        expect(current).toHaveAttribute("aria-current", "page");
    });

    it("never links the last item even when it has an href", () => {
        render(<Breadcrumbs items={[{ label: "Only Item", href: "/somewhere" }]} />);
        const item = screen.getByText("Only Item");
        expect(item.tagName).toBe("SPAN");
        expect(screen.queryByRole("link", { name: "Only Item" })).toBeNull();
    });

    it("exposes a breadcrumb navigation landmark", () => {
        render(<Breadcrumbs items={[{ label: "X" }]} />);
        expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
    });
});
