import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";

// Safety net for the Avatar family (Yellow/Green tier). Built on @base-ui/react/avatar.
// The own-logic is the size variant + the data-slot contract the layout CSS keys off
// (e.g. group-data-[size=sm]/avatar, *:data-[slot=avatar]). No snapshot (base-ui markup).
const slot = (name: string) => document.querySelector(`[data-slot="${name}"]`);

describe("Avatar", () => {
  it("has data-slot=avatar and default size", () => {
    render(<Avatar />);
    const el = slot("avatar");
    expect(el).not.toBeNull();
    expect(el).toHaveAttribute("data-size", "default");
  });

  it("honors the sm and lg sizes", () => {
    const { unmount } = render(<Avatar size="sm" />);
    expect(slot("avatar")).toHaveAttribute("data-size", "sm");
    unmount();
    render(<Avatar size="lg" />);
    expect(slot("avatar")).toHaveAttribute("data-size", "lg");
  });

  it("merges a custom className", () => {
    render(<Avatar className="custom-x" />);
    expect(slot("avatar")?.className).toContain("custom-x");
  });

  it("renders the fallback content (shown when the image is unavailable)", () => {
    render(
      <Avatar>
        <AvatarImage src="/nope.png" alt="user" />
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>,
    );
    const fallback = screen.getByText("AB");
    expect(fallback).toBeInTheDocument();
    expect(fallback.closest('[data-slot="avatar-fallback"]')).not.toBeNull();
  });
});

describe("Avatar subcomponents carry their data-slot", () => {
  it("AvatarBadge", () => {
    render(<AvatarBadge>1</AvatarBadge>);
    expect(slot("avatar-badge")).not.toBeNull();
  });

  it("AvatarGroup and AvatarGroupCount", () => {
    render(
      <AvatarGroup>
        <AvatarGroupCount>+3</AvatarGroupCount>
      </AvatarGroup>,
    );
    expect(slot("avatar-group")).not.toBeNull();
    expect(slot("avatar-group-count")).not.toBeNull();
  });
});
