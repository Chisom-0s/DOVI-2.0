// Homepage API — /api/v1/homepage/*
import apiClient from './client';
import { SEED_RAW_PRODUCTS } from './seedProducts';
import { parsePriceNumber } from '@/utils/currency';
import { normalizeUrl } from '@/utils/image';
import { enrichProductWithDelivery } from '@/services/deliveryPricingService';
import { enrichProductWithCategory } from '@/services/categoryService';
import type { HomepageData, HomepageBanner, HomepageSection, ProductSummary } from '@/types';

const SEED_SECTIONS: HomepageSection[] = [
  {
    id: 'sec-flash-deals',
    name: 'Flash Deals',
    key: 'FLASH_DEALS',
    title: 'Flash Deals',
    subtitle: 'Limited time offers — ending soon!',
    is_active: true,
    visible: true,
    sort_order: 1,
    display_order: 1,
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
    sort_order: 2,
    display_order: 2,
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
    sort_order: 3,
    display_order: 3,
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
    sort_order: 4,
    display_order: 4,
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
    subtitle: 'Top performing products in the catalog',
    is_active: true,
    visible: true,
    sort_order: 5,
    display_order: 5,
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
    sort_order: 6,
    display_order: 6,
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
    sort_order: 7,
    display_order: 7,
    display_limit: 4,
    configuration: {
      layout: 'PRODUCT_GRID',
      source: 'AUTOMATIC',
    },
    config: {},
  },
  {
    id: 'sec-dovi-auto',
    name: 'Dovi Auto',
    key: 'DOVI_AUTO',
    title: 'Dovi Auto Hub',
    subtitle: 'Premium car deals and accessories',
    is_active: true,
    visible: true,
    sort_order: 8,
    display_order: 8,
    display_limit: 4,
    configuration: {
      layout: 'AUTO_LISTING_GRID',
      source: 'AUTOMATIC',
    },
    config: {},
  },
];

export const MOCK_PRODUCTS: ProductSummary[] = [];

export const SEED_REAL_PRODUCTS: ProductSummary[] = (SEED_RAW_PRODUCTS || []).map((p: any) =>
  normalizeBackendProductToSummary(p)
);

/**
 * Normalizes a raw product from GET /api/v1/products/ into a typed ProductSummary
 * and enriches it with configured DOVI parcel classification & delivery attributes.
 */
export function normalizeBackendProductToSummary(p: any): ProductSummary {
  const stock =
    Array.isArray(p.variants) && p.variants.length > 0
      ? p.variants.reduce((sum: number, v: any) => sum + (Number(v.stock ?? v.quantity) || 0), 0)
      : Number(p.stock_quantity ?? p.stock) || 10;

  const priceStr = String(p.base_price ?? p.price ?? '0');

  let primaryImg: string | null = p.primary_image_url || null;
  if (!primaryImg && Array.isArray(p.images) && p.images.length > 0) {
    const prim = p.images.find((img: any) => img.is_primary);
    primaryImg =
      prim?.thumbnail_url || prim?.image_url || p.images[0]?.thumbnail_url || p.images[0]?.image_url || null;
  }
  const resolvedPrimary = normalizeUrl(primaryImg) || primaryImg;

  const vendorName = p.vendor_name || (typeof p.vendor === 'object' ? p.vendor?.name : 'Verified Vendor');
  const vendorObj =
    typeof p.vendor === 'object' && p.vendor !== null
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
  const categoryObj =
    typeof p.category === 'object' && p.category !== null
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

  const summary: ProductSummary = {
    id: p.id,
    name: p.name,
    description: p.description || '',
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
    is_flash_deal: Boolean(p.is_flash_deal),
    is_trending: Boolean(p.is_trending),
    is_best_seller: Boolean(p.is_best_seller),
    is_hot_sale: Boolean(p.is_hot_sale),
    is_new_arrival: Boolean(p.is_new_arrival),
    created_at: p.created_at || new Date().toISOString(),
    in_stock: stock > 0,
    delivery_classification: p.delivery_classification,
    weight_kg: p.weight_kg,
    dimensions_cm: p.dimensions_cm,
    requires_special_handling: p.requires_special_handling,
    can_consolidate_with_furniture: p.can_consolidate_with_furniture,
    max_items_per_shipment: p.max_items_per_shipment,
    delivery_notes: p.delivery_notes,
  };

  return enrichProductWithCategory(enrichProductWithDelivery(summary));
}

