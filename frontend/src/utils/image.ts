/**
 * Universal defensive product image resolver for DOVI 2.0.
 * Safely extracts primary thumbnail or full image across all API serializer variations.
 */
export function getProductImageUrl(product?: any): string {
  if (!product) return '/logo.jpg?v=2';

  // 1. Direct primary_image_url field
  if (product.primary_image_url && typeof product.primary_image_url === 'string' && product.primary_image_url.trim()) {
    return product.primary_image_url;
  }

  // 2. Nested images array (with is_primary check or first available)
  if (Array.isArray(product.images) && product.images.length > 0) {
    const primary = product.images.find((img: any) => img.is_primary) || product.images[0];
    if (primary) {
      const url = primary.thumbnail_url || primary.image_url || primary.url;
      if (url && typeof url === 'string' && url.trim()) {
        return url;
      }
    }
  }

  // 3. Variant level image
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    const variantWithImg = product.variants.find((v: any) => v.image_url);
    if (variantWithImg?.image_url && typeof variantWithImg.image_url === 'string') {
      return variantWithImg.image_url;
    }
  }

  // 4. Legacy / flat image_url or image property
  if (product.image_url && typeof product.image_url === 'string' && product.image_url.trim()) {
    return product.image_url;
  }

  if (product.image && typeof product.image === 'string' && product.image.trim()) {
    return product.image;
  }

  return '/logo.jpg?v=2';
}
