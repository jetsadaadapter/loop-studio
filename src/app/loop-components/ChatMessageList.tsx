"use client";

import React from "react";
import Image from "next/image";
import { Sparkles, FileText, Loader2 } from "lucide-react";
import { ChatMessageContent, messageHasCode } from "./ChatMessageContent";
import { AgentAvatar } from "@/app/agents/components/AgentAvatar";
import type { ChatMessage } from "@/core/interfaces/loop-projects.interface";

interface ChatMessageListProps {
    messages: ChatMessage[];
    loading: boolean;
    collaborating: boolean;
    isBridgedPending: boolean;
    endRef: React.RefObject<HTMLDivElement | null>;
}

interface AgentIdentity {
    seed: string;
    gender: "male" | "female";
}

function resolveAgentIdentity(senderName: string, role: "user" | "assistant" | "system"): AgentIdentity {
    const nameLower = senderName.toLowerCase();
    if (nameLower.includes("somsri")) return { seed: "agent-somsri", gender: "female" };
    if (nameLower.includes("somchai")) return { seed: "agent-somchai", gender: "male" };
    if (nameLower.includes("wichai")) return { seed: "agent-wichai", gender: "male" };
    if (nameLower.includes("mana")) return { seed: "agent-mana", gender: "male" };
    if (nameLower.includes("preecha")) return { seed: "agent-preecha", gender: "male" };
    if (role === "user") return { seed: "user", gender: "male" };
    return { seed: senderName, gender: "female" };
}

/** Animated "typing…" bubble shown while waiting for a chat response */
function TypingIndicator({ collaborating }: { collaborating: boolean }) {
    return (
        <div className="flex items-start gap-3 mr-auto">
            <AgentAvatar
                seed="agent-somsri"
                name="Somsri (Developer)"
                size={30}
                gender="female"
                className="shadow-3xs border border-slate-100 bg-white shrink-0 mt-0.5"
            />
            <div className="flex flex-col items-start gap-1 min-w-0">
                <div className="rounded-[18px] rounded-tl-[4px] bg-white border border-slate-200/80 shadow-3xs px-4 py-3 flex items-center gap-2.5">
                    {/* Bouncing dots */}
                    <span className="flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
                        <span className="size-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
                        <span className="size-1.5 rounded-full bg-slate-400 animate-bounce" />
                    </span>
                    <span className="text-xs text-slate-400 font-sans select-none">
                        {collaborating ? "Delegating to agent team…" : "Somsri is typing…"}
                    </span>
                </div>
            </div>
        </div>
    );
}

export function ChatMessageList({ messages, loading, collaborating, isBridgedPending, endRef }: ChatMessageListProps) {
    const isWaiting = (loading || collaborating) && !isBridgedPending;

    return (
        <div className="flex-1 bg-[#f8f9fc] overflow-y-auto min-h-0 flex flex-col">
            <div className="flex-1 flex flex-col justify-end px-5 py-5 gap-6">
                {messages.length === 0 && !isWaiting ? (
                    <div className="flex flex-col flex-1 items-center justify-center text-center p-6 select-none">
                        <Sparkles className="size-7 text-indigo-500 mb-2 animate-pulse" />
                        <h4 className="text-xs font-semibold text-slate-700">Chat Workspace Ready</h4>
                        <p className="text-[11.5px] text-slate-400 font-sans mt-1 max-w-[220px] leading-relaxed">
                            Type instructions to Chat with Somsri (Developer) or delegate the work to the AI Agent Team.
                        </p>
                    </div>
                ) : (
                    <>
                        {messages.map((m) => {
                            const isUser = m.role === "user";
                            const isSystem = m.role === "system";
                            const tone = isUser ? "user" : isSystem ? "system" : "assistant";
                            const hasCode = tone === "assistant" && messageHasCode(m.content);

                            if (isSystem) {
                                return (
                                    <div key={m.id} className="w-full flex justify-start">
                                        <div className="bg-white/80 border border-slate-200/50 rounded-2xl px-4.5 py-3 text-[10px] text-slate-500 text-left font-sans shadow-4xs max-w-[90%] min-w-0 overflow-hidden leading-relaxed">
                                            <ChatMessageContent content={m.content} tone={tone} />
                                        </div>
                                    </div>
                                );
                            }

                            const identity = resolveAgentIdentity(m.senderName, m.role);
                            return (
                                <div
                                    key={m.id}
                                    className={`flex items-start gap-3 min-w-0 ${isUser ? "flex-row-reverse ml-8" : "flex-row mr-8"}`}
                                >
                                    <AgentAvatar
                                        seed={identity.seed}
                                        name={m.senderName}
                                        size={30}
                                        gender={identity.gender}
                                        className="shadow-3xs border border-slate-100 bg-white shrink-0 mt-0.5"
                                    />
                                    {/* Bubble column */}
                                    <div className={`flex flex-col min-w-0 max-w-full gap-1.5 ${isUser ? "items-end" : "items-start"}`}>
                                        {/* Attachments */}
                                        {m.attachments && m.attachments.length > 0 && (
                                            <div className={`flex flex-wrap gap-1.5 ${isUser ? "justify-end" : "justify-start"}`}>
                                                {m.attachments.map((a) =>
                                                    a.mimeType.startsWith("image/") ? (
                                                        <Image
                                                            key={a.id}
                                                            src={a.dataUrl}
                                                            alt={a.name}
                                                            width={96}
                                                            height={96}
                                                            unoptimized
                                                            className="size-24 rounded-lg border border-slate-200 object-cover shadow-3xs"
                                                        />
                                                    ) : (
                                                        <span
                                                            key={a.id}
                                                            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 font-sans shadow-3xs"
                                                        >
                                                            <FileText className="size-3.5 text-slate-450 shrink-0" />
                                                            <span className="truncate max-w-[120px]">{a.name}</span>
                                                        </span>
                                                    ),
                                                )}
                                            </div>
                                        )}

                                        {/* Message bubble */}
                                        <div
                                            className={`rounded-[18px] px-4.5 py-3 text-xs select-text leading-relaxed shadow-3xs min-w-0 overflow-hidden ${
                                                isUser
                                                    ? "rounded-tr-[4px] bg-[#5D8736] text-white font-sans"
                                                    : "rounded-tl-[4px] bg-white text-slate-800 border border-slate-200/60"
                                            } ${hasCode ? "w-full" : "max-w-full"}`}
                                        >
                                            <ChatMessageContent content={m.content} tone={tone} />
                                        </div>

                                        {/* Timestamp */}
                                        <span className="text-[10px] text-slate-400 px-1 font-sans select-none mt-0.5">
                                            {m.timestamp
                                                ? new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                                : "just now"}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Loading / typing indicator */}
                        {isWaiting && <TypingIndicator collaborating={collaborating} />}
                    </>
                )}

                {/* Standalone loading state when messages exist but waiting */}
                {messages.length > 0 && isWaiting && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-sans select-none ml-11">
                        <Loader2 className="size-3.5 animate-spin" />
                        {collaborating ? "Delegating task to AI team…" : "Waiting for Somsri…"}
                    </div>
                )}

                <div ref={endRef} />
            </div>
        </div>
    );
}
