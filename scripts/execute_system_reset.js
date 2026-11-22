/**
 * DOVI - Operational Data Reset Execution Script
 * Strictly clears operational test data while preserving all 49 products, 29 delivery routes,
 * 12 categories, and the permanent administrator.
 */

const fs = require('fs');
const path = require('path');

const BACKEND_STORE_PATH = path.join(__dirname, '..', 'backend', 'delivery_store.json');
const ADMIN_PUBLIC_PATH = path.join(__dirname, '..', 'admin', 'public', 'delivery_store.json');
const FRONTEND_PUBLIC_PATH = path.join(__dirname, '..', 'frontend', 'public', 'delivery_store.json');
const CATALOG_PATH = path.join(__dirname, '..', 'backend', 'products_catalog.json');
const RECEIPTS_DIR = path.join(__dirname, '..', 'backend', 'media', 'receipts');

const RESET_TIMESTAMP = '2026-11-22T13:00:00Z';
const RESET_VERSION = '2026-11-22-clean-v1';

// 1. Read existing store to preserve infrastructure settings
const currentStore = JSON.parse(fs.readFileSync(BACKEND_STORE_PATH, 'utf8'));
const catalogProducts = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

if (!catalogProducts || catalogProducts.length < 49) {
  throw new Error(`Catalog verification failed: only ${catalogProducts ? catalogProducts.length : 0} products found.`);
}

if (!currentStore.routes || currentStore.routes.length < 29) {
  throw new Error(`Routes verification failed: only ${currentStore.routes ? currentStore.routes.length : 0} routes found.`);
}

if (!currentStore.categories || currentStore.categories.length < 12) {
  throw new Error(`Categories verification failed: only ${currentStore.categories ? currentStore.categories.length : 0} categories found.`);
}

console.log('✓ Validation passed: 49 products, 29 routes, 12 categories confirmed.');

// 2. Build the pristine post-reset store
const cleanStore = {
  system_reset_version: RESET_VERSION,
  reset_at: RESET_TIMESTAMP,
  routes: currentStore.routes,
  categories: currentStore.categories,
  products: catalogProducts,
  users: [
    {
      id: 'usr_admin_1',
      email: 'admin@dovi.com',
      first_name: 'DOVI',
      last_name: 'Administrator',
      role: 'ADMIN',
      phone: '+2347067402413',
      is_active: true,
      is_staff: true,
      is_email_verified: true,
      created_at: '2026-01-01T00:00:00Z'
    }
  ],
  orders: [],
  orderShipments: {},
  manualQuoteOrders: [],
  payments: [],
  paymentSessions: [],
  save2ownGoals: [],
  save2ownParticipants: [],
  save2ownContributions: [],
  save2ownRefunds: [],
  rateHistory: [],
  productAttributes: currentStore.productAttributes || {},
  productCategoryAssignments: currentStore.productCategoryAssignments || {},
  homepagePlacements: currentStore.homepagePlacements || {},
  homepageSections: currentStore.homepageSections || [],
  merchandisingSections: currentStore.merchandisingSections || [],
  minimumOrderSettings: currentStore.minimumOrderSettings || {
    enabled: true,
    minimum_amount: 10000,
    updated_at: '2026-01-01T00:00:00Z',
    updated_by: 'system'
  }
};

const serialized = JSON.stringify(cleanStore, null, 2);

// 3. Write to backend, admin public, and frontend public
fs.writeFileSync(BACKEND_STORE_PATH, serialized, 'utf8');
console.log('✓ backend/delivery_store.json reset successfully.');

if (fs.existsSync(path.dirname(ADMIN_PUBLIC_PATH))) {
  fs.writeFileSync(ADMIN_PUBLIC_PATH, serialized, 'utf8');
  console.log('✓ admin/public/delivery_store.json reset successfully.');
}

if (fs.existsSync(path.dirname(FRONTEND_PUBLIC_PATH))) {
  fs.writeFileSync(FRONTEND_PUBLIC_PATH, serialized, 'utf8');
  console.log('✓ frontend/public/delivery_store.json reset successfully.');
}

// 4. Clean up any receipts in receipts dir
if (fs.existsSync(RECEIPTS_DIR)) {
  const receiptFiles = fs.readdirSync(RECEIPTS_DIR);
  let purgedCount = 0;
  for (const file of receiptFiles) {
    if (file !== '.gitkeep' && file !== 'README.md') {
      fs.unlinkSync(path.join(RECEIPTS_DIR, file));
      purgedCount++;
    }
  }
  console.log(`✓ Purged ${purgedCount} test payment receipt file(s) from media/receipts.`);
}

console.log('\n=======================================');
console.log('OPERATIONAL DATA RESET EXECUTION COMPLETE');
console.log('Products Preserved:', cleanStore.products.length);
console.log('Delivery Routes Preserved:', cleanStore.routes.length);
console.log('Categories Preserved:', cleanStore.categories.length);
console.log('Permanent Admin Preserved:', cleanStore.users[0].email);
console.log('Orders Count:', cleanStore.orders.length);
console.log('Payments Count:', cleanStore.payments.length);
console.log('Save2Own Goals Count:', cleanStore.save2ownGoals.length);
console.log('=======================================');
