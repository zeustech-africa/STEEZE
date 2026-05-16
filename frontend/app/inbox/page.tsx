"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  MessageCircle,
  Heart,
  UserPlus,
  Repeat,
} from "lucide-react";
import BottomNav from "../../components/layout/BottomNav";

export default function InboxPage() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"notifications" | "messages">(
    "notifications"
  );
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token || !userData) return;
    setUser(JSON.parse(userData));
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart size={16} className="text-red-500" />;
      case "follow":
        return <UserPlus size={16} className="text-blue-500" />;
      case "repost":
        return <Repeat size={16} className="text-green-500" />;
      case "comment":
        return <MessageCircle size={16} className="text-gold" />;
      case "unsave":
        return <Bell size={16} className="text-white/50" />;
      default:
        return <Bell size={16} className="text-white" />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-gold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-12 pb-20 px-4">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-gold mb-6">Inbox</h1>

        {/* Tabs */}
        <div className="flex gap-3 mb-6 border-b border-white/10">
          <button
            onClick={() => setActiveTab("notifications")}
            className={`pb-2 px-4 transition-all ${
              activeTab === "notifications"
                ? "border-b-2 border-gold text-gold"
                : "text-white/50"
            }`}
          >
            Notifications
          </button>
          <button
            onClick={() => setActiveTab("messages")}
            className={`pb-2 px-4 transition-all ${
              activeTab === "messages"
                ? "border-b-2 border-gold text-gold"
                : "text-white/50"
            }`}
          >
            Messages
          </button>
        </div>

        {/* Notifications Tab */}
        {activeTab === "notifications" ? (
          loading ? (
            <div className="text-center py-8">
              <div className="animate-pulse text-gold">Loading...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="mx-auto text-white/40 mb-4" size={48} />
              <p className="text-white/50">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif: any) => (
                <Link
                  key={notif.id}
                  href={notif.postId ? `/post/${notif.postId}` : "#"}
                  className={`glass-card p-4 flex items-center gap-3 hover:border-gold/50 transition-all ${
                    !notif.read ? "border-gold/20" : ""
                  }`}
                >
                  <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={
                        notif.fromUser?.profilePicUrl ||
                        "/icons/steeze-icon-square.png"
                      }
                      alt=""
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">
                      {notif.message}
                    </p>
                    <p className="text-white/40 text-xs">
                      {new Date(notif.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex-shrink-0">{getIcon(notif.type)}</div>
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-gold flex-shrink-0" />
                  )}
                </Link>
              ))}
            </div>
          )
        ) : (
          /* Messages Tab */
          <div className="text-center py-12">
            <MessageCircle
              className="mx-auto text-white/40 mb-4"
              size={48}
            />
            <p className="text-white/50">
              Direct messages for Gold subscribers only
            </p>
            <button className="mt-4 px-6 py-2 bg-gold text-black rounded-full font-semibold hover:bg-gold-dark transition-all">
              Upgrade to Gold
            </button>
          </div>
        )}
      </div>

      <BottomNav isCreator={user.role === "creator"} onUploadClick={() => {}} />
    </div>
  );
}