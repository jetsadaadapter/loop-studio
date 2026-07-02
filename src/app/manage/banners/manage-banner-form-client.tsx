"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ManagerShell } from "@/components/manager-shell";
import { getLocalizedText, getManageRouteMeta } from "@/app/manage/config";
import { useManageBannerFormData } from "./hooks/use-manage-banner-form-data";
import { DetailsSection } from "./form-sections/details-section";
import { AppSelectionSection } from "./form-sections/app-selection-section";
import { BannerSidebarSections } from "./form-sections/banner-sidebar-sections";

type ManageBannerFormClientProps = {
  mode: "create" | "edit";
  bannerId?: string;
};

export function ManageBannerFormClient({ mode, bannerId }: ManageBannerFormClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const routeMeta = useMemo(() => getManageRouteMeta(pathname), [pathname]);
  const pageTitle = useMemo(() => getLocalizedText(routeMeta.title), [routeMeta]);
  const pageSubtitle = useMemo(() => getLocalizedText(routeMeta.subtitle), [routeMeta]);

  const {
    draft,
    dateRange,
    apps,
    isLoading,
    isLoadingApps,
    isSubmitting,
    error,
    fieldErrors,
    touched,
    touch,
    handleFieldChange,
    handleDateRangeSelect,
    handleTimeChange,
    clearDateRange,
    getTimeValue,
    handleSubmit,
  } = useManageBannerFormData(mode, bannerId);

  function handleBlur(field: string) {
    touch(field);
  }

  return (
    <ManagerShell
      title={pageTitle}
      description={pageSubtitle}
    >
      <form onSubmit={handleSubmit} className="space-y-6 pb-20">
        {isLoading ? (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 space-y-6 lg:col-span-8">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-44 w-full rounded-xl" />
              ))}
            </div>
            <div className="col-span-12 lg:col-span-4">
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 space-y-6 lg:col-span-8">
              <DetailsSection
                title={draft.title}
                subtitle={draft.subtitle}
                touched={touched}
                fieldErrors={fieldErrors}
                onChange={(field, value) => handleFieldChange(field, value)}
                onBlur={handleBlur}
              />

              <AppSelectionSection
                selectedAppId={draft.appId}
                apps={apps}
                isLoadingApps={isLoadingApps}
                touched={touched}
                fieldErrors={fieldErrors}
                onChange={(appId) => handleFieldChange("appId", appId)}
              />
            </div>

            <div className="col-span-12 lg:col-span-4">
              <BannerSidebarSections
                imageId={draft.imageId}
                isActive={draft.isActive}
                dateRange={dateRange}
                startsAt={draft.startsAt}
                endsAt={draft.endsAt}
                touched={touched}
                fieldErrors={fieldErrors}
                onImageChange={(id) => handleFieldChange("imageId", id)}
                onImageError={(msg) => {
                  touch("imageId");
                  handleFieldChange("imageId", "");
                  void msg;
                }}
                onStatusChange={(val) => handleFieldChange("isActive", val === "active")}
                onDateRangeSelect={handleDateRangeSelect}
                onTimeChange={handleTimeChange}
                onClearDateRange={clearDateRange}
                getTimeValue={getTimeValue}
              />
            </div>
          </div>
        )}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {!isLoading && (
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting ? "Saving…" : mode === "create" ? "Create Banner" : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/manage/banners")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        )}
      </form>
    </ManagerShell>
  );
}
