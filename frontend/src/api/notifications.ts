// Notifications API — /api/v1/notifications/*
import apiClient, { normalizeApiError } from './client';
import type { Notification, NotificationUnreadCount, PaginatedResponse } from '@/types';

// Helper for local simulation
const getLocalNotifications = (): Notification[] => {
  try {
    const data = localStorage.getItem('dovi_local_notifications');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveLocalNotifications = (notifs: Notification[]) => {
  try {
    localStorage.setItem('dovi_local_notifications', JSON.stringify(notifs));
  } catch {}
};

export const notificationsApi = {
  create: async (title: string, message: string, type: string = 'INFO'): Promise<Notification> => {
    try {
      const { data } = await apiClient.post('/api/v1/notifications/', { title, message, type });
      return data;
    } catch {
      // Fallback to local storage
      const newNotif: Notification = {
        id: `local-${Date.now()}-${Math.random()}`,
        user_id: 'current-user',
        title,
        message,
        type: type as any,
        is_read: false,
        created_at: new Date().toISOString(),
      };
      const notifs = getLocalNotifications();
      saveLocalNotifications([newNotif, ...notifs]);
      return newNotif;
    }
  },

  list: async (page?: number): Promise<PaginatedResponse<Notification>> => {
    try {
      const { data } = await apiClient.get('/api/v1/notifications/', { params: { page } });
      const serverNotifs = data.results || [];
      const localNotifs = getLocalNotifications();
      return {
        ...data,
        count: (data.count || 0) + localNotifs.length,
        results: [...localNotifs, ...serverNotifs],
      };
    } catch (err) {
      const localNotifs = getLocalNotifications();
      if (localNotifs.length > 0) {
        return {
          count: localNotifs.length,
          next: null,
          previous: null,
          results: localNotifs,
        };
      }
      throw normalizeApiError(err);
    }
  },

  markRead: async (id: string): Promise<Notification> => {
    if (id.startsWith('local-')) {
      const notifs = getLocalNotifications();
      const notif = notifs.find(n => n.id === id);
      if (notif) notif.is_read = true;
      saveLocalNotifications(notifs);
      return notif as Notification;
    }
    try {
      const { data } = await apiClient.post(`/api/v1/notifications/${id}/read/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  markAllRead: async (): Promise<void> => {
    const notifs = getLocalNotifications();
    notifs.forEach(n => { n.is_read = true; });
    saveLocalNotifications(notifs);

    try {
      await apiClient.post('/api/v1/notifications/read-all/');
    } catch (err) {
      // If endpoint doesn't exist, ignore gracefully
      console.warn('Mark all read not supported or failed:', err);
    }
  },

  getUnreadCount: async (): Promise<NotificationUnreadCount> => {
    const localNotifs = getLocalNotifications();
    const localUnread = localNotifs.filter(n => !n.is_read).length;

    try {
      const { data } = await apiClient.get('/api/v1/notifications/unread-count/');
      const serverUnread = typeof data === 'object' && 'unread_count' in data ? data.unread_count : (Number(data) || 0);
      return { unread_count: serverUnread + localUnread };
    } catch {
      try {
        const { data } = await apiClient.get('/api/v1/notifications/');
        const items: Notification[] = Array.isArray(data) ? data : (data?.results || []);
        const serverUnread = items.filter(item => !item.is_read).length;
        return { unread_count: serverUnread + localUnread };
      } catch {
        return { unread_count: localUnread };
      }
    }
  },

  delete: async (id: string): Promise<void> => {
    if (id.startsWith('local-')) {
      const notifs = getLocalNotifications();
      const filtered = notifs.filter(n => n.id !== id);
      saveLocalNotifications(filtered);
      return;
    }
    try {
      await apiClient.delete(`/api/v1/notifications/${id}/`);
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};
