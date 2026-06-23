"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type NotificationType = "success" | "error" | "info" | "warning";

export interface AppNotification {
  id: string;
  title: string;
  message?: string;
  type: NotificationType;
  createdAt: Date;
  read: boolean;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  push: (title: string, opts?: { message?: string; type?: NotificationType }) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clear: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const push = useCallback((title: string, opts?: { message?: string; type?: NotificationType }) => {
    const item: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      message: opts?.message,
      type: opts?.type ?? "info",
      createdAt: new Date(),
      read: false,
    };
    setNotifications((prev) => [item, ...prev].slice(0, 50)); // cap at 50
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }, []);

  const clear = useCallback(() => setNotifications([]), []);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const value = useMemo(
    () => ({ notifications, unreadCount, push, markAllRead, markRead, clear }),
    [notifications, unreadCount, push, markAllRead, markRead, clear],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider");
  return ctx;
}
