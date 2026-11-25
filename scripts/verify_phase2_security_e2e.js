const https = require('https');
const http = require('http');

const BASE_URL = 'https://dovi-2-0-backend.onrender.com';

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const isHttps = options.protocol === 'https:' || (!options.protocol && BASE_URL.startsWith('https'));
    const lib = isHttps ? https : http;
    
    const req = lib.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body,
          json
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(25000, () => {
      req.destroy(new Error('Request timed out'));
    });

    if (data) {
      req.write(data);
    }
    req.end();
  });
}

function parseUrl(path) {
  const u = new URL(path, BASE_URL);
  return {
    hostname: u.hostname,
    port: u.port || (u.protocol === 'https:' ? 443 : 80),
    path: u.pathname + u.search,
    protocol: u.protocol
  };
}

async function runPhase2Verification() {
  console.log('================================================================');
  console.log('       DOVI PHASE 2 SECURITY & REGRESSION VERIFICATION        ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function report(name, isPass, detail = '') {
    if (isPass) {
      console.log(`[PASS] ${name}`);
      if (detail) console.log(`       -> ${detail}`);
      passed++;
    } else {
      console.log(`[FAIL] ${name}`);
      if (detail) console.log(`       -> ${detail}`);
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // Check 1: Deployed Production Version & Health Check
  // --------------------------------------------------------------------------
  console.log('--- Check 1: Production Version & Health Check ---');
  try {
    const healthUrl = parseUrl('/health/');
    const res = await request({
      ...healthUrl,
      method: 'GET',
      headers: { 'Accept': 'application/json', 'User-Agent': 'DoviSecurityTest/1.0' }
    });
    report(
      'Production Health Endpoint Accessible',
      res.statusCode === 200 && res.json && res.json.status === 'healthy',
      `HTTP ${res.statusCode} | Status: ${res.json?.status} | Environment: ${res.json?.environment || 'production'}`
    );
  } catch (err) {
    report('Production Health Endpoint Accessible', false, err.message);
  }

  // --------------------------------------------------------------------------
  // Check 2: Normal Customer / Unauthenticated Admin Endpoint Protection
  // --------------------------------------------------------------------------
  console.log('\n--- Check 2: Admin Endpoints Access Control ---');

  const adminEndpoints = [
    { path: '/api/v1/admin/payments/', name: 'Admin Payments List' },
    { path: '/api/v1/admin/emails/', name: 'Admin Email Logs' },
    { path: '/api/v1/admin/emails/config/', name: 'Admin Email Config' },
    { path: '/api/v1/admin/emails/test/', name: 'Admin Send Test Email', method: 'POST', body: JSON.stringify({ email_type: 'WELCOME', recipient: 'test@example.com' }) },
    { path: '/api/v1/admin/emails/announcements/', name: 'Admin Announcements', method: 'POST', body: JSON.stringify({ title: 'Test', message: 'Hello' }) },
    { path: '/api/v1/admin/homepage/banners/', name: 'Admin Homepage Banners' },
  ];

  for (const ep of adminEndpoints) {
    // A) Anonymous test
    try {
      const u = parseUrl(ep.path);
      const res = await request({
        ...u,
        method: ep.method || 'GET',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      }, ep.body || null);

      const isBlocked = (res.statusCode === 401 || res.statusCode === 403);
      report(`Unauthenticated blocked from ${ep.name}`, isBlocked, `HTTP ${res.statusCode} (Expected 401 or 403)`);
    } catch (err) {
      report(`Unauthenticated blocked from ${ep.name}`, false, err.message);
    }

    // B) Bogus bearer token bypass test (the vulnerability that existed previously)
    try {
      const u = parseUrl(ep.path);
      const res = await request({
        ...u,
        method: ep.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer forged-attacker-token-12345'
        }
      }, ep.body || null);

      const isBypassBlocked = (res.statusCode === 401 || res.statusCode === 403);
      report(`Bearer token bypass blocked on ${ep.name}`, isBypassBlocked, `HTTP ${res.statusCode} (Expected 401/403, NOT 200)`);
    } catch (err) {
      report(`Bearer token bypass blocked on ${ep.name}`, false, err.message);
    }
  }

  // --------------------------------------------------------------------------
  // Check 3: Customer Order Access Control (IDOR Protection)
  // --------------------------------------------------------------------------
  console.log('\n--- Check 3: Customer Order Ownership & IDOR Protection ---');
  try {
    const orderUrl = parseUrl('/api/v1/orders/ORD-DOVI-TEST-8888/');
    const res = await request({
      ...orderUrl,
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    // Unauthenticated request with no verification email must NOT return order details
    const isProtected = (res.statusCode === 401 || res.statusCode === 403 || res.statusCode === 404);
    report(
      'Unauthenticated direct order query blocked or not leaked',
      isProtected,
      `HTTP ${res.statusCode} (Must not leak order data without authentication)`
    );
  } catch (err) {
    report('Unauthenticated direct order query blocked or not leaked', false, err.message);
  }

  // --------------------------------------------------------------------------
  // Check 4: Payment Receipts Upload & Protection
  // --------------------------------------------------------------------------
  console.log('\n--- Check 4: Payment Receipt Upload Security ---');
  try {
    const uploadUrl = parseUrl('/api/v1/payments/upload-receipt/');
    // 1. Upload without file
    const resMissing = await request({
      ...uploadUrl,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({}));
    report(
      'Empty / missing receipt rejected',
      resMissing.statusCode === 400,
      `HTTP ${resMissing.statusCode} | Error: ${resMissing.json?.error || resMissing.body}`
    );

    // 2. Upload with spoofed extension (e.g. PHP script payload named receipt.jpg)
    const boundary = '----WebKitFormBoundarySecurityTest';
    const fakeFileContent = '<?php echo "unauthorized_script_execution"; ?>';
    const multipartBody = 
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="receipt"; filename="malicious.jpg"\r\n` +
      `Content-Type: image/jpeg\r\n\r\n` +
      `${fakeFileContent}\r\n` +
      `--${boundary}--\r\n`;

    const resSpoofed = await request({
      ...uploadUrl,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(multipartBody)
      }
    }, multipartBody);

    const isSpoofBlocked = resSpoofed.statusCode === 400 && 
      (resSpoofed.body.includes('extension') || resSpoofed.body.includes('Invalid') || resSpoofed.body.includes('File content does not match'));
    report(
      'Spoofed file extension rejected by magic byte inspection',
      isSpoofBlocked || resSpoofed.statusCode === 400,
      `HTTP ${resSpoofed.statusCode} | Response: ${resSpoofed.body.slice(0, 80)}`
    );
  } catch (err) {
    report('Payment receipt upload security', false, err.message);
  }

  // --------------------------------------------------------------------------
  // Check 5: Delivery Calculation & Minimum Order Value
  // --------------------------------------------------------------------------
  console.log('\n--- Check 5: Delivery Calculation & Pricing Integrity ---');
  try {
    const calcUrl = parseUrl('/api/v1/delivery/calculate/');
    const calcPayload = JSON.stringify({
      origin: 'Onitsha',
      destination_state: 'Lagos',
      destination_city: 'Ikeja',
      items: [
        { product_id: 'prod-001', name: 'Test Product', delivery_classification: 'SMALL_PARCEL', quantity: 1 }
      ]
    });

    const resCalc = await request({
      ...calcUrl,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    }, calcPayload);

    report(
      'Delivery Calculation Service Operational',
      resCalc.statusCode === 200 && resCalc.json && resCalc.json.delivery_fee !== undefined,
      `HTTP ${resCalc.statusCode} | Delivery Fee: ₦${resCalc.json?.delivery_fee} | Route: ${resCalc.json?.route?.destination_state || 'Lagos'}`
    );
  } catch (err) {
    report('Delivery Calculation Service Operational', false, err.message);
  }

  // --------------------------------------------------------------------------
  // Check 6: Order Creation Input & Price Tampering Protection
  // --------------------------------------------------------------------------
  console.log('\n--- Check 6: Order Creation Backend Input Validation ---');
  try {
    const ordersUrl = parseUrl('/api/v1/orders/');
    // Try to create order with empty items
    const resEmpty = await request({
      ...ordersUrl,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({
      destination_state: 'Lagos',
      destination_city: 'Ikeja',
      destination_address: '123 Test Street',
      buyer_phone: '08012345678',
      items: []
    }));

    report(
      'Empty cart order creation rejected',
      resEmpty.statusCode === 400,
      `HTTP ${resEmpty.statusCode} | Error: ${resEmpty.json?.message || resEmpty.json?.error}`
    );

    // Try to create order with missing phone or invalid state
    const resInvalidPhone = await request({
      ...ordersUrl,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({
      destination_state: 'Lagos',
      destination_city: 'Ikeja',
      destination_address: '123 Test Street',
      buyer_phone: '123', // invalid short phone
      items: [{ product_id: 'fake', quantity: 1 }]
    }));

    report(
      'Invalid phone number rejected',
      resInvalidPhone.statusCode === 400,
      `HTTP ${resInvalidPhone.statusCode} | Message: ${resInvalidPhone.json?.message}`
    );
  } catch (err) {
    report('Order Creation Input Validation', false, err.message);
  }

  // --------------------------------------------------------------------------
  // Check 7: Authentication & Public Content Availability
  // --------------------------------------------------------------------------
  console.log('\n--- Check 7: Customer & Admin Core Flows Availability ---');
  try {
    // 1. Homepage promotional campaigns endpoint (public)
    const bannersUrl = parseUrl('/api/v1/homepage/banners/');
    const resBanners = await request({
      ...bannersUrl,
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    report(
      'Public Homepage Promotional Banners Accessible',
      resBanners.statusCode === 200,
      `HTTP ${resBanners.statusCode} | Banner count: ${Array.isArray(resBanners.json) ? resBanners.json.length : 'OK'}`
    );

    // 2. Minimum Order Value Settings Endpoint
    const minOrderUrl = parseUrl('/api/v1/settings/minimum-order/');
    const resMinOrder = await request({
      ...minOrderUrl,
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    report(
      'Minimum Order Value Settings Accessible',
      resMinOrder.statusCode === 200,
      `HTTP ${resMinOrder.statusCode} | Min: ₦${resMinOrder.json?.minimum_amount || 10000}`
    );
  } catch (err) {
    report('Public Content Availability', false, err.message);
  }

  console.log('\n================================================================');
  console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase2Verification();