/**
 * Fetches real products posted by vendors directly from the backend API.
 * Uses sessionStorage cache as immediate fallback for speed and offline stability.
 */
export async function fetchRealBackendProducts(): Promise<ProductSummary[]> {
  let deletedIds: string[] = [];
  try {
    deletedIds = JSON.parse(localStorage.getItem('dovi_deleted_product_ids') || '[]');
  } catch {}

  const filterActive = (list: ProductSummary[]) =>
    list
      .filter((p) => !deletedIds.includes(p.id) && p.status !== 'ARCHIVED' && p.status !== 'DELETED')
      .map((p) => enrichProductWithDelivery(p));

  try {
    const { data } = await apiClient.get('/api/v1/products/', { params: { page_size: 100 } });
    const rawList: any[] = Array.isArray(data) ? data : data?.results || [];
    if (rawList && rawList.length > 0) {
      const normalized = rawList
        .filter((p: any) => {
          if (!p) return false;
          if (deletedIds.includes(p.id)) return false;
          if (p.status === 'ARCHIVED' || p.status === 'DELETED') return false;
          return true;
        })
        .map((p) => normalizeBackendProductToSummary(p));

      try {
        sessionStorage.setItem('dovi_real_products_cache', JSON.stringify(normalized));
        localStorage.setItem('dovi_real_products_cache', JSON.stringify(normalized));
      } catch {}
      return normalized;
    }
  } catch (err) {
    console.warn('Could not fetch real products from backend, checking local cache:', err);
  }

  // Fallback 1: sessionStorage
  try {
    const cached = sessionStorage.getItem('dovi_real_products_cache');
    if (cached) {
      const parsed: ProductSummary[] = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return filterActive(parsed);
      }
    }
  } catch {}

  // Fallback 2: localStorage (survives tab closing & browser restart)
  try {
    const cached = localStorage.getItem('dovi_real_products_cache');
    if (cached) {
      const parsed: ProductSummary[] = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return filterActive(parsed);
      }
    }
  } catch {}

  // Fallback 3: Verified seed products (guarantees instant 0ms first render)
  if (SEED_REAL_PRODUCTS.length > 0) {
    return filterActive(SEED_REAL_PRODUCTS);
  }

  return [];
}

function getMockSections(): HomepageSection[] {
  const data = localStorage.getItem('dovi_homepage_sections_db');
  let sections: HomepageSection[] = [];
  if (!data || data === '[]' || !data.includes('sec-new-arrivals')) {
    localStorage.setItem('dovi_homepage_sections_db', JSON.stringify(SEED_SECTIONS));
    sections = SEED_SECTIONS;
  } else {
    try {
      sections = JSON.parse(data);
    } catch {
      sections = SEED_SECTIONS;
    }
  }
  return sections.filter(
    (s) =>
      s.key !== 'FEATURED_CATEGORIES' &&
      s.key !== 'TOP_VENDORS' &&
      s.configuration?.layout !== 'VENDOR_GRID' &&
      s.configuration?.layout !== 'CATEGORY_GRID' &&
      s.configuration?.layout !== 'CATEGORY_CIRCLES' &&
      s.configuration?.layout !== 'CATEGORY_PILLS' &&
      s.configuration?.layout !== 'BRAND_GRID'
  );
}

