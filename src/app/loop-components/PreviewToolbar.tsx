import { Monitor, MonitorSmartphone, Tablet } from "lucide-react";
import type { RiskTier } from "@/core/interfaces/loop-projects.interface";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { CommitPublishButton } from "./CommitPublishButton";
import { StatusBadge, type CheckState } from "./PreviewStatusBadge";
import type { PreviewTab } from "./usePreviewPane";

const TIER_VARIANTS: Record<RiskTier, BadgeVariant> = {
    RED: "error",
    ORANGE: "orange",
    YELLOW: "warning",
    GREEN: "success",
};

interface PreviewToolbarProps {
    deviceMode: "desktop" | "mobile";
    onDeviceModeChange?: (mode: "desktop" | "mobile") => void;
    visibleTabs: { key: PreviewTab; label: string; icon: typeof Monitor }[];
    tab: PreviewTab;
    onTabChange: (tab: PreviewTab) => void;
    verifyStatus: CheckState;
    buildStatus: CheckState;
    riskTier?: RiskTier;
    projectId: string;
    taskName?: string;
    onPublished: () => void;
}

/** Top toolbar: device toggle, tab switcher, pipeline status, publish. */
export function PreviewToolbar({
    deviceMode,
    onDeviceModeChange,
    visibleTabs,
    tab,
    onTabChange,
    verifyStatus,
    buildStatus,
    riskTier,
    projectId,
    taskName,
    onPublished,
}: PreviewToolbarProps) {
    return (
        <div className="flex items-center gap-1.5 border-b border-slate-200 bg-white px-3 py-2 shrink-0">
            <div className="flex items-center gap-1.5 pr-1.5 border-r border-slate-200 select-none">
                <button
                    type="button"
                    onClick={() => onDeviceModeChange?.("desktop")}
                    title="Desktop View"
                    className={`flex size-7 cursor-pointer items-center justify-center rounded-md border transition-all ${
                        deviceMode === "desktop"
                            ? "border-indigo-250 bg-indigo-50 text-indigo-600 shadow-3xs"
                            : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                    }`}
                >
                    <MonitorSmartphone className="size-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => onDeviceModeChange?.("mobile")}
                    title="Mobile View"
                    className={`flex size-7 cursor-pointer items-center justify-center rounded-md border transition-all ${
                        deviceMode === "mobile"
                            ? "border-indigo-250 bg-indigo-50 text-indigo-600 shadow-3xs"
                            : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                    }`}
                >
                    <Tablet className="size-3.5" />
                </button>
            </div>

            {visibleTabs.map(({ key, label, icon: Icon }) => {
                const active = tab === key;
                return (
                    <button
                        key={key}
                        type="button"
                        onClick={() => onTabChange(key)}
                        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-sans text-xs transition-colors cursor-pointer ${
                            active
                                ? "bg-slate-100 text-slate-800 border border-slate-200/50 shadow-3xs"
                                : "text-slate-500 hover:text-slate-850 hover:bg-slate-50 border border-transparent"
                        }`}
                    >
                        <Icon className="size-3.5" />
                        {label}
                    </button>
                );
            })}

            <div className="ml-auto flex items-center gap-1.5">
                <StatusBadge label="Verify" state={verifyStatus} />
                <StatusBadge label="Build" state={buildStatus} />
                {riskTier && (
                    <>
                        <span className="text-slate-300">·</span>
                        <Badge variant={TIER_VARIANTS[riskTier]}>
                            {riskTier}
                        </Badge>
                    </>
                )}
                <span className="ml-1 pl-1.5 border-l border-slate-200">
                    <CommitPublishButton projectId={projectId} taskName={taskName} onPublished={onPublished} />
                </span>
            </div>
        </div>
    );
}
