// Notifications API — /api/v1/notifications/*
import apiClient, { normalizeApiError } from './client';
import type { Notification, NotificationUnreadCount, PaginatedResponse } from '@/types';

export const notificationsApi = {
  list: async (page?: number): Promise<PaginatedResponse<Notification>> => {
    try {
      const { data } = await apiClient.get('/api/v1/notifications/', { params: { page } });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  markRead: async (id: string): Promise<Notification> => {
    try {
      const { data } = await apiClient.post(`/api/v1/notifications/${id}/read/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  markAllRead: async (): Promise<void> => {
    try {
      await apiClient.post('/api/v1/notifications/read-all/');
    } catch (err) {
      // If endpoint doesn't exist, ignore gracefully
      console.warn('Mark all read not supported or failed:', err);
    }
  },

  getUnreadCount: async (): Promise<NotificationUnreadCount> => {
    try {
      const { data } = await apiClient.get('/api/v1/notifications/unread-count/');
      return typeof data === 'object' && 'unread_count' in data ? data : { unread_count: Number(data) || 0 };
    } catch {
      try {
        const { data } = await apiClient.get('/api/v1/notifications/');
        const items: Notification[] = Array.isArray(data) ? data : (data?.results || []);
        const unreadCount = items.filter(item => !item.is_read).length;
        return { unread_count: unreadCount };
      } catch {
        return { unread_count: 0 };
      }
    }
  },
};

