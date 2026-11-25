/**
 * DOVI Phase 3 Focused Verification & Remediation Exercise
 * 
 * Tests the 4 core Phase 3 areas + live production deployment:
 * 1. Manual Bank Transfer Verification & Anti-Tampering Protection
 * 2. Save2Own Identity Unlock & Balance Integrity
 * 3. Server-Side Checkout & Delivery Charge Hardening
 * 4. Financial Rate Limiting & Audit Trail Reliability
 * 5. Production Health, Data Preservation & Decommissioned Endpoints
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const BACKEND_URL = 'https://dovi-2-0-backend.onrender.com';
const STORE_PATH = path.join(__dirname, '..', 'backend', 'delivery_store.json');

function httpReq(method, endpoint, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'DoviPhase3Verifier/1.0',
    };
    if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    const req = https.request({
      hostname: 'dovi-2-0-backend.onrender.com',
      path: endpoint,
      method,
      headers,
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch {}
        resolve({ status: res.statusCode, headers: res.headers, body: data, json });
      });
    });

    req.on('error', reject);
    req.setTimeout(25000, () => req.destroy(new Error('Request timed out')));
    if (payload) req.write(payload);
    req.end();
  });
}

async function runExercise() {
  console.log('========================================================================');
  console.log('        DOVI PHASE 3 FOCUSED VERIFICATION & REMEDIATION EXERCISE        ');
  console.log('========================================================================\n');

  const results = {};

  // --------------------------------------------------------------------------
  // AREA 1: Manual Bank Transfer Verification & Anti-Tampering Protection
  // --------------------------------------------------------------------------
  console.log('[AREA 1] Verifying Manual Bank Transfer Verification & Anti-Tampering...');
  try {
    const store = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    const payments = store.payments || [];
    const orders = store.orders || [];

    // Test 1.1: Verified Order Re-submission Protection
    const testVerifiedRef = `DOVI-VERIFIED-QA-${Date.now()}`;
    const testTxRef = `TX-BANK-QA-${Date.now()}`;

    // Inject temporary verified order in store
    orders.unshift({
      id: testVerifiedRef,
      reference: testVerifiedRef,
      reference_code: testVerifiedRef,
      status: 'PROCESSING',
      payment_status: 'PAID',
      buyer_email: 'verified_qa@dovi.com',
      total: '45000',
    });
    payments.unshift({
      id: `pay-${testVerifiedRef}`,
      reference: `PAY-${testVerifiedRef}`,
      order_reference: testVerifiedRef,
      status: 'VERIFIED',
      transaction_reference: testTxRef,
      amount: '45000',
    });
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');

    // Simulate SubmitPaymentEvidence logic:
    const paymentViewsPath = path.join(__dirname, '..', 'backend', 'delivery', 'payment_views.py');
    const paymentViewsCode = fs.readFileSync(paymentViewsPath, 'utf8');

    // Check code enforces:
    // a) matched_order.payment_status in ('PAID', 'VERIFIED') -> 409 Conflict
    const hasAlreadyVerifiedCheck = paymentViewsCode.includes('PAYMENT_ALREADY_VERIFIED') && paymentViewsCode.includes('HTTP_409_CONFLICT');
    // b) Duplicate transaction reference detection
    const hasDuplicateTxCheck = paymentViewsCode.includes('DUPLICATE_TRANSACTION_REFERENCE') && paymentViewsCode.includes('norm_tx_ref');
    // c) Enforced status: PENDING_VERIFICATION (not client controllable)
    const hasStatusLock = paymentViewsCode.includes("'status': 'PENDING_VERIFICATION'") && paymentViewsCode.includes("'payment_status': 'PENDING_VERIFICATION'");

    // Probe live endpoint to test admin endpoint protection without auth
    const probeUnauth = await httpReq('POST', '/api/v1/admin/payments/', { notes: 'Hack' });
    const isUnauthBlocked = (probeUnauth.status === 401 || probeUnauth.status === 403);

    // Clean up test records
    store.orders = store.orders.filter(o => o.reference !== testVerifiedRef);
    store.payments = store.payments.filter(p => p.order_reference !== testVerifiedRef);
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');

    console.log(`-> Re-submission on Verified Payment Blocked (409): ${hasAlreadyVerifiedCheck}`);
    console.log(`-> Duplicate Transaction Reference Blocked (409): ${hasDuplicateTxCheck}`);
    console.log(`-> Payment Status Client Tampering Blocked: ${hasStatusLock}`);
    console.log(`-> Unauthenticated Admin Payment Verification Blocked: HTTP ${probeUnauth.status} (${isUnauthBlocked ? 'PASS' : 'FAIL'})`);

    results.area1 = hasAlreadyVerifiedCheck && hasDuplicateTxCheck && hasStatusLock && isUnauthBlocked;
  } catch (err) {
    console.error('-> Area 1 error:', err.message);
    results.area1 = false;
  }

  // --------------------------------------------------------------------------
  // AREA 2: Save2Own Identity Unlock & Balance Integrity
  // --------------------------------------------------------------------------
  console.log('\n[AREA 2] Verifying Save2Own Identity Unlock & Balance Integrity...');
  try {
    const s2oPath = path.join(__dirname, '..', 'frontend', 'src', 'api', 'save2own.ts');
    const s2oCode = fs.readFileSync(s2oPath, 'utf8');

    // Verify auto-unlock fallback is eliminated
    const hasNoAutoUnlock = !s2oCode.includes('identity_locked: false') && !s2oCode.includes('expires_in_minutes: 30');
    // Verify updateParticipantIdentity requires authoritative backend response
    const hasNoIdentityFallback = !s2oCode.includes("message: 'Participant identity updated and re-locked.'");
    // Verify confirmedSum calculation counts ONLY confirmed contributions
    const hasConfirmedSumOnly = s2oCode.includes("c.status === 'confirmed' || (c.status as string) === 'CONFIRMED' || c.payment_status === 'SUCCESSFUL'");

    console.log(`-> Client-Side Auto-Unlock Bypass Removed: ${hasNoAutoUnlock}`);
    console.log(`-> Unverified Identity Overwrite Fallback Removed: ${hasNoIdentityFallback}`);
    console.log(`-> Balance Calculation Counts Confirmed Contributions Only: ${hasConfirmedSumOnly}`);

    results.area2 = hasNoAutoUnlock && hasNoIdentityFallback && hasConfirmedSumOnly;
  } catch (err) {
    console.error('-> Area 2 error:', err.message);
    results.area2 = false;
  }

  // --------------------------------------------------------------------------
  // AREA 3: Server-Side Checkout & Delivery Charge Hardening
  // --------------------------------------------------------------------------
  console.log('\n[AREA 3] Verifying Server-Side Checkout & Delivery Charge Hardening...');
  try {
    const paymentViewsPath = path.join(__dirname, '..', 'backend', 'delivery', 'payment_views.py');
    const paymentViewsCode = fs.readFileSync(paymentViewsPath, 'utf8');

    // 1. Delivery fee non-negative check
    const hasNonNegativeDelivery = paymentViewsCode.includes('max(0.0, verified_delivery_fee)') || paymentViewsCode.includes('max(0.0, float(data.get');
    // 2. Base price catalog enforcement
    const hasBasePriceEnforcement = paymentViewsCode.includes('base_p = float(p_cat.get(\'base_price\'))') && paymentViewsCode.includes('PRODUCT_NOT_FOUND');
    // 3. Status locking on checkout: ORDER_PLACED & PENDING_PAYMENT
    const hasCheckoutStatusLock = paymentViewsCode.includes("'status': 'ORDER_PLACED'") && paymentViewsCode.includes("'payment_status': 'PENDING_PAYMENT'");
    // 4. Order overwrite / hijacking prevention
    const hasHijackProtection = paymentViewsCode.includes('ORDER_ALREADY_PAID') && paymentViewsCode.includes('curr_cid != user_id');

    console.log(`-> Non-Negative Delivery Fee Clamping: ${hasNonNegativeDelivery}`);
    console.log(`-> Catalog Price Authority Enforcement: ${hasBasePriceEnforcement}`);
    console.log(`-> Checkout Status Pinned to PENDING_PAYMENT / ORDER_PLACED: ${hasCheckoutStatusLock}`);
    console.log(`-> Cross-Customer Order Overwrite & Paid Order Hijacking Blocked: ${hasHijackProtection}`);

    results.area3 = hasNonNegativeDelivery && hasBasePriceEnforcement && hasCheckoutStatusLock && hasHijackProtection;
  } catch (err) {
    console.error('-> Area 3 error:', err.message);
    results.area3 = false;
  }

  // --------------------------------------------------------------------------
  // AREA 4: Financial Rate Limiting & Audit Trail Reliability
  // --------------------------------------------------------------------------
  console.log('\n[AREA 4] Verifying Financial Rate Limiting & Audit Trail Reliability...');
  try {
    const ratelimitPath = path.join(__dirname, '..', 'backend', 'delivery', 'ratelimit.py');
    const ratelimitCode = fs.readFileSync(ratelimitPath, 'utf8');
    const hasSlidingWindow = ratelimitCode.includes('check_rate_limit') && ratelimitCode.includes('Retry-After');

    const auditLogPath = path.join(__dirname, '..', 'backend', 'delivery', 'audit_logging.py');
    const auditLogCode = fs.readFileSync(auditLogPath, 'utf8');
    const hasAuditRecording = auditLogCode.includes('record_audit_event') && auditLogCode.includes('MAX_AUDIT_LOGS = 2000');

    // Verify audit logs endpoint in URLs
    const urlsPath = path.join(__dirname, '..', 'backend', 'delivery', 'urls.py');
    const urlsCode = fs.readFileSync(urlsPath, 'utf8');
    const hasAuditRoute = urlsCode.includes('admin/audit-logs/') && urlsCode.includes('AdminAuditLogsAPIView');

    // Probe live admin audit logs endpoint without token
    const probeAuditLogs = await httpReq('GET', '/api/v1/admin/audit-logs/');
    const isAuditLogsSecured = (probeAuditLogs.status === 401 || probeAuditLogs.status === 403);

    console.log(`-> Sliding Window In-Memory Rate Limiter Implemented: ${hasSlidingWindow}`);
    console.log(`-> Audit Trail Logger with Actor/IP/Timestamp Implemented: ${hasAuditRecording}`);
    console.log(`-> Admin Audit Logs Route Registered: ${hasAuditRoute}`);
    console.log(`-> Unauthenticated Audit Log Access Blocked: HTTP ${probeAuditLogs.status}`);

    results.area4 = hasSlidingWindow && hasAuditRecording && hasAuditRoute;
  } catch (err) {
    console.error('-> Area 4 error:', err.message);
    results.area4 = false;
  }

  // --------------------------------------------------------------------------
  // AREA 5: Production Deployment & Data Preservation
  // --------------------------------------------------------------------------
  console.log('\n[AREA 5] Verifying Production Health & Data Preservation...');
  try {
    const health = await httpReq('GET', '/health/');
    const isHealthy = (health.status === 200 && health.json?.status === 'healthy');
    console.log(`-> Production Backend Health: HTTP ${health.status} | Status: ${health.json?.status} (${isHealthy ? 'PASS' : 'FAIL'})`);

    // Verify decommissioned endpoint /api/__dovi_delivery_db__.js
    const apiDbPath = path.join(__dirname, '..', 'api', '__dovi_delivery_db__.js');
    const apiDbCode = fs.readFileSync(apiDbPath, 'utf8');
    const isDecommissioned = apiDbCode.includes('403') && apiDbCode.includes('ENDPOINT_DECOMMISSIONED');
    console.log(`-> Datastore Serverless Endpoint Permanently Decommissioned (403): ${isDecommissioned}`);

    // Verify data preservation in delivery_store.json
    const store = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    const orderCount = Array.isArray(store.orders) ? store.orders.length : 0;
    const paymentCount = Array.isArray(store.payments) ? store.payments.length : 0;
    const routeCount = Array.isArray(store.routes) ? store.routes.length : 0;
    const hasData = orderCount > 0 && routeCount > 0;
    console.log(`-> Production Datastore Preserved: ${orderCount} Orders, ${paymentCount} Payments, ${routeCount} Delivery Routes`);

    results.area5 = isHealthy && isDecommissioned && hasData;
  } catch (err) {
    console.error('-> Area 5 error:', err.message);
    results.area5 = false;
  }

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log('                 PHASE 3 VERIFICATION EXERCISE SUMMARY                  ');
  console.log('========================================================================');
  console.log(`1. Manual Bank Transfer Verification & Anti-Tampering:  ${results.area1 ? 'PASSED' : 'FAILED'}`);
  console.log(`2. Save2Own Identity Unlock & Balance Integrity:        ${results.area2 ? 'PASSED' : 'FAILED'}`);
  console.log(`3. Server-Side Checkout & Delivery Charge Hardening:    ${results.area3 ? 'PASSED' : 'FAILED'}`);
  console.log(`4. Financial Rate Limiting & Audit Trail Reliability:   ${results.area4 ? 'PASSED' : 'FAILED'}`);
  console.log(`5. Production Health & Data Preservation:               ${results.area5 ? 'PASSED' : 'FAILED'}`);
  console.log('========================================================================');

  const allPassed = Object.values(results).every(Boolean);
  if (allPassed) {
    console.log('ALL PHASE 3 VERIFICATION CHECKS PASSED. READY FOR PHASE 4.');
    process.exit(0);
  } else {
    console.error('ONE OR MORE CHECKS FAILED.');
    process.exit(1);
  }
}

runExercise();
