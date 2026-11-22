const fs = require('fs');

// 1. Update ProductDetailPage.tsx
let pdp = fs.readFileSync('frontend/src/pages/Products/Detail/ProductDetailPage.tsx', 'utf8');
pdp = pdp.replace(/\r\n/g, '\n');

// Import resolveProductSellingPrice
if (!pdp.includes('resolveProductSellingPrice')) {
  pdp = pdp.replace(
    "import { getProductHomepagePlacement, isDiscountActiveNow } from '@/services/homepagePlacementService';",
    "import { getProductHomepagePlacement, isDiscountActiveNow, resolveProductSellingPrice } from '@/services/homepagePlacementService';"
  );
}

// Update pricing calculation in render
const oldPricingCalc = `  const discountConfig = placement?.discount_config ?? (product as any).discount_config ?? null;
  const isDiscountActive = isDiscountActiveNow(discountConfig);

  const variantPrice = selectedVariant
    ? (selectedVariant.price_override || selectedVariant.price)
    : null;
  let effectivePrice: any = variantPrice || product.base_price || product.price;
  let originalPriceForDisplay: string | null = ((product as any).original_price ? formatPrice((product as any).original_price) : null);

  if (isDiscountActive && discountConfig?.discount_price && !variantPrice) {
    effectivePrice = discountConfig.discount_price;
    originalPriceForDisplay = discountConfig.original_price ? formatPrice(discountConfig.original_price) : formatPrice(product.base_price || product.price);
  }
  const displayPrice = formatPrice(effectivePrice);`;

const newPricingCalc = `  const pricing = resolveProductSellingPrice(product);
  const discountConfig = placement?.discount_config ?? (product as any).discount_config ?? null;
  const isDiscountActive = pricing.isDiscountActive || isDiscountActiveNow(discountConfig);

  const variantPrice = selectedVariant
    ? (selectedVariant.price_override || selectedVariant.price)
    : null;

  let effectivePrice: any = variantPrice || (pricing.isDiscountActive ? pricing.sellingPrice : (product.base_price || product.price));
  let originalPriceForDisplay: string | null = pricing.originalPrice
    ? formatPrice(pricing.originalPrice)
    : ((product as any).original_price ? formatPrice((product as any).original_price) : null);

  if (isDiscountActive && !variantPrice) {
    effectivePrice = pricing.sellingPrice;
    originalPriceForDisplay = pricing.originalPrice
      ? formatPrice(pricing.originalPrice)
      : formatPrice(product.base_price || product.price);
  }
  const displayPrice = formatPrice(effectivePrice);`;

pdp = pdp.replace(oldPricingCalc, newPricingCalc);

// Update handleAddToCart to pass effectivePrice
const oldAddToCart = `      await addToCart(product, quantity, {
        variantId: selectedVariant ? selectedVariant.id : undefined,
        variantName: selectedVariant?.name,
        price: selectedVariant?.price_override ?? selectedVariant?.price ?? product.base_price ?? product.price,
        imageUrl: product.primary_image_url || product.image_url || undefined,
      });`;

const newAddToCart = `      const currentPricing = resolveProductSellingPrice(product);
      const actualSellingPrice = selectedVariant
        ? (selectedVariant.price_override ?? selectedVariant.price)
        : (currentPricing.isDiscountActive ? currentPricing.sellingPrice : (product.base_price ?? product.price));

      await addToCart(product, quantity, {
        variantId: selectedVariant ? selectedVariant.id : undefined,
        variantName: selectedVariant?.name,
        price: actualSellingPrice,
        imageUrl: product.primary_image_url || product.image_url || undefined,
      });`;

pdp = pdp.replace(oldAddToCart, newAddToCart);

// Update mobile styles in ProductDetailPage
pdp = pdp.replace(
  `const titleStyles: React.CSSProperties = {
  fontSize: 'var(--text-2xl)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  lineHeight: 'var(--leading-tight)',
};`,
  `const titleStyles: React.CSSProperties = {
  fontSize: 'clamp(1.25rem, 4.5vw, 1.75rem)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  lineHeight: '1.25',
  wordBreak: 'break-word',
};`
);

pdp = pdp.replace(
  `const priceContainerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};`,
  `const priceContainerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: '10px',
  width: '100%',
};`
);

pdp = pdp.replace(
  `const cartBtnStyles: React.CSSProperties = {
  flex: '1',
  height: '48px',`,
  `const cartBtnStyles: React.CSSProperties = {
  flex: '1 1 180px',
  minWidth: '160px',
  height: '48px',`
);

pdp = pdp.replace(
  `const pageWrapperStyles: React.CSSProperties = {
  paddingTop: 'var(--space-6)',
  paddingBottom: 'var(--space-12)',`,
  `const pageWrapperStyles: React.CSSProperties = {
  paddingTop: 'var(--space-4)',
  paddingBottom: 'var(--space-16)',`
);

fs.writeFileSync('frontend/src/pages/Products/Detail/ProductDetailPage.tsx', pdp, 'utf8');
console.log('ProductDetailPage.tsx updated successfully.');

// 2. Update ShareButtons.tsx containerStyles
let sb = fs.readFileSync('frontend/src/components/product/ShareButtons.tsx', 'utf8');
sb = sb.replace(/\r\n/g, '\n');

sb = sb.replace(
  `const containerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
  marginVertical: 'var(--space-4)',
  width: '100%',
};`,
  `const containerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '8px',
  marginTop: 'var(--space-3)',
  marginBottom: 'var(--space-3)',
  width: '100%',
};`
);

fs.writeFileSync('frontend/src/components/product/ShareButtons.tsx', sb, 'utf8');
console.log('ShareButtons.tsx updated successfully.');
