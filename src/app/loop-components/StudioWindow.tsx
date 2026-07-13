"use client";

import React, { useState } from "react";
import { Maximize2 } from "lucide-react";

interface StudioWindowProps {
    left: React.ReactNode;
    right: React.ReactNode;
    header?: React.ReactNode;
}

// IDE-style chrome for the Studio workspace: wraps a two-pane body
// (chat+changes / live preview). Device toggle and Commit & Publish now live
// inline in PreviewPane's tab bar instead of a dedicated title-bar row here.
export function StudioWindow({ left, right, header }: StudioWindowProps) {
    const [isChatExpanded, setIsChatExpanded] = useState(true);
    const [isChatMaximized, setIsChatMaximized] = useState(false);

    return (
        <div className="flex h-full w-full min-h-0 overflow-hidden bg-slate-100/60 relative">
            {/* Workspace Column (Left / Center) */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {header}
                {/* Main Viewport Content (Preview & bottom controls) */}
                <div className="min-h-0 flex-1 flex flex-col bg-slate-50 overflow-hidden">{right}</div>
            </div>

            {/* Collapsible Chat Panel on the right (stretches full height) */}
            {isChatExpanded ? (
                <div className={`flex min-h-0 shrink-0 flex-col bg-white transition-all duration-300 ease-in-out ${
                    isChatMaximized 
                        ? "absolute right-3 top-3 bottom-3 z-30 w-[600px] max-w-[90vw] shadow-2xl border border-slate-200 rounded-xl overflow-hidden" 
                        : "relative w-[380px] h-full border-l border-slate-200"
                }`}>
                    <div className="flex-1 flex flex-col min-h-0">
                        {React.isValidElement(left)
                            ? React.cloneElement(left as React.ReactElement<{ 
                                  onCollapse: () => void;
                                  onExpand: () => void;
                                  isMaximized: boolean;
                              }>, {
                                  onCollapse: () => {
                                      setIsChatExpanded(false);
                                      setIsChatMaximized(false);
                                  },
                                  onExpand: () => setIsChatMaximized((prev) => !prev),
                                  isMaximized: isChatMaximized
                              })
                            : left}
                    </div>
                </div>
            ) : (
                <div className="flex h-full min-h-0 shrink-0 flex-col bg-white w-12 items-center py-3 select-none transition-all duration-300 ease-in-out border-l border-slate-200">
                    <button
                        type="button"
                        onClick={() => setIsChatExpanded(true)}
                        title="Expand Chat"
                        className="flex size-7 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-all shadow-sm"
                    >
                        <Maximize2 className="size-3.5" />
                    </button>
                    
                    {/* Vertical text label + chat icon */}
                    <div className="mt-8 flex flex-col items-center gap-4">
                        <button
                            type="button"
                            onClick={() => setIsChatExpanded(true)}
                            title="Expand Chat"
                            className="relative flex size-7 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 cursor-pointer hover:bg-indigo-100 transition-all shadow-sm"
                        >
                            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-indigo-450 opacity-75"></span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </button>
                        <div 
                            onClick={() => setIsChatExpanded(true)}
                            className="mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans cursor-pointer hover:text-slate-800 transition-colors" 
                            style={{ writingMode: "vertical-lr" }}
                        >
                            AI Chat Space
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
