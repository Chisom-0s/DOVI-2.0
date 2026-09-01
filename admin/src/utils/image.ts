/**
 * Universal defensive product image resolver for DOVI 2.0 Admin.
 */
export function getProductImageUrl(product?: any): string {
  if (!product) return '/logo.jpg?v=2';

  if (product.primary_image_url && typeof product.primary_image_url === 'string' && product.primary_image_url.trim()) {
    return product.primary_image_url;
  }

  if (Array.isArray(product.images) && product.images.length > 0) {
    const primary = product.images.find((img: any) => img.is_primary) || product.images[0];
    if (primary) {
      const url = primary.thumbnail_url || primary.image_url || primary.url;
      if (url && typeof url === 'string' && url.trim()) {
        return url;
      }
    }
  }

  if (Array.isArray(product.variants) && product.variants.length > 0) {
    const variantWithImg = product.variants.find((v: any) => v.image_url);
    if (variantWithImg?.image_url && typeof variantWithImg.image_url === 'string') {
      return variantWithImg.image_url;
    }
  }

  if (product.image_url && typeof product.image_url === 'string' && product.image_url.trim()) {
    return product.image_url;
  }

  if (product.image && typeof product.image === 'string' && product.image.trim()) {
    return product.image;
  }

  return '/logo.jpg?v=2';
}
