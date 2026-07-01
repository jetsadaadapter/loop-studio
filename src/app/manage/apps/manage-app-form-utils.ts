import type {
  AppLinkType,
  ManageAppApiItem,
  ManageAppPayload,
} from "@/core/interfaces/apps.interface";
import { getAppItemId } from "@/core/interfaces/apps.interface";
import { ApiError } from "@/core/services/api";
import { ManageAppSchema } from "@/core/validators/apps.validator";

export type AppRecord = {
  id: string;
  name: string;
  categoryId: string;
  description: string;
  imageId: string;
  iconId: string;
  coverId: string;
  instructions: string;
  integration: string;
  ctaLabel: string;
  ctaLink: string;
  linkType: AppLinkType;
  isActive: boolean;
  sortOrder: number;
  badgeLabel: string;
  tags: string[];
};

export const EMPTY_FORM: AppRecord = {
  id: "",
  name: "",
  categoryId: "",
  description: "",
  imageId: "",
  iconId: "",
  coverId: "",
  instructions: "",
  integration: "",
  ctaLabel: "",
  ctaLink: "",
  linkType: "internal",
  isActive: true,
  sortOrder: 0,
  badgeLabel: "",
  tags: [],
};

export function mapApiItemToRecord(item: ManageAppApiItem): AppRecord {
  return {
    id: getAppItemId(item),
    name: item.name,
    categoryId:
      item.categoryId ||
      (item.category !== null && typeof item.category === "object" ? item.category.id : ""),
    description: item.description,
    imageId: item.imageId,
    iconId: item.iconId,
    coverId: item.coverId ?? "",
    instructions: item.instructions,
    integration: item.integration ?? "",
    ctaLabel: item.ctaLabel ?? "",
    ctaLink: item.ctaLink ?? "",
    linkType: item.linkType,
    isActive: item.isActive,
    sortOrder: item.sortOrder,
    badgeLabel: item.badgeLabel ?? "",
    tags: (item.tags ?? [])
      .map((tag) => tag.name || tag.id || tag.tagId || "")
      .filter(Boolean),
  };
}

export function mapRecordToPayload(record: AppRecord): ManageAppPayload {
  return {
    name: record.name.trim(),
    categoryId: String(record.categoryId).trim(),
    description: record.description.trim(),
    imageId: record.imageId.trim(),
    iconId: record.iconId.trim(),
    coverId: record.coverId.trim(),
    instructions: record.instructions.trim(),
    integration: record.integration.trim() || null,
    ctaLabel: record.ctaLabel.trim(),
    ctaLink: record.ctaLink.trim(),
    linkType: record.linkType,
    isActive: record.isActive,
    sortOrder: record.sortOrder,
    badgeLabel: record.badgeLabel.trim(),
    tags: record.tags,
  };
}

function hasChanged(nextValue: string, previousValue: string): boolean {
  const next = nextValue.trim();
  const prev = previousValue.trim();
  return Boolean(next) && Boolean(prev) && next !== prev;
}

export function buildImageRemovePayload(
  nextMedia: { imageId: string; iconId: string; coverId: string },
  previousMedia: { imageId: string; iconId: string; coverId: string },
): NonNullable<ManageAppPayload["imageRemove"]> | undefined {
  const previousImageId = previousMedia.imageId.trim();
  const previousIconId = previousMedia.iconId.trim();
  const previousCoverId = previousMedia.coverId.trim();

  const imageChanged = hasChanged(nextMedia.imageId, previousImageId);
  const iconChanged = hasChanged(nextMedia.iconId, previousIconId);
  const coverChanged = hasChanged(nextMedia.coverId, previousCoverId);

  const imageRemove: NonNullable<ManageAppPayload["imageRemove"]> = {};

  if (imageChanged && previousImageId) {
    imageRemove.imageId = previousImageId;
  }

  if (iconChanged && previousIconId) {
    imageRemove.iconId = previousIconId;
  }

  if (coverChanged && previousCoverId) {
    imageRemove.coverId = previousCoverId;
  }

  return Object.keys(imageRemove).length > 0 ? imageRemove : undefined;
}

export function parseApiFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || !error.details) return {};

  const details = error.details as {
    errors?: Record<string, string | string[]>;
    fieldErrors?: Record<string, string | string[]>;
  };

  const raw = details.fieldErrors ?? details.errors;
  if (!raw || typeof raw !== "object") return {};

  const mapped: Record<string, string> = {};
  for (const [field, value] of Object.entries(raw)) {
    mapped[field] = Array.isArray(value)
      ? (value[0] ?? "Invalid value")
      : value;
  }
  return mapped;
}

export function validateAppForm(value: AppRecord): Record<string, string> {
  const result = ManageAppSchema.safeParse(value);
  if (result.success) return {};

  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path[0] as string;
    errors[path] = issue.message;
  });

  return errors;
}
