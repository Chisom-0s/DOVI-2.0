/**
 * Robust, defensive currency and price formatter for Nigerian Naira (NGN).
 * Handles:
 * - String numbers ("1550000.00", "580000")
 * - Formatted strings with commas ("1,550,000")
 * - Direct numbers (1550000)
 * - Full Product, ProductSummary, or Variant objects ({ base_price, price_override, price, variants })
 * - Undefined, null, empty strings, and NaN gracefully (returning "Price unavailable" or fallback)
 */

export function formatPrice(val: unknown, fallback: string = 'Price unavailable'): string {
  if (val === undefined || val === null || val === '') {
    return fallback;
  }

  // If a product/variant object was passed
  if (typeof val === 'object' && val !== null) {
    const obj = val as Record<string, any>;
    const extracted =
      (obj.price_override && String(obj.price_override).trim() !== '' ? obj.price_override : null) ??
      (obj.base_price && String(obj.base_price).trim() !== '' ? obj.base_price : null) ??
      (obj.price && String(obj.price).trim() !== '' ? obj.price : null) ??
      (Array.isArray(obj.variants) && obj.variants[0]
        ? (obj.variants[0].price_override || obj.variants[0].price || obj.base_price)
        : null);
    if (extracted === null || extracted === undefined) {
      return fallback;
    }
    return formatPrice(extracted, fallback);
  }

  let num: number;
  if (typeof val === 'number') {
    num = val;
  } else if (typeof val === 'string') {
    // Strip any existing currency symbols, commas, or spaces
    const cleaned = val.replace(/[^0-9.-]+/g, '');
    num = parseFloat(cleaned);
  } else {
    num = Number(val);
  }

  if (isNaN(num) || !isFinite(num)) {
    return fallback;
  }

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function parsePriceNumber(val: unknown): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val === 'object' && val !== null) {
    const obj = val as Record<string, any>;
    const extracted =
      (obj.price_override && String(obj.price_override).trim() !== '' ? obj.price_override : null) ??
      (obj.base_price && String(obj.base_price).trim() !== '' ? obj.base_price : null) ??
      (obj.price && String(obj.price).trim() !== '' ? obj.price : null) ??
      (Array.isArray(obj.variants) && obj.variants[0]
        ? (obj.variants[0].price_override || obj.variants[0].price || obj.base_price)
        : null);
    return parsePriceNumber(extracted);
  }
  const cleaned = String(val).replace(/[^0-9.-]+/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}
