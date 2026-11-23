const https = require('https');
const fs = require('fs');
const path = require('path');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        resolve({ status: res.statusCode, headers: res.headers, data: buf.toString('utf8') });
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => req.destroy(new Error('Timed out')));
    if (body) req.write(body);
    req.end();
  });
}

async function runVerification() {
  console.log('====================================================');
  console.log('DOVI — POST-CLEANUP VERIFICATION TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name, condition, details = '') {
    if (condition) {
      console.log(`[PASS] ${name} ${details ? '(' + details + ')' : ''}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  }

  // 1. Health Check
  const healthRes = await request({
    hostname: 'dovi-2-0-backend.onrender.com',
    path: '/health/',
    method: 'GET',
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const health = JSON.parse(healthRes.data);
  assert('Backend Health Check', healthRes.status === 200 && health.status === 'healthy', `Status: ${health.status}, DB: ${health.database}`);

  // 2. Product Catalog Integrity
  const prodRes = await request({
    hostname: 'dovi-2-0-backend.onrender.com',
    path: '/api/v1/products/?page_size=1',
    method: 'GET',
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const prodData = JSON.parse(prodRes.data);
  assert('Product Catalog Preserved', prodData.count === 49, `Count: ${prodData.count} products`);

  // 3. Category Tree Integrity
  const catRes = await request({
    hostname: 'dovi-2-0-backend.onrender.com',
    path: '/api/v1/categories/',
    method: 'GET',
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const catData = JSON.parse(catRes.data);
  assert('Categories Preserved', Array.isArray(catData) && catData.length >= 12, `Count: ${catData.length} categories`);

  // 4. Delivery Store Integrity
  const store = JSON.parse(fs.readFileSync(path.join(__dirname, '../backend/delivery_store.json'), 'utf8'));
  assert('Delivery Routes Preserved', store.routes && store.routes.length === 29, `Count: ${store.routes ? store.routes.length : 0} routes`);
  assert('Minimum Order Threshold Preserved', store.minimumOrderSettings?.minimum_amount === 10000, `Amount: ₦${store.minimumOrderSettings?.minimum_amount}`);
  assert('Bank Account Settings Preserved', store.paymentAccounts?.some(a => a.account_number === '5601660874'), 'Bank Account: 5601660874 verified');

  // 5. Test Customer Registration
  const testEmail = `post_check_${Date.now()}@example.com`;
  const regRes = await request({
    hostname: 'dovi-2-0-backend.onrender.com',
    path: '/api/v1/auth/register/',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' }
  }, JSON.stringify({
    email: testEmail,
    password: 'VerifyPassword123!',
    first_name: 'Post',
    last_name: 'Verification',
    phone: '08099887766',
    role: 'BUYER'
  }));
  const regJson = JSON.parse(regRes.data);
  const userToken = regJson.access || regJson.tokens?.access;
  const refreshToken = regJson.refresh || regJson.tokens?.refresh;
  assert('New Customer Registration', regRes.status === 201 && Boolean(userToken), `Registered: ${testEmail}`);

  // 6. Test Customer Profile Access
  const profileRes = await request({
    hostname: 'dovi-2-0-backend.onrender.com',
    path: '/api/v1/users/me/',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${userToken}`, 'User-Agent': 'Mozilla/5.0' }
  });
  const profileJson = JSON.parse(profileRes.data);
  assert('New Customer Profile Retrieval', profileRes.status === 200 && profileJson.email === testEmail, `User: ${profileJson.email}`);

  // 7. Test Customer Logout & Token Blacklist
  const logoutRes = await request({
    hostname: 'dovi-2-0-backend.onrender.com',
    path: '/api/v1/auth/logout/',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${userToken}`, 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
  }, JSON.stringify({ refresh: refreshToken }));
  assert('Customer Logout Revocation', logoutRes.status === 200, 'Logout succeeded and submitted refresh token');

  // 8. Test Revoked Token Cannot Refresh
  const revokedRefreshRes = await request({
    hostname: 'dovi-2-0-backend.onrender.com',
    path: '/api/v1/auth/token/refresh/',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
  }, JSON.stringify({ refresh: refreshToken }));
  assert('Revoked Token Blocked', revokedRefreshRes.status === 401, `Status: ${revokedRefreshRes.status} (Rejected)`);

  // 9. Admin API Codebase Integrity (No Artificial Masking)
  const adminApiContent = fs.readFileSync(path.join(__dirname, '../admin/src/api/admin.ts'), 'utf8');
  const hasOldMasking = adminApiContent.includes("em.includes('test') ||");
  assert('Admin API Artificial Masking Removed', !hasOldMasking, 'True database state will be rendered in dashboard');

  console.log('\n====================================================');
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');
  if (failed > 0) process.exit(1);
}

runVerification().catch(err => {
  console.error('Fatal Verification Error:', err);
  process.exit(1);
});

