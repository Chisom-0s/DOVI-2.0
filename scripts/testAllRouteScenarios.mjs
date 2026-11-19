import fs from 'node:fs';
import {
  findRouteInList,
  calculateOrderDelivery,
  canonicalStateKey,
  canonicalCityKey,
  listConfiguredCitiesForState,
} from '../frontend/src/services/deliveryPricingService.ts';

const store = JSON.parse(fs.readFileSync('backend/delivery_store.json', 'utf-8'));
const routes = store.routes;

console.log('--- STARTING ROUTE SCENARIO VERIFICATION ---');

// Scenario 1: Exact matches for major cities
const testCasesExact = [
  { state: 'Anambra', city: 'Awka', expectedRate: 2500 },
  { state: 'Anambra', city: 'Onitsha', expectedRate: 1500 },
  { state: 'Lagos', city: 'Ikeja', expectedRate: 4000 },
  { state: 'Lagos', city: 'Lekki', expectedRate: 4500 },
  { state: 'FCT - Abuja', city: 'Garki', expectedRate: 5000 },
  { state: 'Enugu', city: 'Enugu', expectedRate: 2500 },
  { state: 'Rivers', city: 'Port Harcourt', expectedRate: 4000 },
  { state: 'Delta', city: 'Asaba', expectedRate: 1500 },
  { state: 'Delta', city: 'Warri', expectedRate: 3000 },
  { state: 'Imo', city: 'Owerri', expectedRate: 2500 },
  { state: 'Abia', city: 'Aba', expectedRate: 2500 },
  { state: 'Oyo', city: 'Ibadan', expectedRate: 4500 },
  { state: 'Edo', city: 'Benin City', expectedRate: 3000 },
  { state: 'Kano', city: 'Kano', expectedRate: 6000 },
  { state: 'Kaduna', city: 'Kaduna', expectedRate: 5500 },
];

for (const tc of testCasesExact) {
  const match = findRouteInList(routes, tc.state, tc.city);
  if (!match.route) {
    throw new Error(`Failed to match exact route for ${tc.state} -> ${tc.city}`);
  }
  const calc = calculateOrderDelivery({
    items: [{ id: '1', product_id: 'p1', product_name: 'Polo Shirt', unit_price: 15000, quantity: 1 }],
    destinationState: tc.state,
    destinationCity: tc.city,
    routeOverride: match.route,
  });
  if (calc.requires_manual_quote || calc.total_delivery_fee !== tc.expectedRate) {
    throw new Error(`Fee mismatch for ${tc.state} -> ${tc.city}: expected ${tc.expectedRate}, got ${calc.total_delivery_fee}`);
  }
}
console.log('✓ Scenario 1: All 15 exact major destinations matched and priced correctly');

// Scenario 2: Real-world sub-districts and aliases
const testCasesFuzzy = [
  { state: 'Lagos', city: 'Ikeja GRA', expectedRate: 4000 },
  { state: 'Lagos', city: 'Lekki Phase 1', expectedRate: 4500 },
  { state: 'Lagos', city: 'VI', expectedRate: 4500 },
  { state: 'Anambra', city: 'Awka South', expectedRate: 2500 },
  { state: 'Anambra', city: 'Onitsha North', expectedRate: 1500 },
  { state: 'Rivers', city: 'PH', expectedRate: 4000 },
  { state: 'Rivers', city: 'Portharcourt', expectedRate: 4000 },
  { state: 'Edo', city: 'Benin', expectedRate: 3000 },
  { state: 'Enugu', city: 'Enugu Urban', expectedRate: 2500 },
  { state: 'Delta', city: 'Warri South', expectedRate: 3000 },
  { state: 'Abia', city: 'Aba North', expectedRate: 2500 },
];

for (const tc of testCasesFuzzy) {
  const match = findRouteInList(routes, tc.state, tc.city);
  if (!match.route) {
    throw new Error(`Failed fuzzy match for ${tc.state} -> ${tc.city}`);
  }
  const calc = calculateOrderDelivery({
    items: [{ id: '1', product_id: 'p1', product_name: 'Polo Shirt', unit_price: 15000, quantity: 1 }],
    destinationState: tc.state,
    destinationCity: tc.city,
    routeOverride: match.route,
  });
  if (calc.requires_manual_quote || calc.total_delivery_fee !== tc.expectedRate) {
    throw new Error(`Fee mismatch for fuzzy ${tc.state} -> ${tc.city}: expected ${tc.expectedRate}, got ${calc.total_delivery_fee}`);
  }
}
console.log('✓ Scenario 2: All 11 fuzzy / sub-district / alias destinations matched and priced correctly');

