import Image from "next/image";
import { X, FileText } from "lucide-react";
import type { ChatAttachment } from "@/core/interfaces/loop-projects.interface";

interface ChatAttachmentBarProps {
    attachments: ChatAttachment[];
    onRemove: (id: string) => void;
}

/** Pending-attachment chips shown above the composer input (images + files). */
export function ChatAttachmentBar({ attachments, onRemove }: ChatAttachmentBarProps) {
    if (attachments.length === 0) return null;

    return (
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
                                onClick={() => onRemove(a.id)}
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
                            onClick={() => onRemove(a.id)}
                            aria-label={`Remove ${a.name}`}
                            className="flex size-4 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer"
                        >
                            <X className="size-3" />
                        </button>
                    </span>
                );
            })}
        </div>
    );
}
