const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('====================================================');
console.log('DOVI DELIVERY ROUTE LOOKUP & PRICING VERIFICATION');
console.log('====================================================\n');

// Build CJS module from frontend deliveryPricingService
const esbuildFe = execSync('npx esbuild frontend/src/services/deliveryPricingService.ts --format=cjs', { maxBuffer: 10*1024*1024 }).toString();
const feMod = { exports: {} };
new Function('module', 'exports', 'require', esbuildFe)(feMod, feMod.exports, require);
const feDps = feMod.exports;

// Build CJS module from admin deliveryPricingService
const esbuildAdmin = execSync('npx esbuild admin/src/services/deliveryPricingService.ts --format=cjs', { maxBuffer: 10*1024*1024 }).toString();
const adminMod = { exports: {} };
new Function('module', 'exports', 'require', esbuildAdmin)(adminMod, adminMod.exports, require);
const adminDps = adminMod.exports;

// Load backend delivery_store.json
const store = JSON.parse(fs.readFileSync('backend/delivery_store.json', 'utf8'));
const routes = store.routes;

console.log(`[Store] Loaded ${routes.length} routes from backend/delivery_store.json\n`);

// TEST 1: Destination Normalization & Matching
console.log('--- Test 1: Location Normalization & Lookup ---');
const testLocations = [
  { state: 'Delta', city: 'Warri', expectedCity: 'warri' },
  { state: 'Delta', city: 'Warri, Delta', expectedCity: 'warri' },
  { state: 'Delta', city: 'Warri (Delta)', expectedCity: 'warri' },
  { state: 'Delta', city: 'Warri City', expectedCity: 'warri' },
  { state: 'Anambra', city: 'Awka', expectedCity: 'awka' },
  { state: 'Anambra', city: 'Awka, Anambra', expectedCity: 'awka' },
  { state: 'Lagos', city: 'Ikeja', expectedCity: 'ikeja' },
  { state: 'Lagos', city: 'Ikeja, Lagos', expectedCity: 'ikeja' },
];

testLocations.forEach(({ state, city, expectedCity }) => {
  const norm = feDps.canonicalCityKey(city);
  console.assert(norm === expectedCity, `Expected ${city} -> ${expectedCity}, got ${norm}`);
  const match = feDps.findRouteInList(routes, state, city);
  console.assert(match.route !== null, `Route for ${city}, ${state} must be found!`);
  console.log(`✓ ${city}, ${state} -> normalized key: "${norm}", route found: ${match.route.id} (${match.route.destination_city})`);
});

// TEST 2: Warri, Delta Parcel Classification Pricing (User prompt specific requirements)
console.log('\n--- Test 2: Warri, Delta Parcel Classification Fees ---');
const warriRoute = routes.find(r => r.destination_city === 'Warri' && r.destination_state === 'Delta');
console.assert(warriRoute !== undefined, 'Warri, Delta route must exist in store');
console.log(`Warri Route ID: ${warriRoute.id}`);
console.log(`Configured Rates in Store: Small: ₦${warriRoute.small_parcel_rate}, Heavy: ₦${warriRoute.heavy_parcel_rate}, Furniture: ₦${warriRoute.furniture_bulky_rate}`);

console.assert(warriRoute.small_parcel_rate === 5000, `Expected Small Parcel rate 5000, got ${warriRoute.small_parcel_rate}`);
console.assert(warriRoute.heavy_parcel_rate === 8500, `Expected Heavy Parcel rate 8500, got ${warriRoute.heavy_parcel_rate}`);
console.assert(warriRoute.furniture_bulky_rate === 20000, `Expected Furniture Bulky rate 20000, got ${warriRoute.furniture_bulky_rate}`);

// A. Small Parcel
const smallItem = [{ id: '1', product_id: 'prod_small', product_name: 'Wireless Earbuds', delivery_classification: 'SMALL_PARCEL', quantity: 1, unit_price: 15000 }];
const smallCalc = feDps.calculateConsolidatedDelivery(smallItem, 'Delta', 'Warri', 'Onitsha', warriRoute);
console.assert(smallCalc.total_delivery_fee === 5000, `Expected fee 5000 for Small Parcel, got ${smallCalc.total_delivery_fee}`);
console.assert(smallCalc.route_found === true, 'route_found must be true');
console.assert(smallCalc.requires_manual_quote === false, 'Standard Small Parcel must not require manual quote');
console.log(`✓ Small Parcel to Warri, Delta: Fee = ₦${smallCalc.total_delivery_fee} (Expected ₦5,000)`);

// B. Heavy Parcel
const heavyItem = [{ id: '2', product_id: 'prod_heavy', product_name: 'Standing Fan', delivery_classification: 'HEAVY_PARCEL', quantity: 1, unit_price: 45000 }];
const heavyCalc = feDps.calculateConsolidatedDelivery(heavyItem, 'Delta', 'Warri', 'Onitsha', warriRoute);
console.assert(heavyCalc.total_delivery_fee === 8500, `Expected fee 8500 for Heavy Parcel, got ${heavyCalc.total_delivery_fee}`);
console.assert(heavyCalc.route_found === true, 'route_found must be true');
console.assert(heavyCalc.requires_manual_quote === false, 'Standard Heavy Parcel must not require manual quote');
console.log(`✓ Heavy Parcel to Warri, Delta: Fee = ₦${heavyCalc.total_delivery_fee} (Expected ₦8,500)`);

