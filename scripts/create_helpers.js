const fs = require('fs');
const path = require('path');

// 1. Create toastDedupe.ts
const toastDedupeContent = `// Toast deduplication utility — prevents stacked duplicate notifications within 3.5s window
import toast, { ToastOptions } from 'react-hot-toast';

const originalError = toast.error.bind(toast);
const originalSuccess = toast.success.bind(toast);

const recentErrors = new Map<string, number>();
const DEDUPE_WINDOW_MS = 3500; // 3.5 seconds

// Wrap toast.error to deduplicate identical errors
toast.error = (message: any, options?: ToastOptions): string => {
  const text = typeof message === 'string' ? message : (message?.toString?.() || 'Error occurred');
  const key = text.trim().toLowerCase();
  const now = Date.now();
  const lastTime = recentErrors.get(key);

  if (lastTime && (now - lastTime) < DEDUPE_WINDOW_MS) {
    // Suppress duplicate within window, but return active toast id
    return options?.id || \`dedupe-\${key.slice(0, 40)}\`;
  }

  recentErrors.set(key, now);

  // Periodic cleanup of stale entries
  if (recentErrors.size > 50) {
    for (const [k, t] of recentErrors.entries()) {
      if (now - t > DEDUPE_WINDOW_MS * 2) {
        recentErrors.delete(k);
      }
    }
  }

  const toastId = options?.id || \`dedupe-\${key.slice(0, 40)}\`;
  return originalError(message, { id: toastId, ...options });
};

export default toast;
`;

const toastPath = path.join(__dirname, '..', 'frontend', 'src', 'utils', 'toastDedupe.ts');
fs.writeFileSync(toastPath, toastDedupeContent, 'utf8');
console.log('toastDedupe.ts written successfully.');

// 2. Create orderImageHelper.ts
const orderImageContent = `// Helper to resolve product thumbnail images for new and historical customer orders
import { findKnownProduct } from '@/contexts/CartContext';

export interface ResolvedItemDisplay {
  name: string;
  imageUrl: string | null;
}

export function resolveItemDisplay(item: any): ResolvedItemDisplay {
  if (!item) return { name: 'Product', imageUrl: null };

  const rawName =
    item.product?.name ||
    item.product_name ||
    item.name ||
    '';

  const rawImg =
    item.product?.primary_image_url ||
    item.product?.image_url ||
    item.image_url ||
    item.product_image_url ||
    null;

  const prodId =
    item.product_id ||
    item.productId ||
    (typeof item.product === 'object' && item.product ? item.product.id : item.product);

  const varId =
    item.variant_id ||
    item.variantId ||
    (typeof item.variant === 'object' && item.variant ? item.variant.id : item.variant);

  let finalImg = rawImg;
  let finalName = rawName;

  if (!finalImg || !finalName) {
    const matched = findKnownProduct(varId, rawName, prodId);
    if (matched) {
      if (!finalName) finalName = matched.name;
      if (!finalImg) {
        finalImg = matched.primary_image_url || matched.image_url || (Array.isArray(matched.images) ? matched.images[0] : null);
      }
    }
  }

  return {
    name: finalName || 'Product',
    imageUrl: finalImg || null,
  };
}

export function resolveOrderDisplay(order: any): {
  primaryImageUrl: string | null;
  primaryProductName: string;
  allImages: string[];
  allNames: string[];
} {
  const items = Array.isArray(order?.items) ? order.items : [];
  const resolvedItems = items.map(resolveItemDisplay);

  const allImages: string[] = [];
  const allNames: string[] = [];

  for (const ri of resolvedItems) {
    if (ri.imageUrl && !allImages.includes(ri.imageUrl)) {
      allImages.push(ri.imageUrl);
    }
    if (ri.name && !allNames.includes(ri.name)) {
      allNames.push(ri.name);
    }
  }

  // Also check existing order.product_images and order.product_names
  if (Array.isArray(order?.product_images)) {
    for (const img of order.product_images) {
      if (img && typeof img === 'string' && !allImages.includes(img)) {
        allImages.push(img);
      }
    }
  }
  if (Array.isArray(order?.product_names)) {
    for (const name of order.product_names) {
      if (name && typeof name === 'string' && !allNames.includes(name)) {
        allNames.push(name);
      }
    }
  }

  // If still no image, try catalog lookup by primary product name
  let primaryImg = allImages[0] || null;
  const primaryName = allNames[0] || (order?.reference ? \`Order #\${order.reference}\` : 'Order');

  if (!primaryImg && primaryName) {
    const matched = findKnownProduct(undefined, primaryName, undefined);
    if (matched) {
      primaryImg = matched.primary_image_url || matched.image_url || (Array.isArray(matched.images) ? matched.images[0] : null);
      if (primaryImg && !allImages.includes(primaryImg)) {
        allImages.unshift(primaryImg);
      }
    }
  }

  return {
    primaryImageUrl: primaryImg,
    primaryProductName: primaryName,
    allImages,
    allNames,
  };
}
`;

const orderImagePath = path.join(__dirname, '..', 'frontend', 'src', 'utils', 'orderImageHelper.ts');
fs.writeFileSync(orderImagePath, orderImageContent, 'utf8');
console.log('orderImageHelper.ts written successfully.');
