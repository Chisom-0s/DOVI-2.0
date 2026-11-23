const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('========================================================');
console.log('PART A — CHECKOUT VALIDATION & ACCESS CONTROL TESTS');
console.log('========================================================');

let passed = 0;
let failed = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`✓ PASS: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`✗ FAIL: ${desc} -> ${err.message}`);
    failed++;
  }
}

// Test 1: backend/delivery/payment_views.py has no duplicate class definitions
it('backend/delivery/payment_views.py has no duplicate classes', () => {
  const content = fs.readFileSync('backend/delivery/payment_views.py', 'utf8');
  const classMatches = content.match(/class\s+([A-Za-z0-9_]+)\s*\(/g) || [];
  const classNames = classMatches.map((c) => c.replace(/class\s+/, '').replace(/\s*\(/, ''));
  const counts = {};
  for (const name of classNames) {
    counts[name] = (counts[name] || 0) + 1;
    assert.strictEqual(counts[name], 1, `Class ${name} appears ${counts[name]} times in payment_views.py!`);
  }
});

// Test 2: SubmitPaymentEvidenceAPIView strictly requires receipt upload
it('SubmitPaymentEvidenceAPIView strictly requires payment_proof_url', () => {
  const content = fs.readFileSync('backend/delivery/payment_views.py', 'utf8');
  assert.ok(content.includes('if not payment_proof_url or not payment_proof_url.strip():'), 'Receipt check not found');
  assert.ok(content.includes("'error': 'RECEIPT_REQUIRED'"), 'RECEIPT_REQUIRED error not found');
});

// Test 3: PaymentSessionListCreateAPIView validates order delivery completeness
it('PaymentSessionListCreateAPIView enforces order delivery completeness', () => {
  const content = fs.readFileSync('backend/delivery/payment_views.py', 'utf8');
  assert.ok(content.includes("'error': 'INCOMPLETE_DELIVERY_DETAILS'"), 'INCOMPLETE_DELIVERY_DETAILS error not found');
  assert.ok(content.includes('clean_digits ='), 'Phone digit check not found in PaymentSessionListCreateAPIView');
});

// Test 4: OrderListCreateAPIView validates delivery info & independently recalculates pricing
it('OrderListCreateAPIView independently verifies delivery info and catalog prices', () => {
  const content = fs.readFileSync('backend/delivery/payment_views.py', 'utf8');
  assert.ok(content.includes("'field': 'full_name'"), 'full_name validation not found');
  assert.ok(content.includes("'field': 'phone'"), 'phone validation not found');
  assert.ok(content.includes("'field': 'state'"), 'state validation not found');
  assert.ok(content.includes("'field': 'city'"), 'city validation not found');
  assert.ok(content.includes("'field': 'address'"), 'address validation not found');
  assert.ok(content.includes("'field': 'items'"), 'items validation not found');
  assert.ok(content.includes('catalog_path ='), 'Catalog path verification not found');
  assert.ok(content.includes('verified_subtotal + verified_delivery_fee'), 'Authoritative total recalculation not found');
});

// Test 5: frontend/src/api/payments.ts enforces receipt presence in submitPaymentEvidence
it('frontend paymentsApi.submitPaymentEvidence requires payment_proof_url', () => {
  const content = fs.readFileSync('frontend/src/api/payments.ts', 'utf8');
  assert.ok(content.includes('if (!payload.payment_proof_url || !payload.payment_proof_url.trim())'), 'Client receipt check not found');
  assert.ok(content.includes('Payment receipt upload is required'), 'Client receipt error message not found');
});

// Test 6: frontend/src/api/checkout.ts validates mandatory fields before creating session
it('frontend checkoutApi.initializeSession enforces mandatory delivery fields', () => {
  const content = fs.readFileSync('frontend/src/api/checkout.ts', 'utf8');
  assert.ok(content.includes('Please enter your full name.'), 'Full name error not found in initializeSession');
  assert.ok(content.includes('Please enter an active phone number (at least 10 digits).'), 'Phone error not found in initializeSession');
  assert.ok(content.includes('Please select your state.'), 'State error not found in initializeSession');
  assert.ok(content.includes('Please select your town.'), 'Town error not found in initializeSession');
  assert.ok(content.includes('Please enter your complete delivery address.'), 'Address error not found in initializeSession');
});

// Test 7: CheckoutSessionPage verifies delivery details on load and enforces receipt on submit
it('CheckoutSessionPage enforces delivery access control and receipt upload', () => {
  const content = fs.readFileSync('frontend/src/pages/Checkout/CheckoutSessionPage.tsx', 'utf8');
  assert.ok(content.includes('Please complete all mandatory delivery information before accessing the payment page.'), 'Access control check not found');
  assert.ok(content.includes('navigate(\'/checkout\', { replace: true })'), 'Redirect to checkout not found');
  assert.ok(content.includes('if (!uploadedProofUrl || !uploadedProofUrl.trim())'), 'Proof URL upload check not found');
});

// Test 8: CheckoutPage has auto-directing focus refs and validation error messaging
it('CheckoutPage has auto-directing focus refs and validation error feedback', () => {
  const content = fs.readFileSync('frontend/src/pages/Checkout/CheckoutPage.tsx', 'utf8');
  assert.ok(content.includes('fullNameInputRef'), 'fullNameInputRef not found');
  assert.ok(content.includes('phoneInputRef'), 'phoneInputRef not found');
  assert.ok(content.includes('stateSelectRef'), 'stateSelectRef not found');
  assert.ok(content.includes('citySelectRef'), 'citySelectRef not found');
  assert.ok(content.includes('cityInputRef'), 'cityInputRef not found');
  assert.ok(content.includes('addressInputRef'), 'addressInputRef not found');
  assert.ok(content.includes('validationErrors'), 'validationErrors state not found');
  assert.ok(content.includes('scrollIntoView({ behavior: \'smooth\', block: \'center\' })'), 'Auto-direct smooth scroll not found');
  assert.ok(content.includes('clearFieldError'), 'clearFieldError not found');
});

console.log('--------------------------------------------------------');
console.log(`TOTAL PART A TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('--------------------------------------------------------');

if (failed > 0) process.exit(1);