// Helper to filter and combine real products + mock products matching section config
function populateProductsForSection(section: HomepageSection, realProducts: ProductSummary[] = []): ProductSummary[] {
  if (!realProducts || realProducts.length === 0) return [];

  const source = section.configuration?.source || 'AUTOMATIC';
  const sourceId = section.configuration?.source_id;

  // 1. Manual Curation (Admin manually selected specific products)
  if (source === 'MANUAL' && Array.isArray(section.configuration?.manual_product_ids) && section.configuration.manual_product_ids.length > 0) {
    const idSet = new Set(section.configuration.manual_product_ids);
    const manualMatches = realProducts.filter((p) => idSet.has(p.id));
    if (manualMatches.length > 0) return manualMatches.slice(0, section.display_limit || 12);
  }

  // 2. Category Restriction (Admin set section to a specific category)
  if (source === 'CATEGORY' && sourceId) {
    const catMatches = realProducts.filter((p) => {
      const cId = typeof p.category === 'object' ? p.category?.id : p.category;
      const cSlug = typeof p.category === 'object' ? p.category?.slug : '';
      return cId === sourceId || cSlug === sourceId || (p.category_name && p.category_name.toLowerCase() === sourceId.toLowerCase());
    });
    if (catMatches.length > 0) return catMatches.slice(0, section.display_limit || 12);
  }

  // 3. Vendor Restriction
  if (source === 'VENDOR' && sourceId) {
    const vendMatches = realProducts.filter((p) => {
      const vId = typeof p.vendor === 'object' ? p.vendor?.id : p.vendor;
      const vSlug = typeof p.vendor === 'object' ? p.vendor?.slug : '';
      return vId === sourceId || vSlug === sourceId;
    });
    if (vendMatches.length > 0) return vendMatches.slice(0, section.display_limit || 12);
  }

  // 4. Automatic Section-Specific Logic
  let candidates: ProductSummary[] = [];

  switch (section.key) {
    case 'NEW_ARRIVALS': {
      // Sort strictly by newest creation date
      candidates = [...realProducts].sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });
      break;
    }

    case 'SAVE2OWN_FEATURED':
    case 'SAVE2OWN_PRODUCTS': {
      // High-value aspirational items specifically suited for micro-payment installment plans
      // Filter >= ₦40,000, sorted from highest price down (TCL TVs, luxury hair, washing machine, cookers)
      const highValue = realProducts.filter((p) => parsePriceNumber(p) >= 40000);
      candidates = highValue.length >= 3 
        ? highValue.sort((a, b) => parsePriceNumber(b) - parsePriceNumber(a))
        : [...realProducts].sort((a, b) => parsePriceNumber(b) - parsePriceNumber(a));
      break;
    }

    case 'FLASH_DEALS':
    case 'DEALS_OF_THE_DAY':
    case 'LIMITED_TIME_OFFERS': {
      // Deals, impulse purchases, and accessible price points (< ₦25,000 or high discount)
      const deals = realProducts.filter((p) => {
        const price = parsePriceNumber(p);
        const discount = p.discount_percentage || 0;
        return discount > 0 || (price > 0 && price <= 25000);
      });
      // Sort by price ascending
      candidates = deals.length >= 4 
        ? deals.sort((a, b) => parsePriceNumber(a) - parsePriceNumber(b))
        : [...realProducts].sort((a, b) => parsePriceNumber(a) - parsePriceNumber(b));
      break;
    }

    case 'HOT_SALES': {
      // Popular, high-demand tech & shoes & accessories (smartwatches, power banks, shoes, clippers, cookers)
      candidates = realProducts.filter((p) => {
        const name = (p.name || '').toLowerCase();
        const cat = (p.category_name || '').toLowerCase();
        return /watch|power bank|clipper|cooker|shoe|sandal|rack|charger/i.test(name) ||
               /watch|shoe|electronics/i.test(cat);
      });
      if (candidates.length < 4) {
        // Fallback: items in moderate price bracket ₦10k - ₦50k
        candidates = realProducts.filter((p) => {
          const price = parsePriceNumber(p);
          return price >= 10000 && price <= 50000;
        });
      }
      break;
    }

    case 'BEST_SELLERS': {
      // Top performing essentials (apparel, kitchenware, diffusers, home goods)
      candidates = realProducts.filter((p) => {
        const name = (p.name || '').toLowerCase();
        const cat = (p.category_name || '').toLowerCase();
        return /jean|pyjama|diffuser|slicer|plate|drainer|towel|shirt|belt/i.test(name) ||
               /fashion|home|kitchen/i.test(cat);
      });
      if (candidates.length < 4) {
        candidates = [...realProducts].sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
      }
      break;
    }

    case 'TRENDING_NOW': {
      // Viral, trending lifestyle & gadget items (headsets, LEDs, humidifiers, 2pcs sets)
      candidates = realProducts.filter((p) => {
        const name = (p.name || '').toLowerCase();
        const cat = (p.category_name || '').toLowerCase();
        return /headset|earbud|bluetooth|led|crystal|humidifier|2pcs|smart|pixie/i.test(name) ||
               /phone|audio|beauty|decor/i.test(cat);
      });
      if (candidates.length < 4) {
        candidates = realProducts.slice(4).concat(realProducts.slice(0, 4));
      }
      break;
    }

    case 'DOVI_AUTO':
    case 'AUTO_PARTS':
    case 'AUTO_ACCESSORIES': {
      candidates = realProducts.filter((p) => {
        const catSlug = (p.category?.slug || '').toLowerCase();
        const catName = (p.category_name || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        return catSlug.includes('auto') || /auto|car|vehicle|motor|brake|engine|tire/i.test(catName + ' ' + name);
      });
      break;
    }

    default: {
      candidates = [...realProducts];
      break;
    }
  }

  // 5. Custom Filters
  const filters = section.configuration?.filters;
  if (filters) {
    if (filters.min_rating) {
      candidates = candidates.filter((p) => (p.average_rating || 0) >= (filters.min_rating ?? 0));
    }
    if (filters.in_stock_only) {
      candidates = candidates.filter((p) => (p.stock_quantity ?? 0) > 0);
    }
    if (filters.price_min) {
      candidates = candidates.filter((p) => parsePriceNumber(p) >= (filters.price_min ?? 0));
    }
    if (filters.price_max) {
      candidates = candidates.filter((p) => parsePriceNumber(p) <= (filters.price_max ?? 99999999));
    }
  }

  // 6. Deduplicate candidates
  const seenIds = new Set<string>();
  const combined: ProductSummary[] = [];

  for (const p of candidates) {
    if (p && p.id && !seenIds.has(p.id)) {
      seenIds.add(p.id);
      combined.push(p);
    }
  }

  // 7. Sorting rules
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

  const limit = section.display_limit || 6;
  return combined.slice(0, limit);
}

