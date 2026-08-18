// Recently Viewed API — /api/v1/recently-viewed/*
import apiClient, { normalizeApiError } from './client';
import type { ProductSummary } from '@/types';

export const recentlyViewedApi = {
  list: async (): Promise<ProductSummary[]> => {
    try {
      const { data } = await apiClient.get('/api/v1/recently-viewed/');
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};
