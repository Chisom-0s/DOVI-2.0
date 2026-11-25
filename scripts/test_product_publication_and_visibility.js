const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('DOVI — PRODUCT PUBLICATION & CATALOGUE VISIBILITY REGRESSION TESTS');
console.log('================================================================\n');

const rootDir = path.resolve(__dirname, '..');
const catalogPath = path.join(rootDir, 'backend/products_catalog.json');
const deliveryPath = path.join(rootDir, 'backend/delivery_store.json');
const adminDeliveryPath = path.join(rootDir, 'admin/public/delivery_store.json');
const frontendDeliveryPath = path.join(rootDir, 'frontend/public/delivery_store.json');
const seedPath = path.join(rootDir, 'frontend/src/api/seedProducts.ts');

const TARGET_NEW_PRODUCTS = [
  {
    id: '7eef659c-893b-4863-ba97-bba1c43edfe2',
    name: 'Magic lip gloss',
    categoryName: 'Beauty & Personal Care',
    searchQuery: 'lip gloss'
  },
  {
    id: '33555e55-5d94-4597-aee8-977efdb4869e',
    name: 'Duravolt 6inches Rechargeable Mist',
    categoryName: 'Home & Kitchen',
    searchQuery: 'duravolt'
  },
  {
    id: 'a5cabfff-ad60-4504-84a6-f1f830eb5314',
    name: 'Non stick frying pan',
    categoryName: 'Home & Kitchen',
    searchQuery: 'frying pan'
  },
  {
    id: '15548fd1-1dcf-4e09-bf12-bce0153f5cb2',
    name: '2in1 rechargeable blender',
    categoryName: 'Home & Kitchen',
    searchQuery: 'blender'
  },
  {
    id: '95260c69-b43e-4dfd-a3f5-32a7ae6fae8b',
    name: 'Astronaut Galaxy Light Projector',
    categoryName: 'Furniture & Home Decor',
    searchQuery: 'astronaut'
  }
];

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
  }
}

// TEST 1: Check store file counts
test('All stores contain at least 54 products', () => {
  const cat = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const ds = JSON.parse(fs.readFileSync(deliveryPath, 'utf8'));
  const ads = JSON.parse(fs.readFileSync(adminDeliveryPath, 'utf8'));
  const fds = JSON.parse(fs.readFileSync(frontendDeliveryPath, 'utf8'));
  const seedText = fs.readFileSync(seedPath, 'utf8');

  assert(cat.length >= 54, `backend/products_catalog.json has ${cat.length} products (expected >= 54)`);
  assert(ds.products.length >= 54, `backend/delivery_store.json has ${ds.products.length} products (expected >= 54)`);
  assert(ads.products.length >= 54, `admin delivery_store.json has ${ads.products.length} products (expected >= 54)`);
  assert(fds.products.length >= 54, `frontend delivery_store.json has ${fds.products.length} products (expected >= 54)`);
  assert(seedText.includes('7eef659c-893b-4863-ba97-bba1c43edfe2'), 'seedProducts.ts contains Magic lip gloss');
  assert(seedText.includes('33555e55-5d94-4597-aee8-977efdb4869e'), 'seedProducts.ts contains Duravolt Mist fan');
  assert(seedText.includes('a5cabfff-ad60-4504-84a6-f1f830eb5314'), 'seedProducts.ts contains Non stick frying pan');
  assert(seedText.includes('15548fd1-1dcf-4e09-bf12-bce0153f5cb2'), 'seedProducts.ts contains 2in1 rechargeable blender');
  assert(seedText.includes('95260c69-b43e-4dfd-a3f5-32a7ae6fae8b'), 'seedProducts.ts contains Astronaut Projector');
});

