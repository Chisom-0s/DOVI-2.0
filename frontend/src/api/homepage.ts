// Homepage API — /api/v1/homepage/*
import apiClient from './client';
import { SEED_RAW_PRODUCTS } from './seedProducts';
import { parsePriceNumber } from '@/utils/currency';
import { normalizeUrl } from '@/utils/image';
import { enrichProductWithDelivery } from '@/services/deliveryPricingService';
import { enrichProductWithCategory } from '@/services/categoryService';
import {
  getProductHomepagePlacement,
  isFlashSaleActiveNow,
  syncHomepagePlacementsFromServer,
  listMerchandisingSections,
} from '@/services/homepagePlacementService';
import type { HomepageData, HomepageBanner, HomepageSection, ProductSummary } from '@/types';

const SEED_SECTIONS: HomepageSection[] = [
  {
    id: 'sec-best-sellers',
    name: 'Best Sellers',
    key: 'BEST_SELLERS',
    title: 'Best Sellers',
    subtitle: 'Top performing products in the catalog',
    is_active: true,
    visible: true,
    sort_order: 1,
    display_order: 1,
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
    id: 'sec-new-arrivals',
    name: 'New Arrivals',
    key: 'NEW_ARRIVALS',
    title: 'New Arrivals',
    subtitle: 'Freshly added to the catalog',
    is_active: true,
    visible: true,
    sort_order: 4,
    display_order: 4,
    display_limit: 4,
    configuration: {
      layout: 'PRODUCT_GRID',
      source: 'AUTOMATIC',
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
    id: 'sec-flash-deals',
    name: 'Flash Deals',
    key: 'FLASH_DEALS',
    title: 'Flash Sales',
    subtitle: 'Limited time offers — ending soon!',
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

  // Authoritative Admin-controlled Homepage Placement & Flash Sale configuration
  const placement = getProductHomepagePlacement({ id: p.id, description: p.description });
  const isBestSeller = Boolean(placement ? placement.is_best_seller : p.is_best_seller);
  const isTrending = Boolean(placement ? placement.is_trending : p.is_trending);
  const isHotSale = Boolean(placement ? placement.is_hot_sale : p.is_hot_sale);
  const isNewArrival = Boolean(placement ? placement.is_new_arrival : p.is_new_arrival);
  const flashSaleConfig = placement?.flash_sale ?? p.flash_sale ?? null;
  const isFlashActive = isFlashSaleActiveNow(flashSaleConfig);
  const isFlashDeal = Boolean((placement ? placement.is_flash_deal : p.is_flash_deal) && isFlashActive);

  let finalPrice = priceStr;
  let finalOriginalPrice: string | null = p.original_price != null ? String(p.original_price) : null;
  let finalDiscount = Number(p.discount_percentage) || 0;

  if (isFlashDeal && flashSaleConfig?.flash_price) {
    finalPrice = String(flashSaleConfig.flash_price);
    finalOriginalPrice = flashSaleConfig.original_price ? String(flashSaleConfig.original_price) : priceStr;
    const origNum = Number(finalOriginalPrice) || Number(priceStr);
    if (origNum > flashSaleConfig.flash_price) {
      finalDiscount = Math.round(((origNum - flashSaleConfig.flash_price) / origNum) * 100);
    }
  }

  const summary: ProductSummary = {
    id: p.id,
    name: p.name,
    description: p.description || '',
    price: finalPrice,
    base_price: finalPrice,
    original_price: finalOriginalPrice,
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
    discount_percentage: finalDiscount,
    is_flash_deal: isFlashDeal,
    flash_sale: flashSaleConfig,
    is_trending: isTrending,
    is_best_seller: isBestSeller,
    is_hot_sale: isHotSale,
    is_new_arrival: isNewArrival,
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
  await syncHomepagePlacementsFromServer().catch(() => {});
  let deletedIds: string[] = [];
  try {
    deletedIds = JSON.parse(localStorage.getItem('dovi_deleted_product_ids') || '[]');
  } catch { }

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
      } catch { }
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
  } catch { }

  // Fallback 2: localStorage (survives tab closing & browser restart)
  try {
    const cached = localStorage.getItem('dovi_real_products_cache');
    if (cached) {
      const parsed: ProductSummary[] = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return filterActive(parsed);
      }
    }
  } catch { }

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
  if (section.configuration?.layout === 'BANNER' || section.key === 'SPECIAL_PROMO') return [];

  const mSections = listMerchandisingSections();
  const mSec = mSections.find((s) => s.id === section.id || s.key === section.key);
  const orderedIds = mSec?.product_ids || section.configuration?.manual_product_ids || [];

  let candidates: ProductSummary[] = [];

  switch (section.key) {
    case 'BEST_SELLERS': {
      candidates = realProducts.filter(
        (p) => (Boolean(p.is_best_seller) || orderedIds.includes(p.id)) &&
               (p.status === 'ACTIVE' || (p.status as any) === 'PUBLISHED') &&
               p.in_stock !== false
      );
      break;
    }

    case 'TRENDING_NOW': {
      candidates = realProducts.filter(
        (p) => (Boolean(p.is_trending) || orderedIds.includes(p.id)) &&
               (p.status === 'ACTIVE' || (p.status as any) === 'PUBLISHED') &&
               p.in_stock !== false
      );
      break;
    }

    case 'NEW_ARRIVALS': {
      candidates = realProducts.filter(
        (p) => (Boolean(p.is_new_arrival) || orderedIds.includes(p.id)) &&
               (p.status === 'ACTIVE' || (p.status as any) === 'PUBLISHED') &&
               p.in_stock !== false
      );
      break;
    }

    case 'HOT_SALES': {
      candidates = realProducts.filter(
        (p) => (Boolean(p.is_hot_sale) || orderedIds.includes(p.id)) &&
               (p.status === 'ACTIVE' || (p.status as any) === 'PUBLISHED') &&
               p.in_stock !== false
      );
      break;
    }

    case 'FLASH_DEALS':
    case 'DEALS_OF_THE_DAY':
    case 'LIMITED_TIME_OFFERS': {
      candidates = realProducts.filter(
        (p) => (Boolean(p.is_flash_deal) || orderedIds.includes(p.id)) &&
               isFlashSaleActiveNow(p.flash_sale) &&
               (p.status === 'ACTIVE' || (p.status as any) === 'PUBLISHED') &&
               p.in_stock !== false
      );
      break;
    }

    case 'SAVE2OWN_FEATURED':
    case 'SAVE2OWN_PRODUCTS': {
      candidates = realProducts.filter(
        (p) => parsePriceNumber(p) >= 40000 &&
               (p.status === 'ACTIVE' || (p.status as any) === 'PUBLISHED') &&
               p.in_stock !== false
      );
      break;
    }

    default: {
      // Custom sections or manually assigned products
      const customMatches = realProducts.filter((p) => {
        const placement = getProductHomepagePlacement({ id: p.id, description: p.description });
        const hasCustom = placement?.custom_section_ids?.includes(section.id) || placement?.custom_section_ids?.includes(section.key);
        return (orderedIds.includes(p.id) || hasCustom) &&
               (p.status === 'ACTIVE' || (p.status as any) === 'PUBLISHED') &&
               p.in_stock !== false;
      });
      candidates = customMatches;
      break;
    }
  }

  // Deduplicate and order by admin sequence if orderedIds is specified
  if (orderedIds.length > 0) {
    const candidateMap = new Map(candidates.map((p) => [p.id, p]));
    const orderedCandidates: ProductSummary[] = [];
    orderedIds.forEach((id) => {
      const p = candidateMap.get(id);
      if (p) {
        orderedCandidates.push(p);
        candidateMap.delete(id);
      }
    });
    // Append remaining candidates that matched flags
    candidateMap.forEach((p) => orderedCandidates.push(p));
    candidates = orderedCandidates;
  }

  const limit = mSec?.display_limit || section.display_limit || 6;
  return candidates.slice(0, limit);
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
    } catch { }

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
    } catch { }
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
  } catch { }

  try {
    let cachedReal: ProductSummary[] = [];
    try {
      const fromSession = sessionStorage.getItem('dovi_real_products_cache');
      if (fromSession) cachedReal = JSON.parse(fromSession);
    } catch { }
    if (!cachedReal || cachedReal.length === 0) {
      try {
        const fromLocal = localStorage.getItem('dovi_real_products_cache');
        if (fromLocal) cachedReal = JSON.parse(fromLocal);
      } catch { }
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
