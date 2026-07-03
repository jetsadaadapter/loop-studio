import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

// Safety net for the Card family (fan-out 12, Orange tier per LOOP-ENGINEERING.md).
// Plain <div> wrappers, so the risk is the cn()-composed classes and the data-slot
// contract the layout CSS keys off (e.g. has-data-[slot=card-footer], group-data-[size=sm]).

describe("Card", () => {
  it("renders with data-slot=card and default size", () => {
    const { container } = render(<Card>body</Card>);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-slot", "card");
    expect(el).toHaveAttribute("data-size", "default");
  });

  it("honors the sm size", () => {
    const { container } = render(<Card size="sm">body</Card>);
    expect(container.firstChild).toHaveAttribute("data-size", "sm");
  });

  it("merges a custom className with the base classes", () => {
    const { container } = render(<Card className="custom-x">body</Card>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("custom-x");
    expect(el.className).toContain("rounded-xl");
  });

  it("matches the default snapshot", () => {
    const { container } = render(<Card>body</Card>);
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe("Card subcomponents carry their data-slot and merge className", () => {
  const cases = [
    ["CardHeader", CardHeader, "card-header"],
    ["CardTitle", CardTitle, "card-title"],
    ["CardDescription", CardDescription, "card-description"],
    ["CardAction", CardAction, "card-action"],
    ["CardContent", CardContent, "card-content"],
    ["CardFooter", CardFooter, "card-footer"],
  ] as const;

  it.each(cases)("%s carries its data-slot and merges className", (_name, Comp, slot) => {
    const { container } = render(<Comp className="cx">x</Comp>);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("data-slot", slot);
    expect(el.className).toContain("cx");
  });
});
