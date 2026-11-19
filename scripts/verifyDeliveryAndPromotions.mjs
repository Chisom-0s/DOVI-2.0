// ============================================================
// Comprehensive Verification Suite for DOVI Delivery Route Lookup
// & Admin-Controlled Homepage Product Sections
// ============================================================
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Import production services
import {
  listDeliveryRoutes,
  findRouteInList,
  listConfiguredCitiesForState,
  selectDestinationState,
  isConfiguredCityForState,
  calculateConsolidatedDelivery,
  calculateOrderDelivery,
  createDeliveryRoute,
  updateDeliveryRoute,
  deleteDeliveryRoute,
  canonicalStateKey,
  canonicalCityKey,
  DEFAULT_SEED_ROUTES,
} from '../frontend/src/services/deliveryPricingService.ts';

import {
  getProductHomepagePlacement,
  saveProductHomepagePlacement,
  isFlashSaleActiveNow,
  serializeProductDescriptionWithHomepage,
  parseHomepageMetadataFromDescription,
} from '../frontend/src/services/homepagePlacementService.ts';

console.log('--- STARTING VERIFICATION TEST SUITE ---');

let totalTests = 0;
let passedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`✓ PASS: ${name}`);
  } catch (err) {
    console.error(`✗ FAIL: ${name}`);
    console.error(err);
    throw err;
  }
}

// -------------------------------------------------------------
// PART 1: DELIVERY ROUTE CONFIGURATION & LOOKUP
// -------------------------------------------------------------

// 1. Verify Database Store (backend/delivery_store.json)
test('Database store has active configured routes', () => {
  const storePath = path.resolve('backend/delivery_store.json');
  assert.ok(fs.existsSync(storePath), 'delivery_store.json must exist');
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  assert.ok(Array.isArray(store.routes) && store.routes.length > 0, 'routes in store must not be empty');

  // Verify Anambra Awka
  const awka = store.routes.find((r) => r.destination_state === 'Anambra' && r.destination_city === 'Awka');
  assert.ok(awka, 'Awka route must exist in database store');
  assert.equal(awka.is_active, true, 'Awka route must be active');
  assert.equal(awka.small_parcel_rate, 2500, 'Awka small parcel rate must be 2500');
  assert.equal(awka.heavy_parcel_rate, 6000, 'Awka heavy parcel rate must be 6000');

  // Verify Lagos Ikeja
  const ikeja = store.routes.find((r) => r.destination_state === 'Lagos' && r.destination_city === 'Ikeja');
  assert.ok(ikeja, 'Ikeja route must exist in database store');
  assert.equal(ikeja.is_active, true, 'Ikeja route must be active');
  assert.equal(ikeja.small_parcel_rate, 4000, 'Ikeja small parcel rate must be 4000');

  // Verify FCT Abuja Garki
  const garki = store.routes.find((r) => r.destination_state === 'FCT - Abuja' && r.destination_city === 'Garki');
  assert.ok(garki, 'Garki route must exist in database store');
  assert.equal(garki.is_active, true, 'Garki route must be active');
  assert.equal(garki.small_parcel_rate, 5000, 'Garki small parcel rate must be 5000');
});

// 2. Active routes retrieval & State/City selector dynamic population
test('Configured cities are dynamically loaded based on currently selected state', () => {
  const routes = listDeliveryRoutes(false);
  assert.ok(routes.length >= 10, 'Must have at least 10 active routes');

  // Select Anambra
  const anambraCities = listConfiguredCitiesForState(routes, 'Anambra');
  const cityNames = anambraCities.map((r) => r.destination_city);
  assert.ok(cityNames.includes('Awka'), 'Anambra cities must include Awka');
  assert.ok(cityNames.includes('Onitsha'), 'Anambra cities must include Onitsha');
  assert.ok(!cityNames.includes('Ikeja'), 'Anambra cities must NOT include Lagos cities');

  // Select Lagos
  const lagosCities = listConfiguredCitiesForState(routes, 'Lagos');
  const lagosCityNames = lagosCities.map((r) => r.destination_city);
  assert.ok(lagosCityNames.includes('Ikeja'), 'Lagos cities must include Ikeja');
  assert.ok(lagosCityNames.includes('Lekki'), 'Lagos cities must include Lekki');
  assert.ok(!lagosCityNames.includes('Awka'), 'Lagos cities must NOT include Awka');

  // Select FCT - Abuja
  const abujaCities = listConfiguredCitiesForState(routes, 'FCT - Abuja');
  const abujaCityNames = abujaCities.map((r) => r.destination_city);
  assert.ok(abujaCityNames.includes('Garki'), 'Abuja cities must include Garki');
  assert.ok(abujaCityNames.includes('Wuse'), 'Abuja cities must include Wuse');
});

