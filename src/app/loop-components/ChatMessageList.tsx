"use client";

import React from "react";
import Image from "next/image";
import { Sparkles, FileText } from "lucide-react";
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
    if (nameLower.includes("somsri")) {
        return { seed: "agent-somsri", gender: "female" };
    }
    if (nameLower.includes("somchai")) {
        return { seed: "agent-somchai", gender: "male" };
    }
    if (nameLower.includes("wichai")) {
        return { seed: "agent-wichai", gender: "male" };
    }
    if (nameLower.includes("mana")) {
        return { seed: "agent-mana", gender: "male" };
    }
    if (nameLower.includes("preecha")) {
        return { seed: "agent-preecha", gender: "male" };
    }
    if (role === "user") {
        return { seed: "user", gender: "male" };
    }
    return { seed: senderName, gender: "female" };
}

export function ChatMessageList({ messages, loading, collaborating, isBridgedPending, endRef }: ChatMessageListProps) {
    return (
        <div className="flex-1 bg-[#f8f9fc] p-4 overflow-y-auto space-y-4 min-h-0">
            {messages.length === 0 ? (
                <div className="flex flex-col h-full items-center justify-center text-center p-4 select-none">
                    <Sparkles className="size-7 text-indigo-500 mb-1.5 animate-pulse" />
                    <h4 className="text-xs font-semibold text-slate-700">Chat Workspace Ready</h4>
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5 max-w-[200px]">Type instructions to Chat with Somsri (Developer) or delegate the work to the AI Agent Team.</p>
                </div>
            ) : (
                messages.map((m) => {
                    const isUser = m.role === "user";
                    const isSystem = m.role === "system";
                    const tone = isUser ? "user" : isSystem ? "system" : "assistant";
                    const hasCode = tone === "assistant" && messageHasCode(m.content);

                    if (isSystem) {
                        return (
                            <div key={m.id} className="w-full flex justify-start py-1">
                                <div className="bg-white/80 border border-slate-200/50 rounded-xl px-3 py-1.5 text-[10px] text-slate-500 text-left font-sans shadow-4xs max-w-[90%]">
                                    <ChatMessageContent content={m.content} tone={tone} />
                                </div>
                            </div>
                        );
                    }

                    const identity = resolveAgentIdentity(m.senderName, m.role);
                    return (
                        <div key={m.id} className={`flex items-start gap-2.5 max-w-[85%] w-fit ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                            <AgentAvatar
                                seed={identity.seed}
                                name={m.senderName}
                                size={32}
                                gender={identity.gender}
                                className="shadow-4xs border border-slate-100 mt-0.5 bg-white"
                            />
                            <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                                {m.attachments && m.attachments.length > 0 && (
                                    <div className={`mb-1 flex flex-wrap gap-1.5 ${isUser ? "justify-end" : "justify-start"}`}>
                                        {m.attachments.map((a) =>
                                            a.mimeType.startsWith("image/") ? (
                                                <Image
                                                    key={a.id}
                                                    src={a.dataUrl}
                                                    alt={a.name}
                                                    width={96}
                                                    height={96}
                                                    unoptimized
                                                    className="size-24 rounded-lg border border-slate-200 object-cover"
                                                />
                                            ) : (
                                                <span
                                                    key={a.id}
                                                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 font-sans shadow-4xs"
                                                >
                                                    <FileText className="size-3.5 text-slate-450" />
                                                    {a.name}
                                                </span>
                                            ),
                                        )}
                                    </div>
                                )}
                                <div className={`rounded-[20px] p-3 text-xs select-text leading-relaxed bg-white text-slate-800 shadow-4xs ${
                                    isUser ? "rounded-tr-[4px]" : "rounded-tl-[4px]"
                                } ${hasCode ? "w-full" : ""}`}>
                                    <ChatMessageContent content={m.content} tone={tone} />
                                </div>
                                <span className="text-[10px] text-indigo-400 mt-1 px-2 font-sans select-none">
                                    {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "just now"}
                                </span>
                            </div>
                        </div>
                    );
                })
            )}
            {(loading || collaborating) && !isBridgedPending && (
                <div className="flex items-start gap-2.5 max-w-[85%] mr-auto">
                    <AgentAvatar
                        seed="agent-somsri"
                        name="Somsri (Developer)"
                        size={32}
                        gender="female"
                        className="shadow-4xs border border-slate-100 mt-0.5 bg-white"
                    />
                    <div className="flex flex-col items-start select-none">
                        <div className="max-w-[85%] rounded-[20px] rounded-tl-[4px] border border-slate-200 bg-white p-3 shadow-4xs">
                            <span className="flex gap-1.5">
                                <span className="size-1.5 rounded-full bg-slate-450 animate-bounce [animation-delay:-0.3s]" />
                                <span className="size-1.5 rounded-full bg-slate-450 animate-bounce [animation-delay:-0.15s]" />
                                <span className="size-1.5 rounded-full bg-slate-450 animate-bounce" />
                            </span>
                        </div>
                    </div>
                </div>
            )}
            <div ref={endRef} />
        </div>
    );
}
