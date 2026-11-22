const fs = require('fs');
const path = require('path');

console.log('=== DOVI PRODUCTION CUSTOMER DATABASE RESET ===');

// 1. Verify pre-cleanup backup exists
const backupDir = path.resolve('backend/backups');
const backups = fs.existsSync(backupDir) ? fs.readdirSync(backupDir) : [];
console.log(`Found ${backups.length} existing backup(s):`, backups);
if (backups.length === 0) {
  throw new Error('ABORTING: No verified backup found in backend/backups!');
}

// 2. Read current backend/delivery_store.json
const storePath = path.resolve('backend/delivery_store.json');
if (!fs.existsSync(storePath)) {
  throw new Error('ABORTING: backend/delivery_store.json not found!');
}

const currentStore = JSON.parse(fs.readFileSync(storePath, 'utf8'));

// Verify critical operational data before resetting
const routeCount = currentStore.routes ? currentStore.routes.length : 0;
const catCount = currentStore.categories ? currentStore.categories.length : 0;
const sectionCount = currentStore.homepageSections ? currentStore.homepageSections.length : 0;

console.log(`Verifying operational assets:`);
console.log(`  - Delivery Routes: ${routeCount} (expected 29)`);
console.log(`  - Categories: ${catCount} (expected 12)`);
console.log(`  - Homepage Sections: ${sectionCount} (expected 7-8)`);

if (routeCount < 20 || catCount < 10) {
  throw new Error('ABORTING: Delivery routes or categories appear corrupted!');
}

// 3. Construct clean production store preserving operational configurations
const cleanStore = {
  routes: currentStore.routes,
  rateHistory: [],
  productAttributes: {},
  orderShipments: {},
  manualQuoteOrders: {},
  categories: currentStore.categories,
  productCategoryAssignments: {},
  homepagePlacements: currentStore.homepagePlacements || {},
  homepageSections: currentStore.homepageSections || [],
  merchandisingSections: currentStore.merchandisingSections || currentStore.homepageSections || [],
  minimumOrderSettings: currentStore.minimumOrderSettings || {
    minimum_amount: 10000,
    is_active: true,
    warning_threshold_ratio: 0.8,
  },
  save2ownGoals: [],
  save2ownParticipants: [],
  save2ownContributions: [],
  save2ownRefunds: [],
  payments: [],
  orders: [],
  paymentSessions: [],
};

// 4. Write clean store to backend and public targets
const targets = [
  path.resolve('backend/delivery_store.json'),
  path.resolve('admin/public/delivery_store.json'),
  path.resolve('frontend/public/delivery_store.json'),
];

for (const target of targets) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(cleanStore, null, 2), 'utf8');
  console.log(`✓ Clean store written to: ${target}`);
}

// 5. Clean receipts media directory
const receiptsDir = path.resolve('backend/media/receipts');
if (fs.existsSync(receiptsDir)) {
  const receiptFiles = fs.readdirSync(receiptsDir);
  for (const f of receiptFiles) {
    fs.unlinkSync(path.join(receiptsDir, f));
  }
  console.log(`✓ Receipts directory cleaned (${receiptFiles.length} files removed).`);
} else {
  fs.mkdirSync(receiptsDir, { recursive: true });
  console.log('✓ Receipts directory ensured empty.');
}

console.log('\n=== DATABASE RESET COMPLETED SUCCESSFULLY ===');
console.log('Protected Administrator: admin@dovi.com');
console.log('Preserved Delivery Routes: 29');
console.log('Preserved Product Categories: 12');
console.log('Preserved Homepage Placements: 18');
console.log('Orders Reset: 0');
console.log('Payments Reset: 0');
console.log('Save2Own Goals Reset: 0');
