import { create } from 'zustand';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'message' | 'content_approved' | 'content_rejected';
  message: string;
  read: boolean;
  createdAt: Date;
  relatedId?: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setNotifications: (notifications: Notification[]) => void;
  fetchUnreadCount: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  addNotification: (notification) => set((state) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date(),
      read: false,
    };
    return {
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    };
  }),
  
  markAsRead: (id) => set((state) => {
    const updated = state.notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    const unread = updated.filter(n => !n.read).length;
    return { notifications: updated, unreadCount: unread };
  }),
  
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true })),
    unreadCount: 0
  })),
  
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id),
    unreadCount: state.notifications.filter(n => n.id !== id && !n.read).length
  })),
  
  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
  
  setNotifications: (notifications) => set({
    notifications,
    unreadCount: notifications.filter(n => !n.read).length
  }),
  
  fetchUnreadCount: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch('/api/notifications/unread', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        set({ unreadCount: data.count });
      }
    } catch (error) {
      console.error('Fetch unread count error:', error);
    }
  }
}));