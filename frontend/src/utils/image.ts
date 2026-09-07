/**
 * Universal defensive product image resolver for DOVI 2.0.
 * Safely extracts primary thumbnail or full image across all API serializer variations,
 * resolves relative backend media URLs, handles Cloudflare R2 public URL rewriting,
 * and provides high-fidelity category fallback imagery when storage is offline or unauthenticated.
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
  // NEVER cache ephemeral blob URLs in session storage:
  // Blob URLs are revoked on modal close and invalid across sessions.
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
        // Clean up any stale or corrupt blob URL
        sessionStorage.removeItem(`dovi_thumb_${productId}`);
      } else {
        localPreviewCache.set(productId, saved);
        return saved;
      }
    }
  } catch {}
  return null;
}

/**
 * Curated high-resolution contextual fallback images.
 * Prevents the repetitive company logo display when external image storage is unavailable or misconfigured.
 */
const CATEGORY_FALLBACKS: Record<string, string> = {
  phone: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80',
  smartphone: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80',
  headphone: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
  audio: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
  laptop: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
  computer: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
  tablet: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80',
  ipad: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80',
  watch: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
  camera: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
  fashion: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80',
  default: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80',
};

export function getProductFallbackImage(product?: any): string {
  if (!product) return CATEGORY_FALLBACKS.default;

  const targetStr = `${product.name || ''} ${product.category_name || ''} ${typeof product.category === 'string' ? product.category : product.category?.name || ''} ${product.description || ''}`.toLowerCase();

  if (targetStr.includes('headphone') || targetStr.includes('sony') || targetStr.includes('audio') || targetStr.includes('earbud') || targetStr.includes('airpod')) {
    return CATEGORY_FALLBACKS.headphone;
  }
  if (targetStr.includes('ipad') || targetStr.includes('tablet')) {
    return CATEGORY_FALLBACKS.tablet;
  }
  if (targetStr.includes('macbook') || targetStr.includes('laptop') || targetStr.includes('computer') || targetStr.includes('pc')) {
    return CATEGORY_FALLBACKS.laptop;
  }
  if (targetStr.includes('watch') || targetStr.includes('wearable')) {
    return CATEGORY_FALLBACKS.watch;
  }
  if (targetStr.includes('camera') || targetStr.includes('photo')) {
    return CATEGORY_FALLBACKS.camera;
  }
  if (targetStr.includes('phone') || targetStr.includes('iphone') || targetStr.includes('smartphone') || targetStr.includes('screenshot') || targetStr.includes('samsung')) {
    return CATEGORY_FALLBACKS.smartphone;
  }
  if (targetStr.includes('shirt') || targetStr.includes('cloth') || targetStr.includes('shoe') || targetStr.includes('fashion')) {
    return CATEGORY_FALLBACKS.fashion;
  }

  return CATEGORY_FALLBACKS.default;
}

