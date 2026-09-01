// Products API — GET /api/v1/products/*
// Stub: full implementation in Phase 2 & 3
import apiClient, { normalizeApiError } from './client';
import type { PaginatedResponse, Product, ProductSummary, Review, ProductVariant } from '@/types';

export interface ProductFilters {
  page?: number;
  page_size?: number;
  category?: string;
  q?: string;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'rating';
  min_price?: number;
  max_price?: number;
  vendor?: string;
  in_stock?: boolean;
}

export const productsApi = {
  list: async (filters?: ProductFilters): Promise<PaginatedResponse<ProductSummary>> => {
    try {
      const { data } = await apiClient.get('/api/v1/products/', { params: filters });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getById: async (id: string): Promise<Product> => {
    try {
      const { data } = await apiClient.get(`/api/v1/products/${id}/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  search: async (q: string, filters?: ProductFilters): Promise<PaginatedResponse<ProductSummary>> => {
    try {
      const { data } = await apiClient.get('/api/v1/products/', { params: { search: q, ...filters } });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  featured: async (): Promise<ProductSummary[]> => {
    try {
      const { data } = await apiClient.get('/api/v1/products/featured/');
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  trending: async (): Promise<ProductSummary[]> => {
    try {
      const { data } = await apiClient.get('/api/v1/products/trending/');
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  newArrivals: async (): Promise<ProductSummary[]> => {
    try {
      const { data } = await apiClient.get('/api/v1/products/new-arrivals/');
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  bestSellers: async (): Promise<ProductSummary[]> => {
    try {
      const { data } = await apiClient.get('/api/v1/products/best-sellers/');
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  flashDeals: async (): Promise<ProductSummary[]> => {
    try {
      const { data } = await apiClient.get('/api/v1/products/flash-deals/');
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  budgetDeals: async (): Promise<ProductSummary[]> => {
    try {
      const { data } = await apiClient.get('/api/v1/products/budget-deals/');
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  topRated: async (): Promise<ProductSummary[]> => {
    try {
      const { data } = await apiClient.get('/api/v1/products/top-rated/');
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getVariants: async (id: string): Promise<ProductVariant[]> => {
    try {
      const { data } = await apiClient.get(`/api/v1/products/${id}/variants/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getReviews: async (id: string, params?: { page?: number; rating?: number; sort?: string }): Promise<PaginatedResponse<Review>> => {
    try {
      const { data } = await apiClient.get(`/api/v1/products/${id}/reviews/`, { params });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  submitReview: async (id: string, payload: FormData): Promise<Review> => {
    try {
      const { data } = await apiClient.post(`/api/v1/products/${id}/reviews/`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getRelated: async (id: string): Promise<ProductSummary[]> => {
    try {
      const { data } = await apiClient.get(`/api/v1/products/${id}/related/`);
      return Array.isArray(data) ? data : (data?.results ?? []);
    } catch (err: unknown) {
      // Degrade gracefully ONLY if the endpoint does not exist on backend (404 Not Found)
      if ((err as { response?: { status?: number } })?.response?.status === 404) {
        return [];
      }
      // Re-throw genuine server errors (500s), network failures, and auth errors
      throw normalizeApiError(err);
    }
  },

  uploadImage: async (
    productId: string,
    imageFile: File,
    isPrimary: boolean = false
  ): Promise<{
    id: string;
    product: string;
    image_url: string;
    thumbnail_url: string;
    storage_key: string;
    is_primary: boolean;
    created_at: string;
  }> => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('is_primary', String(isPrimary));

      const { data } = await apiClient.post(
        `/api/v1/products/${productId}/images/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  deleteImage: async (productId: string, imageId: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/v1/products/${productId}/images/${imageId}/`);
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};
