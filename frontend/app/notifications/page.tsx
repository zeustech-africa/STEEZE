'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Bell, Heart, MessageCircle, UserPlus, Star, Reply } from 'lucide-react';

interface NotificationItem {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'subscribe' | 'reply';
  message: string;
  fromUser: { id: string; artistName: string; profilePhotoUrl: string | null } | null;
  postId: string | null;
  createdAt: string;
  read: boolean;
}

const iconMap = {
  like: <Heart size={16} className="text-red-400 flex-shrink-0" />,
  comment: <MessageCircle size={16} className="text-blue-400 flex-shrink-0" />,
  follow: <UserPlus size={16} className="text-green-400 flex-shrink-0" />,
  subscribe: <Star size={16} className="text-gold flex-shrink-0" />,
  reply: <Reply size={16} className="text-purple-400 flex-shrink-0" />,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const data = await api.getNotifications();
        setNotifications(Array.isArray(data) ? data : data?.notifications || []);
      } catch (err: any) {
        setError(err?.message || 'Failed to load notifications');
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch { /* silent */ } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="glass-card p-8 text-center max-w-md">
          <Bell size={48} className="mx-auto mb-4 text-gray-500" />
          <h1 className="text-2xl font-bold text-white mb-2">Unable to Load</h1>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-gray-400 text-sm mt-1">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="text-gold text-sm hover:underline disabled:opacity-50"
            >
              {markingAll ? 'Marking...' : 'Mark all read'}
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Bell size={48} className="mx-auto mb-4 text-gray-600" />
            <h2 className="text-xl font-semibold text-white mb-2">No Notifications</h2>
            <p className="text-gray-400">You're all caught up! New notifications will appear here.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleMarkRead(n.id)}
                className={`w-full flex items-start gap-4 p-4 rounded-xl text-left transition-colors ${
                  n.read
                    ? 'bg-white/[0.02] hover:bg-white/[0.04]'
                    : 'bg-gold/[0.05] hover:bg-gold/[0.08] border-l-2 border-gold'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {n.fromUser?.profilePhotoUrl ? (
                    <img
                      src={n.fromUser.profilePhotoUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white/40 font-bold text-sm">
                      {n.fromUser?.artistName?.[0]?.toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {iconMap[n.type] || <Bell size={16} className="text-white/40 flex-shrink-0" />}
                    <span className="text-white/90 text-sm line-clamp-2">{n.message}</span>
                  </div>
                  <span className="text-white/30 text-xs">
                    {new Date(n.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {!n.read && (
                  <span className="w-2.5 h-2.5 rounded-full bg-gold flex-shrink-0 mt-1.5" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}