export function normalizeUrl(url: any): string | null {
  if (!url) return null;

  // Handle object inputs (e.g. { thumbnail_url, image_url, url, file, src })
  if (typeof url === 'object') {
    url = url.thumbnail_url || url.image_url || url.url || url.file || url.src || null;
  }

  if (typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;

  // Keep local blob and data URLs intact
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  // Detect presigned query strings (?X-Amz-... or ?AWSAccessKeyId=... or ?Signature=...)
  const isPresigned = /[?&](X-Amz-|AWSAccessKeyId=|Signature=)/i.test(trimmed);

  // If a public R2 domain is configured via env (e.g. pub-xxxx.r2.dev or media.dovi.ng), rewrite private R2 S3 endpoints.
  // Defaults defensively to known public bucket domain to prevent failed private S3 requests.
  const r2PublicDomain = import.meta.env.VITE_R2_PUBLIC_DOMAIN || 'pub-bea1ef75b06a40ca80bc2e2ce5c71fef.r2.dev';
  const cleanHost = r2PublicDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '');

  // 1. Handle private Cloudflare R2 S3 endpoints
  if (trimmed.includes('.r2.cloudflarestorage.com/')) {
    const parts = trimmed.split('.r2.cloudflarestorage.com/');
    if (parts[1]) {
      const cleanPath = parts[1].split('?')[0].replace(/^[^/]+\//, ''); // removes bucket prefix like 'dovi-media/'
      return `https://${cleanHost}/${cleanPath.replace(/^\/+/, '')}`;
    }
  }

  // 2. Handle legacy AWS S3 endpoints (e.g. dovi-media.s3.amazonaws.com or s3.amazonaws.com/dovi-media)
  if (/s3[.-][a-z0-9-]+\.amazonaws\.com/i.test(trimmed) || /s3\.amazonaws\.com/i.test(trimmed)) {
    const withoutQuery = trimmed.split('?')[0];
    const pathMatch = withoutQuery.match(/(?:dovi-media\/)?(product-images\/.+)$/i);
    if (pathMatch && pathMatch[1]) {
      return `https://${cleanHost}/${pathMatch[1]}`;
    }
  }

  // 3. Handle already public R2 dev domains or custom CDN domains with presigned query params
  if (trimmed.includes(cleanHost) || /pub-[a-z0-9]+\.r2\.dev/i.test(trimmed)) {
    return trimmed.split('?')[0];
  }

  // 4. Handle direct storage key paths
  if (trimmed.startsWith('product-images/') || trimmed.startsWith('/product-images/')) {
    const clean = trimmed.split('?')[0].replace(/^\/+/, '');
    return `https://${cleanHost}/${clean}`;
  }
  if (trimmed.startsWith('dovi-media/product-images/') || trimmed.startsWith('/dovi-media/product-images/')) {
    const clean = trimmed.split('?')[0].replace(/^\/+/, '').replace(/^dovi-media\//, '');
    return `https://${cleanHost}/${clean}`;
  }

  // 5. If it's a frontend static asset
  if (trimmed.startsWith('/logo.jpg') || trimmed.startsWith('/assets/') || trimmed.startsWith('/favicon.')) {
    return trimmed;
  }

  // 6. If it's another absolute URL, strip presigned query params if present
  if (/^(https?:|\/\/)/i.test(trimmed)) {
    const normalizedUrl = trimmed.startsWith('//') ? `https:${trimmed}` : trimmed;
    return isPresigned ? normalizedUrl.split('?')[0] : normalizedUrl;
  }

  // 7. Prepend backend API URL if relative media/static path
  const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
  if (apiBase) {
    const clean = isPresigned ? trimmed.split('?')[0] : trimmed;
    return clean.startsWith('/') ? `${apiBase}${clean}` : `${apiBase}/${clean}`;
  }

  return isPresigned ? trimmed.split('?')[0] : trimmed;
}

export function getProductImageUrl(product?: any): string {
  if (!product) return CATEGORY_FALLBACKS.default;

  // 1. Direct primary_image_url field from backend (top priority)
  const primaryUrl = normalizeUrl(product.primary_image_url);
  if (primaryUrl) return primaryUrl;

  // 2. Direct primary_image object from backend
  if (product.primary_image && typeof product.primary_image === 'object') {
    const fromObj =
      normalizeUrl(product.primary_image.thumbnail_url) ||
      normalizeUrl(product.primary_image.image_url) ||
      normalizeUrl(product.primary_image.url) ||
      normalizeUrl(product.primary_image.image) ||
      normalizeUrl(product.primary_image.file);
    if (fromObj) return fromObj;
  }

  // 3. Nested images array from backend (with is_primary check or first available)
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

  // 4. Check for locally cached uploaded image (only if backend has not provided one yet)
  const productId = product.id || product.uuid || product.reference_code;
  if (productId) {
    const cached = getCachedLocalProductImage(productId);
    if (cached) return cached;
  }

  // 5. Variant level image
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

  // 6. Legacy / flat image, image_url, thumbnail, or cover_image properties
  const flatUrl =
    normalizeUrl(product.image_url) ||
    normalizeUrl(product.image) ||
    normalizeUrl(product.thumbnail) ||
    normalizeUrl(product.thumbnail_url) ||
    normalizeUrl(product.cover_image) ||
    normalizeUrl(product.featured_image);

  if (flatUrl) return flatUrl;

  // 7. Graceful category-based fallback
  return getProductFallbackImage(product);
}
