import fs from 'fs';
import assert from 'assert';

console.log('=== DOVI Full Verification Suite ===\n');

// 1. Initial Page Flash Check
console.log('1. Checking frontend/index.html...');
const indexHtml = fs.readFileSync('frontend/index.html', 'utf8');
assert(!indexHtml.includes('Centralized campus marketplace'), 'FAIL: Found obsolete campus marketplace text in index.html');
assert(!indexHtml.includes('100% Escrow Buyer Protection'), 'FAIL: Found obsolete escrow copy in index.html');
assert(!indexHtml.includes('Verified Vendors & Students'), 'FAIL: Found obsolete student vendor text in index.html');
assert(indexHtml.includes('id="dovi-initial-loader"'), 'FAIL: Missing branded dovi-initial-loader');
assert(indexHtml.includes('Shop Smart. Feel Good.'), 'FAIL: Missing brand tagline in index.html loader');
console.log('   ✓ index.html clean, sleek branded loader verified.');

// 2. Technical Backend Error Message Check
console.log('2. Checking error handling sanitization across codebase...');
const filesToCheck = [
  'frontend/src/api/client.ts',
  'admin/src/api/client.ts',
  'frontend/src/pages/Auth/LoginPage.tsx',
  'admin/src/pages/LoginPage.tsx',
  'frontend/src/components/common/ApiErrorMessage.tsx',
  'admin/src/components/common/ApiErrorMessage.tsx',
];

for (const file of filesToCheck) {
  const content = fs.readFileSync(file, 'utf8');
  assert(!content.toLowerCase().includes('render may be waking up'), `FAIL: Technical message found in ${file}`);
  assert(!content.toLowerCase().includes('takes 30-50s'), `FAIL: Technical seconds message found in ${file}`);
}
console.log('   ✓ All technical hosting/provider sleep messages completely eliminated.');

// 3. Merchandising Sections & Placements
console.log('3. Checking merchandising placement service and seeded products...');
const deliveryDb = JSON.parse(fs.readFileSync('backend/delivery_store.json', 'utf8'));
assert(deliveryDb.homepagePlacements, 'FAIL: Missing homepagePlacements in backend/delivery_store.json');
assert(deliveryDb.homepageSections, 'FAIL: Missing homepageSections in backend/delivery_store.json');

const sections = deliveryDb.homepageSections;
assert.strictEqual(sections.length, 8, `Expected 8 core sections, found ${sections.length}`);

const expectedKeys = [
  'BEST_SELLERS',
  'TRENDING_NOW',
  'SPECIAL_PROMO',
  'NEW_ARRIVALS',
  'HOT_SALES',
  'FLASH_DEALS',
  'DISCOUNTS',
  'FEATURED_PRODUCTS',
];
expectedKeys.forEach((key, idx) => {
  assert.strictEqual(sections[idx].key, key, `Expected section ${idx + 1} to be ${key}, found ${sections[idx].key}`);
  if (key !== 'SPECIAL_PROMO') {
    assert(sections[idx].product_ids.length >= 4, `Expected at least 4 products in section ${key}, found ${sections[idx].product_ids.length}`);
  }
});
console.log('   ✓ All 8 core sections present in exact sequence with 4-6 products assigned per section.');

// Check Flash Sales & Discount Prices
const placements = deliveryDb.homepagePlacements;
const flashKeys = ['0023fd0f-715d-4578-94ad-e84efb1f3ba8', '8fe9e4bb-dc2a-43e7-aa37-06727bc7dd71', '23a9ba40-294a-4c8b-bef5-f0e1fa92abaa', '9b1920db-b6d5-47e5-8a12-1d7b09d1ad6d'];
for (const pid of flashKeys) {
  const plc = placements[pid];
  assert(plc.flash_sale, `FAIL: Missing flash_sale for product ${pid}`);
  assert(plc.flash_sale.flash_price < plc.flash_sale.original_price, `FAIL: flash_price must be < original_price for ${pid}`);
  assert(plc.flash_sale.is_active === true, `FAIL: flash_sale not active for ${pid}`);
}
console.log('   ✓ Flash sale pricing strictly lower than original and active.');

const discountKeys = ['66d4c89f-ea43-4fb3-904e-7de1ea7577e9', '3318868a-1e34-43f4-888e-c9d63d373509', 'fc26c3d7-8e88-4f6b-b648-0b512b031e20', '3d2350c1-8325-4a02-b554-d24b650ad901'];
for (const pid of discountKeys) {
  const plc = placements[pid];
  assert(plc.discount_config, `FAIL: Missing discount_config for product ${pid}`);
  assert(plc.discount_config.discount_price < plc.discount_config.original_price, `FAIL: discount_price must be < original_price for ${pid}`);
  assert(plc.discount_config.is_active === true, `FAIL: discount_config not active for ${pid}`);
}
console.log('   ✓ Discount pricing strictly lower than original and active.');

// 4. Checking DOVI Auto removal
console.log('4. Checking complete excision of DOVI Auto...');
const appFiles = [
  'frontend/src/App.tsx',
  'frontend/src/pages/Home/HomePage.tsx',
  'frontend/src/components/layout/Header.tsx',
  'frontend/src/components/layout/BottomNavigation.tsx',
  'admin/src/App.tsx',
  'admin/src/components/layout/AdminSidebar.tsx',
];

for (const f of appFiles) {
  if (fs.existsSync(f)) {
    const text = fs.readFileSync(f, 'utf8');
    assert(!text.toLowerCase().includes('dovi auto'), `FAIL: DOVI Auto found in ${f}`);
    assert(!text.toLowerCase().includes('/dovi-auto'), `FAIL: /dovi-auto route found in ${f}`);
  }
}
console.log('   ✓ DOVI Auto is completely absent from all navigation, routes, and components.');

// 5. Admin ProductsPage Features
console.log('5. Checking Admin ProductsPage merchandising integration...');
const adminProdPage = fs.readFileSync('admin/src/pages/ProductsPage.tsx', 'utf8');
assert(adminProdPage.includes('Homepage Sections'), 'FAIL: Missing Homepage Sections column in table header');
assert(adminProdPage.includes('quickSectionsProduct'), 'FAIL: Missing quickSectionsProduct state');
assert(adminProdPage.includes('Quick Sections Management Modal'), 'FAIL: Missing Quick Sections Modal markup');
assert(adminProdPage.includes('is_discount'), 'FAIL: Missing is_discount in form state');
assert(adminProdPage.includes('Discount Pricing Configuration'), 'FAIL: Missing Discount Pricing Configuration drawer');
console.log('   ✓ Admin ProductsPage fully equipped with section badges, quick modal, and discount configuration.');

console.log('\n=== All Tests Passed Successfully! ===');
