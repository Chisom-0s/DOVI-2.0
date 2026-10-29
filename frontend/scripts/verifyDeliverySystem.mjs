/**
 * DOVI E-COMMERCE DELIVERY PRICING, ORDER CONSOLIDATION & ONITSHA HUB FULFILLMENT
 * Automated End-to-End Verification Suite (Tests A through L)
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Provide browser localStorage & fetch shims before importing deliveryPricingService
const memoryStorage = new Map();
globalThis.window = {
  localStorage: {
    getItem: (key) => (memoryStorage.has(key) ? memoryStorage.get(key) : null),
    setItem: (key, val) => memoryStorage.set(key, String(val)),
    removeItem: (key) => memoryStorage.delete(key),
    clear: () => memoryStorage.clear(),
  },
  dispatchEvent: () => true,
  addEventListener: () => {},
};
globalThis.localStorage = globalThis.window.localStorage;
globalThis.CustomEvent = class CustomEvent {
  constructor(name, opts) {
    this.type = name;
    this.detail = opts?.detail;
  }
};
globalThis.fetch = async () => ({
  ok: true,
  json: async () => ({}),
});

// Dynamically transpile/load deliveryPricingService.ts using TypeScript compiler from frontend/node_modules
import ts from '../node_modules/typescript/lib/typescript.js';

const serviceTsPath = path.resolve(__dirname, '../src/services/deliveryPricingService.ts');
const tsSource = fs.readFileSync(serviceTsPath, 'utf8');

const transpiled = ts.transpileModule(tsSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
});

const tempMjsPath = path.resolve(__dirname, './_compiledDeliveryPricingService.mjs');
fs.writeFileSync(tempMjsPath, transpiled.outputText, 'utf8');

const service = await import(`file://${tempMjsPath.replace(/\\/g, '/')}`);

const {
  PRIMARY_DISPATCH_ORIGIN,
  createDeliveryRoute,
  updateDeliveryRoute,
  listDeliveryRoutes,
  listRateChangeHistory,
  calculateOrderDelivery,
  buildOrderShipmentsFromCalculation,
  updateShipmentItemHubStatus,
  updateShipmentStatus,
  approvePartialSplitDelivery,
  confirmManualDeliveryQuote,
  customerRespondToManualQuote,
  deriveOverallOrderStatus,
  reverifySessionDeliveryPricing,
  saveProductDeliveryAttributes,
  getProductDeliveryAttributes,
} = service;

const ADMIN_ACTOR = {
  id: 'admin_01',
  email: 'logistics.admin@dovi.com',
  name: 'Chukwudi Okafor (Onitsha Hub Admin)',
  role: 'ADMIN',
};

const BUYER_ACTOR = {
  id: 'buyer_99',
  email: 'customer@example.com',
  name: 'Regular Customer',
  role: 'BUYER',
};

console.log('===================================================================');
console.log('DOVI DELIVERY PRICING & ORDER CONSOLIDATION VERIFICATION SUITE');
console.log('===================================================================\n');

try {
  // Seed clean delivery routes for testing
  memoryStorage.clear();

  const lagosRoute = createDeliveryRoute(
    {
      dispatch_origin: PRIMARY_DISPATCH_ORIGIN,
      destination_state: 'Lagos',
      destination_city: 'Lagos',
      small_parcel_rate: 4500,
      heavy_parcel_rate: 9500,
      furniture_bulky_rate: 25000,
      combined_furniture_rate: 38000,
      special_handling_surcharge: 3000,
      allows_furniture_small_consolidation: false,
      max_furniture_items_consolidated: 2,
      max_small_parcel_weight_kg: 15,
      max_heavy_parcel_weight_kg: 80,
      special_delivery_requirements: 'Fragile & bulky cargo requires Onitsha Hub crating.',
      estimated_delivery_days: '2-4 business days',
      is_active: true,
    },
    ADMIN_ACTOR
  );

  const enuguRoute = createDeliveryRoute(
    {
      dispatch_origin: PRIMARY_DISPATCH_ORIGIN,
      destination_state: 'Enugu',
      destination_city: 'Enugu',
      small_parcel_rate: 2500,
      heavy_parcel_rate: 5500,
      furniture_bulky_rate: 14000,
      combined_furniture_rate: 20000,
      special_handling_surcharge: 1500,
      allows_furniture_small_consolidation: true,
      max_furniture_items_consolidated: 2,
      max_small_parcel_weight_kg: 15,
      max_heavy_parcel_weight_kg: 80,
      estimated_delivery_days: '1-2 business days',
      is_active: true,
    },
    ADMIN_ACTOR
  );

  // ------------------------------------------------------------------
  // TEST A: Single small parcel item
  // ------------------------------------------------------------------
  const testA = calculateOrderDelivery({
    destinationState: 'Lagos',
    destinationCity: 'Lagos',
    items: [
      {
        product_id: 'prod_shirt_1',
        product_name: 'Classic Cotton Shirt',
        quantity: 1,
        unit_price: 15000,
        delivery_classification: 'SMALL_PARCEL',
        weight_kg: 0.4,
      },
    ],
  });
  assert.equal(testA.shipment_count, 1, 'Test A: Expected 1 shipment');
  assert.equal(testA.total_delivery_fee, 4500, 'Test A: Expected 1 Small Parcel delivery fee (4500)');
  assert.equal(testA.total_payable, 19500, 'Test A: Expected 15000 + 4500 = 19500');
  console.log('[PASS] Test A — Single Small Parcel item: 1 shipment, 1 Small Parcel fee (₦4,500)');

  // ------------------------------------------------------------------
  // TEST B: Multiple small parcel items (3 clothes -> 1 consolidated shipment, 1 fee)
  // ------------------------------------------------------------------
  const testB = calculateOrderDelivery({
    destinationState: 'Lagos',
    destinationCity: 'Lagos',
    items: [
      {
        product_id: 'prod_shirt_1',
        product_name: 'Classic Cotton Shirt',
        quantity: 2,
        unit_price: 15000,
        delivery_classification: 'SMALL_PARCEL',
        weight_kg: 0.4,
      },
      {
        product_id: 'prod_trouser_1',
        product_name: 'Chino Trousers',
        quantity: 1,
        unit_price: 20000,
        delivery_classification: 'SMALL_PARCEL',
        weight_kg: 0.6,
      },
    ],
  });
  assert.equal(testB.shipment_count, 1, 'Test B: Expected 1 consolidated shipment');
  assert.equal(testB.total_delivery_fee, 4500, 'Test B: Expected single Small Parcel fee (NOT multiplied by 3)');
  console.log('[PASS] Test B — Multiple Small Parcel items (3 clothes): 1 consolidated shipment, 1 fee (₦4,500)');

  // ------------------------------------------------------------------
  // TEST C: Mixed small items across categories (shirt, shoes, wristwatch, phone)
  // ------------------------------------------------------------------
  const testC = calculateOrderDelivery({
    destinationState: 'Lagos',
    destinationCity: 'Lagos',
    items: [
      {
        product_id: 'prod_shirt',
        product_name: 'Designer Linen Shirt',
        quantity: 1,
        unit_price: 18000,
        delivery_classification: 'SMALL_PARCEL',
        weight_kg: 0.4,
      },
      {
        product_id: 'prod_shoes',
        product_name: 'Leather Loafers',
        quantity: 1,
        unit_price: 35000,
        delivery_classification: 'SMALL_PARCEL',
        weight_kg: 1.1,
      },
      {
        product_id: 'prod_watch',
        product_name: 'Chronograph Wristwatch',
        quantity: 1,
        unit_price: 42000,
        delivery_classification: 'SMALL_PARCEL',
        weight_kg: 0.3,
      },
      {
        product_id: 'prod_phone',
        product_name: '5G Smartphone',
        quantity: 1,
        unit_price: 210000,
        delivery_classification: 'SMALL_PARCEL',
        weight_kg: 0.5,
      },
    ],
  });
  assert.equal(testC.shipment_count, 1, 'Test C: Expected 1 consolidated shipment across 4 categories');
  assert.equal(testC.total_delivery_fee, 4500, 'Test C: Expected 1 Small Parcel delivery fee (₦4,500)');
  console.log('[PASS] Test C — Mixed Small Items across categories (shirt, shoes, watch, phone): 1 shipment, 1 fee (₦4,500)');

  // ------------------------------------------------------------------
  // TEST D: Small parcel + Heavy parcel (clothes + standing fan)
  // Expected: 1 combined Heavy Parcel shipment, 1 Heavy Parcel fee (NOT Small + Heavy)
  // ------------------------------------------------------------------
  const testD = calculateOrderDelivery({
    destinationState: 'Lagos',
    destinationCity: 'Lagos',
    items: [
      {
        product_id: 'prod_shirt',
        product_name: 'Cotton Polo Shirt',
        quantity: 1,
        unit_price: 12000,
        delivery_classification: 'SMALL_PARCEL',
        weight_kg: 0.4,
      },
      {
        product_id: 'prod_fan',
        product_name: '18-Inch Rechargeable Standing Fan',
        quantity: 1,
        unit_price: 68000,
        delivery_classification: 'HEAVY_PARCEL',
        weight_kg: 9.5,
      },
    ],
  });
  assert.equal(testD.shipment_count, 1, 'Test D: Expected 1 combined Heavy Parcel shipment');
  assert.equal(
    testD.shipments[0].shipment_classification,
    'HEAVY_PARCEL',
    'Test D: Combined shipment classification should be HEAVY_PARCEL'
  );
  assert.equal(
    testD.total_delivery_fee,
    9500,
    'Test D: Expected single Heavy Parcel fee (9500), NOT Small (4500) + Heavy (9500)'
  );
  console.log('[PASS] Test D — Small Parcel + Heavy Parcel (clothes + standing fan): 1 combined Heavy Parcel shipment (₦9,500)');

  // ------------------------------------------------------------------
  // TEST E: Small parcel + Furniture (clothes + chair)
  // Case E1 (Lagos route disallowing small+furniture merge): separates into 2 shipments with clear explanation
  // Case E2 (Enugu route + product allowing consolidation): consolidates into 1 shipment
  // ------------------------------------------------------------------
  const testE_Split = calculateOrderDelivery({
    destinationState: 'Lagos',
    destinationCity: 'Lagos',
    items: [
      {
        product_id: 'prod_shirt',
        product_name: 'Cotton Shirt',
        quantity: 1,
        unit_price: 15000,
        delivery_classification: 'SMALL_PARCEL',
        can_consolidate_with_furniture: false,
      },
      {
        product_id: 'prod_chair',
        product_name: 'Ergonomic Executive Office Chair',
        quantity: 1,
        unit_price: 145000,
        delivery_classification: 'FURNITURE_BULKY',
      },
    ],
  });
  assert.equal(testE_Split.shipment_count, 2, 'Test E (Split): Expected 2 shipments when route/product disallows merge');
  assert.equal(testE_Split.total_delivery_fee, 4500 + 25000, 'Test E (Split): Expected 4500 + 25000 = 29500');
  assert.ok(testE_Split.shipments[1].separation_reason, 'Test E (Split): Must include clear separation reason');

  const testE_Consolidated = calculateOrderDelivery({
    destinationState: 'Enugu',
    destinationCity: 'Enugu',
    items: [
      {
        product_id: 'prod_shirt',
        product_name: 'Cotton Shirt',
        quantity: 1,
        unit_price: 15000,
        delivery_classification: 'SMALL_PARCEL',
        can_consolidate_with_furniture: true,
      },
      {
        product_id: 'prod_chair',
        product_name: 'Ergonomic Executive Office Chair',
        quantity: 1,
        unit_price: 145000,
        delivery_classification: 'FURNITURE_BULKY',
        can_consolidate_with_furniture: true,
      },
    ],
  });
  assert.equal(testE_Consolidated.shipment_count, 1, 'Test E (Consolidated): Expected 1 consolidated shipment when allowed');
  assert.equal(testE_Consolidated.total_delivery_fee, 14000, 'Test E (Consolidated): Expected single Furniture transport fee');
  console.log('[PASS] Test E — Small Parcel + Furniture (clothes + chair): Verified both consolidated (₦14,000) and separated (2 shipments with explanation) modes');

  // ------------------------------------------------------------------
  // TEST F: Multiple furniture items (2 chairs)
  // Expected: Uses combined furniture rate (38,000) or manual quote — NEVER 2 * 25,000 (50,000)
  // ------------------------------------------------------------------
  const testF_Combined = calculateOrderDelivery({
    destinationState: 'Lagos',
    destinationCity: 'Lagos',
    items: [
      {
        product_id: 'prod_chair_1',
        product_name: 'Executive Office Chair',
        quantity: 2,
        unit_price: 145000,
        delivery_classification: 'FURNITURE_BULKY',
      },
    ],
  });
  assert.equal(testF_Combined.shipment_count, 1, 'Test F: Expected 1 combined furniture shipment');
  assert.equal(
    testF_Combined.total_delivery_fee,
    38000,
    'Test F: Expected combined furniture rate (38000), NOT 2 * 25000 (50000)'
  );

  const testF_ExceedsLimit = calculateOrderDelivery({
    destinationState: 'Lagos',
    destinationCity: 'Lagos',
    items: [
      {
        product_id: 'prod_chair_1',
        product_name: 'Executive Office Chair',
        quantity: 4,
        unit_price: 145000,
        delivery_classification: 'FURNITURE_BULKY',
      },
    ],
  });
  assert.equal(testF_ExceedsLimit.requires_manual_quote, true, 'Test F (4 chairs): Expected manual quotation required');
  assert.equal(testF_ExceedsLimit.total_delivery_fee, null, 'Test F (4 chairs): Delivery fee must be null pending manual quote');
  console.log('[PASS] Test F — Multiple Furniture items: Uses combined furniture rate (₦38,000) or manual quote, never multiplies single furniture rate');

  // ------------------------------------------------------------------
  // TEST G: Missing route rate & Manual Quotation Workflow
  // Expected: Never ₦0; requires manual confirmation -> admin confirms -> customer accepts
  // ------------------------------------------------------------------
  const testG = calculateOrderDelivery({
    destinationState: 'Borno',
    destinationCity: 'Maiduguri',
    items: [
      {
        product_id: 'prod_shirt',
        product_name: 'Classic Cotton Shirt',
        quantity: 1,
        unit_price: 15000,
        delivery_classification: 'SMALL_PARCEL',
      },
    ],
  });
  assert.equal(testG.route_found, false, 'Test G: Route should not be found');
  assert.equal(testG.requires_manual_quote, true, 'Test G: Must require manual delivery confirmation');
  assert.equal(testG.total_delivery_fee, null, 'Test G: Missing route rate must NEVER default to 0');
  assert.equal(testG.total_payable, null, 'Test G: Total payable must be null until quote is confirmed');

  // Create order shipments for manual quote order, confirm as Admin, and accept as Customer
  const manualShipments = buildOrderShipmentsFromCalculation(
    'ord_manual_1',
    'DOVI-MQ-1001',
    testG,
    '15 Airport Road, Maiduguri, Borno',
    'Musa Ibrahim',
    '08030001111'
  );
  assert.equal(manualShipments[0].status, 'AWAITING_DELIVERY_CONFIRMATION');
  assert.equal(manualShipments[0].manual_quote_status, 'PENDING_ADMIN_QUOTE');

  const confirmedQuote = confirmManualDeliveryQuote(
    'DOVI-MQ-1001',
    [
      {
        shipmentId: manualShipments[0].id,
        confirmedDeliveryFee: 8500,
        transportArrangement: 'DOVI Northern Express Line from Onitsha Hub',
        deliveryNotes: 'Confirmed with transport partner.',
      },
    ],
    ADMIN_ACTOR
  );
  assert.equal(confirmedQuote.totalDeliveryFee, 8500, 'Test G: Admin confirmed fee should be 8500');
  assert.equal(confirmedQuote.shipments[0].status, 'DELIVERY_FEE_CONFIRMED');
  assert.equal(confirmedQuote.shipments[0].manual_quote_status, 'QUOTED_AWAITING_CUSTOMER');

  const customerAccepted = customerRespondToManualQuote('DOVI-MQ-1001', true);
  assert.equal(customerAccepted.status, 'CUSTOMER_ACCEPTED');
  assert.equal(customerAccepted.shipments[0].status, 'ORDER_PLACED');
  console.log('[PASS] Test G — Missing route rate: Requires manual quote (never ₦0), Admin confirms fee (₦8,500), Customer accepts');

  // ------------------------------------------------------------------
  // TEST H: Admin rate update & Audit History + Pre-payment Re-verification
  // ------------------------------------------------------------------
  const initialUpdatedAt = lagosRoute.updated_at;
  const updatedLagos = updateDeliveryRoute(
    lagosRoute.id,
    {
      small_parcel_rate: 5200,
      reason: 'Courier fuel adjustment Q4',
    },
    ADMIN_ACTOR
  );
  assert.equal(updatedLagos.small_parcel_rate, 5200, 'Test H: Updated small parcel rate should be 5200');
  assert.equal(updatedLagos.updated_by_email, ADMIN_ACTOR.email, 'Test H: Must record updated_by_email');

  const auditLogs = listRateChangeHistory(lagosRoute.id);
  assert.ok(auditLogs.length >= 1, 'Test H: Rate change history must record the update');
  const latestLog = auditLogs.find((l) => l.previous_rate === 4500 && l.new_rate === 5200);
  assert.ok(latestLog, 'Test H: Audit log must contain previous_rate (4500) -> new_rate (5200)');
  assert.equal(latestLog.changed_by_email, ADMIN_ACTOR.email);
  assert.equal(latestLog.reason, 'Courier fuel adjustment Q4');

  // Verify checkout re-verification detects rate change before payment
  const reverify = reverifySessionDeliveryPricing({
    items: [
      {
        product_id: 'prod_shirt_1',
        product_name: 'Classic Cotton Shirt',
        quantity: 1,
        unit_price: 15000,
        delivery_classification: 'SMALL_PARCEL',
      },
    ],
    destinationState: 'Lagos',
    destinationCity: 'Lagos',
    previousDeliveryFee: 4500,
    previousRouteUpdatedAt: initialUpdatedAt,
  });
  assert.equal(reverify.priceChanged, true, 'Test H: Pre-payment re-verification must detect rate change');
  assert.equal(reverify.updatedCalculation.total_delivery_fee, 5200);
  console.log('[PASS] Test H — Admin rate update: Dynamically updates checkout, logs immutable audit history, and triggers pre-payment re-verification');

  // ------------------------------------------------------------------
  // TEST I: Unauthorized rate update (Non-admin user receives 403 FORBIDDEN)
  // ------------------------------------------------------------------
  let unauthorizedBlocked = false;
  try {
    updateDeliveryRoute(
      lagosRoute.id,
      { small_parcel_rate: 1000 },
      BUYER_ACTOR
    );
  } catch (err) {
    unauthorizedBlocked = err.status === 403 || String(err.message).includes('403');
  }
  assert.equal(unauthorizedBlocked, true, 'Test I: Non-admin user must be rejected with 403 FORBIDDEN');
  console.log('[PASS] Test I — Unauthorized rate update: Non-admin user rejected with 403 FORBIDDEN');

  // ------------------------------------------------------------------
  // TEST J: Multi-product fulfillment at Onitsha Hub & Split Delivery
  // ------------------------------------------------------------------
  const multiCalc = calculateOrderDelivery({
    destinationState: 'Lagos',
    destinationCity: 'Lagos',
    items: [
      {
        id: 'item_shirt',
        product_id: 'prod_shirt',
        product_name: 'Classic Cotton Shirt',
        quantity: 1,
        unit_price: 15000,
        delivery_classification: 'SMALL_PARCEL',
      },
      {
        id: 'item_shoes',
        product_id: 'prod_shoes',
        product_name: 'Leather Loafers',
        quantity: 1,
        unit_price: 35000,
        delivery_classification: 'SMALL_PARCEL',
      },
    ],
  });

  const hubShipments = buildOrderShipmentsFromCalculation(
    'ord_hub_1',
    'DOVI-HUB-2002',
    multiCalc,
    '22 Admiralty Way, Lekki, Lagos',
    'Adaobi Nwosu',
    '08091112222'
  );
  const mainShipmentId = hubShipments[0].id;

  // Supplier 1 delivers Shirt to Onitsha Hub, but Shoes are still delayed
  const afterPartialArrival = updateShipmentItemHubStatus(
    'DOVI-HUB-2002',
    mainShipmentId,
    'item_shirt',
    { hub_received: true, quality_checked: true, packaged: true },
    ADMIN_ACTOR
  );
  assert.equal(
    afterPartialArrival.status,
    'AWAITING_PRODUCTS_AT_HUB',
    'Test J: Shipment must remain AWAITING_PRODUCTS_AT_HUB when 1 item arrived and 1 item is still pending'
  );

  // Attempting to dispatch before all items are received/inspected/packaged must be blocked
  let prematureDispatchBlocked = false;
  try {
    updateShipmentStatus('DOVI-HUB-2002', mainShipmentId, 'DISPATCHED', ADMIN_ACTOR);
  } catch (err) {
    prematureDispatchBlocked = String(err.message).includes('Onitsha Hub Guard');
  }
  assert.equal(prematureDispatchBlocked, true, 'Test J: Onitsha Hub Guard must block premature dispatch');

  // Admin approves split delivery for the arrived item while the delayed item stays in a 2nd shipment
  const splitShipments = approvePartialSplitDelivery('DOVI-HUB-2002', mainShipmentId, ADMIN_ACTOR, 0);
  assert.equal(splitShipments.length, 2, 'Test J: Split delivery should produce 2 shipments');
  assert.equal(splitShipments[0].status, 'PACKAGED', 'Test J: Ready shipment is PACKAGED');
  assert.equal(splitShipments[1].status, 'AWAITING_PRODUCTS_AT_HUB', 'Test J: Delayed shipment is AWAITING_PRODUCTS_AT_HUB');

  // Dispatch and deliver Shipment 1, while Shipment 2 is still at Hub
  updateShipmentStatus('DOVI-HUB-2002', splitShipments[0].id, 'DISPATCHED', ADMIN_ACTOR);
  const afterFirstDelivered = updateShipmentStatus('DOVI-HUB-2002', splitShipments[0].id, 'DELIVERED', ADMIN_ACTOR);
  assert.notEqual(
    afterFirstDelivered.overallOrderStatus,
    'DELIVERED',
    'Test J (Section 6 Rule): Overall order MUST NOT be marked DELIVERED until ALL shipments are DELIVERED'
  );

  // Now receive, inspect, package, dispatch, and deliver Shipment 2
  updateShipmentItemHubStatus(
    'DOVI-HUB-2002',
    splitShipments[1].id,
    'item_shoes',
    { hub_received: true, quality_checked: true, packaged: true },
    ADMIN_ACTOR
  );
  const afterAllDelivered = updateShipmentStatus('DOVI-HUB-2002', splitShipments[1].id, 'DELIVERED', ADMIN_ACTOR);
  assert.equal(
    afterAllDelivered.overallOrderStatus,
    'DELIVERED',
    'Test J: Overall order becomes DELIVERED once all shipments are DELIVERED'
  );
  console.log('[PASS] Test J — Multi-product Onitsha Hub fulfillment: Holds for consolidation, blocks premature dispatch, supports split delivery, and only marks order DELIVERED when all shipments are DELIVERED');

  // ------------------------------------------------------------------
  // TEST K: Checkout total accuracy
  // ------------------------------------------------------------------
  assert.equal(
    testC.product_subtotal + testC.total_delivery_fee,
    testC.total_payable,
    'Test K: product_subtotal + total_delivery_fee must equal total_payable'
  );
  assert.equal(
    testE_Split.product_subtotal + testE_Split.total_delivery_fee,
    testE_Split.total_payable,
    'Test K (Multi-shipment): product_subtotal + total_delivery_fee must equal total_payable'
  );
  console.log('[PASS] Test K — Checkout total accuracy: Product subtotal + delivery fee(s) === total payable');

  // ------------------------------------------------------------------
  // TEST L: Admin Product Delivery Classification Override
  // ------------------------------------------------------------------
  saveProductDeliveryAttributes(
    'prod_custom_bulky_speaker',
    {
      delivery_classification: 'FURNITURE_BULKY',
      weight_kg: 45,
      dimensions_cm: '120x60x60',
      requires_special_handling: true,
      can_consolidate_with_furniture: false,
      delivery_notes: 'Concert PA speaker requiring upright crating.',
    },
    ADMIN_ACTOR
  );
  const retrievedAttrs = getProductDeliveryAttributes({ id: 'prod_custom_bulky_speaker' });
  assert.equal(retrievedAttrs.delivery_classification, 'FURNITURE_BULKY');
  assert.equal(retrievedAttrs.weight_kg, 45);
  console.log('[PASS] Test L — Admin per-product delivery classification & attribute persistence verified');

  console.log('\n===================================================================');
  console.log('ALL 12 TEST SUITES (TESTS A THROUGH L) PASSED SUCCESSFULLY!');
  console.log('===================================================================');
} finally {
  try {
    fs.unlinkSync(tempMjsPath);
  } catch {}
}

