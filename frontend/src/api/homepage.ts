// Homepage API — /api/v1/homepage/*
import apiClient from './client';
import { parsePriceNumber } from '@/utils/currency';
import { normalizeUrl } from '@/utils/image';
import type { HomepageData, HomepageBanner, HomepageSection, ProductSummary } from '@/types';

const SEED_SECTIONS: HomepageSection[] = [
  {
    id: 'sec-categories',
    name: 'Featured Categories',
    key: 'FEATURED_CATEGORIES',
    title: 'Featured Categories',
    subtitle: 'Find items by department',
    is_active: true,
    visible: true,
    sort_order: 1,
    display_order: 1,
    display_limit: 10,
    configuration: {
      layout: 'CATEGORY_PILLS',
      source: 'AUTOMATIC',
    },
    config: {},
  },
  {
    id: 'sec-flash-deals',
    name: 'Flash Deals',
    key: 'FLASH_DEALS',
    title: 'Flash Deals',
    subtitle: 'Limited time offers — ending soon!',
    is_active: true,
    visible: true,
    sort_order: 2,
    display_order: 2,
    display_limit: 6,
    configuration: {
      layout: 'HORIZONTAL_CAROUSEL',
      source: 'AUTOMATIC',
    },
    config: {},
  },
  {
    id: 'sec-new-arrivals',
    name: 'New Arrivals',
    key: 'NEW_ARRIVALS',
    title: 'New Arrivals',
    subtitle: 'Freshly added to the catalog',
    is_active: true,
    visible: true,
    sort_order: 3,
    display_order: 3,
    display_limit: 4,
    configuration: {
      layout: 'PRODUCT_GRID',
      source: 'AUTOMATIC',
    },
    config: {},
  },
  {
    id: 'sec-special-promo',
    name: 'Special Promo',
    key: 'SPECIAL_PROMO',
    title: 'Unlock Save2Own Benefits',
    subtitle: 'Contribute in bits towards purchasing high-value items without any interest.',
    is_active: true,
    visible: true,
    sort_order: 4,
    display_order: 4,
    display_limit: 1,
    configuration: {
      layout: 'BANNER',
      source: 'AUTOMATIC',
      cta_text: 'Start Saving',
      cta_url: '/save2own',
      background_color: 'rgba(255, 122, 0, 0.05)',
    },
    config: {},
  },
  {
    id: 'sec-hot-sales',
    name: 'Hot Sales',
    key: 'HOT_SALES',
    title: 'Hot Sales',
    subtitle: 'Most popular purchases this week',
    is_active: true,
    visible: true,
    sort_order: 5,
    display_order: 5,
    display_limit: 6,
    configuration: {
      layout: 'HORIZONTAL_CAROUSEL',
      source: 'AUTOMATIC',
    },
    config: {},
  },
  {
    id: 'sec-best-sellers',
    name: 'Best Sellers',
    key: 'BEST_SELLERS',
    title: 'Best Sellers',
    subtitle: 'Top performing products from our vendors',
    is_active: true,
    visible: true,
    sort_order: 6,
    display_order: 6,
    display_limit: 4,
    configuration: {
      layout: 'PRODUCT_GRID',
      source: 'AUTOMATIC',
    },
    config: {},
  },
  {
    id: 'sec-trending',
    name: 'Trending Now',
    key: 'TRENDING_NOW',
    title: 'Trending Now',
    subtitle: 'High demand products right now',
    is_active: true,
    visible: true,
    sort_order: 7,
    display_order: 7,
    display_limit: 6,
    configuration: {
      layout: 'HORIZONTAL_CAROUSEL',
      source: 'AUTOMATIC',
    },
    config: {},
  },
  {
    id: 'sec-save2own',
    name: 'Save2Own Featured',
    key: 'SAVE2OWN_FEATURED',
    title: 'Featured Save2Own items',
    subtitle: 'Start saving in micro-payments today',
    is_active: true,
    visible: true,
    sort_order: 8,
    display_order: 8,
    display_limit: 4,
    configuration: {
      layout: 'LARGE_PRODUCT_CARDS',
      source: 'AUTOMATIC',
    },
    config: {},
  },
  {
    id: 'sec-dovi-auto',
    name: 'Featured Cars',
    key: 'DOVI_AUTO',
    title: 'Dovi Auto Hub',
    subtitle: 'Premium car deals and accessories',
    is_active: true,
    visible: true,
    sort_order: 9,
    display_order: 9,
    display_limit: 4,
    configuration: {
      layout: 'AUTO_LISTING_GRID',
      source: 'AUTOMATIC',
    },
    config: {},
  },
  {
    id: 'sec-vendors',
    name: 'Top Vendors',
    key: 'TOP_VENDORS',
    title: 'Top Vendors',
    subtitle: 'Certified sellers with excellent delivery record',
    is_active: true,
    visible: true,
    sort_order: 10,
    display_order: 10,
    display_limit: 4,
    configuration: {
      layout: 'VENDOR_GRID',
      source: 'AUTOMATIC',
    },
    config: {},
  }
];

