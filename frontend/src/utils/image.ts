/**
 * Universal defensive product image resolver for DOVI 2.0.
 * Safely extracts primary thumbnail or full image across all API serializer variations,
 * resolves relative backend media URLs, and maintains local session previews.
 */

// In-memory cache for immediately uploaded product photos
const localPreviewCache = new Map<string, string>();

export function cacheLocalProductImage(productId: string, previewUrl: string): void {
  if (!productId || !previewUrl) return;
  localPreviewCache.set(productId, previewUrl);
  try {
    sessionStorage.setItem(`dovi_thumb_${productId}`, previewUrl);
  } catch {}
}

export function getCachedLocalProductImage(productId: string): string | null {
  if (!productId) return null;
  if (localPreviewCache.has(productId)) {
    return localPreviewCache.get(productId)!;
  }
  try {
    const saved = sessionStorage.getItem(`dovi_thumb_${productId}`);
    if (saved) {
      localPreviewCache.set(productId, saved);
      return saved;
    }
  } catch {}
  return null;
}

function normalizeUrl(url?: unknown): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;

  // If a public R2 domain is configured via env (e.g. pub-xxxx.r2.dev or media.dovi.ng), rewrite private R2 S3 endpoints
  const r2PublicDomain = import.meta.env.VITE_R2_PUBLIC_DOMAIN;
  if (r2PublicDomain && trimmed.includes('.r2.cloudflarestorage.com/')) {
    const parts = trimmed.split('.r2.cloudflarestorage.com/');
    if (parts[1]) {
      // Remove bucket prefix if present
      const afterBucket = parts[1].replace(/^[^/]+\//, '');
      const cleanHost = r2PublicDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
      return `https://${cleanHost}/${afterBucket}`;
    }
  }

  // If already absolute or data / blob URL
  if (/^(https?:|\/\/|data:|blob:)/i.test(trimmed)) {
    return trimmed.startsWith('//') ? `https:${trimmed}` : trimmed;
  }

  // If it's a frontend static asset
  if (trimmed.startsWith('/logo.jpg') || trimmed.startsWith('/assets/') || trimmed.startsWith('/favicon.')) {
    return trimmed;
  }

  // Prepend backend API URL if relative media/static path
  const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
  if (apiBase) {
    return trimmed.startsWith('/') ? `${apiBase}${trimmed}` : `${apiBase}/${trimmed}`;
  }

  return trimmed;
}

export function getProductImageUrl(product?: any): string {
  if (!product) return '/logo.jpg?v=2';

  // 0. Check for locally cached upload preview (instant vendor feedback)
  const productId = product.id || product.uuid || product.reference_code;
  if (productId) {
    const cached = getCachedLocalProductImage(productId);
    if (cached) return cached;
  }

  // 1. Direct primary_image_url field
  const primaryUrl = normalizeUrl(product.primary_image_url);
  if (primaryUrl) return primaryUrl;

  // 2. Direct primary_image object
  if (product.primary_image && typeof product.primary_image === 'object') {
    const fromObj =
      normalizeUrl(product.primary_image.thumbnail_url) ||
      normalizeUrl(product.primary_image.image_url) ||
      normalizeUrl(product.primary_image.url) ||
      normalizeUrl(product.primary_image.image) ||
      normalizeUrl(product.primary_image.file);
    if (fromObj) return fromObj;
  }

  // 3. Nested images array (with is_primary check or first available)
  const imageList = Array.isArray(product.images)
    ? product.images
    : Array.isArray(product.product_images)
    ? product.product_images
    : Array.isArray(product.photos)
    ? product.photos
    : Array.isArray(product.media)
    ? product.media
    : [];

  if (imageList.length > 0) {
    const primary = imageList.find((img: any) => img && (img.is_primary === true || img.is_primary === 'true')) || imageList[0];
    if (primary) {
      if (typeof primary === 'string') {
        const fromStr = normalizeUrl(primary);
        if (fromStr) return fromStr;
      } else if (typeof primary === 'object') {
        const url =
          normalizeUrl(primary.thumbnail_url) ||
          normalizeUrl(primary.image_url) ||
          normalizeUrl(primary.url) ||
          normalizeUrl(primary.image) ||
          normalizeUrl(primary.file) ||
          normalizeUrl(primary.src) ||
          normalizeUrl(primary.original);
        if (url) return url;
      }
    }
  }

  // 4. Variant level image
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    for (const v of product.variants) {
      if (!v) continue;
      const vImg =
        normalizeUrl(v.image_url) ||
        normalizeUrl(v.thumbnail_url) ||
        normalizeUrl(v.image) ||
        (Array.isArray(v.images) && v.images.length > 0 ? normalizeUrl(typeof v.images[0] === 'string' ? v.images[0] : v.images[0]?.image_url || v.images[0]?.url) : null);
      if (vImg) return vImg;
    }
  }

  // 5. Legacy / flat image, image_url, thumbnail, or cover_image properties
  const flatUrl =
    normalizeUrl(product.image_url) ||
    normalizeUrl(product.image) ||
    normalizeUrl(product.thumbnail) ||
    normalizeUrl(product.thumbnail_url) ||
    normalizeUrl(product.cover_image) ||
    normalizeUrl(product.featured_image);

  if (flatUrl) return flatUrl;

  return '/logo.jpg?v=2';
}


