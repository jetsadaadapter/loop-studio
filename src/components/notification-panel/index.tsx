"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Bell, CheckCheck, Trash2, CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { useNotifications, type AppNotification } from "@/components/notification-provider";

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const TYPE_STYLES: Record<AppNotification["type"], { icon: React.ComponentType<{ className?: string }>; bg: string; text: string; dot: string }> = {
  success: { icon: CheckCircle2, bg: "bg-emerald-50",  text: "text-emerald-600", dot: "bg-emerald-500" },
  error:   { icon: AlertCircle,  bg: "bg-rose-50",     text: "text-rose-600",   dot: "bg-rose-500"    },
  warning: { icon: AlertTriangle,bg: "bg-amber-50",    text: "text-amber-600",  dot: "bg-amber-500"   },
  info:    { icon: Info,         bg: "bg-indigo-50",   text: "text-indigo-600", dot: "bg-indigo-500"  },
};

export function NotificationPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { notifications, unreadCount, markAllRead, markRead, clear } = useNotifications();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} className="w-[320px] sm:w-[380px] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <SheetHeader className="px-5 py-3.5 border-b border-slate-100 shrink-0">
          <SheetTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Bell className="size-4 text-slate-500" />
              Notifications
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-brand text-white text-[9px] font-bold min-w-[16px] h-4 px-1">
                  {unreadCount}
                </span>
              )}
            </span>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Mark all read"
                >
                  <CheckCheck className="size-3" />
                  All read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clear}
                  className="flex size-7 items-center justify-center rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Clear all"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex size-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
          </SheetTitle>
        </SheetHeader>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
              <div className="flex size-12 items-center justify-center rounded-full bg-slate-50 border border-slate-100">
                <Bell className="size-5 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No notifications</p>
              <p className="text-xs text-slate-400">Activity from tools, credits and system events will appear here.</p>
            </div>
          ) : (
            <div>
              {notifications.map((n, idx) => {
                const cfg = TYPE_STYLES[n.type];
                const Icon = cfg.icon;
                const isLast = idx === notifications.length - 1;
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50/60 cursor-pointer ${!isLast ? "border-b border-slate-100" : ""} ${!n.read ? "bg-slate-50/40" : ""}`}
                    onClick={() => markRead(n.id)}
                  >
                    <div className={`flex size-7 shrink-0 items-center justify-center rounded-full mt-0.5 ${cfg.bg}`}>
                      <Icon className={`size-3.5 ${cfg.text}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <p className={`text-xs font-semibold leading-snug ${n.read ? "text-slate-600" : "text-slate-800"}`}>
                          {n.title}
                        </p>
                        {!n.read && <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${cfg.dot}`} />}
                      </div>
                      {n.message && (
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                      )}
                      <p className="text-[9px] text-slate-300 mt-1 font-medium">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
