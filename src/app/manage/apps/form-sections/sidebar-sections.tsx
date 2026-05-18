"use client";

import { useMemo } from "react";
import { CircleIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SidebarSectionsProps = {
  iconId: string;
  coverId: string;
  isActive: boolean;
  badgeLabel: string;
  touched: Partial<Record<string, boolean>>;
  fieldErrors: Record<string, string>;
  onIconChange: (value: string) => void;
  onIconError: (message: string) => void;
  onCoverChange: (value: string) => void;
  onCoverError: (message: string) => void;
  onStatusChange: (value: string) => void;
  onBadgeChange: (value: string) => void;
};

export function SidebarSections({
  iconId,
  coverId,
  isActive,
  badgeLabel,
  touched,
  fieldErrors,
  onIconChange,
  onIconError,
  onCoverChange,
  onCoverError,
  onStatusChange,
  onBadgeChange,
}: SidebarSectionsProps) {
  const statuses = useMemo(
    () => [
      {
        value: "active",
        label: "Active",
        color: "text-teal-600 fill-teal-600",
      },
      {
        value: "inactive",
        label: "Inactive",
        color: "text-gray-500 fill-gray-500",
      },
    ],
    [],
  );

  const selectedStatus = statuses.find(
    (status) => status.value === (isActive ? "active" : "inactive"),
  );

  return (
    <div className="space-y-6">
      <Card className="rounded-xl border-0">
        <CardHeader>
          <h5 className="text-base font-semibold">Icon</h5>
        </CardHeader>
        <CardContent>
          <Field>
            <ImageUpload
              value={iconId}
              previewSrc={
                iconId
                  ? `/images/${encodeURIComponent(iconId.trim())}`
                  : undefined
              }
              previewFit="contain"
              onChange={onIconChange}
              onError={onIconError}
              placeholder="Upload icon"
              description="Recommended size: 512x512 px. Supports png, jpg, jpeg, webp."
            />
            <FieldError
              errors={touched.iconId ? [{ message: fieldErrors.iconId }] : []}
            />
          </Field>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-0">
        <CardHeader>
          <h5 className="text-base font-semibold">Cover Image</h5>
        </CardHeader>
        <CardContent>
          <Field>
            <ImageUpload
              value={coverId}
              previewSrc={
                coverId
                  ? `/images/${encodeURIComponent(coverId.trim())}`
                  : undefined
              }
              previewFit="cover"
              expectedWidth={1200}
              expectedHeight={630}
              onChange={onCoverChange}
              onError={onCoverError}
              placeholder="Upload cover"
              description="Recommended size: 1200x630 px. Supports png, jpg, jpeg, webp."
            />
            <FieldError
              errors={touched.coverId ? [{ message: fieldErrors.coverId }] : []}
            />
          </Field>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-0">
        <CardHeader>
          <h5 className="text-base font-semibold">Status</h5>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field>
            <FieldLabel>Publish Status</FieldLabel>
            <Select
              value={isActive ? "active" : "inactive"}
              onValueChange={(val) => onStatusChange(val || "")}
            >
              <SelectTrigger className="w-full [&>span]:flex [&>span]:items-center [&>span]:gap-2">
                {selectedStatus ? (
                  <CircleIcon className={`size-2 ${selectedStatus.color}`} />
                ) : null}
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                {statuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    <div className="flex items-center gap-2">
                      <CircleIcon className={`size-2 ${status.color}`} />
                      <span className="truncate">{status.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Badge Label</FieldLabel>
            <Select value={badgeLabel || "none"} onValueChange={(val) => onBadgeChange(val || "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select badge" />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="New">
                  <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700">
                    New
                  </span>
                </SelectItem>
                <SelectItem value="Trending">
                  <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">
                    Trending
                  </span>
                </SelectItem>
                <SelectItem value="Hot">
                  <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-rose-100 text-rose-700">
                    Hot
                  </span>
                </SelectItem>
                <SelectItem value="Coming Soon">
                  <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-violet-100 text-violet-700">
                    Coming Soon
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <FieldError
              errors={
                touched.badgeLabel ? [{ message: fieldErrors.badgeLabel }] : []
              }
            />
          </Field>
        </CardContent>
      </Card>
    </div>
  );
}
