"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { ManagerShell } from "@/components/manager-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useManageAppFormData } from "./hooks/use-manage-app-form-data";
import { GeneralSection } from "./form-sections/general-section";
import { FeaturedImageSection } from "./form-sections/featured-image-section";
import { ActionSection } from "./form-sections/action-section";
import { ContentSection } from "./form-sections/content-section";
import { SidebarSections } from "./form-sections/sidebar-sections";
import { InstructionsPreviewDialog } from "./instructions-preview-dialog";
import { IntegrationPreviewDialog } from "./integration-preview-dialog";

type ManageAppFormClientProps = {
  mode: "create" | "edit";
  appId?: string;
};

export function ManageAppFormClient({ mode, appId }: ManageAppFormClientProps) {
  const router = useRouter();
  const instructionsMdInputRef = useRef<HTMLInputElement>(null);
  const integrationMdInputRef = useRef<HTMLInputElement>(null);

  const {
    draft,
    setDraft,
    isLoading,
    isSubmitting,
    error,
    fieldErrors,
    touched,
    tagSuggestions,
    categories,
    showPreview,
    setShowPreview,
    didCopy,
    showIntegrationPreview,
    setShowIntegrationPreview,
    didCopyIntegration,
    touch,
    touchAndValidate,
    handleInstructionsPaste,
    handleInstructionsMdInputChange,
    handleCopyInstructions,
    handleDownloadMarkdown,
    handleIntegrationPaste,
    handleIntegrationMdInputChange,
    handleCopyIntegration,
    handleDownloadIntegration,
    handleSubmit,
    handleFieldChange,
  } = useManageAppFormData(mode, appId);

  const pageTitle = mode === "create" ? "Create App" : "Edit App";

  return (
    <ManagerShell
      title={pageTitle}
      description={
        mode === "create"
          ? "Add a new app to the catalog."
          : "Edit app details, media, and publishing options."
      }
      actions={
        <Button type="button" variant="outline" onClick={() => router.push("/manage/apps")}>
          Back to List
        </Button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 space-y-6 lg:col-span-8">
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-40 w-full rounded-xl" />
                ))}
              </div>
            </div>
            <div className="col-span-12 lg:col-span-4">
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 space-y-6 lg:col-span-8">
              <GeneralSection
                name={draft.name}
                categoryId={draft.categoryId}
                description={draft.description}
                categories={categories}
                touched={touched}
                fieldErrors={fieldErrors}
                onChange={handleFieldChange}
                onBlur={(field) => touchAndValidate(field, draft)}
              />

              <FeaturedImageSection
                imageId={draft.imageId}
                touched={touched}
                fieldErrors={fieldErrors}
                onChange={(value) => handleFieldChange("imageId", value)}
                onError={() => {
                  touch("imageId");
                  setDraft((c) => ({ ...c, imageId: "" }));
                  handleFieldChange("imageId", "");
                }}
              />

              <ActionSection
                linkType={draft.linkType}
                ctaLabel={draft.ctaLabel}
                ctaLink={draft.ctaLink}
                touched={touched}
                fieldErrors={fieldErrors}
                onChange={handleFieldChange}
                onBlur={(field) => touchAndValidate(field, draft)}
              />

              <ContentSection
                instructions={draft.instructions}
                integration={draft.integration}
                tags={draft.tags}
                tagSuggestions={tagSuggestions}
                touched={touched}
                fieldErrors={fieldErrors}
                onChange={handleFieldChange}
                onBlur={(field) => touchAndValidate(field, draft)}
                onPaste={(e) => void handleInstructionsPaste(e)}
                onMdInputChange={(e) => void handleInstructionsMdInputChange(e)}
                onPreviewClick={() => setShowPreview(true)}
                instructionsMdInputRef={instructionsMdInputRef}
                onIntegrationPaste={(e) => void handleIntegrationPaste(e)}
                onIntegrationMdInputChange={(e) => void handleIntegrationMdInputChange(e)}
                onIntegrationPreviewClick={() => setShowIntegrationPreview(true)}
                integrationMdInputRef={integrationMdInputRef}
              />
            </div>

            <div className="col-span-12 space-y-6 lg:col-span-4">
              <SidebarSections
                iconId={draft.iconId}
                coverId={draft.coverId}
                isActive={draft.isActive}
                badgeLabel={draft.badgeLabel}
                touched={touched}
                fieldErrors={fieldErrors}
                onIconChange={(value) => handleFieldChange("iconId", value)}
                onIconError={() => {
                  touch("iconId");
                  setDraft((c) => ({ ...c, iconId: "" }));
                  handleFieldChange("iconId", "");
                }}
                onCoverChange={(value) => handleFieldChange("coverId", value)}
                onCoverError={() => {
                  touch("coverId");
                  setDraft((c) => ({ ...c, coverId: "" }));
                  handleFieldChange("coverId", "");
                }}
                onStatusChange={(value) => setDraft((current) => ({ ...current, isActive: value === "active" }))}
                onBadgeChange={(value) =>
                  setDraft((current) => ({ ...current, badgeLabel: value !== "none" ? value : "" }))
                }
              />
            </div>
          </div>
        )}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isSubmitting || isLoading}>
            {isSubmitting ? "Saving..." : mode === "create" ? "Create App" : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/manage/apps")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>

      <InstructionsPreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        instructions={draft.instructions}
        onCopy={handleCopyInstructions}
        onDownload={handleDownloadMarkdown}
        didCopy={didCopy}
      />

      <IntegrationPreviewDialog
        open={showIntegrationPreview}
        onOpenChange={setShowIntegrationPreview}
        integration={draft.integration}
        onCopy={handleCopyIntegration}
        onDownload={handleDownloadIntegration}
        didCopy={didCopyIntegration}
      />
    </ManagerShell>
  );
}
