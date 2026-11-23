// Homepage API — /api/v1/homepage/*
import apiClient from './client';
import { SEED_RAW_PRODUCTS } from './seedProducts';
import { parsePriceNumber } from '@/utils/currency';
import { normalizeUrl } from '@/utils/image';
import { enrichProductWithDelivery } from '@/services/deliveryPricingService';
import { enrichProductWithCategory } from '@/services/categoryService';
import {
  getProductHomepagePlacement,
  isDiscountActiveNow,
  syncHomepagePlacementsFromServer,
  listMerchandisingSections,
  DEFAULT_CORE_SECTIONS,
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
    display_limit: 24,
    configuration: {
      layout: 'PRODUCT_GRID',
      source: 'AUTOMATIC',
      cta_text: 'View All',
      cta_url: '/products?section=best-sellers',
    },
    config: {},
  },
  {
    id: 'sec-discounts',
    name: 'Deals & Discounts',
    key: 'DISCOUNTS',
    title: 'Deals & Discounts',
    subtitle: 'Exclusive markdowns and limited-time discounts',
    is_active: true,
    visible: true,
    sort_order: 2,
    display_order: 2,
    display_limit: 24,
    configuration: {
      layout: 'HORIZONTAL_CAROUSEL',
      source: 'AUTOMATIC',
      cta_text: 'View All',
      cta_url: '/products?section=deals-and-discounts',
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
    sort_order: 3,
    display_order: 3,
    display_limit: 24,
    configuration: {
      layout: 'HORIZONTAL_CAROUSEL',
      source: 'AUTOMATIC',
      cta_text: 'View All',
      cta_url: '/products?section=trending',
    },
    config: {},
  },
  {
    id: 'sec-special-promo',
    name: 'Save2Own',
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
    id: 'sec-new-arrivals',
    name: 'New Arrivals',
    key: 'NEW_ARRIVALS',
    title: 'New Arrivals',
    subtitle: 'Freshly added to the catalog',
    is_active: true,
    visible: true,
    sort_order: 5,
    display_order: 5,
    display_limit: 24,
    configuration: {
      layout: 'PRODUCT_GRID',
      source: 'AUTOMATIC',
      cta_text: 'View All',
      cta_url: '/products?section=new-arrivals',
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
    sort_order: 6,
    display_order: 6,
    display_limit: 24,
    configuration: {
      layout: 'HORIZONTAL_CAROUSEL',
      source: 'AUTOMATIC',
      cta_text: 'View All',
      cta_url: '/products?section=hot-sales',
    },
    config: {},
  },
  {
    id: 'sec-featured',
    name: 'Featured Products',
    key: 'FEATURED_PRODUCTS',
    title: 'Featured Products',
    subtitle: 'Hand-picked essentials curated for you',
    is_active: true,
    visible: true,
    sort_order: 7,
    display_order: 7,
    display_limit: 24,
    configuration: {
      layout: 'PRODUCT_GRID',
      source: 'AUTOMATIC',
      cta_text: 'View All',
      cta_url: '/products?section=featured',
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
        rating: 0,
        review_count: 0,
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

  // Authoritative Admin-controlled Homepage Placement & Discount configuration
  const placement = getProductHomepagePlacement({ id: p.id, description: p.description });
  const isBestSeller = Boolean(placement ? placement.is_best_seller : p.is_best_seller);
  const isTrending = Boolean(placement ? placement.is_trending : p.is_trending);
  const isHotSale = Boolean(placement ? placement.is_hot_sale : p.is_hot_sale);
  const isNewArrival = Boolean(placement ? placement.is_new_arrival : p.is_new_arrival);
  const isFeatured = Boolean(placement ? placement.is_featured : (p as any).is_featured);

  // Deals & Discounts is the ONLY section responsible for product discounts across DOVI.
  const discountConfig = placement?.discount_config ?? p.discount_config ?? null;
  const isDiscountActive = isDiscountActiveNow(discountConfig);
  const isDiscount = Boolean((placement ? placement.is_discount : (p as any).is_discount) && isDiscountActive);

  let finalPrice = priceStr;
  let finalOriginalPrice: string | null = p.original_price != null ? String(p.original_price) : null;
  let finalDiscount = Number(p.discount_percentage) || 0;

  if (isDiscount && discountConfig?.discount_price) {
    finalPrice = String(discountConfig.discount_price);
    finalOriginalPrice = discountConfig.original_price ? String(discountConfig.original_price) : priceStr;
    const origNum = Number(finalOriginalPrice) || Number(priceStr);
    if (origNum > discountConfig.discount_price) {
      finalDiscount = Math.round(((origNum - discountConfig.discount_price) / origNum) * 100);
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
    average_rating: Number(p.average_rating) || 0,
    review_count: Number(p.review_count) || (p.reviews ? p.reviews.length : 0),
    stock_quantity: stock,
    status: (p.status || 'PUBLISHED') as any,
    discount_percentage: finalDiscount,
    is_flash_deal: false,
    flash_sale: null,
    is_discount: isDiscount,
    discount_config: discountConfig,
    is_trending: isTrending,
    is_best_seller: isBestSeller,
    is_hot_sale: isHotSale,
    is_new_arrival: isNewArrival,
    is_featured: isFeatured,
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
  await syncHomepagePlacementsFromServer().catch(() => { });
  let deletedIds: string[] = [];
  try {
    deletedIds = JSON.parse(localStorage.getItem('dovi_deleted_product_ids') || '[]');
  } catch { }

  const filterActive = (list: ProductSummary[]) =>
    list
      .filter((p) => !deletedIds.includes(p.id) && p.status !== 'ARCHIVED' && p.status !== 'DELETED')
      .map((p) => enrichProductWithDelivery(p));

  try {
    const allRaw: any[] = [];
    let page = 1;
    let hasMore = true;

    // Fetch products in safe batches across pages (avoids 502 crash on single large page_size)
    while (hasMore && page <= 10) {
      try {
        const { data } = await apiClient.get('/api/v1/products/', { params: { page, page_size: 24 } });
        const rawList: any[] = Array.isArray(data) ? data : data?.results || [];
        if (rawList && rawList.length > 0) {
          allRaw.push(...rawList);
        }
        const totalCount = typeof data?.count === 'number' ? data.count : allRaw.length;
        if (!data?.next || allRaw.length >= totalCount || rawList.length === 0) {
          hasMore = false;
        } else {
          page++;
        }
      } catch (pageErr) {
        // Stop pagination on error, preserve products retrieved so far
        hasMore = false;
      }
    }

    if (allRaw && allRaw.length > 0) {
      const seen = new Set<string>();
      const uniqueRaw: any[] = [];
      for (const p of allRaw) {
        if (p && p.id && !seen.has(p.id)) {
          seen.add(p.id);
          uniqueRaw.push(p);
        }
      }

      const normalized = uniqueRaw
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
  if (!data || data === '[]' || !data.includes('sec-new-arrivals') || data.includes('sec-flash-deals')) {
    localStorage.setItem('dovi_homepage_sections_db', JSON.stringify(SEED_SECTIONS));
    sections = SEED_SECTIONS;
  } else {
    try {
      sections = JSON.parse(data);
    } catch {
      sections = SEED_SECTIONS;
    }
  }
  const CANONICAL_ORDER_RANK: Record<string, number> = {
    BEST_SELLERS: 1,
    'sec-best-sellers': 1,
    DISCOUNTS: 2,
    DEALS_AND_DISCOUNTS: 2,
    'sec-discounts': 2,
    TRENDING_NOW: 3,
    TRENDING: 3,
    'sec-trending': 3,
    SPECIAL_PROMO: 4,
    SAVE2OWN: 4,
    'sec-special-promo': 4,
    NEW_ARRIVALS: 5,
    'sec-new-arrivals': 5,
    HOT_SALES: 6,
    'sec-hot-sales': 6,
    FEATURED_PRODUCTS: 7,
    FEATURED: 7,
    'sec-featured': 7,
  };

  return sections
    .filter(
      (s) =>
        s.key !== 'FLASH_DEALS' &&
        s.id !== 'sec-flash-deals' &&
        s.key !== 'FEATURED_CATEGORIES' &&
        s.key !== 'TOP_VENDORS' &&
        s.configuration?.layout !== 'VENDOR_GRID' &&
        s.configuration?.layout !== 'CATEGORY_GRID' &&
        s.configuration?.layout !== 'CATEGORY_CIRCLES' &&
        s.configuration?.layout !== 'CATEGORY_PILLS' &&
        s.configuration?.layout !== 'BRAND_GRID'
    )
    .map((s) => {
      const rank = CANONICAL_ORDER_RANK[s.key] || CANONICAL_ORDER_RANK[s.id] || s.sort_order || 99;
      if (s.key === 'DISCOUNTS' || s.id === 'sec-discounts') {
        return {
          ...s,
          name: 'Deals & Discounts',
          title: 'Deals & Discounts',
          sort_order: 2,
          display_order: 2,
        };
      }
      return {
        ...s,
        sort_order: rank,
        display_order: rank,
      };
    })
    .sort((a, b) => (CANONICAL_ORDER_RANK[a.key] || a.sort_order || 99) - (CANONICAL_ORDER_RANK[b.key] || b.sort_order || 99));
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
      let effectiveBestIds = [...orderedIds];
      if (effectiveBestIds.length === 0) {
        const defaultBestSec = DEFAULT_CORE_SECTIONS.find((s) => s.key === 'BEST_SELLERS');
        if (defaultBestSec?.product_ids && defaultBestSec.product_ids.length > 0) {
          effectiveBestIds = [...defaultBestSec.product_ids];
        }
      }

      candidates = realProducts.filter(
        (p) => (Boolean(p.is_best_seller) || effectiveBestIds.includes(p.id)) &&
          (p.status === 'ACTIVE' || (p.status as any) === 'PUBLISHED') &&
          p.in_stock !== false
      );
      break;
    }

    case 'DISCOUNTS':
    case 'DEALS_AND_DISCOUNTS': {
      candidates = realProducts.filter(
        (p) => (Boolean((p as any).is_discount) || orderedIds.includes(p.id)) &&
          isDiscountActiveNow((p as any).discount_config) &&
          (p.status === 'ACTIVE' || (p.status as any) === 'PUBLISHED') &&
          p.in_stock !== false
      );
      if (candidates.length === 0 && orderedIds.length > 0) {
        candidates = realProducts.filter(
          (p) => orderedIds.includes(p.id) &&
            (p.status === 'ACTIVE' || (p.status as any) === 'PUBLISHED') &&
            p.in_stock !== false
        );
      }
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
        (p) => (Boolean(p.is_new_arrival) || orderedIds.includes(p.id) || !p.created_at || (Date.now() - new Date(p.created_at).getTime() < 60 * 24 * 3600 * 1000)) &&
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

    case 'FEATURED_PRODUCTS':
    case 'FEATURED': {
      candidates = realProducts.filter(
        (p) => (Boolean(p.is_featured) || orderedIds.includes(p.id)) &&
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

  // Respect admin configured display_limit if set, otherwise return all eligible candidates without an arbitrary 24 cap
  const limit = mSec?.display_limit ?? section.display_limit;
  return (typeof limit === 'number' && limit > 0) ? candidates.slice(0, limit) : candidates;
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
                  rating: rp.average_rating || '0.0',
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

  getCampaignProducts: async (campaignKey: string): Promise<{ campaign_key: string; banner: HomepageBanner | null; total_products: number; products: ProductSummary[] }> => {
    try {
      const { data } = await apiClient.get(`/api/v1/campaigns/${campaignKey}/products/`);
      if (data && Array.isArray(data.products)) {
        return data;
      }
    } catch { }
    return {
      campaign_key: campaignKey,
      banner: DEFAULT_HERO_BANNERS.find(b => b.campaign_key === campaignKey || b.id === campaignKey) || null,
      total_products: 0,
      products: [],
    };
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
    id: 'ban-hero-launch',
    campaign_key: 'launch',
    title: 'DOVI Launch Campaign',
    subtitle: 'Discover More, Shop Smart',
    cta_text: 'Shop Now',
    cta_url: '/promotions/launch',
    desktop_image_url: '/images/hero/hero_launch_campaign.jpg',
    mobile_image_url: '/images/hero/hero_launch_campaign.jpg',
    image_url: '/images/hero/hero_launch_campaign.jpg',
    is_active: true,
    display_order: 1,
    slide_interval_ms: 5000,
    start_date: '2026-11-20T00:00:00Z',
    end_date: '2026-12-31T23:59:59Z',
  },
  {
    id: 'ban-hero-black-friday',
    campaign_key: 'black-friday',
    title: 'Black Friday Mega Deals',
    subtitle: 'Up to 70% OFF on Selected Products',
    cta_text: 'Shop the Deals',
    cta_url: '/promotions/black-friday',
    desktop_image_url: '/images/hero/hero_black_friday.jpg',
    mobile_image_url: '/images/hero/hero_black_friday.jpg',
    image_url: '/images/hero/hero_black_friday.jpg',
    is_active: true,
    display_order: 2,
    slide_interval_ms: 5000,
    start_date: '2026-11-20T00:00:00Z',
    end_date: '2026-12-31T23:59:59Z',
  },
  {
    id: 'ban-hero-price-drops',
    campaign_key: 'price-drops',
    title: 'Price Drops',
    subtitle: 'More Value, Less Spending on Selected Products',
    cta_text: 'Shop Price Drops',
    cta_url: '/promotions/price-drops',
    desktop_image_url: '/images/hero/hero_price_drops.jpg',
    mobile_image_url: '/images/hero/hero_price_drops.jpg',
    image_url: '/images/hero/hero_price_drops.jpg',
    is_active: true,
    display_order: 3,
    slide_interval_ms: 5000,
    start_date: '2026-11-20T00:00:00Z',
    end_date: '2026-12-31T23:59:59Z',
  },
  {
    id: 'ban-hero-free-gifts',
    campaign_key: 'rewards',
    title: 'Free Gifts & Shopping Rewards',
    subtitle: 'Shop qualifying products and unlock exciting rewards!',
    cta_text: 'Claim Your Free Gift',
    cta_url: '/promotions/giveaway',
    desktop_image_url: '/images/hero/hero_free_gifts.jpg',
    mobile_image_url: '/images/hero/hero_free_gifts.jpg',
    image_url: '/images/hero/hero_free_gifts.jpg',
    is_active: true,
    display_order: 4,
    slide_interval_ms: 5000,
    start_date: '2026-11-20T00:00:00Z',
    end_date: '2026-12-31T23:59:59Z',
  },
  {
    id: 'ban-hero-limited-deals',
    campaign_key: 'limited-deals',
    title: 'Limited-Time Deals',
    subtitle: "Don't Miss Out on Special Offers - Up to 50% OFF",
    cta_text: 'Shop Limited Deals',
    cta_url: '/promotions/limited-deals',
    desktop_image_url: '/images/hero/hero_limited_deals.jpg',
    mobile_image_url: '/images/hero/hero_limited_deals.jpg',
    image_url: '/images/hero/hero_limited_deals.jpg',
    is_active: true,
    display_order: 5,
    slide_interval_ms: 5000,
    start_date: '2026-11-20T00:00:00Z',
    end_date: '2026-12-31T23:59:59Z',
  },
  {
    id: 'ban-hero-christmas-deals',
    campaign_key: 'christmas',
    title: 'Christmas Deals',
    subtitle: 'Up to 60% OFF - Festive Gifts & Luxury Items',
    cta_text: 'Shop Now',
    cta_url: '/promotions/christmas',
    desktop_image_url: '/images/hero/hero_christmas_deals.jpg',
    mobile_image_url: '/images/hero/hero_christmas_deals.jpg',
    image_url: '/images/hero/hero_christmas_deals.jpg',
    is_active: true,
    display_order: 6,
    slide_interval_ms: 5000,
    start_date: '2026-11-20T00:00:00Z',
    end_date: '2026-12-31T23:59:59Z',
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