export const MOCK_PRODUCTS: ProductSummary[] = [
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
    is_hot_sale: true,
    is_new_arrival: false,
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
    is_hot_sale: true,
    is_new_arrival: true,
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
    is_hot_sale: false,
    is_new_arrival: true,
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
    is_hot_sale: false,
    is_new_arrival: false,
    created_at: '2026-08-10T14:00:00Z',
    in_stock: true,
  },
  {
    id: 'prod-s24',
    name: 'Samsung Galaxy S24 Ultra (512GB)',
    price: '1350000.00',
    original_price: '1450000.00',
    primary_image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400',
    image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400',
    category: { id: 'cat-phones', name: 'Phones & Tablets', slug: 'phones-tablets', icon_url: null },
    vendor: { id: 'vend-slot', name: 'SLOT Nigeria', logo_url: null, rating: 4.8, review_count: 42, location: 'Lagos', slug: 'slot' },
    average_rating: 4.8,
    review_count: 32,
    stock_quantity: 12,
    status: 'ACTIVE',
    discount_percentage: 8,
    is_flash_deal: true,
    is_trending: true,
    is_best_seller: false,
    is_hot_sale: true,
    is_new_arrival: true,
    created_at: '2026-08-11T11:00:00Z',
    in_stock: true,
  },
  {
    id: 'prod-xm5',
    name: 'Sony WH-1000XM5 Wireless Headphones',
    price: '450000.00',
    original_price: '450000.00',
    primary_image_url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400',
    image_url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400',
    category: { id: 'cat-audio', name: 'Audio & Video', slug: 'audio-video', icon_url: null },
    vendor: { id: 'vend-apple', name: 'iConnect', logo_url: null, rating: 4.9, review_count: 18, location: 'Lekki, Lagos', slug: 'iconnect' },
    average_rating: 4.7,
    review_count: 22,
    stock_quantity: 15,
    status: 'ACTIVE',
    discount_percentage: 0,
    is_flash_deal: false,
    is_trending: true,
    is_best_seller: true,
    is_hot_sale: false,
    is_new_arrival: true,
    created_at: '2026-08-12T16:00:00Z',
    in_stock: true,
  },
  {
    id: 'prod-switch',
    name: 'Nintendo Switch OLED Model',
    price: '390000.00',
    original_price: '390000.00',
    primary_image_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
    image_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
    category: { id: 'cat-gaming', name: 'Gaming', slug: 'gaming', icon_url: null },
    vendor: { id: 'vend-gaming', name: 'GameHouse', logo_url: null, rating: 4.9, review_count: 85, location: 'Lagos', slug: 'gamehouse' },
    average_rating: 4.8,
    review_count: 48,
    stock_quantity: 14,
    status: 'ACTIVE',
    discount_percentage: 0,
    is_flash_deal: false,
    is_trending: true,
    is_best_seller: false,
    is_hot_sale: true,
    is_new_arrival: false,
    created_at: '2026-08-13T10:00:00Z',
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
    is_hot_sale: false,
    is_new_arrival: false,
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
    is_hot_sale: false,
    is_new_arrival: false,
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
    is_hot_sale: false,
    is_new_arrival: false,
    created_at: '2026-08-15T15:00:00Z',
    in_stock: true,
  },
  {
    id: 'prod-camry-covers',
    name: 'Toyota Camry Premium Leather Seat Covers',
    price: '55000.00',
    original_price: '55000.00',
    primary_image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400',
    image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400',
    category: { id: 'cat-auto-acc', name: 'Auto Accessories', slug: 'auto-accessories', icon_url: null },
    vendor: { id: 'vend-lubes', name: 'Dovi Auto Hub', logo_url: null, rating: 4.8, review_count: 10, location: 'Enugu', slug: 'dovi-auto-hub' },
    average_rating: 4.5,
    review_count: 10,
    stock_quantity: 6,
    status: 'ACTIVE',
    discount_percentage: 0,
    is_flash_deal: false,
    is_trending: false,
    is_best_seller: false,
    is_hot_sale: false,
    is_new_arrival: true,
    created_at: '2026-08-16T12:00:00Z',
    in_stock: true,
  },
  {
    id: 'prod-benz-c300',
    name: 'Mercedes-Benz C300 2021 (Sedan)',
    price: '28000000.00',
    original_price: '30000000.00',
    primary_image_url: 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=400',
    image_url: 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=400',
    category: { id: 'cat-auto-cars', name: 'Dovi Auto', slug: 'auto-cars', icon_url: null },
    vendor: { id: 'vend-lubes', name: 'Dovi Auto Hub', logo_url: null, rating: 4.9, review_count: 5, location: 'Enugu', slug: 'dovi-auto-hub' },
    average_rating: 4.9,
    review_count: 5,
    stock_quantity: 1,
    status: 'ACTIVE',
    discount_percentage: 6,
    is_flash_deal: false,
    is_trending: true,
    is_best_seller: true,
    is_hot_sale: false,
    is_new_arrival: false,
    created_at: '2026-08-17T09:00:00Z',
    in_stock: true,
  },
  {
    id: 'prod-lexus-rx',
    name: 'Lexus RX350 2020 Luxury SUV',
    price: '35000000.00',
    original_price: '35000000.00',
    primary_image_url: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=400',
    image_url: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=400',
    category: { id: 'cat-auto-cars', name: 'Dovi Auto', slug: 'auto-cars', icon_url: null },
    vendor: { id: 'vend-lubes', name: 'Dovi Auto Hub', logo_url: null, rating: 4.8, review_count: 8, location: 'Enugu', slug: 'dovi-auto-hub' },
    average_rating: 4.8,
    review_count: 8,
    stock_quantity: 2,
    status: 'ACTIVE',
    discount_percentage: 0,
    is_flash_deal: false,
    is_trending: true,
    is_best_seller: false,
    is_hot_sale: true,
    is_new_arrival: true,
    created_at: '2026-08-18T14:00:00Z',
    in_stock: true,
  }
];

