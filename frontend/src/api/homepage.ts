// Homepage API — /api/v1/homepage/*
import apiClient from './client';
import type { HomepageData, HomepageBanner, HomepageSection, ProductSummary } from '@/types';

const SEED_SECTIONS: HomepageSection[] = [];
const MOCK_PRODUCTS: ProductSummary[] = [];

function getMockSections(): HomepageSection[] {
  const data = localStorage.getItem('dovi_homepage_sections_db');
  if (!data) {
    localStorage.setItem('dovi_homepage_sections_db', JSON.stringify(SEED_SECTIONS));
    return SEED_SECTIONS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return SEED_SECTIONS;
  }
}

// Local helper to filter mock products matching section config
function populateProductsForSection(section: HomepageSection): ProductSummary[] {
  let list = [...MOCK_PRODUCTS];

  const source = section.configuration?.source || 'AUTOMATIC';
  const sourceId = section.configuration?.source_id;

  // 1. Source Filtering
  if (source === 'MANUAL' && section.configuration?.manual_product_ids) {
    list = list.filter(p => section.configuration.manual_product_ids?.includes(p.id));
  } else if (source === 'CATEGORY' && sourceId) {
    list = list.filter(p => p.category?.id === sourceId || p.category?.slug === sourceId);
  } else if (source === 'VENDOR' && sourceId) {
    list = list.filter(p => p.vendor?.id === sourceId || p.vendor?.slug === sourceId);
  }

  // 2. Automations Filter based on Section Type
  if (section.key === 'FLASH_DEALS') {
    list = list.filter(p => p.is_flash_deal);
  } else if (section.key === 'TRENDING_NOW') {
    list = list.filter(p => p.is_trending);
  } else if (section.key === 'BEST_SELLERS') {
    list = list.filter(p => p.is_best_seller);
  } else if (section.key === 'AUTO_PARTS') {
    list = list.filter(p => p.category?.slug === 'auto-parts');
  } else if (section.key === 'AUTO_ACCESSORIES') {
    list = list.filter(p => p.category?.slug === 'auto-accessories');
  } else if (section.key === 'DOVI_AUTO') {
    // Keep auto products or Lubes
    list = list.filter(p => p.category?.slug.startsWith('auto'));
  }

  // 3. Custom Filters
  const filters = section.configuration?.filters;
  if (filters) {
    if (filters.min_discount) {
      list = list.filter(p => (p.discount_percentage ?? 0) >= (filters.min_discount ?? 0));
    }
    if (filters.min_rating) {
      list = list.filter(p => p.average_rating >= (filters.min_rating ?? 0));
    }
    if (filters.in_stock_only) {
      list = list.filter(p => p.stock_quantity > 0);
    }
    if (filters.price_min) {
      list = list.filter(p => parseFloat(p.price) >= (filters.price_min ?? 0));
    }
    if (filters.price_max) {
      list = list.filter(p => parseFloat(p.price) <= (filters.price_max ?? 99999999));
    }
  }

  // 4. Sorting rules
  const sortBy = section.configuration?.sort_by;
  if (sortBy === 'price_asc') {
    list.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  } else if (sortBy === 'price_desc') {
    list.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
  } else if (sortBy === 'newest') {
    list.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
  } else if (sortBy === 'highest_discount') {
    list.sort((a, b) => (b.discount_percentage ?? 0) - (a.discount_percentage ?? 0));
  }

  // 5. Display Limit
  const limit = section.display_limit || 10;
  return list.slice(0, limit);
}

export const homepageApi = {
  getData: async (): Promise<HomepageData> => {
    try {
      const { data } = await apiClient.get('/api/v1/homepage/');
      return data;
    } catch (err) {
      console.warn('Backend API GET /homepage failed, returning populated mock database...', err);
      const rawSections = getMockSections();
      const sections = rawSections
        .filter(s => s.is_active)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(s => ({
          ...s,
          products: populateProductsForSection(s),
        }));

      return {
        banners: [],
        sections,
      };
    }
  },

  getBanners: async (): Promise<HomepageBanner[]> => {
    try {
      const { data } = await apiClient.get('/api/v1/homepage/banners/');
      return data;
    } catch (err) {
      console.warn('Backend API GET /homepage/banners failed, returning empty mock list...');
      return [];
    }
  },

  getSections: async (): Promise<HomepageSection[]> => {
    try {
      const { data } = await apiClient.get('/api/v1/homepage/sections/');
      return data;
    } catch (err) {
      console.warn('Backend API GET /homepage/sections failed, returning mock sections list...');
      return getMockSections().map(s => ({
        ...s,
        products: populateProductsForSection(s),
      }));
    }
  },
};
