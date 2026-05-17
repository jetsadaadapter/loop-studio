import { z } from "zod";

export const ManageAppSchema = z.object({
  name: z.string().min(1, "App name is required."),
  categoryId: z.string().min(1, "Category is required."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  imageId: z.string().min(1, "Banner image is required."),
  iconId: z.string().min(1, "Thumbnail image is required."),
  coverId: z.string().optional(),
  instructions: z.string().min(10, "Instructions must be at least 10 characters."),
  ctaLabel: z.string().optional().or(z.literal("")),
  ctaLink: z.string().optional().or(z.literal("")),
  linkType: z.enum(["internal", "external", "instruction"]),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().nonnegative("Sort order must be a non-negative integer."),
  badgeLabel: z.string().max(40, "Badge label must be 40 characters or fewer.").optional().or(z.literal("")),
  tags: z.array(z.string()).min(1, "At least one tag is required."),
}).refine((data) => {
  if (data.linkType === "internal" && data.ctaLink) {
    return data.ctaLink.startsWith("/");
  }
  return true;
}, {
  message: "Internal link must start with /.",
  path: ["ctaLink"],
}).refine((data) => {
  if (data.linkType === "external" && data.ctaLink) {
    return data.ctaLink.startsWith("https://");
  }
  return true;
}, {
  message: "External link must start with https://.",
  path: ["ctaLink"],
}).refine((data) => {
  if (data.linkType !== "instruction") {
    return !!data.ctaLabel && data.ctaLabel.trim().length > 0;
  }
  return true;
}, {
  message: "CTA label is required.",
  path: ["ctaLabel"],
}).refine((data) => {
  if (data.linkType !== "instruction") {
    return !!data.ctaLink && data.ctaLink.trim().length > 0;
  }
  return true;
}, {
  message: "CTA link is required.",
  path: ["ctaLink"],
});

export type ManageAppPayloadInput = z.infer<typeof ManageAppSchema>;
