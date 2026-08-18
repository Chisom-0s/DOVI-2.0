// Payments API — /api/v1/payments/*
// Full implementation in Phase 4
import apiClient, { normalizeApiError } from './client';
import type { Payment, PaymentInitResponse, PaymentMethod } from '@/types';

export const paymentsApi = {
  getMethods: async (): Promise<PaymentMethod[]> => {
    try {
      const { data } = await apiClient.get('/api/v1/payments/methods/');
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  initialize: async (payload: {
    order_reference: string;
    provider: string;
    redirect_url: string;
  }): Promise<PaymentInitResponse> => {
    try {
      const { data } = await apiClient.post('/api/v1/payments/initialize/', payload);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  verify: async (ref: string): Promise<Payment> => {
    try {
      const { data } = await apiClient.get(`/api/v1/payments/${ref}/verify/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  retry: async (ref: string): Promise<PaymentInitResponse> => {
    try {
      const { data } = await apiClient.post(`/api/v1/payments/${ref}/retry/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};
