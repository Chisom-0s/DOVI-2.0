const fs = require('fs');
const path = require('path');

const BACKEND_STORE = path.join(__dirname, '..', 'backend', 'delivery_store.json');
const ADMIN_STORE = path.join(__dirname, '..', 'admin', 'public', 'delivery_store.json');
const FRONTEND_STORE = path.join(__dirname, '..', 'frontend', 'public', 'delivery_store.json');
const CATALOG = path.join(__dirname, '..', 'backend', 'products_catalog.json');
const RECEIPTS_DIR = path.join(__dirname, '..', 'backend', 'media', 'receipts');

const results = [];

function check(name, pass, details = '') {
  results.push({ name, pass, details });
  console.log(`${pass ? '✓ PASS' : '✗ FAIL'}: ${name} ${details ? '(' + details + ')' : ''}`);
}

console.log('========================================================');
console.log('DOVI SYSTEM RESET INTEGRITY & VERIFICATION SUITE');
console.log('========================================================\n');

// 1. Backend store checks
const backendDb = JSON.parse(fs.readFileSync(BACKEND_STORE, 'utf8'));
check('Backend Store Reset Version', backendDb.system_reset_version === '2026-11-22-audit-ready-v2' || backendDb.system_reset_version === '2026-11-22-clean-v1', backendDb.system_reset_version);
check('Backend Orders Count is 0', backendDb.orders.length === 0, `count: ${backendDb.orders.length}`);
check('Backend Payments Count is 0', backendDb.payments.length === 0, `count: ${backendDb.payments.length}`);
check('Backend Payment Sessions Count is 0', backendDb.paymentSessions.length === 0, `count: ${backendDb.paymentSessions.length}`);
check('Backend Save2Own Goals Count is 0', backendDb.save2ownGoals.length === 0, `count: ${backendDb.save2ownGoals.length}`);
check('Backend Save2Own Contributions Count is 0', backendDb.save2ownContributions.length === 0, `count: ${backendDb.save2ownContributions.length}`);
check('Backend Save2Own Refunds Count is 0', backendDb.save2ownRefunds.length === 0, `count: ${backendDb.save2ownRefunds.length}`);
check('Backend Users has 1 Admin', backendDb.users.length === 1 && backendDb.users[0].email === 'admin@dovi.com', backendDb.users[0].email);
check('Backend Catalog Products Count is 49', backendDb.products.length === 49, `count: ${backendDb.products.length}`);
check('Backend Delivery Routes Count is 29', backendDb.routes.length === 29, `count: ${backendDb.routes.length}`);
check('Backend Categories Count is 12', backendDb.categories.length === 12, `count: ${backendDb.categories.length}`);

// 2. Admin public store parity
const adminDb = JSON.parse(fs.readFileSync(ADMIN_STORE, 'utf8'));
check('Admin Public Store Parity', adminDb.products.length === 49 && adminDb.routes.length === 29 && adminDb.orders.length === 0);

// 3. Frontend public store parity
const frontendDb = JSON.parse(fs.readFileSync(FRONTEND_STORE, 'utf8'));
check('Frontend Public Store Parity', frontendDb.products.length === 49 && frontendDb.routes.length === 29 && frontendDb.orders.length === 0);

// 4. Products catalog source file
const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
check('Products Catalog Integrity', catalog.length === 49, `count: ${catalog.length}`);
const sampleProduct = catalog[0];
const hasSku = sampleProduct.sku || sampleProduct.reference_code || (sampleProduct.variants && sampleProduct.variants[0]?.sku);
check('Product Schema Integrity', !!(sampleProduct.id && sampleProduct.name && sampleProduct.base_price && hasSku), sampleProduct.name);

// 5. Customer Receipts storage
if (fs.existsSync(RECEIPTS_DIR)) {
  const receipts = fs.readdirSync(RECEIPTS_DIR).filter(f => f !== '.gitkeep' && f !== 'README.md');
  check('Receipts Directory Clean', receipts.length === 0, `found: ${receipts.length} files`);
} else {
  check('Receipts Directory Empty/Nonexistent', true);
}

// Summary
const total = results.length;
const passed = results.filter(r => r.pass).length;
console.log('\n--------------------------------------------------------');
console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
console.log('--------------------------------------------------------\n');

if (passed !== total) {
  process.exit(1);
}
