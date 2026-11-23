const fs = require('fs');

let code = fs.readFileSync('frontend/src/services/homepagePlacementService.ts', 'utf8');
code = code.replace(/\r\n/g, '\n');

const targetFunc = `export function isDiscountActiveNow(discount?: DiscountConfig | null, asOfDate: Date = new Date()): boolean {`;

const addition = `export interface ProductSellingPriceResult {
  sellingPrice: number;
  originalPrice: number | null;
  isDiscountActive: boolean;
  discountPrice: number | null;
  discountPercent: number | null;
}

/**
 * Authoritative single source of truth for product selling prices across DOVI.
 * Evaluates active promotions, Deals & Discounts configs, and normal base prices.
 */
export function resolveProductSellingPrice(product: any): ProductSellingPriceResult {
  if (!product) {
    return {
      sellingPrice: 0,
      originalPrice: null,
      isDiscountActive: false,
      discountPrice: null,
      discountPercent: null,
    };
  }

  const basePriceNum = parseFloat(String(product.base_price ?? product.price ?? 0)) || 0;
  const placement = getProductHomepagePlacement(product);

  if (placement?.discount_config && isDiscountActiveNow(placement.discount_config)) {
    const discPrice = Number(placement.discount_config.discount_price);
    const origPrice =
      placement.discount_config.original_price != null && Number(placement.discount_config.original_price) > 0
        ? Number(placement.discount_config.original_price)
        : basePriceNum;

    if (discPrice > 0 && (origPrice <= 0 || discPrice < origPrice)) {
      const discountPercent = origPrice > 0 ? Math.round(((origPrice - discPrice) / origPrice) * 100) : null;
      return {
        sellingPrice: discPrice,
        originalPrice: origPrice,
        isDiscountActive: true,
        discountPrice: discPrice,
        discountPercent,
      };
    }
  }

  const prodOrig = product.original_price ? Number(product.original_price) : null;
  return {
    sellingPrice: basePriceNum,
    originalPrice: prodOrig && prodOrig > basePriceNum ? prodOrig : null,
    isDiscountActive: false,
    discountPrice: null,
    discountPercent: null,
  };
}

export function isDiscountActiveNow(discount?: DiscountConfig | null, asOfDate: Date = new Date()): boolean {`;

if (code.includes(targetFunc)) {
  code = code.replace(targetFunc, addition);
  fs.writeFileSync('frontend/src/services/homepagePlacementService.ts', code, 'utf8');
  console.log('Added resolveProductSellingPrice to homepagePlacementService.ts');
} else {
  console.error('Target function not found in homepagePlacementService.ts');
}
