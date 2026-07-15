import { Textarea } from "@/components/ui/textarea";
import { Paperclip, SendHorizontal, Zap, Users, Terminal, AtSign, Image as ImageIcon } from "lucide-react";
import { ChatAttachmentBar } from "./ChatAttachmentBar";
import { CHAT_ACTIONS, renderSuggestionItem } from "./chat-helpers";
import type { useChatComposer } from "./useChatComposer";

type ChatComposerProps = ReturnType<typeof useChatComposer> & {
    useBridge: boolean;
    disabled: boolean;
    onToggleBridge: () => void;
};

/** The composer input row: attachment chips, autocomplete, toolbar, textarea. */
export function ChatComposer({
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
    useBridge,
    disabled,
    onToggleBridge,
}: ChatComposerProps) {
    return (
        <form onSubmit={submit} className="shrink-0 bg-white">
            <ChatAttachmentBar attachments={attachments} onRemove={removeAttachment} />

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
                        onClick={onToggleBridge}
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
                        onClick={delegate}
                        disabled={disabled || !inputValue.trim()}
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
                    disabled={disabled}
                    placeholder={disabled ? "Select mode first..." : "Type a message..."}
                    value={inputValue}
                    onChange={(e) => handleInputChange(e.target.value, e.target.selectionStart || 0)}
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
                    disabled={disabled || (!inputValue.trim() && attachments.length === 0)}
                    title="Send"
                    className="flex size-7 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-800 disabled:opacity-40 cursor-pointer transition-colors"
                >
                    <SendHorizontal className="size-4" />
                </button>
            </div>
        </form>
    );
}
