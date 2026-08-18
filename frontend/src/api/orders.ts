// Orders API — /api/v1/orders/*
// Full implementation in Phase 4
import apiClient, { normalizeApiError } from './client';
import type { Order, OrderSummary, PaginatedResponse } from '@/types';

export const ordersApi = {
  list: async (page?: number): Promise<PaginatedResponse<OrderSummary>> => {
    try {
      const { data } = await apiClient.get('/api/v1/orders/', { params: { page } });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getByRef: async (ref: string): Promise<Order> => {
    try {
      const { data } = await apiClient.get(`/api/v1/orders/${ref}/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  cancel: async (ref: string): Promise<Order> => {
    try {
      const { data } = await apiClient.post(`/api/v1/orders/${ref}/cancel/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  confirmReceipt: async (ref: string): Promise<Order> => {
    try {
      const { data } = await apiClient.post(`/api/v1/orders/${ref}/confirm-receipt/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getTracking: async (ref: string) => {
    try {
      const { data } = await apiClient.get(`/api/v1/orders/${ref}/tracking/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};
