/**
 * Universal defensive product image resolver for DOVI 2.0 (Admin).
 * Strictly avoids showing unrelated third-party products.
 */

// In-memory cache for immediately uploaded product photos
const localPreviewCache = new Map<string, string>();

export function clearLocalProductImage(productId: string): void {
  if (!productId) return;
  localPreviewCache.delete(productId);
  try {
    sessionStorage.removeItem(`dovi_thumb_${productId}`);
  } catch {}
}

export function cacheLocalProductImage(productId: string, previewUrl: string): void {
  if (!productId || !previewUrl) return;
  if (previewUrl.startsWith('blob:') || previewUrl.startsWith('data:')) {
    return;
  }
  const normalized = normalizeUrl(previewUrl) || previewUrl;
  localPreviewCache.set(productId, normalized);
  try {
    sessionStorage.setItem(`dovi_thumb_${productId}`, normalized);
  } catch {}
}

export function getCachedLocalProductImage(productId: string): string | null {
  if (!productId) return null;
  const inMem = localPreviewCache.get(productId);
  if (inMem) {
    if (inMem.startsWith('blob:') || inMem.startsWith('data:')) {
      localPreviewCache.delete(productId);
    } else {
      return inMem;
    }
  }
  try {
    const saved = sessionStorage.getItem(`dovi_thumb_${productId}`);
    if (saved) {
      if (saved.startsWith('blob:') || saved.startsWith('data:')) {
        sessionStorage.removeItem(`dovi_thumb_${productId}`);
      } else {
        localPreviewCache.set(productId, saved);
        return saved;
      }
    }
  } catch {}
  return null;
}

export const CLEAN_PRODUCT_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' width='100%25' height='100%25'%3E%3Crect width='200' height='200' fill='%23f8fafc'/%3E%3Cpath d='M60 70 L100 50 L140 70 L140 130 L100 150 L60 130 Z' fill='none' stroke='%23cbd5e1' stroke-width='6' stroke-linejoin='round'/%3E%3Cpath d='M100 50 L100 150 M60 70 L100 95 L140 70' fill='none' stroke='%23cbd5e1' stroke-width='6' stroke-linejoin='round'/%3E%3Ctext x='100' y='175' font-family='sans-serif' font-size='12' font-weight='700' fill='%2394a3b8' text-anchor='middle'%3EDOVI%3C/text%3E%3C/svg%3E";

export function getProductFallbackImage(_product?: any): string {
  return CLEAN_PRODUCT_PLACEHOLDER;
}

export function normalizeUrl(url: any): string | null {
  if (!url) return null;

  if (typeof url === 'object') {
    url = url.thumbnail_url || url.image_url || url.url || url.file || url.src || null;
  }

  if (typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;

  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  const isPresigned = /[?&](X-Amz-|AWSAccessKeyId=|Signature=)/i.test(trimmed);
  const r2PublicDomain = import.meta.env.VITE_R2_PUBLIC_DOMAIN || 'pub-bea1ef75b06a40ca80bc2e2ce5c71fef.r2.dev';
  const cleanHost = r2PublicDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '');

  if (trimmed.includes('.r2.cloudflarestorage.com/')) {
    const parts = trimmed.split('.r2.cloudflarestorage.com/');
    if (parts[1]) {
      const cleanPath = parts[1].split('?')[0].replace(/^[^/]+\//, '');
      return `https://${cleanHost}/${cleanPath.replace(/^\/+/, '')}`;
    }
  }

  if (/s3[.-][a-z0-9-]+\.amazonaws\.com/i.test(trimmed) || /s3\.amazonaws\.com/i.test(trimmed)) {
    const withoutQuery = trimmed.split('?')[0];
    const pathMatch = withoutQuery.match(/(?:dovi-media\/)?(product-images\/.+)$/i);
    if (pathMatch && pathMatch[1]) {
      return `https://${cleanHost}/${pathMatch[1]}`;
    }
  }

  if (trimmed.includes(cleanHost) || /pub-[a-z0-9]+\.r2\.dev/i.test(trimmed)) {
    return trimmed.split('?')[0];
  }

  if (trimmed.startsWith('product-images/') || trimmed.startsWith('/product-images/')) {
    const clean = trimmed.split('?')[0].replace(/^\/+/, '');
    return `https://${cleanHost}/${clean}`;
  }
  if (trimmed.startsWith('dovi-media/product-images/') || trimmed.startsWith('/dovi-media/product-images/')) {
    const clean = trimmed.split('?')[0].replace(/^\/+/, '').replace(/^dovi-media\//, '');
    return `https://${cleanHost}/${clean}`;
  }

  if (trimmed.startsWith('/logo.jpg') || trimmed.startsWith('/assets/') || trimmed.startsWith('/favicon.')) {
    return trimmed;
  }

  if (/^(https?:|\/\/)/i.test(trimmed)) {
    const normalizedUrl = trimmed.startsWith('//') ? `https:${trimmed}` : trimmed;
    return isPresigned ? normalizedUrl.split('?')[0] : normalizedUrl;
  }

  const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
  if (apiBase) {
    const clean = isPresigned ? trimmed.split('?')[0] : trimmed;
    return clean.startsWith('/') ? `${apiBase}${clean}` : `${apiBase}/${clean}`;
  }

  return isPresigned ? trimmed.split('?')[0] : trimmed;
}

export function getProductImageUrl(product?: any, fallbackUrl: string = CLEAN_PRODUCT_PLACEHOLDER): string {
  if (!product) return fallbackUrl;

  const primaryUrl = normalizeUrl(product.primary_image_url);
  if (primaryUrl) return primaryUrl;

  if (product.primary_image && typeof product.primary_image === 'object') {
    const fromObj =
      normalizeUrl(product.primary_image.thumbnail_url) ||
      normalizeUrl(product.primary_image.image_url) ||
      normalizeUrl(product.primary_image.url) ||
      normalizeUrl(product.primary_image.image) ||
      normalizeUrl(product.primary_image.file);
    if (fromObj) return fromObj;
  }

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

  const productId = product.id || product.uuid || product.reference_code || product.product_id;
  if (productId) {
    const cached = getCachedLocalProductImage(productId);
    if (cached) return cached;
  }

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

  const flatUrl =
    normalizeUrl(product.image_url) ||
    normalizeUrl(product.image) ||
    normalizeUrl(product.thumbnail) ||
    normalizeUrl(product.thumbnail_url) ||
    normalizeUrl(product.cover_image) ||
    normalizeUrl(product.featured_image);

  if (flatUrl) return flatUrl;

  return fallbackUrl;
}