/**
 * Normalizes a raw product from GET /api/v1/products/ into a typed ProductSummary.
 */
export function normalizeBackendProductToSummary(p: any): ProductSummary {
  const stock = Array.isArray(p.variants) && p.variants.length > 0
    ? p.variants.reduce((sum: number, v: any) => sum + (Number(v.stock ?? v.quantity) || 0), 0)
    : (Number(p.stock_quantity ?? p.stock) || 10);

  const priceStr = String(p.base_price ?? p.price ?? '0');
  
  // Resolve primary image or first available image thumbnail/url
  let primaryImg: string | null = p.primary_image_url || null;
  if (!primaryImg && Array.isArray(p.images) && p.images.length > 0) {
    const prim = p.images.find((img: any) => img.is_primary);
    primaryImg = prim?.thumbnail_url || prim?.image_url || p.images[0]?.thumbnail_url || p.images[0]?.image_url || null;
  }
  const resolvedPrimary = normalizeUrl(primaryImg) || primaryImg;

  const vendorName = p.vendor_name || (typeof p.vendor === 'object' ? p.vendor?.name : 'Verified Vendor');
  const vendorObj = typeof p.vendor === 'object' && p.vendor !== null
    ? p.vendor
    : {
        id: String(p.vendor || 'vend-real'),
        name: vendorName,
        logo_url: null,
        rating: 4.9,
        review_count: 14,
        location: 'Lagos, Nigeria',
        slug: vendorName.toLowerCase().replace(/\s+/g, '-'),
      };

  const categoryName = p.category_name || (typeof p.category === 'object' ? p.category?.name : 'General');
  const categoryObj = typeof p.category === 'object' && p.category !== null
    ? p.category
    : {
        id: String(p.category || 'cat-real'),
        name: categoryName,
        slug: (p.category_slug || categoryName).toLowerCase().replace(/\s+/g, '-'),
        icon_url: null,
      };

  const normalizedImages = (Array.isArray(p.images) ? p.images : []).map((img: any) => {
    if (!img) return img;
    if (typeof img === 'string') {
      return normalizeUrl(img) || img;
    }
    return {
      ...img,
      image_url: normalizeUrl(img.image_url) || img.image_url,
      thumbnail_url: normalizeUrl(img.thumbnail_url) || img.thumbnail_url,
      url: normalizeUrl(img.url || img.image_url) || img.url,
    };
  });

  return {
    id: p.id,
    name: p.name,
    price: priceStr,
    base_price: priceStr,
    original_price: p.original_price ?? null,
    primary_image_url: resolvedPrimary,
    image_url: resolvedPrimary || undefined,
    images: normalizedImages,
    variants: p.variants || [],
    category: categoryObj,
    category_name: categoryName,
    vendor: vendorObj,
    vendor_name: vendorName,
    average_rating: Number(p.average_rating) || 4.9,
    review_count: Number(p.review_count) || (p.reviews ? p.reviews.length : 12),
    stock_quantity: stock,
    status: (p.status || 'PUBLISHED') as any,
    discount_percentage: Number(p.discount_percentage) || 0,
    is_flash_deal: true,
    is_trending: true,
    is_best_seller: true,
    is_hot_sale: true,
    is_new_arrival: true,
    created_at: p.created_at || new Date().toISOString(),
    in_stock: stock > 0,
  };
}