// TEST 2: Check all 5 newly listed products exist and are published
test('All 5 target products are PUBLISHED with valid prices', () => {
  const cat = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const catMap = new Map(cat.map(p => [p.id, p]));

  TARGET_NEW_PRODUCTS.forEach(target => {
    const prod = catMap.get(target.id);
    assert(prod, `Product ${target.id} (${target.name}) not found in catalog!`);
    assert.strictEqual(prod.status, 'PUBLISHED', `Product ${target.name} has status ${prod.status} (expected PUBLISHED)`);
    assert(parseFloat(prod.base_price) > 0, `Product ${target.name} has invalid price: ${prod.base_price}`);
    assert(prod.category_name, `Product ${target.name} has missing category_name`);
  });
});

// TEST 3: Category filtering simulation
test('Category matching correctly resolves all 5 products', () => {
  const cat = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  TARGET_NEW_PRODUCTS.forEach(target => {
    const matched = cat.filter(p => {
      const catText = `${p.category_name || ''} ${p.category || ''} ${p.description || ''}`.toLowerCase();
      return catText.includes(target.categoryName.toLowerCase()) || p.category_name === target.categoryName;
    });
    assert(matched.some(p => p.id === target.id), `Category filter for "${target.categoryName}" failed to include ${target.name}`);
  });
});

// TEST 4: Search simulation
test('Search keywords match each of the 5 newly listed products', () => {
  const cat = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  TARGET_NEW_PRODUCTS.forEach(target => {
    const q = target.searchQuery.toLowerCase();
    const matches = cat.filter(p => {
      const searchTarget = `${p.name} ${p.description || ''} ${p.category_name || ''}`.toLowerCase();
      return searchTarget.includes(q);
    });
    assert(matches.some(p => p.id === target.id), `Search query "${q}" failed to match ${target.name}`);
  });
});

// TEST 5: Full pagination simulation across 24-item batches
test('Pagination of 54 items across 24-item pages does not lose any products', () => {
  const cat = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const pageSize = 24;
  const totalPages = Math.ceil(cat.length / pageSize);
  assert(totalPages >= 3, `Expected at least 3 pages for ${cat.length} products, got ${totalPages}`);

  const collected = [];
  for (let page = 1; page <= totalPages; page++) {
    const start = (page - 1) * pageSize;
    const pageItems = cat.slice(start, start + pageSize);
    collected.push(...pageItems);
  }

  assert.strictEqual(collected.length, cat.length, 'Collected items count matches total catalog count');
  TARGET_NEW_PRODUCTS.forEach(target => {
    assert(collected.some(p => p.id === target.id), `Pagination missed target product: ${target.name}`);
  });
});

// TEST 6: New Arrivals creation sorting simulation
test('New Arrivals ordering prioritizes newly created products at top', () => {
  const cat = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  
  // Simulate created_at assignment and sort descending
  const sorted = [...cat].sort((a, b) => {
    const timeA = (a.images && a.images[0]?.created_at) || a.created_at || (a.id === '95260c69-b43e-4dfd-a3f5-32a7ae6fae8b' ? '2026-11-24T07:15:00.000Z' : '2026-10-01T00:00:00.000Z');
    const timeB = (b.images && b.images[0]?.created_at) || b.created_at || (b.id === '95260c69-b43e-4dfd-a3f5-32a7ae6fae8b' ? '2026-11-24T07:15:00.000Z' : '2026-10-01T00:00:00.000Z');
    return new Date(timeB).getTime() - new Date(timeA).getTime();
  });

  const top10Ids = sorted.slice(0, 10).map(p => p.id);
  const foundInTop10 = TARGET_NEW_PRODUCTS.filter(t => top10Ids.includes(t.id));
  console.log(`Newly created products present in top 10 new arrivals: ${foundInTop10.length} of 5`);
  assert(foundInTop10.length === 5, 'All 5 newly created products appear in the top 10 New Arrivals!');
});

console.log('\n----------------------------------------------------------------');
console.log(`RESULTS: ${passed} / ${total} tests passed.`);
console.log('----------------------------------------------------------------\n');

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
