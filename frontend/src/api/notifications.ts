// Notifications API — /api/v1/notifications/*
// Full implementation in Phase 5 & 12
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
      const { data } = await apiClient.patch(`/api/v1/notifications/${id}/read/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  markAllRead: async (): Promise<void> => {
    try {
      await apiClient.post('/api/v1/notifications/read-all/');
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getUnreadCount: async (): Promise<NotificationUnreadCount> => {
    try {
      const { data } = await apiClient.get('/api/v1/notifications/unread-count/');
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};
