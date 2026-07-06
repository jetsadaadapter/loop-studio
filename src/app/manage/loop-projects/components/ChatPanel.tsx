"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Users, Sparkles, AlertCircle, Coins, Plus, Zap, X, FileText } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessageList } from "./ChatMessageList";
import { resolveBridge } from "./bridge-client";
import type { ChatMessage, ChatAttachment } from "@/core/interfaces/loop-projects.interface";

interface ChatPanelProps {
    projectId: string;
    taskId: string;
    chatHistory: ChatMessage[];
    onRefresh: () => void;
    onTriggerLog: () => void;
}

function readFileAsAttachment(file: File): Promise<ChatAttachment> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({
            id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: file.name,
            mimeType: file.type || "application/octet-stream",
            dataUrl: reader.result as string,
        });
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

export function ChatPanel({ projectId, taskId, chatHistory, onRefresh, onTriggerLog }: ChatPanelProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [useBridge, setUseBridge] = useState(false);
    const [isBridgedPending, setIsBridgedPending] = useState(false);
    const [loading, setLoading] = useState(false);
    const [collaborating, setCollaborating] = useState(false);
    const [costSummary, setCostSummary] = useState({ input: 0, output: 0, cost: 0 });
    const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
    const [attachMenuOpen, setAttachMenuOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const bridgeAbortRef = useRef<AbortController | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const addFiles = async (files: FileList | File[]) => {
        const read = await Promise.all(Array.from(files).map(readFileAsAttachment));
        setAttachments((prev) => [...prev, ...read]);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const imageFiles = Array.from(e.clipboardData.items)
            .filter((item) => item.type.startsWith("image/"))
            .map((item) => item.getAsFile())
            .filter((f): f is File => f !== null);
        if (imageFiles.length > 0) {
            e.preventDefault();
            void addFiles(imageFiles);
        }
    };

    const removeAttachment = (id: string) => {
        setAttachments((prev) => prev.filter((a) => a.id !== id));
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMessages(chatHistory || []);
        if (typeof window !== "undefined") {
            setApiKey(localStorage.getItem("loop_anthropic_api_key") || "");
        }

        // Sum total cost
        const summary = (chatHistory || []).reduce(
            (acc, m) => {
                if (m.tokensUsed) {
                    acc.input += m.tokensUsed.input;
                    acc.output += m.tokensUsed.output;
                    acc.cost += m.tokensUsed.cost;
                }
                return acc;
            },
            { input: 0, output: 0, cost: 0 }
        );
        setCostSummary(summary);
    }, [chatHistory]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Cancel any in-flight bridge poll (on new send, unmount, or the Cancel button).
    const cancelBridge = () => {
        bridgeAbortRef.current?.abort();
        bridgeAbortRef.current = null;
        setIsBridgedPending(false);
    };

    // Stop polling when the panel unmounts.
    useEffect(() => () => bridgeAbortRef.current?.abort(), []);

    // Bridged request: poll the IDE bridge in the background (with backoff); when
    // the agent replies, the reply and any file edits are pulled into the chat.
    const startBridge = (bridgeId?: string) => {
        setIsBridgedPending(true);
        if (!bridgeId) return;
        bridgeAbortRef.current?.abort();
        const controller = new AbortController();
        bridgeAbortRef.current = controller;
        void resolveBridge(projectId, taskId, bridgeId, { signal: controller.signal }).then((outcome) => {
            if (outcome === "cancelled" || controller.signal.aborted) return;
            setIsBridgedPending(false);
            if (outcome === "done") {
                onRefresh();
                onTriggerLog();
            } else {
                setMessages((prev) => [...prev, {
                    id: `msg-bridge-note-${Date.now()}`,
                    role: "system",
                    senderName: "System",
                    content: outcome === "error"
                        ? "IDE bridge returned an error."
                        : "No reply from the IDE agent yet — the request is saved in .antigravity/bridge.json and will appear here once the agent responds.",
                    timestamp: new Date().toISOString(),
                }]);
            }
        });
    };

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if ((!inputValue.trim() && attachments.length === 0) || loading || collaborating) return;

        const userMsg: ChatMessage = {
            id: `msg-temp-${Date.now()}`,
            role: "user",
            senderName: "User",
            content: inputValue,
            timestamp: new Date().toISOString(),
            ...(attachments.length > 0 ? { attachments } : {}),
        };
        const sentAttachments = attachments;

        setMessages((prev) => [...prev, userMsg]);
        setInputValue("");
        setAttachments([]);
        setLoading(true);
        cancelBridge();

        try {
            const res = await fetch(`/api/manage/loop-projects/${projectId}/tasks/${taskId}/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Anthropic-API-Key": apiKey
                },
                body: JSON.stringify({ message: userMsg.content, history: messages, bridge: useBridge, attachments: sentAttachments }),
            });
            const data = await res.json();
            if (data.success) {
                if (data.bridged) {
                    startBridge(data.bridgeId);
                } else {
                    // Show Somsri's reply immediately, then sync full task state.
                    if (data.data) setMessages((prev) => [...prev, data.data as ChatMessage]);
                    onRefresh();
                    onTriggerLog();
                }
            } else {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: `msg-err-${Date.now()}`,
                        role: "system",
                        senderName: "System Error",
                        content: data.error || "Failed to send message",
                        timestamp: new Date().toISOString()
                    }
                ]);
            }
        } catch {
            // error
        } finally {
            setLoading(false);
        }
    };

    const handleCollaborate = async () => {
        if (!inputValue.trim() || loading || collaborating) return;
        setCollaborating(true);
        cancelBridge();
        onTriggerLog();

        try {
            const res = await fetch(`/api/manage/loop-projects/${projectId}/tasks/${taskId}/collaborate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Anthropic-API-Key": apiKey
                },
                body: JSON.stringify({ instructions: inputValue, bridge: useBridge }),
            });
            const data = await res.json();
            if (data.success) {
                setInputValue("");
                if (data.bridged) {
                    startBridge(data.bridgeId);
                } else {
                    // Poll/Refresh task data periodically during collaboration
                    const interval = setInterval(() => {
                        onRefresh();
                    }, 3000);
                    setTimeout(() => clearInterval(interval), 45000);
                }
            }
        } catch {
            // error
        } finally {
            setCollaborating(false);
        }
    };

    // Sending is always allowed: the server resolves a key (user/env) or falls
    // back to the IDE bridge, so we don't block on a missing client-side key.
    const isDisabled = loading || collaborating;

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#0d1526]">
            {/* Header / Cost summary */}
            <div className="flex shrink-0 items-center justify-between border-b border-[#24304b] p-3">
                <div className="flex items-center gap-1.5">
                    <Users className="size-4 text-indigo-400" />
                    <span className="text-xs font-semibold text-slate-200 font-sans">AI Developer Space</span>
                </div>
                <div className="inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                    <Coins className="size-3 text-amber-400" />
                    <span>${costSummary.cost.toFixed(3)} ({Math.round((costSummary.input + costSummary.output)/1000)}k tokens)</span>
                </div>
            </div>

            {/* Bridge-mode notice (opt-in): requests are handed to the IDE agent */}
            {useBridge && (
                <div className="flex shrink-0 items-start gap-1.5 border-b border-amber-400/15 bg-amber-400/[0.06] px-3 py-2">
                    <AlertCircle className="size-3.5 shrink-0 mt-0.5 text-amber-400" />
                    <span className="text-[10px] leading-normal text-amber-200/90 font-sans">
                        IDE Bridge is on — messages are handed to your IDE agent instead of replying here. Uncheck it to chat live with Somsri, using a key saved in the <Link href="/manage/loop-projects/agents" className="font-semibold underline hover:text-amber-100">AI Team Manager</Link> (or a server-configured key).
                    </span>
                </div>
            )}

            {/* Pending Bridge Banner */}
            {isBridgedPending && (
                <div className="flex shrink-0 items-start gap-2 border-b border-indigo-400/20 bg-indigo-400/[0.06] px-3 py-2.5">
                    <Sparkles className="size-4 shrink-0 mt-0.5 animate-pulse text-indigo-400" />
                    <div className="flex-1 text-[10px] leading-relaxed text-indigo-200/90 font-sans">
                        <span>Bridged to your IDE agent — waiting for a reply. In your IDE, run </span>
                        <code className="rounded-lg border border-indigo-400/20 bg-indigo-400/10 px-1 py-0.5 text-[10px] font-semibold font-sans">run bridge</code>
                        <span> (read .antigravity/bridge.json, do the work, write the reply back). Updates here automatically.</span>
                    </div>
                    <button
                        type="button"
                        onClick={cancelBridge}
                        className="shrink-0 cursor-pointer rounded-sm border border-indigo-400/30 px-2 py-1 text-[10px] font-semibold text-indigo-300 hover:bg-indigo-400/10"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* Messages Area */}
            <ChatMessageList
                messages={messages}
                loading={loading}
                collaborating={collaborating}
                isBridgedPending={isBridgedPending}
                endRef={messagesEndRef}
            />

            {/* Input Form — one clean row; secondary controls cluster at the right */}
            <form onSubmit={handleSend} className="shrink-0 border-t border-[#24304b] p-3">
                {attachments.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                        {attachments.map((a) => (
                            <span
                                key={a.id}
                                className="flex items-center gap-1.5 rounded-lg border border-[#24304b] bg-[#0b1322] py-1 pl-1.5 pr-1 text-[10px] text-slate-300 font-sans"
                            >
                                {a.mimeType.startsWith("image/") ? (
                                    <Image src={a.dataUrl} alt={a.name} width={18} height={18} unoptimized className="size-4.5 rounded object-cover" />
                                ) : (
                                    <FileText className="size-3.5 text-slate-500" />
                                )}
                                <span className="max-w-24 truncate">{a.name}</span>
                                <button
                                    type="button"
                                    onClick={() => removeAttachment(a.id)}
                                    aria-label={`Remove ${a.name}`}
                                    className="flex size-4 items-center justify-center rounded-full text-slate-500 hover:bg-white/10 hover:text-slate-200 cursor-pointer"
                                >
                                    <X className="size-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                <div className="flex items-end gap-1.5 rounded-xl border border-[#24304b] bg-[#0b1322] px-2 py-1.5">
                    <div className="relative shrink-0">
                        <button
                            type="button"
                            onClick={() => setAttachMenuOpen((o) => !o)}
                            aria-label="Attach files"
                            title="Attach files"
                            className="flex size-6 items-center justify-center rounded-md text-slate-400 hover:bg-white/10 hover:text-slate-200 cursor-pointer"
                        >
                            <Plus className="size-4" />
                        </button>
                        {attachMenuOpen && (
                            <div className="absolute bottom-full left-0 z-10 mb-2 w-48 rounded-lg border border-[#24304b] bg-[#141e33] p-1 shadow-xl">
                                <button
                                    type="button"
                                    onClick={() => {
                                        fileInputRef.current?.click();
                                        setAttachMenuOpen(false);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-slate-300 hover:bg-white/10 cursor-pointer"
                                >
                                    <Plus className="size-3.5" />
                                    Upload from computer
                                </button>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*,.pdf,.txt,.md,.json"
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files) void addFiles(e.target.files);
                                e.target.value = "";
                            }}
                        />
                    </div>

                    <Textarea
                        rows={1}
                        disabled={isDisabled}
                        placeholder={isDisabled ? "Select a mode or set API Key first..." : "Ask a follow-up…"}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onPaste={handlePaste}
                        className="min-h-0 flex-1 resize-none border-0 bg-transparent px-1 py-1 text-xs leading-relaxed text-slate-200 shadow-none placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />

                    {/* Secondary controls, clustered at the right corner */}
                    <div className="flex shrink-0 items-center gap-1">
                        <button
                            type="button"
                            onClick={() => {
                                setUseBridge((prev) => !prev);
                                setIsBridgedPending(false);
                            }}
                            aria-pressed={useBridge}
                            title="Use IDE Agent Bridge (Free)"
                            className={`flex size-7 items-center justify-center rounded-md cursor-pointer ${
                                useBridge ? "bg-amber-400/15 text-amber-300" : "text-slate-400 hover:bg-white/10 hover:text-slate-200"
                            }`}
                        >
                            <Zap className="size-3.5" />
                        </button>

                        <button
                            type="button"
                            onClick={handleCollaborate}
                            disabled={isDisabled || !inputValue.trim()}
                            title="Delegate to the AI Agent Team (background)"
                            className="flex size-7 items-center justify-center rounded-md text-indigo-300 hover:bg-indigo-400/15 disabled:opacity-40 cursor-pointer"
                        >
                            <Users className="size-3.5" />
                        </button>

                        <button
                            type="submit"
                            disabled={isDisabled || (!inputValue.trim() && attachments.length === 0)}
                            title="Send"
                            className="flex size-7 items-center justify-center rounded-md bg-brand text-white hover:bg-brand/90 disabled:opacity-40 cursor-pointer shadow-sm"
                        >
                            <Send className="size-3.5" />
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
