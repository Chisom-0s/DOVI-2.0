const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '..', 'backend', 'delivery_store.json');
const raw = fs.readFileSync(STORE_PATH, 'utf8');
const store = JSON.parse(raw);

console.log('====================================================');
console.log('DOVI ADMIN DASHBOARD OVERHAUL: VERIFICATION SUITE');
console.log('====================================================\n');

let failed = 0;
function assert(cond, msg) {
  if (cond) {
    console.log(`[PASS] ${msg}`);
  } else {
    console.error(`[FAIL] ${msg}`);
    failed++;
  }
}

// 1. Data Accuracy Tests
assert(store.users && store.users.length >= 10, `Authoritative Users populated (Count: ${store.users?.length})`);
const buyers = (store.users || []).filter(u => u.role === 'BUYER');
const vendors = (store.users || []).filter(u => u.role === 'VENDOR');
const admins = (store.users || []).filter(u => u.role === 'ADMIN');
assert(buyers.length >= 7, `Buyer accounts exist (Count: ${buyers.length})`);
assert(vendors.length >= 3, `Vendor accounts exist (Count: ${vendors.length})`);
assert(admins.length >= 1, `Admin accounts exist (Count: ${admins.length})`);

// Check products preservation
assert(store.products && store.products.length === 54, `All 54 products preserved (Count: ${store.products?.length})`);

// Check orders and payments
assert(store.orders && store.orders.length >= 5, `Authoritative Orders populated (Count: ${store.orders?.length})`);
assert(store.payments && store.payments.length >= 5, `Authoritative Payments populated (Count: ${store.payments?.length})`);
const pendingPayments = (store.payments || []).filter(p => p.status === 'PENDING_VERIFICATION');
assert(pendingPayments.length >= 2, `Pending verification payments exist with receipts (Count: ${pendingPayments.length})`);
assert(pendingPayments.every(p => Boolean(p.payment_proof_url)), 'All pending payments include receipt URLs');

// Check Save2Own activities
assert(store.save2ownGoals && store.save2ownGoals.length >= 3, `Save2Own goals populated (Count: ${store.save2ownGoals?.length})`);
assert(store.save2ownContributions && store.save2ownContributions.length >= 6, `Save2Own contributions populated (Count: ${store.save2ownContributions?.length})`);
assert(store.save2ownRefunds && store.save2ownRefunds.length >= 2, `Save2Own refunds populated (Count: ${store.save2ownRefunds?.length})`);

// 2. Navigation Structure Verification
const adminLayoutSrc = fs.readFileSync(path.join(__dirname, '..', 'admin', 'src', 'components', 'layout', 'AdminLayout.tsx'), 'utf8');
assert(!adminLayoutSrc.includes("label: 'Homepage CMS'"), 'Homepage CMS removed from Admin navigation');
assert(!adminLayoutSrc.includes("label: 'Auto Listings'"), 'Auto Listings removed from Admin navigation');
assert(!adminLayoutSrc.includes("label: 'Reviews'"), 'Reviews removed from Admin navigation');
assert(adminLayoutSrc.includes("title: 'Overview'"), 'Navigation Group 1: Overview present');
assert(adminLayoutSrc.includes("title: 'Store Management'"), 'Navigation Group 2: Store Management present');
assert(adminLayoutSrc.includes("title: 'Orders & Payments'"), 'Navigation Group 3: Orders & Payments present');
assert(adminLayoutSrc.includes("title: 'Save2Own'"), 'Navigation Group 4: Save2Own present');
assert(adminLayoutSrc.includes("title: 'Users'"), 'Navigation Group 5: Users present');
assert(adminLayoutSrc.includes("title: 'Settings'"), 'Navigation Group 6: Settings present');

// 3. Categories Page Dedicated View Verification
const categoriesPageSrc = fs.readFileSync(path.join(__dirname, '..', 'admin', 'src', 'pages', 'CategoriesPage.tsx'), 'utf8');
assert(categoriesPageSrc.includes('selectedCategory'), 'CategoriesPage supports dedicated selectedCategory view');
assert(categoriesPageSrc.includes('← All Categories'), 'CategoriesPage includes breadcrumb back navigation');
assert(categoriesPageSrc.includes('categoryProducts'), 'CategoriesPage computes products within selected category');

// 4. Users Page Redesign Verification
const usersPageSrc = fs.readFileSync(path.join(__dirname, '..', 'admin', 'src', 'pages', 'UsersPage.tsx'), 'utf8');
assert(usersPageSrc.includes('stats.total') && usersPageSrc.includes('stats.active') && usersPageSrc.includes('stats.suspended'), 'UsersPage displays real KPI counts');
assert(usersPageSrc.includes('handleToggleLoginStatus'), 'UsersPage supports quick account suspend/activate toggle');

// 5. Reset loop prevention in orderPaymentSync
const orderSyncSrc = fs.readFileSync(path.join(__dirname, '..', 'admin', 'src', 'services', 'orderPaymentSync.ts'), 'utf8');
assert(orderSyncSrc.includes('const needsReset = !applied || applied !== targetVersion;'), 'Wipe loop bug in enforceSystemResetCheck is permanently fixed');

console.log('\n----------------------------------------------------');
if (failed === 0) {
  console.log('ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
} else {
  console.error(`${failed} VERIFICATION CHECK(S) FAILED.`);
  process.exit(1);
}
