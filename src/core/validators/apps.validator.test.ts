import { describe, it, expect } from "vitest";

import { ManageAppSchema } from "@/core/validators/apps.validator";

// ManageAppSchema is the single boundary contract for every app create/update
// path in Manage Apps (admin form + API route). Apps are the app store's
// primary entity, so a regression here (a bad refine, a loosened field, a
// flipped default) can silently let malformed apps into the catalog or block
// valid ones. These tests lock: required-field minimums/maximums, the
// isActive default, the linkType-driven CTA refinements (internal path/tool-id
// checks, external https requirement, CTA label/link required unless
// "instruction"), and the array/enum edge cases.

// A minimal, fully-valid "external" app — the simplest shape that satisfies
// every refinement (no internal-link/tool-slug checks apply).
function validApp() {
  return {
    name: "Valid App Name",
    categoryId: "cat-1",
    description: "This is a perfectly valid description.",
    imageId: "",
    iconId: "",
    coverId: "",
    instructions: "Step 1: click the button to begin.",
    integration: "",
    ctaLabel: "Open App",
    ctaLink: "https://example.com",
    linkType: "external" as const,
    isActive: true,
    sortOrder: 0,
    badgeLabel: "",
    tags: ["ai"],
  };
}

describe("ManageAppSchema — happy path", () => {
  it("parses a fully-valid external app unchanged", () => {
    const input = validApp();
    const result = ManageAppSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject(input);
    }
  });

  it("defaults isActive to true when omitted", () => {
    const input = validApp();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { isActive, ...rest } = input;
    const result = ManageAppSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isActive).toBe(true);
    }
  });

  it("accepts optional string fields omitted entirely (imageId/iconId/coverId/integration/badgeLabel)", () => {
    const input = validApp();
    const { imageId, iconId, coverId, integration, badgeLabel, ...rest } = input;
    void imageId;
    void iconId;
    void coverId;
    void integration;
    void badgeLabel;
    const result = ManageAppSchema.safeParse(rest);
    expect(result.success).toBe(true);
  });

  it("accepts a valid internal ctaLink to a whitelisted base path", () => {
    const input = {
      ...validApp(),
      linkType: "internal" as const,
      ctaLink: "/apps/123",
    };
    const result = ManageAppSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("accepts a valid internal ctaLink to a tool with a long, hyphen-free id", () => {
    const input = {
      ...validApp(),
      linkType: "internal" as const,
      ctaLink: "/tool/01ABCDEFGH",
    };
    const result = ManageAppSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("accepts linkType='instruction' with empty ctaLabel/ctaLink", () => {
    const input = {
      ...validApp(),
      linkType: "instruction" as const,
      ctaLabel: "",
      ctaLink: "",
    };
    const result = ManageAppSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});

describe("ManageAppSchema — required field violations", () => {
  it("rejects a name shorter than 3 characters", () => {
    const result = ManageAppSchema.safeParse({ ...validApp(), name: "Ab" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          path: ["name"],
          message: "App name must be at least 3 characters.",
        }),
      );
    }
  });

  it("rejects a name longer than 50 characters", () => {
    const result = ManageAppSchema.safeParse({
      ...validApp(),
      name: "A".repeat(51),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          path: ["name"],
          message: "App name must be 50 characters or fewer.",
        }),
      );
    }
  });

  it("rejects an empty categoryId", () => {
    const result = ManageAppSchema.safeParse({ ...validApp(), categoryId: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          path: ["categoryId"],
          message: "Category is required.",
        }),
      );
    }
  });

  it("rejects a description shorter than 10 characters", () => {
    const result = ManageAppSchema.safeParse({
      ...validApp(),
      description: "short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          path: ["description"],
          message: "Description must be at least 10 characters.",
        }),
      );
    }
  });

  it("rejects instructions shorter than 10 characters", () => {
    const result = ManageAppSchema.safeParse({
      ...validApp(),
      instructions: "too short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          path: ["instructions"],
          message: "Instructions must be at least 10 characters.",
        }),
      );
    }
  });

  it("rejects an unknown linkType (enum violation)", () => {
    const result = ManageAppSchema.safeParse({
      ...validApp(),
      linkType: "bogus",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "linkType")).toBe(
        true,
      );
    }
  });

  it("rejects a negative sortOrder", () => {
    const result = ManageAppSchema.safeParse({ ...validApp(), sortOrder: -1 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          path: ["sortOrder"],
          message: "Sort order must be a non-negative integer.",
        }),
      );
    }
  });

  it("rejects a non-integer sortOrder", () => {
    const result = ManageAppSchema.safeParse({ ...validApp(), sortOrder: 1.5 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "sortOrder")).toBe(
        true,
      );
    }
  });

  it("rejects an empty tags array", () => {
    const result = ManageAppSchema.safeParse({ ...validApp(), tags: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          path: ["tags"],
          message: "At least one tag is required.",
        }),
      );
    }
  });

  it("rejects a tags array containing a non-string element", () => {
    const result = ManageAppSchema.safeParse({
      ...validApp(),
      tags: ["ok", 42],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "tags")).toBe(true);
    }
  });

  it("rejects a null optional field (imageId) — null is not an accepted variant", () => {
    const result = ManageAppSchema.safeParse({
      ...validApp(),
      imageId: null,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "imageId")).toBe(
        true,
      );
    }
  });

  it("rejects a wrong-typed name (number instead of string)", () => {
    const result = ManageAppSchema.safeParse({ ...validApp(), name: 123 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "name")).toBe(true);
    }
  });
});

