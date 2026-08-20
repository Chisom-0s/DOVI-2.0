// Homepage API — /api/v1/homepage/*
import apiClient from './client';
import type { HomepageData, HomepageBanner, HomepageSection, ProductSummary } from '@/types';

const SEED_SECTIONS: HomepageSection[] = [
  {
    id: 'sec-popular-categories',
    name: 'Popular Categories',
    key: 'POPULAR_CATEGORIES',
    title: 'Popular Categories',
    subtitle: 'Browse our trending categories',
    is_active: true,
    visible: true,
    sort_order: 1,
    display_order: 1,
    display_limit: 8,
    configuration: {
      layout: 'CATEGORY_GRID',
      source: 'AUTOMATIC',
    },
    config: {},
  },
  {
    id: 'sec-flash-deals',
    name: 'Flash Deals',
    key: 'FLASH_DEALS',
    title: 'Flash Deals',
    subtitle: 'Hurry up! Limited time offers',
    is_active: true,
    visible: true,
    sort_order: 2,
    display_order: 2,
    display_limit: 10,
    configuration: {
      layout: 'HORIZONTAL_CAROUSEL',
      source: 'AUTOMATIC',
      filters: { min_discount: 10, in_stock_only: true },
      sort_by: 'highest_discount',
    },
    config: {},
  },
  {
    id: 'sec-trending',
    name: 'Trending Now',
    key: 'TRENDING_NOW',
    title: 'Trending Now',
    subtitle: 'People are looking at these right now',
    is_active: true,
    visible: true,
    sort_order: 3,
    display_order: 3,
    display_limit: 6,
    configuration: {
      layout: 'HORIZONTAL_CAROUSEL',
      source: 'AUTOMATIC',
      sort_by: 'trending_score',
    },
    config: {},
  },
  {
    id: 'sec-save2own',
    name: 'Save2Own Picks',
    key: 'SAVE2OWN_FEATURED',
    title: 'Start Saving Today',
    subtitle: 'Contribute in bits towards purchasing high-value items',
    is_active: true,
    visible: true,
    sort_order: 4,
    display_order: 4,
    display_limit: 4,
    configuration: {
      layout: 'LARGE_PRODUCT_CARDS',
      source: 'QUERY',
      filters: { price_min: 50000 },
    },
    config: {},
  },
  {
    id: 'sec-dovi-auto',
    name: 'Featured Cars',
    key: 'DOVI_AUTO',
    title: 'Featured Cars',
    subtitle: 'Explore auto deals, rentals, and spare compatibility parts',
    is_active: true,
    visible: true,
    sort_order: 5,
    display_order: 5,
    display_limit: 4,
    configuration: {
      layout: 'AUTO_LISTING_GRID',
      source: 'AUTOMATIC',
    },
    config: {},
  }
];

