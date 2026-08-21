import apiClient, { normalizeApiError } from './client';
import { productsApi } from './products';
import type { Cart } from '@/types';

export const cartApi = {
  get: async (): Promise<Cart> => {
    try {
      const { data } = await apiClient.get('/api/v1/cart/');
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  addItem: async (payload: { product_id: string; variant_id?: string; variant?: string; quantity: number }): Promise<Cart> => {
    try {
      let variant = payload.variant || payload.variant_id;
      if (!variant) {
        try {
          const product = await productsApi.getById(payload.product_id);
          if (product.variants && product.variants.length > 0) {
            variant = product.variants[0].id;
          }
        } catch (err) {
          console.error('Failed to resolve variant for product:', payload.product_id, err);
        }
      }
      const { data } = await apiClient.post('/api/v1/cart/items/', {
        variant,
        quantity: payload.quantity,
      });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  updateItem: async (itemId: string, quantity: number): Promise<Cart> => {
    try {
      const { data } = await apiClient.patch(`/api/v1/cart/items/${itemId}/`, { quantity });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  removeItem: async (itemId: string): Promise<Cart> => {
    try {
      const { data } = await apiClient.delete(`/api/v1/cart/items/${itemId}/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  clear: async (): Promise<void> => {
    try {
      await apiClient.delete('/api/v1/cart/clear/');
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  validate: async (): Promise<Cart> => {
    try {
      const { data } = await apiClient.post('/api/v1/cart/validate/');
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};
