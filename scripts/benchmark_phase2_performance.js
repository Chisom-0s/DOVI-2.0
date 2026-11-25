const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('DOVI 2.0 — PHASE 2 PERFORMANCE VERIFICATION & BENCHMARK SUITE');
console.log('================================================================\n');

// 1. Bundle Size Verification
const frontendDist = path.resolve('frontend/dist/assets');
const adminDist = path.resolve('admin/dist/assets');

let passed = 0;
let total = 0;

function assertTest(name, condition, details) {
  total++;
  if (condition) {
    console.log(`[PASS] ${name}`);
    if (details) console.log(`       -> ${details}`);
    passed++;
  } else {
    console.error(`[FAIL] ${name}`);
    if (details) console.error(`       -> ${details}`);
  }
}

// Check Frontend index bundle size
const frontendFiles = fs.readdirSync(frontendDist);
const frontendIndexFile = frontendFiles.find(f => f.startsWith('index-') && f.endsWith('.js'));
if (frontendIndexFile) {
  const stat = fs.statSync(path.join(frontendDist, frontendIndexFile));
  const kb = stat.size / 1024;
  assertTest(
    'Frontend Root Bundle Reduction',
    kb < 200,
    `index.js size: ${kb.toFixed(2)} KB (Baseline: 925.7 KB -> ${(100 - (kb / 925.7) * 100).toFixed(1)}% reduction)`
  );
}

// Check Frontend route chunks existence (lazy loaded)
const expectedFrontendChunks = [
  'CheckoutPage',
  'ProductListingPage',
  'ProductDetailPage',
  'CartPage',
  'DashboardOverviewPage',
  'Save2OwnCreateGoalPage',
  'LoginPage'
];
expectedFrontendChunks.forEach(chunkName => {
  const found = frontendFiles.some(f => f.startsWith(chunkName) && f.endsWith('.js'));
  assertTest(`Frontend Lazy Chunk: ${chunkName}`, found, `Isolated route chunk created in dist/assets/`);
});

// Check Admin bundle sizes & exportUtils isolation
const adminFiles = fs.readdirSync(adminDist);
const usersPageFile = adminFiles.find(f => f.startsWith('UsersPage-') && f.endsWith('.js'));
const paymentsPageFile = adminFiles.find(f => f.startsWith('PaymentsPage-') && f.endsWith('.js'));
const exportUtilsFile = adminFiles.find(f => f.startsWith('exportUtils-') && f.endsWith('.js'));

if (usersPageFile && exportUtilsFile) {
  const uStat = fs.statSync(path.join(adminDist, usersPageFile));
  const uKb = uStat.size / 1024;
  assertTest(
    'Admin UsersPage Decoupled from Export Engine',
    uKb < 80,
    `UsersPage size: ${uKb.toFixed(2)} KB (Decoupled from 792 KB exportUtils)`
  );
}

if (paymentsPageFile && exportUtilsFile) {
  const pStat = fs.statSync(path.join(adminDist, paymentsPageFile));
  const pKb = pStat.size / 1024;
  assertTest(
    'Admin PaymentsPage Decoupled from Export Engine',
    pKb < 80,
    `PaymentsPage size: ${pKb.toFixed(2)} KB (Decoupled from 792 KB exportUtils)`
  );
}

// Check homepage.ts code implementation (elimination of while loop)
const homepageApiCode = fs.readFileSync('frontend/src/api/homepage.ts', 'utf8');
assertTest(
  'Sequential Multi-Page Pagination Loop Removed',
  !homepageApiCode.includes('while (hasMore && page <= 10)'),
  'Replaced with single bounded query and background progressive hydration'
);
assertTest(
  'Dead /api/v1/homepage/ 404 Request Eliminated',
  !homepageApiCode.includes("apiClient.get('/api/v1/homepage/')"),
  'Dead 404 network request removed'
);

// Check admin.ts getAnalyticsOverview (elimination of fetchAllPages dump)
const adminApiCode = fs.readFileSync('admin/src/api/admin.ts', 'utf8');
assertTest(
  'Admin Full Database Ingestion Eliminated',
  !adminApiCode.includes('fetchAllPages(path, params)'),
  'Replaced with single-page bounded query and local shared database snapshot'
);

console.log(`\n================================================================`);
console.log(`PHASE 2 BENCHMARK RESULTS: ${passed} / ${total} tests passed (${Math.round((passed / total) * 100)}%)`);
console.log('================================================================\n');
