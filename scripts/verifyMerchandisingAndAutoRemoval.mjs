import fs from 'fs';
import path from 'path';
import {
  DEFAULT_CORE_SECTIONS,
  listMerchandisingSections,
  saveMerchandisingSection,
  createCustomSection,
  deleteCustomSection,
  assignProductToSection,
  removeProductFromSection,
  reorderProductsInSection,
  updateSectionLimit,
  toggleSectionActive,
  isFlashSaleActiveNow,
  serializeProductDescriptionWithHomepage,
  parseHomepageMetadataFromDescription,
  saveProductHomepagePlacement,
  getProductHomepagePlacement,
} from '../frontend/src/services/homepagePlacementService.ts';

console.log('=== DOVI VERIFICATION SUITE: DOVI AUTO REMOVAL & HOMEPAGE MERCHANDISING ===\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${testName}`);
    failedTests++;
  }
}

// -------------------------------------------------------------
// 1. VERIFY REMOVAL OF DOVI AUTO
// -------------------------------------------------------------
console.log('--- 1. Testing DOVI Auto Elimination ---');

// Deleted files on disk
const deletedPaths = [
  'frontend/src/pages/Auto',
  'frontend/src/components/auto',
  'admin/src/pages/Auto',
  'frontend/src/api/auto.ts',
];
deletedPaths.forEach((p) => {
  assert(!fs.existsSync(p), `Path correctly does not exist: ${p}`);
});

// App / Layout / Navigation checks
const adminApp = fs.readFileSync('admin/src/App.tsx', 'utf8');
assert(!adminApp.includes('AutoListingsPage'), 'admin/src/App.tsx does not import or route AutoListingsPage');

const adminLayout = fs.readFileSync('admin/src/components/layout/AdminLayout.tsx', 'utf8');
assert(!adminLayout.includes("path: '/auto'"), "admin/src/components/layout/AdminLayout.tsx has no '/auto' nav item");
assert(adminLayout.includes('Homepage & Merchandising'), 'Admin navigation includes "Homepage & Merchandising"');

const feHeader = fs.readFileSync('frontend/src/components/layout/Header.tsx', 'utf8');
assert(!feHeader.includes('🚗 Dovi Auto'), 'frontend Header.tsx has no "🚗 Dovi Auto" links');
assert(!feHeader.includes('/categories/auto'), 'frontend Header.tsx has no "/categories/auto" link');

const feHero = fs.readFileSync('frontend/src/components/home/HeroBannerCarousel.tsx', 'utf8');
assert(!feHero.includes('slide-auto'), 'frontend HeroBannerCarousel has no "slide-auto"');

const feCategoryPage = fs.readFileSync('frontend/src/pages/Products/CategoryPage.tsx', 'utf8');
assert(!feCategoryPage.includes("'DOVI Auto'"), 'frontend CategoryPage has no hardcoded DOVI Auto condition');

// -------------------------------------------------------------
// 2. VERIFY HOMEPAGE MERCHANDISING CORE SECTIONS & ORDER
// -------------------------------------------------------------
console.log('\n--- 2. Testing Homepage Sections Sequence & Configuration ---');

const sections = listMerchandisingSections();
assert(sections.length >= 6, `Configured sections count >= 6 (found ${sections.length})`);

const expectedKeys = ['BEST_SELLERS', 'TRENDING_NOW', 'SPECIAL_PROMO', 'NEW_ARRIVALS', 'HOT_SALES', 'FLASH_DEALS'];
expectedKeys.forEach((key) => {
  const s = sections.find((x) => x.key === key);
  assert(Boolean(s), `Section exists: ${key} ("${s?.title}")`);
});

// Verify correct repositioned sequence:
// Hero -> Best Sellers (1) -> Trending Now (2) -> Save2Own CTA Promo (3) -> New Arrivals (4) -> Hot Sales (5) -> Flash Sales (6)
const bestSellers = sections.find((x) => x.key === 'BEST_SELLERS');
const trendingNow = sections.find((x) => x.key === 'TRENDING_NOW');
const save2OwnPromo = sections.find((x) => x.key === 'SPECIAL_PROMO');
const newArrivals = sections.find((x) => x.key === 'NEW_ARRIVALS');
const hotSales = sections.find((x) => x.key === 'HOT_SALES');
const flashSales = sections.find((x) => x.key === 'FLASH_DEALS');

assert(bestSellers.sort_order < trendingNow.sort_order, 'Best Sellers precedes Trending Now');
assert(trendingNow.sort_order < save2OwnPromo.sort_order, 'Trending Now precedes Save2Own CTA Card');
assert(save2OwnPromo.sort_order < newArrivals.sort_order, 'Save2Own CTA Card precedes New Arrivals (repositioned in flow)');
assert(newArrivals.sort_order < hotSales.sort_order, 'New Arrivals precedes Hot Sales');
assert(hotSales.sort_order < flashSales.sort_order, 'Hot Sales precedes Flash Sales');