export const homepageApi = {
  getData: async (): Promise<HomepageData> => {
    const realProducts = await fetchRealBackendProducts();

    try {
      const { data } = await apiClient.get('/api/v1/homepage/');
      if (data && data.sections && data.sections.length > 0) {
        return data;
      }
    } catch {
      // Expected when backend has no dedicated /homepage/ endpoint
    }

    const rawSections = getMockSections();
    const sections = rawSections
      .filter((s) => s.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((s) => {
        const populatedProducts = populateProductsForSection(s, realProducts);

        let vendors = s.vendors;
        if (s.key === 'TOP_VENDORS' && realProducts.length > 0) {
          const realVendorsMap = new Map<string, any>();
          realProducts.forEach((rp) => {
            if (rp.vendor_name && rp.vendor_name !== 'Verified Vendor') {
              const vId = typeof rp.vendor === 'object' ? rp.vendor.id : rp.vendor || rp.vendor_name;
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
    } catch {
      return getMockSections().map((s) => ({
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

export function getCachedHomepageSections(): HomepageSection[] {
  const isExcluded = (s: HomepageSection) =>
    s.key === 'FEATURED_CATEGORIES' ||
    s.key === 'TOP_VENDORS' ||
    s.configuration?.layout === 'VENDOR_GRID' ||
    s.configuration?.layout === 'CATEGORY_GRID' ||
    s.configuration?.layout === 'CATEGORY_CIRCLES' ||
    s.configuration?.layout === 'CATEGORY_PILLS' ||
    s.configuration?.layout === 'BRAND_GRID';

  try {
    const cached = localStorage.getItem('dovi_cached_homepage_sections');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .filter((s: HomepageSection) => s.is_active && !isExcluded(s))
          .map((s: HomepageSection) => ({
            ...s,
            products: (s.products || []).filter((p: any) => p && !String(p.id).startsWith('prod-')),
          }));
      }
    }
  } catch {}

  try {
    let cachedReal: ProductSummary[] = [];
    try {
      const fromSession = sessionStorage.getItem('dovi_real_products_cache');
      if (fromSession) cachedReal = JSON.parse(fromSession);
    } catch {}
    if (!cachedReal || cachedReal.length === 0) {
      try {
        const fromLocal = localStorage.getItem('dovi_real_products_cache');
        if (fromLocal) cachedReal = JSON.parse(fromLocal);
      } catch {}
    }
    if (!cachedReal || cachedReal.length === 0) {
      cachedReal = SEED_REAL_PRODUCTS;
    }

    const cleanReal = (cachedReal || []).filter((p: any) => p && !String(p.id).startsWith('prod-'));
    const rawSections = getMockSections();
    return rawSections
      .filter((s) => s.is_active && !isExcluded(s))
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((s) => ({
        ...s,
        products: populateProductsForSection(s, cleanReal),
      }));
  } catch {
    return [];
  }
}
