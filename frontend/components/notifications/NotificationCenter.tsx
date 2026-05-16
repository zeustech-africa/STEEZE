"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, Heart, MessageCircle, UserPlus, Star, Reply, CheckCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationData {
  id: string;
  type: "like" | "comment" | "follow" | "subscribe" | "reply";
  message: string;
  fromUser: { id: string; artistName: string; profilePhotoUrl: string | null } | null;
  postId: string | null;
  createdAt: string;
  read: boolean;
}

interface NotificationCenterProps {
  userId: string;
  apiBase?: string;
}

export default function NotificationCenter({ userId, apiBase = "/api/creators" }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/notifications/${userId}`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications.slice(0, 20));
        setUnreadCount(data.unreadCount);
      }
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  }, [userId, apiBase]);

  // Poll every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Request push notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  // Show browser notification for new notifications
  useEffect(() => {
    if (notifications.length > 0 && typeof window !== "undefined" && "Notification" in window) {
      const unread = notifications.filter((n) => !n.read);
      if (unread.length > 0 && Notification.permission === "granted") {
        const latest = unread[0];
        if (latest.fromUser) {
          try {
            new Notification(latest.message, {
              body: `From ${latest.fromUser.artistName || "a user"}`,
              icon: "/icons/steeze-icon-square.png",
            });
          } catch {}
        }
      }
    }
  }, [notifications]);

  const markAsRead = async (notificationIds?: string[]) => {
    try {
      await fetch(`${apiBase}/notifications/mark-read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, notificationIds }),
      });
      fetchNotifications();
    } catch (e) {
      console.error("Failed to mark as read", e);
    }
  };

  const markAllRead = () => markAsRead();

  const getIcon = (type: string) => {
    switch (type) {
      case "like": return <Heart size={14} className="text-red-400" />;
      case "comment": return <MessageCircle size={14} className="text-blue-400" />;
      case "follow": return <UserPlus size={14} className="text-green-400" />;
      case "subscribe": return <Star size={14} className="text-gold" />;
      case "reply": return <Reply size={14} className="text-purple-400" />;
      default: return <Bell size={14} className="text-white/40" />;
    }
  };

  return (
    <div className="relative">
      {/* Bell icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white/60 hover:text-white transition-colors rounded-full hover:bg-white/10"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-80 md:w-96 max-h-[70vh] overflow-y-auto bg-black/95 border border-white/10 rounded-2xl shadow-2xl shadow-gold/5 z-50"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 sticky top-0 bg-black/95 backdrop-blur-sm z-10">
                <h3 className="text-white font-semibold text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-gold text-xs hover:underline"
                  >
                    <CheckCheck size={14} />
                    Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              {loading ? (
                <div className="p-6 text-center text-white/30 text-sm">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center text-white/30 text-sm">No notifications yet</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        markAsRead([n.id]);
                        if (n.postId) {
                          setIsOpen(false);
                        }
                      }}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors ${
                        !n.read ? "bg-gold/[0.03]" : ""
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden flex-shrink-0 mt-0.5">
                        {n.fromUser?.profilePhotoUrl ? (
                          <img src={n.fromUser.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {getIcon(n.type)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-0.5">
                          {getIcon(n.type)}
                          <span className="text-white/80 text-xs line-clamp-2">{n.message}</span>
                        </div>
                        <span className="text-white/30 text-[10px]">
                          {new Date(n.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-gold flex-shrink-0 mt-2" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* View all */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-white/5 text-center">
                  <a href="/notifications" className="text-gold text-xs hover:underline">
                    View all notifications
                  </a>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}