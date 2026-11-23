const fs = require('fs');
const path = require('path');

const filePath = path.resolve('frontend/src/api/homepage.ts');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

const target = `  return sections
    .filter(
      (s) =>
        s.key !== 'FLASH_DEALS' &&
        s.id !== 'sec-flash-deals' &&
        s.key !== 'FEATURED_CATEGORIES' &&
        s.key !== 'TOP_VENDORS' &&
        s.configuration?.layout !== 'VENDOR_GRID' &&
        s.configuration?.layout !== 'CATEGORY_GRID' &&
        s.configuration?.layout !== 'CATEGORY_CIRCLES' &&
        s.configuration?.layout !== 'CATEGORY_PILLS' &&
        s.configuration?.layout !== 'BRAND_GRID'
    )
    .map((s) => {
      if (s.key === 'DISCOUNTS' || s.id === 'sec-discounts') {
        return {
          ...s,
          name: 'Deals & Discounts',
          title: 'Deals & Discounts',
          sort_order: 2,
          display_order: 2,
        };
      }
      return s;
    })
    .sort((a, b) => (a.sort_order || 99) - (b.sort_order || 99));`;

const replacement = `  const CANONICAL_ORDER_RANK: Record<string, number> = {
    BEST_SELLERS: 1,
    'sec-best-sellers': 1,
    DISCOUNTS: 2,
    DEALS_AND_DISCOUNTS: 2,
    'sec-discounts': 2,
    TRENDING_NOW: 3,
    TRENDING: 3,
    'sec-trending': 3,
    SPECIAL_PROMO: 4,
    SAVE2OWN: 4,
    'sec-special-promo': 4,
    NEW_ARRIVALS: 5,
    'sec-new-arrivals': 5,
    HOT_SALES: 6,
    'sec-hot-sales': 6,
    FEATURED_PRODUCTS: 7,
    FEATURED: 7,
    'sec-featured': 7,
  };

  return sections
    .filter(
      (s) =>
        s.key !== 'FLASH_DEALS' &&
        s.id !== 'sec-flash-deals' &&
        s.key !== 'FEATURED_CATEGORIES' &&
        s.key !== 'TOP_VENDORS' &&
        s.configuration?.layout !== 'VENDOR_GRID' &&
        s.configuration?.layout !== 'CATEGORY_GRID' &&
        s.configuration?.layout !== 'CATEGORY_CIRCLES' &&
        s.configuration?.layout !== 'CATEGORY_PILLS' &&
        s.configuration?.layout !== 'BRAND_GRID'
    )
    .map((s) => {
      const rank = CANONICAL_ORDER_RANK[s.key] || CANONICAL_ORDER_RANK[s.id] || s.sort_order || 99;
      if (s.key === 'DISCOUNTS' || s.id === 'sec-discounts') {
        return {
          ...s,
          name: 'Deals & Discounts',
          title: 'Deals & Discounts',
          sort_order: 2,
          display_order: 2,
        };
      }
      return {
        ...s,
        sort_order: rank,
        display_order: rank,
      };
    })
    .sort((a, b) => (CANONICAL_ORDER_RANK[a.key] || a.sort_order || 99) - (CANONICAL_ORDER_RANK[b.key] || b.sort_order || 99));`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated canonical sorting in frontend/src/api/homepage.ts');
} else {
  console.error('Target not found in homepage.ts');
}
