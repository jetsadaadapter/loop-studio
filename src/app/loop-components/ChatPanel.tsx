"use client";

import React, { useState, useEffect, useRef } from "react";
import { Users, Sparkles, AlertCircle, Zap, X, FileText, SendHorizontal, Paperclip, Maximize2, Minimize2, FileJson, FileCode, AtSign, Terminal, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessageList } from "./ChatMessageList";
import { resolveBridge } from "./bridge-client";
import { Badge } from "@/components/ui/badge";
import type { ChatMessage, ChatAttachment } from "@/core/interfaces/loop-projects.interface";

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

const CHAT_ACTIONS = [
    { name: "/collaborate", desc: "Delegate to AI Agent Team" },
    { name: "/clear", desc: "Clear input box" },
];

function getFileIcon(filePath: string, className = "size-3.5") {
    const ext = filePath.split(".").pop()?.toLowerCase();
    const cn = `${className} shrink-0`;
    if (ext === "json") return <FileJson className={`${cn} text-amber-500`} />;
    if (ext === "md" || ext === "mdx") return <FileText className={`${cn} text-blue-500`} />;
    if (["ts", "tsx", "js", "jsx", "mjs", "cjs"].includes(ext || "")) {
        return <FileCode className={`${cn} text-emerald-500`} />;
    }
    return <FileText className={`${cn} text-slate-400`} />;
}

function renderSuggestionItem(pathStr: string) {
    const parts = pathStr.split("/");
    const fileName = parts.pop() || "";
    const dirPath = parts.join("/");
    return (
        <div className="flex items-center gap-2 w-full min-w-0 text-xs">
            {getFileIcon(pathStr, "size-3.5")}
            <span className="font-medium text-slate-800 truncate shrink-0">{fileName}</span>
            {dirPath && (
                <span className="text-[11px] text-slate-400 truncate font-normal">
                    {dirPath}
                </span>
            )}
        </div>
    );
}

function generateUniqueId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readFileAsAttachment(file: File): Promise<ChatAttachment> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({
            id: generateUniqueId("att"),
            name: file.name,
            mimeType: file.type || "application/octet-stream",
            dataUrl: reader.result as string,
        });
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

