// Delivery API — /api/v1/delivery/* and /api/v1/delivery-groups/*
import apiClient, { normalizeApiError } from './client';
import type { DeliveryGroup, PaginatedResponse } from '@/types';

export const deliveryApi = {
  list: async (params?: { page?: number; status?: string; search?: string }): Promise<PaginatedResponse<DeliveryGroup>> => {
    try {
      const { data } = await apiClient.get('/api/v1/delivery/', { params });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getById: async (id: string): Promise<DeliveryGroup> => {
    try {
      const { data } = await apiClient.get(`/api/v1/delivery/${id}/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getByOrder: async (orderId: string): Promise<DeliveryGroup[]> => {
    try {
      const { data } = await apiClient.get(`/api/v1/orders/${orderId}/delivery-groups/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  markReady: async (id: string, notes?: string): Promise<DeliveryGroup> => {
    try {
      const { data } = await apiClient.post(`/api/v1/delivery/${id}/mark-ready/`, { notes });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  dispatch: async (id: string, payload: { tracking_reference?: string; vendor_notes?: string }): Promise<DeliveryGroup> => {
    try {
      const { data } = await apiClient.post(`/api/v1/delivery/${id}/dispatch/`, payload);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  confirmPickup: async (id: string): Promise<DeliveryGroup> => {
    try {
      const { data } = await apiClient.post(`/api/v1/delivery/${id}/confirm-pickup/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  confirmDelivery: async (id: string): Promise<DeliveryGroup> => {
    try {
      const { data } = await apiClient.post(`/api/v1/delivery/${id}/confirm-delivery/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};