// Scenario 3: Route with partial classification (e.g. only small parcel entered by admin)
const partialRoute = {
  id: 'route_partial_test',
  dispatch_origin: 'Onitsha',
  destination_state: 'Ogun',
  destination_city: 'Abeokuta',
  small_parcel_rate: 3500,
  heavy_parcel_rate: null, // Left blank by admin
  furniture_bulky_rate: null, // Left blank by admin
  combined_furniture_rate: null,
  is_active: true,
  updated_at: new Date().toISOString(),
};

const calcSmall = calculateOrderDelivery({
  items: [{ id: '1', product_id: 'p1', product_name: 'Watch', unit_price: 10000, quantity: 1 }],
  destinationState: 'Ogun',
  destinationCity: 'Abeokuta',
  routeOverride: partialRoute,
});
if (calcSmall.requires_manual_quote || calcSmall.total_delivery_fee !== 3500) {
  throw new Error(`Small parcel failed on partial route: ${calcSmall.total_delivery_fee}`);
}

const calcHeavy = calculateOrderDelivery({
  items: [{ id: '2', product_id: 'p2', product_name: 'Standing Fan 18 Inch', unit_price: 45000, quantity: 1 }],
  destinationState: 'Ogun',
  destinationCity: 'Abeokuta',
  routeOverride: partialRoute,
});
// Heavy parcel must auto-resolve to proportional fee (3500 * 2.2 = 7700), never fail!
if (calcHeavy.requires_manual_quote || calcHeavy.total_delivery_fee !== 7700) {
  throw new Error(`Heavy parcel failed to auto-resolve on partial route: ${calcHeavy.total_delivery_fee}`);
}

const calcFurn = calculateOrderDelivery({
  items: [{ id: '3', product_id: 'p3', product_name: 'Office Chair', unit_price: 90000, quantity: 1 }],
  destinationState: 'Ogun',
  destinationCity: 'Abeokuta',
  routeOverride: partialRoute,
});
// Bulky parcel must auto-resolve to proportional fee (3500 * 4.5 = 15750), never fail!
if (calcFurn.requires_manual_quote || calcFurn.total_delivery_fee !== 15750) {
  throw new Error(`Bulky parcel failed to auto-resolve on partial route: ${calcFurn.total_delivery_fee}`);
}
console.log('✓ Scenario 3: Routes with missing classification tiers automatically resolve without blocking');

// Scenario 4: Statewide route covers unlisted towns of that state
const statewideRoute = {
  id: 'route_statewide_test',
  dispatch_origin: 'Onitsha',
  destination_state: 'Osun',
  destination_city: 'All Cities',
  small_parcel_rate: 4200,
  heavy_parcel_rate: 9000,
  furniture_bulky_rate: 20000,
  combined_furniture_rate: 26000,
  is_active: true,
  updated_at: new Date().toISOString(),
};

const customTownMatch = findRouteInList([statewideRoute], 'Osun', 'Ilesa');
if (!customTownMatch.route || customTownMatch.match !== 'STATE_WIDE') {
  throw new Error('Statewide route failed to cover custom town in that state');
}
const calcCustomTown = calculateOrderDelivery({
  items: [{ id: '1', product_id: 'p1', product_name: 'Phone', unit_price: 80000, quantity: 1 }],
  destinationState: 'Osun',
  destinationCity: 'Ilesa',
  routeOverride: customTownMatch.route,
});
if (calcCustomTown.requires_manual_quote || calcCustomTown.total_delivery_fee !== 4200) {
  throw new Error(`Custom town failed statewide pricing: ${calcCustomTown.total_delivery_fee}`);
}
console.log('✓ Scenario 4: Statewide route covers unlisted towns in that state');

// Scenario 5: Unconfigured state correctly requires manual quote (no fake ₦0)
const unconfiguredMatch = findRouteInList(routes, 'Taraba', 'Jalingo');
if (unconfiguredMatch.route !== null) {
  throw new Error('Unconfigured state should return null route');
}
const calcUnconfigured = calculateOrderDelivery({
  items: [{ id: '1', product_id: 'p1', product_name: 'Phone', unit_price: 80000, quantity: 1 }],
  destinationState: 'Taraba',
  destinationCity: 'Jalingo',
  routeOverride: unconfiguredMatch.route,
});
if (!calcUnconfigured.requires_manual_quote || calcUnconfigured.total_delivery_fee !== null) {
  throw new Error('Unconfigured state must require manual quote with null fee');
}
console.log('✓ Scenario 5: Genuinely unconfigured state requires manual quote without fake fee');

console.log('=============================================');
console.log('ALL 5 ROUTE SCENARIOS PASSED WITH 100% SUCCESS!');
console.log('=============================================');