export function ChatPanel({ projectId, taskId, chatHistory, onRefresh, onTriggerLog, onCollapse, onExpand, isMaximized }: ChatPanelProps) {
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

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-complete files and actions states
    const [projectFiles, setProjectFiles] = useState<string[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [triggerIndex, setTriggerIndex] = useState(-1);
    const [triggerType, setTriggerType] = useState<"@" | "/">("@");

    useEffect(() => {
        fetch(`/api/loop-projects/${projectId}/files`)
            .then((r) => r.json())
            .then((data) => {
                if (data.success) {
                    setProjectFiles(data.data || []);
                }
            })
            .catch(console.error);
    }, [projectId]);

    const handleSelectionChange = (val: string, selectionStart: number) => {
        if (!val) {
            setShowSuggestions(false);
            return;
        }
        const textBeforeCursor = val.slice(0, selectionStart);
        const lastSlash = textBeforeCursor.lastIndexOf("/");
        const lastAt = textBeforeCursor.lastIndexOf("@");
        const lastTrigger = Math.max(lastSlash, lastAt);
        
        if (lastTrigger !== -1) {
            const textBetween = textBeforeCursor.slice(lastTrigger + 1);
            if (!textBetween.includes(" ") && !textBetween.includes("\n")) {
                setTriggerIndex(lastTrigger);
                const isSlash = lastSlash > lastAt;
                setTriggerType(isSlash ? "/" : "@");
                
                const query = textBetween.toLowerCase();
                if (isSlash) {
                    const filtered = CHAT_ACTIONS.filter((act) => act.name.toLowerCase().includes(query));
                    setSuggestions(filtered.map((act) => act.name));
                    setShowSuggestions(filtered.length > 0);
                    setActiveIndex(0);
                } else {
                    const filtered = projectFiles.filter((f) => f.toLowerCase().includes(query));
                    setSuggestions(filtered.slice(0, 10));
                    setShowSuggestions(filtered.length > 0);
                    setActiveIndex(0);
                }
                return;
            }
        }
        setShowSuggestions(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showSuggestions && suggestions.length > 0) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((prev) => (prev + 1) % suggestions.length);
                return;
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
                return;
            }
            if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                void selectSuggestion(suggestions[activeIndex]);
                return;
            }
            if (e.key === "Escape") {
                e.preventDefault();
                setShowSuggestions(false);
                return;
            }
        }

        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const selectSuggestion = async (selected: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const val = inputValue;
        const selectionStart = textarea.selectionStart;
        const before = val.slice(0, triggerIndex);
        const after = val.slice(selectionStart);

        if (triggerType === "@") {
            // It's a file mention: we add the file as a ChatAttachment!
            const newVal = before + after;
            setInputValue(newVal);
            setShowSuggestions(false);
            
            try {
                const res = await fetch(`/api/loop-projects/${projectId}/files?file=${encodeURIComponent(selected)}`);
                const data = await res.json();
                if (data.success) {
                    const content = data.data;
                    const fileName = selected.split("/").pop() || "";
                    const base64Data = typeof window !== "undefined" ? window.btoa(unescape(encodeURIComponent(content))) : "";
                    const dataUrl = `data:text/plain;base64,${base64Data}`;
                    const newAttachment: ChatAttachment = {
                        id: generateUniqueId("att"),
                        name: fileName,
                        mimeType: "text/plain",
                        dataUrl: dataUrl,
                    };
                    setAttachments((prev) => {
                        if (prev.some((a) => a.name === fileName)) return prev;
                        return [...prev, newAttachment];
                    });
                }
            } catch (e) {
                console.error(e);
            }
        } else {
            // It's an action command
            if (selected === "/clear") {
                setInputValue("");
            } else if (selected === "/collaborate") {
                setInputValue("");
                void handleCollaborate();
            } else {
                const newVal = before + selected + " " + after;
                setInputValue(newVal);
            }
            setShowSuggestions(false);
        }

        setTimeout(() => {
            textarea.focus();
            if (triggerType === "@") {
                textarea.setSelectionRange(triggerIndex, triggerIndex);
            } else {
                const newPos = triggerIndex + selected.length + 1;
                textarea.setSelectionRange(newPos, newPos);
            }
        }, 0);
    };

    const triggerMention = () => {
        setInputValue((prev) => prev + "@");
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                const len = textareaRef.current.value.length;
                textareaRef.current.setSelectionRange(len, len);
                handleSelectionChange(textareaRef.current.value, len);
            }
        }, 50);
    };

    const triggerAction = () => {
        setInputValue((prev) => prev + "/");
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                const len = textareaRef.current.value.length;
                textareaRef.current.setSelectionRange(len, len);
                handleSelectionChange(textareaRef.current.value, len);
            }
        }, 50);
    };

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
            id: generateUniqueId("msg-temp"),
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
            const res = await fetch(`/api/loop-projects/${projectId}/tasks/${taskId}/chat`, {
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
            const res = await fetch(`/api/loop-projects/${projectId}/tasks/${taskId}/collaborate`, {
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
                {useBridge && (
                <div className="flex shrink-0 items-start gap-1.5 border-b border-amber-200 bg-amber-50/50 px-3 py-2">
                    <AlertCircle className="size-3.5 shrink-0 mt-0.5 text-amber-500" />
                    <span className="text-xs leading-normal text-amber-800 font-sans">
                        IDE Bridge is on — messages are handed to your IDE agent instead of replying here. Uncheck it to chat live with Somsri, using a key saved in the <Link href="/agents" className="font-semibold underline hover:text-indigo-600">AI Team Manager</Link> (or a server-configured key).
                    </span>
                </div>
            )}

            {/* Pending Bridge Banner */}
            {isBridgedPending && (
                <div className="flex shrink-0 items-start gap-2 border-b border-indigo-100 bg-indigo-50/60 px-3 py-2.5">
                    <Sparkles className="size-4 shrink-0 mt-0.5 animate-pulse text-indigo-600" />
                    <div className="flex-1 text-xs leading-relaxed text-indigo-800 font-sans">
                        <span>Bridged to your IDE agent — waiting for a reply. In your IDE, run </span>
                        <code className="rounded-lg border border-indigo-100 bg-indigo-50/40 px-1 py-0.5 text-xs font-semibold font-sans">run bridge</code>
                        <span> (read .antigravity/bridge.json, do the work, write the reply back). Updates here automatically.</span>
                    </div>
                    <button
                        type="button"
                        onClick={cancelBridge}
                        className="shrink-0 cursor-pointer rounded-sm border border-indigo-200 px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
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
            <form onSubmit={handleSend} className="shrink-0 bg-white">
                {attachments.length > 0 && (
                    <div className="mb-2 px-4 pt-2 flex flex-wrap gap-1.5">
                        {attachments.map((a) => {
                            const isImage = a.mimeType.startsWith("image/");
                            if (isImage) {
                                return (
                                    <div
                                        key={a.id}
                                        title={a.name}
                                        className="relative size-14 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden group shadow-3xs select-none"
                                    >
                                        <Image
                                            src={a.dataUrl}
                                            alt={a.name}
                                            width={56}
                                            height={56}
                                            unoptimized
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeAttachment(a.id)}
                                            aria-label={`Remove ${a.name}`}
                                            className="absolute top-1 right-1 size-5 flex items-center justify-center rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition-colors cursor-pointer opacity-0 group-hover:opacity-100 z-10"
                                        >
                                            <X className="size-3" />
                                        </button>
                                        {/* Hover image name banner */}
                                        <div className="absolute inset-x-0 bottom-0 bg-slate-900/80 text-[8px] leading-normal text-white px-1 py-0.5 truncate text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            {a.name}
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <span
                                    key={a.id}
                                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 py-1 pl-1.5 pr-1 text-xs text-slate-700 font-sans shadow-3xs"
                                >
                                    <FileText className="size-3.5 text-slate-500" />
                                    <span className="max-w-24 truncate">{a.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeAttachment(a.id)}
                                        aria-label={`Remove ${a.name}`}
                                        className="flex size-4 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer"
                                    >
                                        <X className="size-3" />
                                    </button>
                                </span>
                            );
                        })}
                    </div>
                )}

                <div className="flex h-[52px] items-center gap-1.5 bg-white px-4 relative overflow-visible">
                    {/* Autocomplete dropdown suggestions */}
                    {showSuggestions && suggestions.length > 0 && (
                        <ul className="absolute bottom-full left-4 right-4 z-35 mb-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200/80 bg-white py-1 shadow-xl shadow-slate-900/10 focus:outline-none divide-y divide-slate-50">
                            {suggestions.map((s, idx) => (
                                <li
                                    key={s}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => void selectSuggestion(s)}
                                    className={`cursor-pointer px-2.5 py-1 transition-all ${
                                        idx === activeIndex
                                            ? "bg-slate-50 border-l-2 border-brand pl-2"
                                            : "hover:bg-slate-50/50 pl-2.5"
                                    }`}
                                >
                                    {triggerType === "@" ? (
                                        renderSuggestionItem(s)
                                    ) : (
                                        <div className="flex items-center gap-2 w-full min-w-0 text-xs">
                                            <Terminal className="size-3.5 text-slate-400 shrink-0" />
                                            <span className="font-semibold text-slate-800 shrink-0">{s}</span>
                                            <span className="text-[11px] text-slate-400 truncate font-normal">
                                                {CHAT_ACTIONS.find((act) => act.name === s)?.desc || ""}
                                            </span>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="relative shrink-0 flex items-center gap-1 overflow-visible">
                        <button
                            type="button"
                            onClick={() => setAttachMenuOpen((o) => !o)}
                            aria-label="Attach files"
                            title="Attach files"
                            className="flex size-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer transition-colors"
                        >
                            <Paperclip className="size-4" />
                        </button>
                        
                        {attachMenuOpen && (
                            <div className="absolute bottom-full left-0 z-30 mb-2 w-44 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl shadow-slate-900/10 divide-y divide-slate-50 select-none">
                                <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                    Add Context
                                </div>
                                <div className="py-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            fileInputRef.current?.click();
                                            setAttachMenuOpen(false);
                                        }}
                                        className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                                    >
                                        <ImageIcon className="size-4 text-slate-400" />
                                        Media
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAttachMenuOpen(false);
                                            triggerMention();
                                        }}
                                        className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                                    >
                                        <AtSign className="size-4 text-slate-400" />
                                        Mentions
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAttachMenuOpen(false);
                                            triggerAction();
                                        }}
                                        className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                                    >
                                        <Terminal className="size-4 text-slate-400" />
                                        Actions
                                    </button>
                                </div>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => {
                                setUseBridge((prev) => !prev);
                                setIsBridgedPending(false);
                            }}
                            aria-pressed={useBridge}
                            title="Use IDE Agent Bridge (Free)"
                            className={`flex size-7 items-center justify-center rounded-full cursor-pointer transition-colors ${
                                useBridge ? "bg-amber-100 text-amber-700 shadow-3xs" : "text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                            }`}
                        >
                            <Zap className="size-4" />
                        </button>

                        <button
                            type="button"
                            onClick={handleCollaborate}
                            disabled={isDisabled || !inputValue.trim()}
                            title="Delegate to the AI Agent Team (background)"
                            className="flex size-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-40 cursor-pointer transition-colors"
                        >
                            <Users className="size-4" />
                        </button>
                    </div>

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

                    <Textarea
                        ref={textareaRef}
                        rows={1}
                        disabled={isDisabled}
                        placeholder={isDisabled ? "Select mode first..." : "Type a message..."}
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value);
                            handleSelectionChange(e.target.value, e.target.selectionStart || 0);
                        }}
                        onPaste={handlePaste}
                        className="min-h-0 flex-1 resize-none border-0 bg-transparent px-2 py-1 text-xs leading-relaxed text-slate-800 shadow-none placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                        onKeyDown={handleKeyDown}
                        onKeyUp={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            handleSelectionChange(target.value, target.selectionStart || 0);
                        }}
                    />

                    <button
                        type="submit"
                        disabled={isDisabled || (!inputValue.trim() && attachments.length === 0)}
                        title="Send"
                        className="flex size-7 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-800 disabled:opacity-40 cursor-pointer transition-colors"
                    >
                        <SendHorizontal className="size-4" />
                    </button>
                </div>
            </form>
            </div>
        </div>
    );
}