const MOCK_PRODUCTS: ProductSummary[] = [
  {
    id: 'prod-iphone-15',
    name: 'iPhone 15 Pro Max (256GB, Titanium)',
    price: '1450000.00',
    original_price: '1600000.00',
    primary_image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400',
    image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400',
    category: { id: 'cat-phones', name: 'Phones & Tablets', slug: 'phones-tablets', icon_url: null },
    vendor: { id: 'vend-slot', name: 'SLOT Nigeria', logo_url: null, rating: 4.8, review_count: 42, location: 'Lagos', slug: 'slot' },
    average_rating: 4.8,
    review_count: 42,
    stock_quantity: 10,
    status: 'ACTIVE',
    discount_percentage: 10,
    is_flash_deal: true,
    is_trending: true,
    is_best_seller: true,
    created_at: '2026-08-01T10:00:00Z',
    in_stock: true,
  },
  {
    id: 'prod-macbook',
    name: 'MacBook Pro 14" M3 Chip (16GB/512GB)',
    price: '2800000.00',
    original_price: '3000000.00',
    primary_image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
    image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
    category: { id: 'cat-computers', name: 'Computers', slug: 'computers', icon_url: null },
    vendor: { id: 'vend-apple', name: 'iConnect', logo_url: null, rating: 4.9, review_count: 18, location: 'Lekki, Lagos', slug: 'iconnect' },
    average_rating: 4.9,
    review_count: 18,
    stock_quantity: 5,
    status: 'ACTIVE',
    discount_percentage: 6,
    is_flash_deal: false,
    is_trending: true,
    is_best_seller: true,
    created_at: '2026-08-05T12:00:00Z',
    in_stock: true,
  },
  {
    id: 'prod-airpods',
    name: 'Apple AirPods Pro (2nd Generation)',
    price: '340000.00',
    original_price: '400000.00',
    primary_image_url: 'https://images.unsplash.com/photo-1588449668365-d15e397f6787?w=400',
    image_url: 'https://images.unsplash.com/photo-1588449668365-d15e397f6787?w=400',
    category: { id: 'cat-audio', name: 'Audio & Video', slug: 'audio-video', icon_url: null },
    vendor: { id: 'vend-slot', name: 'SLOT Nigeria', logo_url: null, rating: 4.8, review_count: 42, location: 'Lagos', slug: 'slot' },
    average_rating: 4.7,
    review_count: 56,
    stock_quantity: 20,
    status: 'ACTIVE',
    discount_percentage: 15,
    is_flash_deal: true,
    is_trending: true,
    is_best_seller: false,
    created_at: '2026-08-07T08:00:00Z',
    in_stock: true,
  },
  {
    id: 'prod-ps5',
    name: 'Sony PlayStation 5 Console (Slim Edition)',
    price: '850000.00',
    original_price: '950000.00',
    primary_image_url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400',
    image_url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400',
    category: { id: 'cat-gaming', name: 'Gaming', slug: 'gaming', icon_url: null },
    vendor: { id: 'vend-gaming', name: 'GameHouse', logo_url: null, rating: 4.9, review_count: 85, location: 'Lagos', slug: 'gamehouse' },
    average_rating: 4.9,
    review_count: 85,
    stock_quantity: 8,
    status: 'ACTIVE',
    discount_percentage: 10,
    is_flash_deal: true,
    is_trending: true,
    is_best_seller: true,
    created_at: '2026-08-10T14:00:00Z',
    in_stock: true,
  },
  {
    id: 'prod-engine-oil',
    name: 'Mobil 1 Full Synthetic Motor Oil 5W-30 (5L)',
    price: '45000.00',
    original_price: '55000.00',
    primary_image_url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400',
    image_url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400',
    category: { id: 'cat-auto-parts', name: 'Auto Parts', slug: 'auto-parts', icon_url: null },
    vendor: { id: 'vend-lubes', name: 'Dovi Auto Hub', logo_url: null, rating: 4.8, review_count: 24, location: 'Enugu', slug: 'dovi-auto-hub' },
    average_rating: 4.8,
    review_count: 24,
    stock_quantity: 15,
    status: 'ACTIVE',
    discount_percentage: 18,
    is_flash_deal: true,
    is_trending: false,
    is_best_seller: true,
    created_at: '2026-08-12T09:00:00Z',
    in_stock: true,
  },
  {
    id: 'prod-brake-pads',
    name: 'Brembo Front Brake Pads Set',
    price: '38000.00',
    original_price: '38000.00',
    primary_image_url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=400',
    image_url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=400',
    category: { id: 'cat-auto-parts', name: 'Auto Parts', slug: 'auto-parts', icon_url: null },
    vendor: { id: 'vend-lubes', name: 'Dovi Auto Hub', logo_url: null, rating: 4.6, review_count: 14, location: 'Enugu', slug: 'dovi-auto-hub' },
    average_rating: 4.6,
    review_count: 14,
    stock_quantity: 12,
    status: 'ACTIVE',
    discount_percentage: 0,
    is_flash_deal: false,
    is_trending: true,
    is_best_seller: false,
    created_at: '2026-08-14T11:00:00Z',
    in_stock: true,
  },
  {
    id: 'prod-dashcam',
    name: '70mai Dash Cam Pro Plus+ A500S 2.7K',
    price: '95000.00',
    original_price: '120000.00',
    primary_image_url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=400',
    image_url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=400',
    category: { id: 'cat-auto-acc', name: 'Auto Accessories', slug: 'auto-accessories', icon_url: null },
    vendor: { id: 'vend-lubes', name: 'Dovi Auto Hub', logo_url: null, rating: 4.7, review_count: 31, location: 'Enugu', slug: 'dovi-auto-hub' },
    average_rating: 4.7,
    review_count: 31,
    stock_quantity: 8,
    status: 'ACTIVE',
    discount_percentage: 20,
    is_flash_deal: true,
    is_trending: true,
    is_best_seller: false,
    created_at: '2026-08-15T15:00:00Z',
    in_stock: true,
  }
];

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