/**
 * Fetches real products posted by vendors directly from the backend API.
 * Uses sessionStorage cache as immediate fallback for speed and offline stability.
 */
export async function fetchRealBackendProducts(): Promise<ProductSummary[]> {
  try {
    const { data } = await apiClient.get('/api/v1/products/', { params: { page_size: 50 } });
    const rawList: any[] = Array.isArray(data) ? data : (data?.results || []);
    if (rawList && rawList.length > 0) {
      const normalized = rawList.map(p => normalizeBackendProductToSummary(p));
      try {
        sessionStorage.setItem('dovi_real_products_cache', JSON.stringify(normalized));
      } catch {}
      return normalized;
    }
  } catch (err) {
    console.warn('Could not fetch real products from backend, checking local cache:', err);
  }

  // Fallback to cache if available
  try {
    const cached = sessionStorage.getItem('dovi_real_products_cache');
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  return [];
}

function getMockSections(): HomepageSection[] {
  const data = localStorage.getItem('dovi_homepage_sections_db');
  if (!data || data === '[]' || !data.includes('sec-new-arrivals')) {
    localStorage.setItem('dovi_homepage_sections_db', JSON.stringify(SEED_SECTIONS));
    return SEED_SECTIONS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return SEED_SECTIONS;
  }
}

// Helper to filter and combine real products + mock products matching section config
function populateProductsForSection(section: HomepageSection, realProducts: ProductSummary[] = []): ProductSummary[] {
  let matchingReal = [...realProducts];
  let matchingMock = [...MOCK_PRODUCTS];

  const source = section.configuration?.source || 'AUTOMATIC';
  const sourceId = section.configuration?.source_id;

  // 1. Source Filtering
  if (source === 'MANUAL' && section.configuration?.manual_product_ids) {
    matchingReal = matchingReal.filter(p => section.configuration.manual_product_ids?.includes(p.id));
    matchingMock = matchingMock.filter(p => section.configuration.manual_product_ids?.includes(p.id));
  } else if (source === 'CATEGORY' && sourceId) {
    matchingReal = matchingReal.filter(p => p.category?.id === sourceId || p.category?.slug === sourceId);
    matchingMock = matchingMock.filter(p => p.category?.id === sourceId || p.category?.slug === sourceId);
  } else if (source === 'VENDOR' && sourceId) {
    matchingReal = matchingReal.filter(p => p.vendor?.id === sourceId || p.vendor?.slug === sourceId);
    matchingMock = matchingMock.filter(p => p.vendor?.id === sourceId || p.vendor?.slug === sourceId);
  }

  // 2. Automations Filter based on Section Type
  if (section.key === 'FLASH_DEALS') {
    matchingMock = matchingMock.filter(p => p.is_flash_deal);
    matchingReal = matchingReal.filter(p => p.is_flash_deal);
  } else if (section.key === 'TRENDING_NOW') {
    matchingMock = matchingMock.filter(p => p.is_trending);
    matchingReal = matchingReal.filter(p => p.is_trending);
  } else if (section.key === 'BEST_SELLERS') {
    matchingMock = matchingMock.filter(p => p.is_best_seller);
    matchingReal = matchingReal.filter(p => p.is_best_seller);
  } else if (section.key === 'NEW_ARRIVALS') {
    matchingMock = matchingMock.filter(p => p.is_new_arrival);
    matchingReal = matchingReal.filter(p => p.is_new_arrival);
  } else if (section.key === 'HOT_SALES') {
    matchingMock = matchingMock.filter(p => p.is_hot_sale);
    matchingReal = matchingReal.filter(p => p.is_hot_sale);
  } else if (section.key === 'SAVE2OWN_FEATURED') {
    matchingMock = matchingMock.filter(p => parsePriceNumber(p) >= 100000);
    matchingReal = matchingReal.filter(p => parsePriceNumber(p) >= 10000);
  } else if (section.key === 'DOVI_AUTO') {
    matchingMock = matchingMock.filter(p => p.category?.slug?.startsWith('auto') || p.id.includes('camry') || p.id.includes('c300') || p.id.includes('rx350'));
    matchingReal = matchingReal.filter(p => p.category?.slug?.startsWith('auto') || (p.category_name && /auto|car|brake|engine/i.test(p.category_name)));
  }

  // 3. Custom Filters
  const filters = section.configuration?.filters;
  if (filters) {
    if (filters.min_discount) {
      matchingMock = matchingMock.filter(p => (p.discount_percentage ?? 0) >= (filters.min_discount ?? 0));
    }
    if (filters.min_rating) {
      matchingReal = matchingReal.filter(p => p.average_rating >= (filters.min_rating ?? 0));
      matchingMock = matchingMock.filter(p => p.average_rating >= (filters.min_rating ?? 0));
    }
    if (filters.in_stock_only) {
      matchingReal = matchingReal.filter(p => p.stock_quantity > 0);
      matchingMock = matchingMock.filter(p => p.stock_quantity > 0);
    }
    if (filters.price_min) {
      matchingReal = matchingReal.filter(p => parsePriceNumber(p) >= (filters.price_min ?? 0));
      matchingMock = matchingMock.filter(p => parsePriceNumber(p) >= (filters.price_min ?? 0));
    }
    if (filters.price_max) {
      matchingReal = matchingReal.filter(p => parsePriceNumber(p) <= (filters.price_max ?? 99999999));
      matchingMock = matchingMock.filter(p => parsePriceNumber(p) <= (filters.price_max ?? 99999999));
    }
  }

  // 4. Combine: REAL USER PRODUCTS COME FIRST, followed by supplemental mock inventory
  const seenIds = new Set<string>();
  const combined: ProductSummary[] = [];

  for (const p of matchingReal) {
    if (!seenIds.has(p.id)) {
      seenIds.add(p.id);
      combined.push(p);
    }
  }

  for (const p of matchingMock) {
    if (!seenIds.has(p.id)) {
      seenIds.add(p.id);
      combined.push(p);
    }
  }

  // 5. Sorting rules
  const sortBy = section.configuration?.sort_by;
  if (sortBy === 'price_asc') {
    combined.sort((a, b) => parsePriceNumber(a) - parsePriceNumber(b));
  } else if (sortBy === 'price_desc') {
    combined.sort((a, b) => parsePriceNumber(b) - parsePriceNumber(a));
  } else if (sortBy === 'newest') {
    combined.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
  } else if (sortBy === 'highest_discount') {
    combined.sort((a, b) => (b.discount_percentage ?? 0) - (a.discount_percentage ?? 0));
  }

  // Ensure all real products are shown up to at least display limit
  const baseLimit = section.display_limit || 10;
  const effectiveLimit = Math.max(baseLimit, matchingReal.length);
  return combined.slice(0, effectiveLimit);
}

export const homepageApi = {
  getData: async (): Promise<HomepageData> => {
    // 1. Always fetch authoritative real products from the backend
    const realProducts = await fetchRealBackendProducts();

    // 2. Attempt backend homepage API if implemented
    try {
      const { data } = await apiClient.get('/api/v1/homepage/');
      if (data && data.sections && data.sections.length > 0) {
        return data;
      }
    } catch {
      // Expected when backend has no dedicated /homepage/ endpoint
    }

    // 3. Construct homepage with real products prioritized alongside seed sections
    const rawSections = getMockSections();
    const sections = rawSections
      .filter(s => s.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(s => {
        const populatedProducts = populateProductsForSection(s, realProducts);

        // For TOP_VENDORS, extract real vendor listings
        let vendors = s.vendors;
        if (s.key === 'TOP_VENDORS' && realProducts.length > 0) {
          const realVendorsMap = new Map<string, any>();
          realProducts.forEach(rp => {
            if (rp.vendor_name && rp.vendor_name !== 'Verified Vendor') {
              const vId = typeof rp.vendor === 'object' ? rp.vendor.id : (rp.vendor || rp.vendor_name);
              if (!realVendorsMap.has(vId)) {
                realVendorsMap.set(vId, {
                  id: vId,
                  name: rp.vendor_name,
                  rating: rp.average_rating || '4.9',
                  location: 'Lagos, Nigeria',
                });
              }
            }
          });
          const realVendors = Array.from(realVendorsMap.values());
          vendors = [...realVendors, ...(s.vendors || [])].slice(0, 6);
        }

        return {
          ...s,
          vendors,
          products: populatedProducts,
        };
      });

    // Cache computed sections locally for instant 0ms rendering on subsequent visits
    try {
      localStorage.setItem('dovi_cached_homepage_sections', JSON.stringify(sections));
    } catch {}

    return {
      banners: DEFAULT_HERO_BANNERS,
      sections,
    };
  },

  getBanners: async (): Promise<HomepageBanner[]> => {
    try {
      const { data } = await apiClient.get('/api/v1/homepage/banners/');
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch {}
    return DEFAULT_HERO_BANNERS;
  },

  getSections: async (): Promise<HomepageSection[]> => {
    const realProducts = await fetchRealBackendProducts();
    try {
      const { data } = await apiClient.get('/api/v1/homepage/sections/');
      return data;
    } catch (err) {
      return getMockSections().map(s => ({
        ...s,
        products: populateProductsForSection(s, realProducts),
      }));
    }
  },
};

export const DEFAULT_HERO_BANNERS: HomepageBanner[] = [
  {
    id: 'ban-hero-save2own',
    title: 'Smart Savings for the Things You Love',
    subtitle: 'Save in flexible micro-payments towards phones, laptops, and gadgets with zero debt.',
    cta_text: 'Explore Save2Own',
    cta_url: '/save2own',
    desktop_image_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&q=80',
    mobile_image_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    is_active: true,
    display_order: 1,
    slide_interval_ms: 5000,
    start_date: null,
    end_date: null,
  },
  {
    id: 'ban-hero-deals',
    title: 'Mega Tech Deals & Verified Sellers',
    subtitle: 'Shop the latest smartphones, computers, and accessories with doorstep warranty.',
    cta_text: 'Shop Tech Deals',
    cta_url: '/products',
    desktop_image_url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=80',
    mobile_image_url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80',
    is_active: true,
    display_order: 2,
    slide_interval_ms: 5000,
    start_date: null,
    end_date: null,
  },
  {
    id: 'ban-hero-auto',
    title: 'Dovi Auto Hub — Cars, Parts & Care',
    subtitle: 'Verified foreign used and brand new vehicles with nationwide inspection.',
    cta_text: 'Explore Dovi Auto',
    cta_url: '/auto',
    desktop_image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80',
    mobile_image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
    is_active: true,
    display_order: 3,
    slide_interval_ms: 5000,
    start_date: null,
    end_date: null,
  },
];

/**
 * Returns immediate synchronous sections (frame 0) so the homepage mounts instantly
 * with zero waiting, before live background revalidation finishes.
 */
export function getCachedHomepageSections(): HomepageSection[] {
  // 1. Try previously cached sections from localStorage (stale-while-revalidate)
  try {
    const cached = localStorage.getItem('dovi_cached_homepage_sections');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  // 2. Immediate synchronous seed with cached real products if available, plus seed mocks
  try {
    const cachedReal = JSON.parse(sessionStorage.getItem('dovi_real_products_cache') || '[]');
    const rawSections = getMockSections();
    return rawSections
      .filter(s => s.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(s => ({
        ...s,
        products: populateProductsForSection(s, cachedReal),
      }));
  } catch {
    return [];
  }
}
