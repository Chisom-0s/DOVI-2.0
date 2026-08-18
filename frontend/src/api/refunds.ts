// Refunds API — /api/v1/refunds/*
import apiClient, { normalizeApiError } from './client';
import type { Refund } from '@/types';

export const refundsApi = {
  submit: async (payload: {
    order_reference: string;
    reason: string;
    description: string;
    amount: string;
  }): Promise<Refund> => {
    try {
      const { data } = await apiClient.post('/api/v1/refunds/', payload);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  uploadEvidence: async (refundId: string, formData: FormData): Promise<Refund> => {
    try {
      const { data } = await apiClient.post(
        `/api/v1/refunds/${refundId}/evidence/`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getById: async (refundId: string): Promise<Refund> => {
    try {
      const { data } = await apiClient.get(`/api/v1/refunds/${refundId}/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};
