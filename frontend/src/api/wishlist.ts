// Wishlist API — /api/v1/wishlist/*
// Full implementation in Phase 2 & 5
import apiClient, { normalizeApiError } from './client';
import type { WishlistItem } from '@/types';

export const wishlistApi = {
  list: async (): Promise<WishlistItem[]> => {
    try {
      const { data } = await apiClient.get('/api/v1/wishlist/');
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  add: async (productId: string): Promise<WishlistItem> => {
    try {
      const { data } = await apiClient.post('/api/v1/wishlist/', { product_id: productId });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  remove: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/v1/wishlist/${id}/`);
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};