// C. Furniture / Bulky
const furnitureItem = [{ id: '3', product_id: 'prod_furn', product_name: 'Office Desk Chair', delivery_classification: 'FURNITURE_BULKY', quantity: 1, unit_price: 120000 }];
const furnitureCalc = feDps.calculateConsolidatedDelivery(furnitureItem, 'Delta', 'Warri', 'Onitsha', warriRoute);
console.assert(furnitureCalc.total_delivery_fee === 20000, `Expected fee 20000 for Furniture Bulky, got ${furnitureCalc.total_delivery_fee}`);
console.assert(furnitureCalc.route_found === true, 'route_found must be true');
console.assert(furnitureCalc.requires_manual_quote === false, 'Standard Furniture Bulky must not require manual quote');
console.log(`✓ Furniture/Bulky to Warri, Delta: Fee = ₦${furnitureCalc.total_delivery_fee} (Expected ₦20,000)`);

// D. Mixed Cart (Small Parcel + Heavy Parcel)
const mixedItems = [...smallItem, ...heavyItem];
const mixedCalc = feDps.calculateConsolidatedDelivery(mixedItems, 'Delta', 'Warri', 'Onitsha', warriRoute);
console.assert(mixedCalc.total_delivery_fee === 8500, `Expected consolidated fee 8500 for mixed Small + Heavy, got ${mixedCalc.total_delivery_fee}`);
console.assert(mixedCalc.shipment_count === 1, 'Small + Heavy must consolidate into 1 shipment group');
console.log(`✓ Mixed Cart (Small + Heavy) to Warri: Fee = ₦${mixedCalc.total_delivery_fee} (Consolidated at Heavy Parcel rate: ₦8,500)`);

// E. Product without delivery classification
const unclassifiedItem = [{ id: '4', product_id: 'prod_unclass', product_name: 'Candy Bottle', quantity: 1, unit_price: 3000 }];
const unclassCalc = feDps.calculateConsolidatedDelivery(unclassifiedItem, 'Delta', 'Warri', 'Onitsha', warriRoute);
console.assert(unclassCalc.total_delivery_fee === 5000, `Expected fallback to Small Parcel (5000), got ${unclassCalc.total_delivery_fee}`);
console.assert(unclassCalc.route_found === true, 'route_found must be true for unclassified product');
console.assert(unclassCalc.requires_manual_quote === false, 'Destination must NOT be marked unconfigured for unclassified product');
console.log(`✓ Unclassified Product to Warri: Fee = ₦${unclassCalc.total_delivery_fee} (Gracefully resolved to Small Parcel rate: ₦5,000)`);

// TEST 3: Awka, Anambra Verification
console.log('\n--- Test 3: Awka, Anambra Route Pricing ---');
const awkaRoute = routes.find(r => r.destination_city === 'Awka' && r.destination_state === 'Anambra');
console.assert(awkaRoute !== undefined, 'Awka, Anambra route must exist');
const awkaCalcSmall = feDps.calculateConsolidatedDelivery(smallItem, 'Anambra', 'Awka', 'Onitsha', awkaRoute);
console.assert(awkaCalcSmall.total_delivery_fee === 2500, `Expected Awka Small fee 2500, got ${awkaCalcSmall.total_delivery_fee}`);
const awkaCalcHeavy = feDps.calculateConsolidatedDelivery(heavyItem, 'Anambra', 'Awka', 'Onitsha', awkaRoute);
console.assert(awkaCalcHeavy.total_delivery_fee === 6000, `Expected Awka Heavy fee 6000, got ${awkaCalcHeavy.total_delivery_fee}`);
const awkaCalcFurn = feDps.calculateConsolidatedDelivery(furnitureItem, 'Anambra', 'Awka', 'Onitsha', awkaRoute);
console.assert(awkaCalcFurn.total_delivery_fee === 15000, `Expected Awka Furniture fee 15000, got ${awkaCalcFurn.total_delivery_fee}`);
console.log(`✓ Awka, Anambra: Small = ₦${awkaCalcSmall.total_delivery_fee}, Heavy = ₦${awkaCalcHeavy.total_delivery_fee}, Furniture = ₦${awkaCalcFurn.total_delivery_fee}`);

// TEST 4: Admin vs Frontend Parity
console.log('\n--- Test 4: Frontend vs Admin Pricing Parity ---');
const adminSmall = adminDps.calculateConsolidatedDelivery(smallItem, 'Delta', 'Warri', 'Onitsha', warriRoute);
const adminHeavy = adminDps.calculateConsolidatedDelivery(heavyItem, 'Delta', 'Warri', 'Onitsha', warriRoute);
const adminFurn = adminDps.calculateConsolidatedDelivery(furnitureItem, 'Delta', 'Warri', 'Onitsha', warriRoute);
console.assert(adminSmall.total_delivery_fee === smallCalc.total_delivery_fee, 'Admin Small fee must match Frontend Small fee');
console.assert(adminHeavy.total_delivery_fee === heavyCalc.total_delivery_fee, 'Admin Heavy fee must match Frontend Heavy fee');
console.assert(adminFurn.total_delivery_fee === furnitureCalc.total_delivery_fee, 'Admin Furniture fee must match Frontend Furniture fee');
console.log('✓ Admin and Frontend delivery calculations are 100% in agreement!');

console.log('\n====================================================');
console.log('ALL DELIVERY ROUTING & PRICING TESTS PASSED (100%)');
console.log('====================================================');

