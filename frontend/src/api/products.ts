// Products API — GET /api/v1/products/*
import apiClient, { normalizeApiError } from './client';
import { MOCK_PRODUCTS, normalizeBackendProductToSummary, fetchRealBackendProducts } from './homepage';
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
      const rawList: any[] = Array.isArray(data) ? data : (data?.results || []);
      const realProducts = rawList.map(p => normalizeBackendProductToSummary(p));

      // If unfiltered or first page and fewer than 12 items, supplement with mock items at the end
      let results = [...realProducts];
      const isUnfiltered = !filters || (!filters.q && !filters.category && (!filters.page || filters.page === 1));
      if (isUnfiltered && results.length < 12) {
        const existingIds = new Set(results.map(r => r.id));
        for (const m of MOCK_PRODUCTS) {
          if (!existingIds.has(m.id)) {
            results.push(m);
          }
        }
      }

      return {
        count: Math.max(data?.count || 0, results.length),
        next: data?.next || null,
        previous: data?.previous || null,
        results,
      };
    } catch (err) {
      console.warn('Backend products list failed, returning mock products fallback:', err);
      return {
        count: MOCK_PRODUCTS.length,
        next: null,
        previous: null,
        results: MOCK_PRODUCTS,
      };
    }
  },

  getById: async (id: string): Promise<Product> => {
    // 1. If not a mock product ID, try backend first
    if (!id.startsWith('prod-')) {
      try {
        const { data } = await apiClient.get(`/api/v1/products/${id}/`);
        return data;
      } catch (err: any) {
        // Only fallback if 404
        if (err?.response?.status !== 404) {
          throw normalizeApiError(err);
        }
      }
    }

    // 2. Check mock products fallback
    const mock = MOCK_PRODUCTS.find(p => p.id === id);
    if (mock) {
      const vendorName = typeof mock.vendor === 'object' ? mock.vendor.name : (mock.vendor_name || 'Verified Vendor');
      const catName = typeof mock.category === 'object' ? mock.category?.name : (mock.category_name || 'General');
      return {
        id: mock.id,
        name: mock.name,
        description: `Premium authentic ${mock.name} supplied by verified merchant ${vendorName}. Includes full warranty and fast doorstep delivery.`,
        base_price: mock.price || mock.base_price || '0',
        price: mock.price || mock.base_price || '0',
        status: 'PUBLISHED',
        vendor: mock.vendor,
        vendor_name: vendorName,
        category: mock.category || 'General',
        category_name: catName,
        primary_image_url: mock.primary_image_url,
        image_url: mock.image_url,
        images: mock.primary_image_url ? [{ id: `img-${mock.id}`, image_url: mock.primary_image_url, is_primary: true }] : [],
        variants: [
          {
            id: `var-${mock.id}`,
            name: 'Standard Option',
            sku: `SKU-${mock.id.toUpperCase()}`,
            stock: mock.stock_quantity || 10,
            reserved: 0,
          },
        ],
        average_rating: mock.average_rating,
        review_count: mock.review_count,
        stock_quantity: mock.stock_quantity,
      };
    }

    throw new Error('Product not found');
  },

  search: async (q: string, filters?: ProductFilters): Promise<PaginatedResponse<ProductSummary>> => {
    try {
      const { data } = await apiClient.get('/api/v1/products/', { params: { search: q, ...filters } });
      const rawList: any[] = Array.isArray(data) ? data : (data?.results || []);
      const realProducts = rawList.map(p => normalizeBackendProductToSummary(p));
      return {
        count: data?.count || realProducts.length,
        next: data?.next || null,
        previous: data?.previous || null,
        results: realProducts,
      };
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  featured: async (): Promise<ProductSummary[]> => {
    try {
      const { data } = await apiClient.get('/api/v1/products/featured/');
      return data;
    } catch {
      const real = await fetchRealBackendProducts();
      return real.length > 0 ? real : MOCK_PRODUCTS.slice(0, 6);
    }
  },

  trending: async (): Promise<ProductSummary[]> => {
    try {
      const { data } = await apiClient.get('/api/v1/products/trending/');
      return data;
    } catch {
      const real = await fetchRealBackendProducts();
      const matching = real.filter(r => r.is_trending);
      return matching.length > 0 ? matching : MOCK_PRODUCTS.filter(m => m.is_trending);
    }
  },

  newArrivals: async (): Promise<ProductSummary[]> => {
    try {
      const { data } = await apiClient.get('/api/v1/products/new-arrivals/');
      return data;
    } catch {
      const real = await fetchRealBackendProducts();
      return real.length > 0 ? real : MOCK_PRODUCTS.filter(m => m.is_new_arrival);
    }
  },

  bestSellers: async (): Promise<ProductSummary[]> => {
    try {
      const { data } = await apiClient.get('/api/v1/products/best-sellers/');
      return data;
    } catch {
      const real = await fetchRealBackendProducts();
      const matching = real.filter(r => r.is_best_seller);
      return matching.length > 0 ? matching : MOCK_PRODUCTS.filter(m => m.is_best_seller);
    }
  },

  flashDeals: async (): Promise<ProductSummary[]> => {
    try {
      const { data } = await apiClient.get('/api/v1/products/flash-deals/');
      return data;
    } catch {
      const real = await fetchRealBackendProducts();
      const matching = real.filter(r => r.is_flash_deal);
      return matching.length > 0 ? matching : MOCK_PRODUCTS.filter(m => m.is_flash_deal);
    }
  },

  budgetDeals: async (): Promise<ProductSummary[]> => {
    try {
      const { data } = await apiClient.get('/api/v1/products/budget-deals/');
      return data;
    } catch {
      const real = await fetchRealBackendProducts();
      return real.length > 0 ? real : MOCK_PRODUCTS.filter(m => m.is_hot_sale);
    }
  },

  topRated: async (): Promise<ProductSummary[]> => {
    try {
      const { data } = await apiClient.get('/api/v1/products/top-rated/');
      return data;
    } catch {
      const real = await fetchRealBackendProducts();
      return real.length > 0 ? real : MOCK_PRODUCTS;
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
      const { data } = await apiClient.post(`/api/v1/products/${id}/reviews/`, payload);
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
      formData.append('image', imageFile, imageFile.name);
      formData.append('file', imageFile, imageFile.name); // Compatibility alias
      formData.append('is_primary', isPrimary ? 'true' : 'false');

      const { data } = await apiClient.post(
        `/api/v1/products/${productId}/images/`,
        formData
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