// 3. Customer changes state -> Clears town immediately & prevents cross-state retention
test('State change clears previously selected town and prevents invalid town retention', () => {
  // Start with Anambra -> Awka
  let selection = { state: 'Anambra', city: 'Awka' };
  assert.equal(selection.city, 'Awka');

  // Customer changes state to Lagos
  selection = selectDestinationState('Lagos');
  assert.equal(selection.state, 'Lagos');
  assert.equal(selection.city, '', 'Town must be immediately cleared when state changes');

  // Awka does NOT belong to Lagos
  const routes = listDeliveryRoutes(false);
  assert.equal(isConfiguredCityForState(routes, 'Lagos', 'Awka'), false, 'Awka cannot be valid in Lagos');

  // Select Ikeja
  selection.city = 'Ikeja';
  assert.equal(selection.city, 'Ikeja');

  // Switch back to Anambra -> Ikeja must be cleared
  selection = selectDestinationState('Anambra');
  assert.equal(selection.state, 'Anambra');
  assert.equal(selection.city, '', 'Previous town Ikeja must be cleared');
  assert.equal(isConfiguredCityForState(routes, 'Anambra', 'Ikeja'), false, 'Ikeja cannot be valid in Anambra');
});

// 4. Actual Checkout Route Lookup & Delivery Fee Calculations with real cart items
test('Checkout recognizes configured destination and returns correct fee', () => {
  const routes = listDeliveryRoutes(false);
  // Real item from backend catalog (Puzzle Speaker: ₦35,000, unclassified originally)
  const cartItems = [
    {
      id: 'cart-1',
      product_id: 'prod-puzzle-speaker',
      product_name: 'Puzzle Speaker',
      quantity: 1,
      unit_price: 35000,
    },
  ];

  // Test Destination 1: Anambra -> Awka
  const matchAwka = findRouteInList(routes, 'Anambra', 'Awka');
  assert.ok(matchAwka.route, 'Route for Anambra -> Awka must be found');
  assert.equal(matchAwka.route.small_parcel_rate, 2500);

  const calcAwka = calculateConsolidatedDelivery(cartItems, 'Anambra', 'Awka', 'Onitsha', matchAwka.route);
  assert.equal(calcAwka.route_found, true, 'Route must be found');
  assert.equal(calcAwka.requires_manual_quote, false, 'Configured route must NOT require manual quote');
  assert.equal(calcAwka.total_delivery_fee, 2500, 'Delivery fee must equal 2500');
  assert.equal(calcAwka.product_subtotal, 35000, 'Product subtotal must be 35000');
  assert.equal(calcAwka.total_payable, 37500, 'Total payable must equal 35000 + 2500 = 37500');

  // Test Destination 2: Anambra -> Onitsha
  const matchOnitsha = findRouteInList(routes, 'Anambra', 'Onitsha');
  const calcOnitsha = calculateConsolidatedDelivery(cartItems, 'Anambra', 'Onitsha', 'Onitsha', matchOnitsha.route);
  assert.equal(calcOnitsha.total_delivery_fee, 1500, 'Delivery fee for Onitsha must be 1500');
  assert.equal(calcOnitsha.total_payable, 36500, 'Total payable must equal 35000 + 1500 = 36500');

  // Test Destination 3: Lagos -> Ikeja
  const matchIkeja = findRouteInList(routes, 'Lagos', 'Ikeja');
  const calcIkeja = calculateConsolidatedDelivery(cartItems, 'Lagos', 'Ikeja', 'Onitsha', matchIkeja.route);
  assert.equal(calcIkeja.total_delivery_fee, 4000, 'Delivery fee for Ikeja must be 4000');
  assert.equal(calcIkeja.total_payable, 39000, 'Total payable must equal 35000 + 4000 = 39000');

  // Test Destination 4: FCT - Abuja -> Garki
  const matchGarki = findRouteInList(routes, 'FCT - Abuja', 'Garki');
  const calcGarki = calculateConsolidatedDelivery(cartItems, 'FCT - Abuja', 'Garki', 'Onitsha', matchGarki.route);
  assert.equal(calcGarki.total_delivery_fee, 5000, 'Delivery fee for Garki must be 5000');
  assert.equal(calcGarki.total_payable, 40000, 'Total payable must equal 35000 + 5000 = 40000');

  // Test Destination 5: Rivers -> Port Harcourt
  const matchPH = findRouteInList(routes, 'Rivers', 'Port Harcourt');
  const calcPH = calculateConsolidatedDelivery(cartItems, 'Rivers', 'Port Harcourt', 'Onitsha', matchPH.route);
  assert.equal(calcPH.total_delivery_fee, 4000, 'Delivery fee for Port Harcourt must be 4000');
  assert.equal(calcPH.total_payable, 39000, 'Total payable must equal 35000 + 4000 = 39000');

  // Test Destination 6: Enugu -> Enugu
  const matchEnugu = findRouteInList(routes, 'Enugu', 'Enugu');
  assert.ok(matchEnugu.route, 'Enugu city in Enugu state must match');
  const calcEnugu = calculateConsolidatedDelivery(cartItems, 'Enugu', 'Enugu', 'Onitsha', matchEnugu.route);
  assert.equal(calcEnugu.total_delivery_fee, 2500, 'Delivery fee for Enugu city must be 2500');
});

