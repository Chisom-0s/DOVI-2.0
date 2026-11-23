const fs = require('fs');

const catalog = JSON.parse(fs.readFileSync('backend/products_catalog.json', 'utf8'));
const placementService = fs.readFileSync('frontend/src/services/homepagePlacementService.ts', 'utf8');

const match = placementService.match(/"id":\s*"sec-best-sellers"[\s\S]*?"product_ids":\s*\[([\s\S]*?)\]/);
if (match) {
  const ids = JSON.parse('[' + match[1] + ']');
  console.log('sec-best-sellers product_ids count in DEFAULT_CORE_SECTIONS:', ids.length);
  const matched = catalog.filter(p => ids.includes(p.id));
  console.log('Matched in catalog count:', matched.length);
  console.log('Matched product names:', matched.map(p => p.name));
}

// Also check backend orders to see genuine sales!
if (fs.existsSync('backend/delivery_store.json')) {
  const store = JSON.parse(fs.readFileSync('backend/delivery_store.json', 'utf8'));
  console.log('Store orders count:', (store.orders || []).length);
  console.log('Store homepagePlacements:', Object.keys(store.homepagePlacements || {}));
  console.log('Store homepageSections:', (store.homepageSections || []).map(s => ({ key: s.key, count: (s.product_ids || []).length })));
}
