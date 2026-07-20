"use client";

import React, { useState } from "react";
import { Lock, GitBranch, Plug } from "lucide-react";
import type { LoopProject, LoopAgent } from "@/core/interfaces/loop-projects.interface";
import { AgentAvatar } from "@/app/agents/components/AgentAvatar";
import { Badge } from "@/components/ui/badge";
import { ViewTabs, type WorkspaceViewTab } from "./ViewTabs";
import { ConnectGitModal } from "./ConnectGitModal";

interface WorkspaceHeaderProps {
    projectId: string;
    project: LoopProject | null;
    gitInfo: { branch: string; commit: string; modifiedFiles: string[] };
    totalCost: number;
    agents?: LoopAgent[];
    viewTab: WorkspaceViewTab;
    onViewTabChange: (tab: WorkspaceViewTab) => void;
    /** Refetch git info after the project is connected to git. */
    onConnected: () => void;
}

// Warm mesh-style gradient for the header banner (purple → magenta → coral → peach).
const HEADER_GRADIENT =
    "linear-gradient(105deg, #7c5ce6 0%, #a94fd8 22%, #d456ab 43%, #ee7d5f 68%, #f5c877 100%)";

function MetaColumn({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70 font-sans">{label}</span>
            <div className="flex items-center gap-1.5 text-xs text-white font-sans">{children}</div>
        </div>
    );
}

// Overlapping stack of the project's AI team using each agent's real generated avatar.
function TeamStack({ agents }: { agents: LoopAgent[] }) {
    const shown = agents.slice(0, 4);
    const rest = agents.length - shown.length;
    return (
        <div className="flex -space-x-2">
            {shown.map((a) => (
                <AgentAvatar key={a.id} seed={a.id} name={a.name} size={24} gender={a.gender} className="ring-2 ring-white" />
            ))}
            {rest > 0 && (
                <span className="flex size-6 items-center justify-center rounded-full bg-white/20 text-[10px] font-semibold text-white font-sans ring-2 ring-white backdrop-blur-sm">
                    +{rest}
                </span>
            )}
        </div>
    );
}

// Compact full-width gradient banner for the project board — breadcrumb + title +
// status on the left, labelled meta columns on the right, view tabs flush along
// the bottom (no bottom padding). All text is white.
export function WorkspaceHeader({ projectId, project, gitInfo, totalCost, agents = [], viewTab, onViewTabChange, onConnected }: WorkspaceHeaderProps) {
    const tasks = project?.tasks ?? [];
    const taskCount = tasks.length;
    const doneCount = tasks.filter((t) => t.status === "completed").length;
    const statusLine =
        taskCount === 0
            ? "No tasks yet — create one to get moving."
            : `${taskCount} task${taskCount === 1 ? "" : "s"} · ${doneCount} done · $${totalCost.toFixed(3)} spent`;

    // "unknown" branch = the project folder isn't its own git repo yet. The host
    // app is always a repo, so it never shows the connect affordance.
    const notUnderGit = gitInfo.branch === "unknown" && !project?.isHost;
    const [connectOpen, setConnectOpen] = useState(false);

    return (
        <>
        <div
            style={{ backgroundImage: HEADER_GRADIENT }}
            className="flex w-full flex-col gap-3 rounded-sm px-3 pt-4 pb-0 shadow-[0_12px_34px_-14px_rgba(124,92,230,0.55)]"
        >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-white/70 font-sans">
                        <span>Workspace</span>
                        <span className="text-white/40">/</span>
                        <span className="text-white/90">Projects</span>
                    </div>
                    <h1 className="mt-1 flex items-center gap-2 truncate text-xl font-bold tracking-tight text-white drop-shadow-sm">
                        {project?.name}
                        {project?.isHost && <Badge variant="warning">Host App</Badge>}
                    </h1>
                    <p className="mt-1 text-xs text-white/85 font-sans">{statusLine}</p>
                    <p className="mt-0.5 max-w-xl truncate text-[11px] text-white/60 font-sans select-all" title={project?.path}>
                        {project?.path}
                    </p>
                </div>

                <div className="flex items-start gap-6 shrink-0">
                    <MetaColumn label="Visibility">
                        <Lock className="size-3.5 text-white/80" />
                        <span className="font-medium">Private</span>
                    </MetaColumn>
                    <MetaColumn label="Branch">
                        {notUnderGit ? (
                            <button
                                type="button"
                                onClick={() => setConnectOpen(true)}
                                title="Initialize a git repository for this project"
                                className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/30 cursor-pointer"
                            >
                                <Plug className="size-3.5" />
                                Connect Git
                            </button>
                        ) : (
                            <>
                                <GitBranch className="size-3.5 text-white/80" />
                                <span className="font-medium">{gitInfo.branch}</span>
                                <span className="text-white/60">({gitInfo.commit})</span>
                            </>
                        )}
                    </MetaColumn>
                    {agents.length > 0 && (
                        <MetaColumn label="Team">
                            <TeamStack agents={agents} />
                        </MetaColumn>
                    )}
                </div>
            </div>

            {/* View tabs flush along the bottom (−ml-1 offsets the tab's own px-1 so
                the first tab left-aligns with the title/breadcrumb above). */}
            <div className="-ml-1">
                <ViewTabs viewTab={viewTab} onChange={onViewTabChange} variant="onGradient" />
            </div>
        </div>
        <ConnectGitModal
            projectId={projectId}
            open={connectOpen}
            onClose={() => setConnectOpen(false)}
            onConnected={onConnected}
        />
        </>
    );
}
