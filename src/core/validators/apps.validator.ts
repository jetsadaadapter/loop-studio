import { z } from "zod";
import { isInvalidToolSlug, isInvalidInternalPath } from "@/lib/utils";

export const ManageAppSchema = z.object({
  name: z.string().min(3, "App name must be at least 3 characters.").max(50, "App name must be 50 characters or fewer."),
  categoryId: z.string().min(1, "Category is required."),
  description: z.string().min(10, "Description must be at least 10 characters.").max(500, "Description must be 500 characters or fewer."),
  imageId: z.string().optional().or(z.literal("")),
  iconId: z.string().optional().or(z.literal("")),
  coverId: z.string().optional().or(z.literal("")),
  instructions: z.string().min(10, "Instructions must be at least 10 characters."),
  integration: z.string().optional().or(z.literal("")),
  ctaLabel: z.string().max(30, "CTA label must be 30 characters or fewer.").optional().or(z.literal("")),
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
  if (data.linkType === "internal" && data.ctaLink) {
    return !isInvalidInternalPath(data.ctaLink);
  }
  return true;
}, {
  message: "Invalid internal link format or non-existent path.",
  path: ["ctaLink"],
}).refine((data) => {
  if (data.linkType === "internal" && data.ctaLink) {
    return !isInvalidToolSlug(data.ctaLink);
  }
  return true;
}, {
  message: "If linking to a Tool, please use the exact Tool ID (e.g., /tool/01KRG...) instead of a slug.",
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