// -------------------------------------------------------------
// 3. PRODUCT ASSIGNMENT, MULTI-ASSIGNMENT, REMOVAL & REORDERING
// -------------------------------------------------------------
console.log('\n--- 3. Testing Admin Product Placement & Merchandising ---');

const testProdId = 'test-prod-101';
const testProdId2 = 'test-prod-102';

// Assign product to Best Sellers and Hot Sales (multi-assignment)
await assignProductToSection('BEST_SELLERS', testProdId);
await assignProductToSection('HOT_SALES', testProdId);

let updatedPlacement = getProductHomepagePlacement(testProdId);
assert(updatedPlacement?.is_best_seller === true, 'Product assigned to Best Sellers flag is true');
assert(updatedPlacement?.is_hot_sale === true, 'Product assigned to Hot Sales flag is true (multi-section support)');

// Reorder products in Best Sellers
await assignProductToSection('BEST_SELLERS', testProdId2);
await reorderProductsInSection('BEST_SELLERS', [testProdId2, testProdId]);
let bsSection = listMerchandisingSections().find((s) => s.key === 'BEST_SELLERS');
assert(bsSection.product_ids[0] === testProdId2 && bsSection.product_ids[1] === testProdId, 'Products in section reordered with testProdId2 first');

// Remove product from Hot Sales
await removeProductFromSection('HOT_SALES', testProdId);
updatedPlacement = getProductHomepagePlacement(testProdId);
assert(updatedPlacement?.is_hot_sale === false, 'Product removed from Hot Sales');
assert(updatedPlacement?.is_best_seller === true, 'Product still remains in Best Sellers after removing from Hot Sales');

// -------------------------------------------------------------
// 4. CUSTOM SECTIONS SUPPORT
// -------------------------------------------------------------
console.log('\n--- 4. Testing Custom Sections Support ---');

const customSec = await createCustomSection({
  name: 'Back to Campus Tech',
  title: 'Back to Campus Tech Essentials',
  subtitle: 'Power adapters, wireless earbuds, and sturdy backpacks',
  display_limit: 8,
});
assert(Boolean(customSec.id), `Custom section created with ID: ${customSec.id}`);
assert(customSec.is_custom === true, 'Custom section marked is_custom = true');

await assignProductToSection(customSec.id, testProdId);
let foundCustom = listMerchandisingSections().find((s) => s.id === customSec.id);
assert(foundCustom?.product_ids.includes(testProdId), 'Product assigned to custom section');

const delResult = await deleteCustomSection(customSec.id);
foundCustom = listMerchandisingSections().find((s) => s.id === customSec.id);
console.log('DEBUG after deleteCustomSection: delResult =', delResult, 'foundCustom =', foundCustom);
assert(!foundCustom, 'Custom section safely deleted');

// -------------------------------------------------------------
// 5. FLASH SALE VALIDATION & AUTO-EXPIRATION
// -------------------------------------------------------------
console.log('\n--- 5. Testing Flash Sale Scheduling & Checkout Expiration ---');

const activeFlash = {
  flash_price: 15000,
  original_price: 25000,
  start_time: new Date(Date.now() - 3600000).toISOString(), // started 1h ago
  end_time: new Date(Date.now() + 3600000).toISOString(),   // ends in 1h
  is_active: true,
};
assert(isFlashSaleActiveNow(activeFlash) === true, 'Active flash sale within time window returns true');

const expiredFlash = {
  flash_price: 15000,
  original_price: 25000,
  start_time: new Date(Date.now() - 7200000).toISOString(),
  end_time: new Date(Date.now() - 3600000).toISOString(),   // ended 1h ago
  is_active: true,
};
assert(isFlashSaleActiveNow(expiredFlash) === false, 'Expired flash sale returns false (auto-deactivated)');

const futureFlash = {
  flash_price: 15000,
  original_price: 25000,
  start_time: new Date(Date.now() + 3600000).toISOString(), // starts in 1h
  end_time: new Date(Date.now() + 7200000).toISOString(),
  is_active: true,
};
assert(isFlashSaleActiveNow(futureFlash) === false, 'Not-yet-started flash sale returns false');

// Metadata serialization test
const rawDesc = 'High quality student product description.';
const serialized = serializeProductDescriptionWithHomepage(rawDesc, {
  is_best_seller: true,
  is_trending: false,
  is_new_arrival: true,
  is_hot_sale: false,
  is_flash_deal: true,
  flash_sale: activeFlash,
});
const parsed = parseHomepageMetadataFromDescription(serialized);
assert(parsed?.is_best_seller === true, 'Parsed description metadata retains is_best_seller');
assert(parsed?.is_new_arrival === true, 'Parsed description metadata retains is_new_arrival');
assert(parsed?.flash_sale?.flash_price === 15000, 'Parsed description metadata retains flash_sale price');

// Clean up test records
await removeProductFromSection('BEST_SELLERS', testProdId);
await removeProductFromSection('BEST_SELLERS', testProdId2);

console.log(`\n=== RESULTS: ${passedTests} PASSED, ${failedTests} FAILED ===\n`);
if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('ALL VERIFICATION CHECKS PASSED PERFECTLY!');
}
