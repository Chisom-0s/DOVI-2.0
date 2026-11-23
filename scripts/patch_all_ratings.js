const fs = require('fs');
const path = require('path');

// 1. ProductDetailPage.tsx
const detailPath = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'Products', 'Detail', 'ProductDetailPage.tsx');
let detail = fs.readFileSync(detailPath, 'utf8');

detail = detail.replace(
  `          {/* Rating aggregate display banner */}
          <div style={ratingRowStyles}>
            <span style={{ color: '#f39c12', fontWeight: 'bold' }}>
              ★ {avgRating.toFixed(1)}
            </span>
            <span style={countTextStyles}>
              ({reviewCount} customer {reviewCount === 1 ? 'review' : 'reviews'})
            </span>
            <span style={skuStyles}>SKU: {displaySku}</span>
          </div>`,
  `          {/* Product Meta SKU */}
          <div style={skuRowStyles}>
            <span style={skuStyles}>SKU: {displaySku}</span>
          </div>`
);

detail = detail.replace(
  `const ratingRowStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  fontSize: 'var(--text-sm)',
  flexWrap: 'wrap',
};`,
  `const skuRowStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
};`
);

// Remove unused avgRating / reviewCount declarations if needed
detail = detail.replace(
  `  const avgRating = typeof product.average_rating === 'number'
    ? product.average_rating
    : (parseFloat(String(product.average_rating || 0)) || 0);

  const reviewCount = typeof product.review_count === 'number'
    ? product.review_count
    : (parseInt(String(product.review_count || 0), 10) || 0);`,
  `  // Rating & review displays temporarily disabled for initial launch`
);

fs.writeFileSync(detailPath, detail, 'utf8');
console.log('✓ ProductDetailPage.tsx updated.');

// 2. ProductSpecs.tsx
const specsPath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'product', 'ProductSpecs.tsx');
let specs = fs.readFileSync(specsPath, 'utf8');
specs = specs.replace(
  "    { label: 'Aggregate Rating', value: avgRating > 0 ? `${avgRating.toFixed(1)} / 5.0 Stars` : 'No ratings yet' },\n",
  ""
);
// remove avgRating calculation if unused
specs = specs.replace(
  `  const avgRating = typeof product.average_rating === 'number'
    ? product.average_rating
    : (parseFloat(String(product.average_rating || 0)) || 0);`,
  `  // Rating displays disabled for launch`
);
fs.writeFileSync(specsPath, specs, 'utf8');
console.log('✓ ProductSpecs.tsx updated.');

// 3. RecentlyViewedPage.tsx
const recentPath = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'Dashboard', 'RecentlyViewedPage.tsx');
let recent = fs.readFileSync(recentPath, 'utf8');
recent = recent.replace(
  `                <div style={ratingRowStyles}>
                  <span style={{ color: 'var(--color-warning)' }}>
                    ★ {product.average_rating.toFixed(1)}
                  </span>
                  <span style={reviewCountStyles}>({product.review_count})</span>
                </div>`,
  ''
);
fs.writeFileSync(recentPath, recent, 'utf8');
console.log('✓ RecentlyViewedPage.tsx updated.');

// 4. WishlistPage.tsx
const wishlistPath = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'Dashboard', 'WishlistPage.tsx');
let wishlist = fs.readFileSync(wishlistPath, 'utf8');
wishlist = wishlist.replace(
  `                <div style={ratingRowStyles}>
                  <span style={{ color: 'var(--color-warning)' }}>
                    ★ {item.product.average_rating.toFixed(1)}
                  </span>
                  <span style={reviewCountStyles}>({item.product.review_count})</span>
                </div>`,
  ''
);
fs.writeFileSync(wishlistPath, wishlist, 'utf8');
console.log('✓ WishlistPage.tsx updated.');

// 5. Hardcoded fallbacks in frontend/src/api/homepage.ts
const homeApiPath = path.join(__dirname, '..', 'frontend', 'src', 'api', 'homepage.ts');
let homeApi = fs.readFileSync(homeApiPath, 'utf8');
homeApi = homeApi.replace('rating: 4.9,', 'rating: 0,');
homeApi = homeApi.replace('review_count: 14,', 'review_count: 0,');
homeApi = homeApi.replace('average_rating: Number(p.average_rating) || 4.9,', 'average_rating: Number(p.average_rating) || 0,');
homeApi = homeApi.replace('review_count: Number(p.review_count) || (p.reviews ? p.reviews.length : 12),', 'review_count: Number(p.review_count) || (p.reviews ? p.reviews.length : 0),');
homeApi = homeApi.replace("rating: rp.average_rating || '4.9',", "rating: rp.average_rating || '0.0',");
fs.writeFileSync(homeApiPath, homeApi, 'utf8');
console.log('✓ homepage.ts hardcoded ratings removed.');

// 6. Hardcoded fallbacks in frontend/src/api/products.ts
const productsApiPath = path.join(__dirname, '..', 'frontend', 'src', 'api', 'products.ts');
let productsApi = fs.readFileSync(productsApiPath, 'utf8');
productsApi = productsApi.replace('review_count: 12,', 'review_count: 0,');
productsApi = productsApi.replace('average_rating: 4.8,', 'average_rating: 0,');
productsApi = productsApi.replace('review_count: 12,', 'review_count: 0,');
fs.writeFileSync(productsApiPath, productsApi, 'utf8');
console.log('✓ products.ts hardcoded ratings removed.');

// 7. Hardcoded fallbacks in CartContext.tsx
const cartCtxPath = path.join(__dirname, '..', 'frontend', 'src', 'contexts', 'CartContext.tsx');
let cartCtx = fs.readFileSync(cartCtxPath, 'utf8');
cartCtx = cartCtx.replace('average_rating: matchedProduct?.average_rating || 4.9,', 'average_rating: matchedProduct?.average_rating || 0,');
cartCtx = cartCtx.replace('review_count: matchedProduct?.review_count || 10,', 'review_count: matchedProduct?.review_count || 0,');
fs.writeFileSync(cartCtxPath, cartCtx, 'utf8');
console.log('✓ CartContext.tsx hardcoded ratings removed.');

// 8. Hardcoded fallbacks in checkout.ts
const checkoutPath = path.join(__dirname, '..', 'frontend', 'src', 'api', 'checkout.ts');
let checkout = fs.readFileSync(checkoutPath, 'utf8');
checkout = checkout.replace(/average_rating: 5,\s*review_count: 1,/g, 'average_rating: 0,\n              review_count: 0,');
fs.writeFileSync(checkoutPath, checkout, 'utf8');
console.log('✓ checkout.ts hardcoded ratings removed.');
