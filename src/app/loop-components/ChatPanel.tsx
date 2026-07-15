"use client";

import { AlertCircle, Sparkles, X, Maximize2, Minimize2 } from "lucide-react";
import Link from "next/link";
import { ChatMessageList } from "./ChatMessageList";
import { ChatComposer } from "./ChatComposer";
import { useChatMessaging } from "./useChatMessaging";
import { useChatComposer } from "./useChatComposer";
import { Badge } from "@/components/ui/badge";
import type { ChatMessage } from "@/core/interfaces/loop-projects.interface";

interface ChatPanelProps {
    projectId: string;
    taskId: string;
    chatHistory: ChatMessage[];
    onRefresh: () => void;
    onTriggerLog: () => void;
    onCollapse?: () => void;
    onExpand?: () => void;
    isMaximized?: boolean;
}

export function ChatPanel({ projectId, taskId, chatHistory, onRefresh, onTriggerLog, onCollapse, onExpand, isMaximized }: ChatPanelProps) {
    const messaging = useChatMessaging({ projectId, taskId, chatHistory, onRefresh, onTriggerLog });
    const composer = useChatComposer({
        projectId,
        disabled: messaging.isDisabled,
        onSend: messaging.sendMessage,
        onCollaborate: messaging.collaborate,
    });

    const { costSummary } = messaging;

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
            {/* Header / Cost summary */}
            <div className="flex shrink-0 items-center justify-between px-5 select-none bg-white h-14 border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-850 font-sans tracking-tight">Team Chat</span>
                    <Badge variant="warning" title={`${Math.round((costSummary.input + costSummary.output)/1000)}k tokens`}>
                        ${costSummary.cost.toFixed(3)}
                    </Badge>
                </div>
                <div className="flex items-center gap-1">
                    {onExpand && (
                        <button
                            type="button"
                            onClick={onExpand}
                            title={isMaximized ? "Restore Chat Size" : "Expand to Drawer"}
                            className="flex size-7 cursor-pointer items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                        >
                            {isMaximized ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onCollapse}
                        title="Close Chat"
                        className="flex size-7 cursor-pointer items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                    >
                        <X className="size-3.5" />
                    </button>
                </div>
            </div>

            {/* Main Content Area with lavender background */}
            <div className="flex-1 flex flex-col min-h-0 bg-[#f8f9fc]">
                {/* Bridge-mode notice (opt-in): requests are handed to the IDE agent */}
                {messaging.useBridge && (
                    <div className="flex shrink-0 items-start gap-1.5 border-b border-amber-200 bg-amber-50/50 px-3 py-2">
                        <AlertCircle className="size-3.5 shrink-0 mt-0.5 text-amber-500" />
                        <span className="text-xs leading-normal text-amber-800 font-sans">
                            IDE Bridge is on — messages are handed to your IDE agent instead of replying here. Uncheck it to chat live with Somsri, using a key saved in the <Link href="/agents" className="font-semibold underline hover:text-indigo-600">AI Team Manager</Link> (or a server-configured key).
                        </span>
                    </div>
                )}

                {/* Pending Bridge Banner */}
                {messaging.isBridgedPending && (
                    <div className="flex shrink-0 items-start gap-2 border-b border-indigo-100 bg-indigo-50/60 px-3 py-2.5">
                        <Sparkles className="size-4 shrink-0 mt-0.5 animate-pulse text-indigo-600" />
                        <div className="flex-1 text-xs leading-relaxed text-indigo-800 font-sans">
                            <span>Bridged to your IDE agent — waiting for a reply. In your IDE, run </span>
                            <code className="rounded-lg border border-indigo-100 bg-indigo-50/40 px-1 py-0.5 text-xs font-semibold font-sans">run bridge</code>
                            <span> (read .antigravity/bridge.json, do the work, write the reply back). Updates here automatically.</span>
                        </div>
                        <button
                            type="button"
                            onClick={messaging.cancelBridge}
                            className="shrink-0 cursor-pointer rounded-sm border border-indigo-200 px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
                        >
                            Cancel
                        </button>
                    </div>
                )}

                {/* Messages Area */}
                <ChatMessageList
                    messages={messaging.messages}
                    loading={messaging.loading}
                    collaborating={messaging.collaborating}
                    isBridgedPending={messaging.isBridgedPending}
                    endRef={messaging.messagesEndRef}
                />

                {/* Input Form — one clean row; secondary controls cluster at the right */}
                <ChatComposer
                    {...composer}
                    useBridge={messaging.useBridge}
                    disabled={messaging.isDisabled}
                    onToggleBridge={messaging.toggleBridge}
                />
            </div>
        </div>
    );
}
