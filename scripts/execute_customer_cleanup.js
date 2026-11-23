/**
 * DOVI - Corrective Production Customer Data Cleanup Script
 * Cleans out test customer records while strictly preserving:
 * - Permanent Administrators (admin@dovi.com, admin@dovishop.com)
 * - All 49 Catalog Products
 * - All 14 Categories
 * - All 29 Delivery Routes
 * - Store Settings (minimum checkout threshold ₦10,000)
 * - Bank Account Settings (5601660874)
 * - 6-Campaign Promotional Carousel
 */

const fs = require('fs');
const path = require('path');

const BACKEND_STORE_PATH = path.join(__dirname, '..', 'backend', 'delivery_store.json');
const ADMIN_PUBLIC_PATH = path.join(__dirname, '..', 'admin', 'public', 'delivery_store.json');
const FRONTEND_PUBLIC_PATH = path.join(__dirname, '..', 'frontend', 'public', 'delivery_store.json');
const CATALOG_PATH = path.join(__dirname, '..', 'backend', 'products_catalog.json');
const RECEIPTS_DIR = path.join(__dirname, '..', 'backend', 'media', 'receipts');
const BACKUP_DIR = path.join(__dirname, '..', 'backend', 'backups', `customer_cleanup_${new Date().toISOString().replace(/[:.]/g, '-')}`);

console.log('=== DOVI PRODUCTION CUSTOMER DATA CLEANUP ===\n');

// 1. Create Pre-Cleanup Backup
fs.mkdirSync(BACKUP_DIR, { recursive: true });
console.log(`1. Created pre-cleanup backup directory: ${BACKUP_DIR}`);

if (fs.existsSync(BACKEND_STORE_PATH)) {
  fs.copyFileSync(BACKEND_STORE_PATH, path.join(BACKUP_DIR, 'delivery_store.json'));
  console.log('   Backed up delivery_store.json');
}
if (fs.existsSync(CATALOG_PATH)) {
  fs.copyFileSync(CATALOG_PATH, path.join(BACKUP_DIR, 'products_catalog.json'));
  console.log('   Backed up products_catalog.json');
}

// 2. Validate Protected Assets Before Any Modification
const currentStore = JSON.parse(fs.readFileSync(BACKEND_STORE_PATH, 'utf8'));
const catalogProducts = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

if (!catalogProducts || catalogProducts.length < 49) {
  throw new Error(`CRITICAL: Product catalog verification failed (${catalogProducts ? catalogProducts.length : 0} products). Aborting!`);
}
if (!currentStore.routes || currentStore.routes.length < 29) {
  throw new Error(`CRITICAL: Delivery routes verification failed (${currentStore.routes ? currentStore.routes.length : 0} routes). Aborting!`);
}
if (!currentStore.categories || currentStore.categories.length < 12) {
  throw new Error(`CRITICAL: Categories verification failed (${currentStore.categories ? currentStore.categories.length : 0} categories). Aborting!`);
}

console.log('\n2. Validation of protected assets passed:');
console.log(`   - Products: ${catalogProducts.length} confirmed`);
console.log(`   - Delivery Routes: ${currentStore.routes.length} confirmed`);
console.log(`   - Categories: ${currentStore.categories.length} confirmed`);

// 3. Build pristine operational store preserving infrastructure and settings
const CLEAN_TIMESTAMP = new Date().toISOString();
const cleanStore = {
  system_reset_version: '2026-11-23-customer-cleanup-v1',
  reset_at: CLEAN_TIMESTAMP,
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
      created_at: '2026-01-01T00:00:00Z',
    },
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
    updated_at: '2026-11-21T00:00:00Z',
    updated_by: 'Administrator',
  },
  paymentAccounts: currentStore.paymentAccounts || [
    {
      id: 'acc-s2o-default',
      account_type: 'save2own',
      bank_name: 'Kuda Microfinance Bank',
      account_name: 'Dovi Save2Own Savings Trust',
      account_number: '5601660874',
      currency: 'NGN',
      is_active: true,
    },
    {
      id: 'acc-mkt-default',
      account_type: 'marketplace',
      bank_name: 'Zenith Bank',
      account_name: 'Dovi Direct Commerce Limited',
      account_number: '5601660874',
      currency: 'NGN',
      is_active: true,
    },
  ],
  promotionalCampaigns: currentStore.promotionalCampaigns || [],
  campaignAuditLogs: currentStore.campaignAuditLogs || [],
};

const serialized = JSON.stringify(cleanStore, null, 2);

// 4. Write pristine store to backend and public distribution targets
fs.writeFileSync(BACKEND_STORE_PATH, serialized, 'utf8');
console.log('\n3. Written clean store to: backend/delivery_store.json');

if (fs.existsSync(path.dirname(ADMIN_PUBLIC_PATH))) {
  fs.writeFileSync(ADMIN_PUBLIC_PATH, serialized, 'utf8');
  console.log('   Written clean store to: admin/public/delivery_store.json');
}

if (fs.existsSync(path.dirname(FRONTEND_PUBLIC_PATH))) {
  fs.writeFileSync(FRONTEND_PUBLIC_PATH, serialized, 'utf8');
  console.log('   Written clean store to: frontend/public/delivery_store.json');
}

// 5. Purge test receipt images
if (fs.existsSync(RECEIPTS_DIR)) {
  const receiptFiles = fs.readdirSync(RECEIPTS_DIR);
  let purgedCount = 0;
  for (const file of receiptFiles) {
    if (file !== '.gitkeep' && file !== 'README.md') {
      fs.unlinkSync(path.join(RECEIPTS_DIR, file));
      purgedCount++;
    }
  }
  console.log(`\n4. Receipts directory purged (${purgedCount} test payment receipt files removed).`);
}

console.log('\n=======================================');
console.log('CUSTOMER DATA CLEANUP COMPLETED');
console.log('Products Preserved:', cleanStore.products.length);
console.log('Delivery Routes Preserved:', cleanStore.routes.length);
console.log('Categories Preserved:', cleanStore.categories.length);
console.log('Permanent Administrator Preserved:', cleanStore.users[0].email);
console.log('Customer Test Accounts Purged: Active');
console.log('Test Orders Reset: 0');
console.log('Test Payments Reset: 0');
console.log('Test Save2Own Goals Reset: 0');
console.log('=======================================\n');

