import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";

import { Button, buttonVariants } from "@/components/ui/button";

// Button() is the shared primitive imported by ~48 modules across 26 feature
// communities. Its className is produced entirely by buttonVariants() + cn(),
// so a snapshot of the rendered class string is the cheapest tripwire for a
// visual regression: if a variant/size class fragment changes, the diff shows
// exactly which token moved before it reaches any consuming screen.

// Mirror the real cva() config in button.tsx — NOT invented names.
const VARIANTS = [
  "default",
  "outline",
  "secondary",
  "ghost",
  "destructive",
  "link",
] as const;

const SIZES = [
  "default",
  "xs",
  "sm",
  "lg",
  "icon",
  "icon-xs",
  "icon-sm",
  "icon-lg",
] as const;

describe("Button", () => {
  it("renders the default variant/size consistently", () => {
    const { container } = render(<Button>Click</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it.each(VARIANTS)("renders variant=%s className consistently", (variant) => {
    const { container } = render(<Button variant={variant}>Btn</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it.each(SIZES)("renders size=%s className consistently", (size) => {
    const { container } = render(<Button size={size}>Btn</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("tags the rendered element with data-slot=\"button\"", () => {
    const { container } = render(<Button>Btn</Button>);
    expect(container.firstChild).toHaveAttribute("data-slot", "button");
  });

  it("merges a custom className alongside the variant classes", () => {
    const { container } = render(<Button className="custom-marker">Btn</Button>);
    expect((container.firstChild as HTMLElement).className).toContain(
      "custom-marker",
    );
  });

  it("buttonVariants() returns a class string for a variant/size combo", () => {
    expect(typeof buttonVariants({ variant: "outline", size: "lg" })).toBe(
      "string",
    );
  });
});