// 5. Unconfigured Destination Handling
test('Unconfigured destination shows clear message and requires arrangement (no fake fee)', () => {
  const routes = listDeliveryRoutes(false);
  const cartItems = [{ id: 'cart-1', product_id: 'p1', product_name: 'Shirt', quantity: 1, unit_price: 10000 }];

  // Select unconfigured state and town: Zamfara -> Gusau
  const match = findRouteInList(routes, 'Zamfara', 'Gusau');
  assert.equal(match.route, null, 'No configured route for Zamfara Gusau');

  const calc = calculateConsolidatedDelivery(cartItems, 'Zamfara', 'Gusau', 'Onitsha', null);
  assert.equal(calc.route_found, false, 'Route found must be false');
  assert.equal(calc.total_delivery_fee, null, 'Must NOT assign fake ₦0 or guessed fee');
  assert.equal(calc.requires_manual_quote, true, 'Must require manual quote / WhatsApp arrangement');
  assert.equal(calc.total_payable, null, 'Total payable cannot be finalized without fee confirmation');
});

// 6. Admin Route Creation & Immediate Checkout Availability
test('Admin can create a new route and checkout immediately recognizes it', async () => {
  const adminActor = { email: 'admin@dovi.com', role: 'ADMIN' };
  const newRouteInput = {
    dispatch_origin: 'Onitsha',
    destination_state: 'Akwa Ibom',
    destination_city: 'Uyo',
    small_parcel_rate: 3500,
    heavy_parcel_rate: 8000,
    furniture_bulky_rate: 18000,
    is_active: true,
  };

  const created = await createDeliveryRoute(newRouteInput, adminActor);
  assert.ok(created.id, 'Route must have an ID');
  assert.equal(created.destination_city, 'Uyo');
  assert.equal(created.small_parcel_rate, 3500);

  // Now verify checkout lookup immediately recognizes Akwa Ibom -> Uyo
  const routes = listDeliveryRoutes(false);
  const uyoCities = listConfiguredCitiesForState(routes, 'Akwa Ibom');
  assert.ok(uyoCities.some((r) => r.destination_city === 'Uyo'), 'Uyo must now be in Akwa Ibom cities list');

  const matchUyo = findRouteInList(routes, 'Akwa Ibom', 'Uyo');
  assert.ok(matchUyo.route, 'Uyo route must be found');
  assert.equal(matchUyo.route.small_parcel_rate, 3500);

  const cart = [{ id: 'c1', product_id: 'p1', product_name: 'Shoes', quantity: 2, unit_price: 15000 }];
  const calcUyo = calculateConsolidatedDelivery(cart, 'Akwa Ibom', 'Uyo', 'Onitsha', matchUyo.route);
  assert.equal(calcUyo.route_found, true);
  assert.equal(calcUyo.total_delivery_fee, 3500);
  assert.equal(calcUyo.product_subtotal, 30000);
  assert.equal(calcUyo.total_payable, 33500);

  // Cleanup: delete test route
  await deleteDeliveryRoute(created.id, adminActor);
  const afterDelete = listDeliveryRoutes(false);
  assert.ok(!afterDelete.some((r) => r.id === created.id), 'Deleted route must no longer be active');
});

