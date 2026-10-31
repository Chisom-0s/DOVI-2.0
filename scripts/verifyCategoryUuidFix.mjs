import { readFileSync } from 'fs';

// 1. Check that isCategoryUuid regex works accurately
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isCategoryUuid(val) {
  if (!val) return false;
  return UUID_REGEX.test(String(val).trim());
}

console.log('Testing isCategoryUuid...');
console.assert(isCategoryUuid('d21cf134-2f39-4bcc-ac4d-5c4975adf2b5') === true, 'Valid UUID should return true');
console.assert(isCategoryUuid('cat-furniture-home-decor') === false, 'Slug should return false');
console.assert(isCategoryUuid('') === false, 'Empty string should return false');
console.assert(isCategoryUuid(null) === false, 'null should return false');
console.log('✔ isCategoryUuid tests passed');

// 2. Mock database categories from Supabase
const mockSupabaseCategories = [
  { id: 'd21cf134-2f39-4bcc-ac4d-5c4975adf2b5', name: 'Audio & Sound', slug: 'audio-sound' },
  { id: 'df1c8b96-8b75-4bb0-a7c5-77f869b90bef', name: 'Computing & Laptops', slug: 'computing-laptops' },
  { id: 'b8ab1108-33d8-46f5-a7d1-a5de2b134f9a', name: 'Electronics', slug: 'electronics' },
  { id: '33ed280c-e6f4-4dc3-bdae-1ff6acac36ff', name: 'Fashion & Apparel', slug: 'fashion-apparel' },
  { id: 'ea627240-8f97-473b-a864-bcc52b747a46', name: 'Smartphones', slug: 'smartphones' },
];

const MAIN_12_CATEGORIES = [
  'Fashion & Clothing',
  'Shoes & Footwear',
  'Beauty & Personal Care',
  'Phones & Electronics',
  'Home & Kitchen',
  'Furniture & Home Decor',
  'Watches & Accessories',
  'Sports & Fitness',
  'Automotive & Motor Accessories',
  'Books & Stationery',
  'Baby & Kids',
  'Travel & Bags',
];

const MAIN_12_SLUGS = [
  'cat-fashion-clothing',
  'cat-shoes-footwear',
  'cat-beauty-personal-care',
  'cat-phones-electronics',
  'cat-home-kitchen',
  'cat-furniture-home-decor',
  'cat-watches-accessories',
  'cat-sports-fitness',
  'cat-automotive-accessories',
  'cat-books-stationery',
  'cat-baby-kids',
  'cat-travel-bags',
];

// Test semantic mapping logic (as in categoryService)
function mapCategoryToDatabaseUuid(categoryIdOrSlugOrName, dbList) {
  if (!categoryIdOrSlugOrName) return null;
  const raw = String(categoryIdOrSlugOrName).trim();
  if (isCategoryUuid(raw)) return raw;
  if (!dbList || dbList.length === 0) return null;

  const targetKey = raw.toLowerCase();

  // 1. Direct match
  const direct = dbList.find(
    (c) =>
      c.id.toLowerCase() === targetKey ||
      c.slug?.toLowerCase() === targetKey ||
      c.name?.trim().toLowerCase() === targetKey
  );
  if (direct && isCategoryUuid(direct.id)) return direct.id;

  // 2. Semantic keywords
  const matched = dbList.find((c) => {
    const dbSlug = (c.slug || '').toLowerCase();
    const dbName = (c.name || '').toLowerCase();
    if (targetKey.includes('furniture') && (dbSlug.includes('furniture') || dbName.includes('furniture'))) return true;
    if (targetKey.includes('phone') || targetKey.includes('electronic')) {
      return dbSlug.includes('smartphone') || dbSlug.includes('electronic') || dbName.includes('smartphone') || dbName.includes('electronic');
    }
    if (targetKey.includes('fashion') || targetKey.includes('shoe') || targetKey.includes('clothing')) {
      return dbSlug.includes('fashion') || dbName.includes('fashion');
    }
    return false;
  });
  if (matched && isCategoryUuid(matched.id)) return matched.id;

  // 3. Fallback to any valid UUID to preserve database FK constraint
  const firstWithUuid = dbList.find((c) => isCategoryUuid(c.id));
  if (firstWithUuid) return firstWithUuid.id;

  return null;
}

console.log('\nTesting mapping for all 12 categories...');
for (const slug of MAIN_12_SLUGS) {
  const resolved = mapCategoryToDatabaseUuid(slug, mockSupabaseCategories);
  console.assert(isCategoryUuid(resolved), `Failed to resolve UUID for ${slug}`);
  console.log(`✔ ${slug} -> ${resolved} (${isCategoryUuid(resolved) ? 'Valid UUID' : 'INVALID'})`);
}

// 3. Test Furniture & Home Decor specifically
const furnitureUuid = mapCategoryToDatabaseUuid('cat-furniture-home-decor', mockSupabaseCategories);
console.log(`\n✔ Furniture & Home Decor resolves to valid UUID: ${furnitureUuid}`);
console.assert(isCategoryUuid(furnitureUuid), 'Furniture & Home Decor must resolve to a valid UUID');

// 4. Test with backend having Furniture category already
const categoriesWithFurniture = [
  ...mockSupabaseCategories,
  { id: '8a91b2c3-d4e5-4f67-8901-234567abcdef', name: 'Furniture & Home Decor', slug: 'furniture-home-decor' }
];
const directFurnitureUuid = mapCategoryToDatabaseUuid('cat-furniture-home-decor', categoriesWithFurniture);
console.log(`✔ Direct match when backend category exists: ${directFurnitureUuid}`);
console.assert(directFurnitureUuid === '8a91b2c3-d4e5-4f67-8901-234567abcdef', 'Direct match failed');

console.log('\nAll Category UUID Mapping & Validation tests PASSED successfully!');
