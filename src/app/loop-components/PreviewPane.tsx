"use client";

import type { RiskTier } from "@/core/interfaces/loop-projects.interface";
import type { CheckState } from "./PreviewStatusBadge";
import { usePreviewPane } from "./usePreviewPane";
import { PreviewToolbar } from "./PreviewToolbar";
import { PreviewAppView } from "./PreviewAppView";
import { PreviewCodeView, PreviewDiffView } from "./PreviewSourceViews";

interface PreviewPaneProps {
    // URL of the live app to preview. Point this at the project's own dev server
    // (project.previewUrl, e.g. http://localhost:3001). Falls back to this app's
    // root, which renders without auth, when the project has no preview URL set.
    initialUrl?: string;
    // Latest auto-pipeline outcome (Phase 3) and the task's risk tier, shown next
    // to the tabs — e.g. "Verify ✓  Build ✓  · YELLOW" — so status is visible
    // without leaving the preview.
    verifyStatus?: CheckState;
    buildStatus?: CheckState;
    riskTier?: RiskTier;
    projectId: string;
    // Project template (e.g. "vite-react", "nodejs") — a signal for auto-picking
    // App vs API preview mode. Optional; detection falls back to a content probe.
    projectTemplate?: string;
    taskId: string;
    taskName?: string;
    onPublished: () => void;
    targetFiles?: string[];
    deviceMode?: "desktop" | "mobile";
    onDeviceModeChange?: (mode: "desktop" | "mobile") => void;
}

export function PreviewPane({
    initialUrl = "/",
    verifyStatus = "idle",
    buildStatus = "idle",
    riskTier,
    projectId,
    projectTemplate,
    taskId,
    taskName,
    onPublished,
    targetFiles = [],
    deviceMode = "desktop",
    onDeviceModeChange
}: PreviewPaneProps) {
    const p = usePreviewPane({ initialUrl, projectId, projectTemplate, taskId, verifyStatus, buildStatus, targetFiles });

    return (
        <div className="flex flex-1 flex-col overflow-hidden bg-slate-50 h-full">
            {/* Merged toolbar: device mode, tabs, pipeline status, and publish —
                one row instead of stacking a separate title bar above it. */}
            <PreviewToolbar
                deviceMode={deviceMode}
                onDeviceModeChange={onDeviceModeChange}
                visibleTabs={p.visibleTabs}
                tab={p.tab}
                onTabChange={p.setTab}
                verifyStatus={verifyStatus}
                buildStatus={buildStatus}
                riskTier={riskTier}
                projectId={projectId}
                taskName={taskName}
                onPublished={onPublished}
            />

            {p.tab === "preview" ? (
                <PreviewAppView
                    url={p.url}
                    inputUrl={p.inputUrl}
                    onInputUrlChange={p.setInputUrl}
                    onLoadUrl={p.loadUrl}
                    onReload={p.reload}
                    onRetry={p.retry}
                    reloadKey={p.reloadKey}
                    reachable={p.reachable}
                    apiCapable={p.apiCapable}
                    previewKind={p.previewKind}
                    bodyKind={p.bodyKind}
                    onSelectApp={p.selectApp}
                    onSelectApi={p.selectApi}
                    deviceMode={deviceMode}
                    projectId={projectId}
                />
            ) : p.tab === "code" ? (
                <PreviewCodeView
                    targetFiles={targetFiles}
                    effectiveSelectedFile={p.effectiveSelectedFile}
                    onSelectFile={p.setSelectedFile}
                    loadingCode={p.loadingCode}
                    codeError={p.codeError}
                    codeContent={p.codeContent}
                />
            ) : (
                <PreviewDiffView
                    loadingDiff={p.loadingDiff}
                    diffError={p.diffError}
                    diffContent={p.diffContent}
                />
            )}
        </div>
    );
}