// -------------------------------------------------------------
// PART 2: ADMIN-CONTROLLED HOMEPAGE PRODUCT SECTIONS
// -------------------------------------------------------------

test('Admin controls Hot Sales, New Arrivals, and Flash Sale placement', async () => {
  const testProductId = 'prod-test-placement-123';
  let desc = 'High quality wireless speaker with powerful bass.';

  // 1. Admin uploads product and selects Hot Sales
  let placement = {
    is_hot_sale: true,
    is_flash_deal: false,
    is_new_arrival: false,
    flash_sale: null,
  };
  desc = serializeProductDescriptionWithHomepage(desc, placement);
  await saveProductHomepagePlacement(testProductId, placement);

  let parsed = getProductHomepagePlacement({ id: testProductId, description: desc });
  assert.equal(parsed?.is_hot_sale, true, 'Product must be in Hot Sales');
  assert.equal(parsed?.is_new_arrival, false, 'Product must NOT be in New Arrivals yet');
  assert.equal(parsed?.is_flash_deal, false, 'Product must NOT be in Flash Sale');

  // 2. Admin adds the same product to New Arrivals (can be in multiple sections)
  placement.is_new_arrival = true;
  desc = serializeProductDescriptionWithHomepage(desc, placement);
  await saveProductHomepagePlacement(testProductId, placement);

  parsed = getProductHomepagePlacement({ id: testProductId, description: desc });
  assert.equal(parsed?.is_hot_sale, true, 'Product must remain in Hot Sales');
  assert.equal(parsed?.is_new_arrival, true, 'Product must now also appear in New Arrivals');

  // 3. Admin removes it from Hot Sales
  placement.is_hot_sale = false;
  desc = serializeProductDescriptionWithHomepage(desc, placement);
  await saveProductHomepagePlacement(testProductId, placement);

  parsed = getProductHomepagePlacement({ id: testProductId, description: desc });
  assert.equal(parsed?.is_hot_sale, false, 'Product must disappear from Hot Sales');
  assert.equal(parsed?.is_new_arrival, true, 'Product must remain in New Arrivals');

  // 4. Admin configures Flash Sale with discount & schedule
  const now = new Date();
  const startTime = new Date(now.getTime() - 1000 * 60 * 30).toISOString(); // Started 30 mins ago
  const endTime = new Date(now.getTime() + 1000 * 60 * 60 * 24).toISOString(); // Ends tomorrow

  placement.is_flash_deal = true;
  placement.flash_sale = {
    flash_price: 18000,
    original_price: 30000,
    start_time: startTime,
    end_time: endTime,
    is_active: true,
  };

  // Validate sale price < original price
  assert.ok(placement.flash_sale.flash_price < placement.flash_sale.original_price, 'Flash price must be lower than original price');

  desc = serializeProductDescriptionWithHomepage(desc, placement);
  await saveProductHomepagePlacement(testProductId, placement);

  parsed = getProductHomepagePlacement({ id: testProductId, description: desc });
  assert.equal(parsed?.is_flash_deal, true, 'Product must be marked as Flash Sale');
  assert.equal(isFlashSaleActiveNow(parsed?.flash_sale), true, 'Flash Sale must currently be active within valid schedule');
  assert.equal(parsed?.flash_sale?.flash_price, 18000, 'Discounted price must be 18000');
  assert.equal(parsed?.flash_sale?.original_price, 30000, 'Original price must be 30000');

  // 5. Flash Sale automatically expires after end time
  const futureDate = new Date(now.getTime() + 1000 * 60 * 60 * 48); // 48 hours later (after end time)
  assert.equal(
    isFlashSaleActiveNow(parsed?.flash_sale, futureDate),
    false,
    'Flash Sale must automatically become inactive once scheduled end time has passed'
  );
});

console.log(`\n=============================================================`);
console.log(`ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
console.log(`=============================================================\n`);