describe("ManageAppSchema — linkType-driven CTA refinements", () => {
  it("rejects an internal ctaLink that doesn't start with /", () => {
    const result = ManageAppSchema.safeParse({
      ...validApp(),
      linkType: "internal" as const,
      ctaLink: "apps/123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          path: ["ctaLink"],
          message: "Internal link must start with /.",
        }),
      );
    }
  });

  it("rejects an internal ctaLink to a non-whitelisted base path", () => {
    const result = ManageAppSchema.safeParse({
      ...validApp(),
      linkType: "internal" as const,
      ctaLink: "/gibberish-path",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          path: ["ctaLink"],
          message: "Invalid internal link format or non-existent path.",
        }),
      );
    }
  });

  it("rejects an internal tool ctaLink using a slug instead of a tool id", () => {
    const result = ManageAppSchema.safeParse({
      ...validApp(),
      linkType: "internal" as const,
      ctaLink: "/tool/short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          path: ["ctaLink"],
          message:
            "If linking to a Tool, please use the exact Tool ID (e.g., /tool/01KRG...) instead of a slug.",
        }),
      );
    }
  });

  it("rejects an external ctaLink that doesn't start with https://", () => {
    const result = ManageAppSchema.safeParse({
      ...validApp(),
      linkType: "external" as const,
      ctaLink: "http://example.com",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          path: ["ctaLink"],
          message: "External link must start with https://.",
        }),
      );
    }
  });

  it("requires ctaLabel when linkType is not 'instruction'", () => {
    const result = ManageAppSchema.safeParse({
      ...validApp(),
      linkType: "external" as const,
      ctaLabel: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          path: ["ctaLabel"],
          message: "CTA label is required.",
        }),
      );
    }
  });

  it("requires ctaLink when linkType is not 'instruction'", () => {
    const result = ManageAppSchema.safeParse({
      ...validApp(),
      linkType: "external" as const,
      ctaLink: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          path: ["ctaLink"],
          message: "CTA link is required.",
        }),
      );
    }
  });

  it("rejects a ctaLabel longer than 30 characters", () => {
    const result = ManageAppSchema.safeParse({
      ...validApp(),
      ctaLabel: "A".repeat(31),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          path: ["ctaLabel"],
          message: "CTA label must be 30 characters or fewer.",
        }),
      );
    }
  });

  it("rejects a badgeLabel longer than 40 characters", () => {
    const result = ManageAppSchema.safeParse({
      ...validApp(),
      badgeLabel: "A".repeat(41),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          path: ["badgeLabel"],
          message: "Badge label must be 40 characters or fewer.",
        }),
      );
    }
  });
});
