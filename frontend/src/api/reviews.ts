// Reviews API — /api/v1/reviews/*
// Full implementation in Phase 3 & 5
import apiClient, { normalizeApiError } from './client';
import type { PaginatedResponse, Review, ReviewEligibility } from '@/types';

export const reviewsApi = {
  list: async (): Promise<PaginatedResponse<Review>> => {
    try {
      const { data } = await apiClient.get('/api/v1/reviews/');
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  submit: async (payload: {
    product_id: string;
    order_reference: string;
    product_rating: number;
    vendor_rating?: number;
    delivery_rating: number;
    title?: string;
    body: string;
  }): Promise<Review> => {
    try {
      const { data } = await apiClient.post('/api/v1/reviews/', payload);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  checkEligibility: async (orderRef: string): Promise<ReviewEligibility> => {
    try {
      const { data } = await apiClient.get(`/api/v1/reviews/eligibility/${orderRef}/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  update: async (id: string, payload: Partial<Review>): Promise<Review> => {
    try {
      const { data } = await apiClient.patch(`/api/v1/reviews/${id}/`, payload);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/v1/reviews/${id}/`);
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};
