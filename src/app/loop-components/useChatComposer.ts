import React, { useState, useEffect, useRef } from "react";
import { CHAT_ACTIONS, generateUniqueId, readFileAsAttachment } from "./chat-helpers";
import type { ChatAttachment } from "@/core/interfaces/loop-projects.interface";

interface UseChatComposerArgs {
    projectId: string;
    disabled: boolean;
    onSend: (content: string, attachments: ChatAttachment[]) => void;
    onCollaborate: (instructions: string) => Promise<boolean>;
}

/**
 * Owns the composer input: text value, pending attachments, and the "@" file /
 * "/" action autocomplete. Delegates the actual send/collaborate to callbacks
 * (wired to `useChatMessaging`).
 */
export function useChatComposer({ projectId, disabled, onSend, onCollaborate }: UseChatComposerArgs) {
    const [inputValue, setInputValue] = useState("");
    const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
    const [attachMenuOpen, setAttachMenuOpen] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleInputChange = (value: string, selectionStart: number) => {
        setInputValue(value);
        handleSelectionChange(value, selectionStart);
    };

    const submit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if ((!inputValue.trim() && attachments.length === 0) || disabled) return;
        onSend(inputValue, attachments);
        setInputValue("");
        setAttachments([]);
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
            submit();
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
                const text = inputValue;
                setInputValue("");
                void onCollaborate(text);
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

    // Delegate to the AI team from the toolbar button; clear input only on accept.
    const delegate = async () => {
        if (!inputValue.trim() || disabled) return;
        const accepted = await onCollaborate(inputValue);
        if (accepted) setInputValue("");
    };

    return {
        inputValue,
        attachments,
        attachMenuOpen,
        setAttachMenuOpen,
        suggestions,
        showSuggestions,
        activeIndex,
        triggerType,
        textareaRef,
        fileInputRef,
        handleInputChange,
        handleSelectionChange,
        handleKeyDown,
        handlePaste,
        submit,
        selectSuggestion,
        triggerMention,
        triggerAction,
        addFiles,
        removeAttachment,
        delegate,
    };
}
