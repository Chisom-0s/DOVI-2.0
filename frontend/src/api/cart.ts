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

  addItem: async (payload: {
    product_id?: string;
    productId?: string;
    variant_id?: string;
    variantId?: string;
    variant?: string;
    quantity: number;
  }): Promise<Cart> => {
    try {
      let variant = payload.variant || payload.variant_id || payload.variantId;
      const prodId = payload.product_id || payload.productId;

      if (!variant && prodId) {
        try {
          const product = await productsApi.getById(prodId);
          if (product.variants && product.variants.length > 0) {
            variant = product.variants[0].id;
          }
        } catch (err) {
          console.error('Failed to resolve variant for product:', prodId, err);
        }
      }

      await apiClient.post('/api/v1/cart/items/', {
        variant,
        quantity: payload.quantity || 1,
      });

      // Always retrieve the latest authoritative cart with all items & subtotal
      const { data: updatedCart } = await apiClient.get('/api/v1/cart/');
      return updatedCart;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  updateItem: async (itemId: string, quantity: number): Promise<Cart> => {
    try {
      await apiClient.patch(`/api/v1/cart/items/${itemId}/`, { quantity });
      const { data: updatedCart } = await apiClient.get('/api/v1/cart/');
      return updatedCart;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  removeItem: async (itemId: string): Promise<Cart> => {
    try {
      await apiClient.delete(`/api/v1/cart/items/${itemId}/`);
      const { data: updatedCart } = await apiClient.get('/api/v1/cart/');
      return updatedCart;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  clear: async (): Promise<void> => {
    try {
      await apiClient.delete('/api/v1/cart/clear/');
    } catch (err: any) {
      // If backend does not implement dedicated /clear/ route, delete items one by one
      if (err?.response?.status === 404) {
        try {
          const { data } = await apiClient.get('/api/v1/cart/');
          if (data?.items && Array.isArray(data.items)) {
            await Promise.allSettled(
              data.items.map((i: any) => apiClient.delete(`/api/v1/cart/items/${i.id}/`))
            );
          }
        } catch {}
        return;
      }
      throw normalizeApiError(err);
    }
  },

  validate: async (): Promise<Cart> => {
    try {
      const { data } = await apiClient.post('/api/v1/cart/validate/');
      return data;
    } catch (err: any) {
      // If backend has no validate endpoint, fallback to get()
      if (err?.response?.status === 404) {
        return await cartApi.get();
      }
      throw normalizeApiError(err);
    }
  },
};
