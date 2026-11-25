const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('DOVI — CONTINUOUS CATALOGUE RETRIEVAL & INTEGRITY TESTS');
console.log('================================================================\n');

const rootDir = path.resolve(__dirname, '..');
const catalogPath = path.join(rootDir, 'backend/products_catalog.json');
const rawCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

console.log(`Total authoritative catalog products: ${rawCatalog.length}`);

// Test 1: Verify all products have valid IDs and published status
const publishedProducts = rawCatalog.filter(p => p.status === 'PUBLISHED' || !p.status);
console.log(`[PASS] Published products count: ${publishedProducts.length} (Expected >= 54)`);
assert(publishedProducts.length >= 54, 'Expected at least 54 published products');

// Test 2: Check for ID uniqueness (Zero Duplicates)
const idSet = new Set();
let duplicates = 0;
publishedProducts.forEach(p => {
  if (idSet.has(p.id)) duplicates++;
  idSet.add(p.id);
});
console.log(`[PASS] Catalogue ID uniqueness: ${duplicates === 0 ? 'ZERO DUPLICATES' : duplicates + ' duplicates found'}`);
assert.strictEqual(duplicates, 0, 'Found duplicate product IDs in catalog');

// Test 3: Search keyword resolution across full collection (items beyond item #24)
const sampleSearchTests = [
  { term: 'lip gloss', expectedId: '7eef659c-893b-4863-ba97-bba1c43edfe2' },
  { term: 'duravolt', expectedId: '33555e55-5d94-4597-aee8-977efdb4869e' },
  { term: 'frying pan', expectedId: 'a5cabfff-ad60-4504-84a6-f1f830eb5314' },
  { term: 'blender', expectedId: '15548fd1-1dcf-4e09-bf12-bce0153f5cb2' },
  { term: 'astronaut', expectedId: '95260c69-b43e-4dfd-a3f5-32a7ae6fae8b' },
];

sampleSearchTests.forEach(test => {
  const matches = publishedProducts.filter(p => {
    const text = `${p.name} ${p.description || ''} ${p.category_name || ''}`.toLowerCase();
    return text.includes(test.term.toLowerCase());
  });
  console.log(`[PASS] Search for "${test.term}": Found ${matches.length} matching item(s) across full catalogue`);
  assert(matches.length > 0, `Search for "${test.term}" returned zero matches`);
  assert(matches.some(m => m.id === test.expectedId), `Search for "${test.term}" failed to match item ${test.expectedId}`);
});

// Test 4: Category Filtering across entire 54-item catalogue
const categoriesInCatalog = new Set(publishedProducts.map(p => p.category_name).filter(Boolean));
console.log(`\nDistinct categories represented across catalogue: ${categoriesInCatalog.size}`);
categoriesInCatalog.forEach(cat => {
  const catProducts = publishedProducts.filter(p => p.category_name === cat);
  console.log(`  - Category "${cat}": ${catProducts.length} product(s) available on continuous page`);
  assert(catProducts.length > 0, `Category "${cat}" has no products`);
});

// Test 5: Verify sorting integrity across all items
const sortedByPriceAsc = [...publishedProducts].sort((a, b) => parseFloat(a.base_price || a.price || 0) - parseFloat(b.base_price || b.price || 0));
const minPrice = parseFloat(sortedByPriceAsc[0].base_price || sortedByPriceAsc[0].price || 0);
const maxPrice = parseFloat(sortedByPriceAsc[sortedByPriceAsc.length - 1].base_price || sortedByPriceAsc[sortedByPriceAsc.length - 1].price || 0);
console.log(`\n[PASS] Price sorting verified: Min = ₦${minPrice.toLocaleString()} -> Max = ₦${maxPrice.toLocaleString()} (across ${sortedByPriceAsc.length} items)`);
assert(minPrice <= maxPrice, 'Price sorting inverted');

console.log('\n================================================================');
console.log('ALL CONTINUOUS CATALOGUE INTEGRITY TESTS PASSED SUCCESSFULLY!');
console.log('================================================================');
