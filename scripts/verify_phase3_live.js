/**
 * DOVI Phase 3 Client & Serverless Verification Script
 */

const fs = require('fs');
const path = require('path');

function runChecks() {
  console.log('=' .repeat(70));
  console.log('DOVI PHASE 3 - CLIENT & ENDPOINT INTEGRITY CHECK');
  console.log('=' .repeat(70));

  // 1. Check api/__dovi_delivery_db__.js
  const apiPath = path.join(__dirname, '..', 'api', '__dovi_delivery_db__.js');
  const apiContent = fs.readFileSync(apiPath, 'utf8');
  if (!apiContent.includes('403') || !apiContent.includes('ENDPOINT_DECOMMISSIONED')) {
    throw new Error('api/__dovi_delivery_db__.js is not decommissioned!');
  }
  console.log('[1] /api/__dovi_delivery_db__.js returns 403 ENDPOINT_DECOMMISSIONED: OK');

  // 2. Check vercel.json
  const vercelPath = path.join(__dirname, '..', 'vercel.json');
  const vercelContent = fs.readFileSync(vercelPath, 'utf8');
  if (vercelContent.includes('/__dovi_delivery_db__') || vercelContent.includes('/delivery_store.json')) {
    throw new Error('vercel.json still has datastore rewrites!');
  }
  console.log('[2] vercel.json removed direct datastore rewrites: OK');

  // 3. Check frontend orderPaymentSync.ts
  const feSyncPath = path.join(__dirname, '..', 'frontend', 'src', 'services', 'orderPaymentSync.ts');
  const feSyncContent = fs.readFileSync(feSyncPath, 'utf8');
  if (feSyncContent.includes('fetch(\'/__dovi_delivery_db__\', {') && feSyncContent.includes('method: \'POST\'')) {
    throw new Error('frontend orderPaymentSync still attempts direct client POSTs!');
  }
  console.log('[3] frontend orderPaymentSync client push deactivated: OK');

  // 4. Check admin orderPaymentSync.ts
  const admSyncPath = path.join(__dirname, '..', 'admin', 'src', 'services', 'orderPaymentSync.ts');
  const admSyncContent = fs.readFileSync(admSyncPath, 'utf8');
  if (admSyncContent.includes('fetch(\'/__dovi_delivery_db__\', {') && admSyncContent.includes('method: \'POST\'')) {
    throw new Error('admin orderPaymentSync still attempts direct client POSTs!');
  }
  console.log('[4] admin orderPaymentSync client push deactivated: OK');

  // 5. Check Save2Own client fallback removal
  const s2oPath = path.join(__dirname, '..', 'frontend', 'src', 'api', 'save2own.ts');
  const s2oContent = fs.readFileSync(s2oPath, 'utf8');
  if (s2oContent.includes('identity_locked: false') || s2oContent.includes('expires_in_minutes: 30')) {
    throw new Error('Save2Own client still has automatic unlock fallback!');
  }
  console.log('[5] Save2Own client-side unlock fallback removed: OK');

  console.log('=' .repeat(70));
  console.log('ALL PHASE 3 INTEGRITY CHECKS PASSED SUCCESSFULLY!');
  console.log('=' .repeat(70));
}

runChecks();
