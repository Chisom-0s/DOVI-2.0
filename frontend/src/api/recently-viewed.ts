// Recently Viewed API — /api/v1/recently-viewed/*
import apiClient from './client';
import type { Product, ProductSummary } from '@/types';

const STORAGE_KEY = 'dovi_recently_viewed_products';

export const recentlyViewedApi = {
  list: async (): Promise<ProductSummary[]> => {
    try {
      const { data } = await apiClient.get('/api/v1/recently-viewed/');
      const items: ProductSummary[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
        ? data.results
        : [];

      if (items.length > 0) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 30)));
        } catch {}
        return items;
      }
    } catch {
      // Backend does not expose an active /recently-viewed/ endpoint; fallback gracefully to local storage
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}

    return [];
  },

  recordView: (product: Product | ProductSummary | Record<string, any>): void => {
    if (!product || !product.id) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let list: ProductSummary[] = [];
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) list = parsed;
      }

      // Filter out existing occurrence
      list = list.filter((p) => p.id !== product.id);

      const summary: ProductSummary = {
        id: product.id,
        name: product.name || 'Viewed Product',
        slug: product.slug || product.id,
        base_price: (product as any).base_price || (product as any).price || '0',
        price: (product as any).price || (product as any).base_price || '0',
        primary_image_url:
          (product as any).primary_image_url ||
          (product as any).image_url ||
          ((product as any).images && (product as any).images[0]?.image_url) ||
          null,
        images: (product as any).images || [],
        average_rating: typeof (product as any).average_rating === 'number' ? (product as any).average_rating : 5.0,
        review_count: typeof (product as any).review_count === 'number' ? (product as any).review_count : 0,
        stock_quantity: typeof (product as any).stock_quantity === 'number' ? (product as any).stock_quantity : 10,
        is_featured: Boolean((product as any).is_featured),
        is_hero: Boolean((product as any).is_hero),
        condition: (product as any).condition || 'NEW',
        category: (product as any).category,
        created_at: (product as any).created_at || new Date().toISOString(),
        updated_at: (product as any).updated_at || new Date().toISOString(),
      };

      list.unshift(summary);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 30)));
    } catch {}
  },
};
