// Delivery destination + route matching verification.
// Runs the REAL production service code (frontend/src/services/deliveryPricingService.ts).
// NOTE: route rates below are TEST FIXTURES used only inside this script; they are never written to any store.
import assert from 'node:assert/strict';
import {
  findRouteInList,
  listConfiguredCitiesForState,
  selectDestinationState,
  isConfiguredCityForState,
  resolveCanonicalStateName,
  calculateConsolidatedDelivery,
} from '../frontend/src/services/deliveryPricingService.ts';

const mk = (state, city, small, heavy, extra = {}) => ({
  id: `t_${state}_${city}`,
  dispatch_origin: 'Onitsha',
  destination_state: state,
  destination_city: city,
  small_parcel_rate: small,
  heavy_parcel_rate: heavy,
  furniture_bulky_rate: null,
  combined_furniture_rate: null,
  special_handling_surcharge: null,
  allows_furniture_small_consolidation: false,
  max_furniture_items_consolidated: 2,
  max_small_parcel_weight_kg: 15,
  max_heavy_parcel_weight_kg: 80,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...extra,
});

const routes = [
  mk('Anambra', 'Awka', 2500, 6000),
  mk('Anambra', 'Onitsha', 1500, 4000),
  mk('Lagos', 'Ikeja', 4000, 9000),
  mk('FCT - Abuja', 'Garki', 5000, 11000),
  mk('Enugu', 'Enugu', 2000, 5000, { is_active: false }),
  mk('Rivers', 'All Cities', 3500, 8000),
];

const items = [{ product_id: 'p1', product_name: 'Sneakers', quantity: 1, unit_price: 20000, delivery_classification: 'SMALL_PARCEL' }];
const fee = (state, city) => {
  const { route } = findRouteInList(routes, state, city);
  const calc = calculateConsolidatedDelivery(items, state, city, 'Onitsha', route);
  return calc;
};

let passed = 0;
const t = (name, fn) => { fn(); passed++; console.log('PASS', name); };

// ---- Sequence requested in the task ----
let dest = { state: '', city: '' };
t('Anambra -> Awka resolves Awka route & fee', () => {
  dest = selectDestinationState('Anambra');
  assert.equal(dest.city, '');
  dest.city = 'Awka';
  const c = fee(dest.state, dest.city);
  assert.equal(c.route_found, true);
  assert.equal(c.total_delivery_fee, 2500);
  assert.equal(c.destination_city, 'Awka');
});
t('Anambra -> Onitsha updates fee', () => {
  dest.city = 'Onitsha';
  const c = fee(dest.state, dest.city);
  assert.equal(c.total_delivery_fee, 1500);
});
t('Switch to Lagos State clears town immediately (no stale Onitsha/Awka)', () => {
  dest = selectDestinationState('Lagos');
  assert.equal(dest.city, '');
  assert.equal(isConfiguredCityForState(routes, 'Lagos', 'Awka'), false);
  assert.equal(isConfiguredCityForState(routes, 'Lagos', 'Onitsha'), false);
  assert.deepEqual(listConfiguredCitiesForState(routes, 'Lagos').map((r) => r.destination_city), ['Ikeja']);
});
t('Lagos -> Ikeja fee', () => {
  dest.city = 'Ikeja';
  assert.equal(fee(dest.state, dest.city).total_delivery_fee, 4000);
});
t('Back to Anambra clears Ikeja, then Awka again => 2500', () => {
  dest = selectDestinationState('Anambra');
  assert.equal(dest.city, '');
  assert.deepEqual(listConfiguredCitiesForState(routes, 'Anambra').map((r) => r.destination_city), ['Awka', 'Onitsha']);
  dest.city = 'Awka';
  assert.equal(fee(dest.state, dest.city).total_delivery_fee, 2500);
});

// ---- Cross-state safety ----
t('A town of another state never matches (Anambra + Ikeja)', () => {
  const c = fee('Anambra', 'Ikeja');
  assert.equal(c.route_found, false);
  assert.equal(c.total_delivery_fee, null);
  assert.equal(c.requires_manual_quote, true);
});
t('Empty city is not priced as a route', () => {
  const c = fee('Anambra', '');
  assert.equal(c.route_found, false);
  assert.equal(c.total_delivery_fee, null);
});

// ---- Normalization between admin config and checkout ----
t('"Lagos State", " lagos ", "LAGOS" all match admin route "Lagos"/"Ikeja"', () => {
  for (const s of ['Lagos State', ' lagos ', 'LAGOS']) {
    assert.equal(fee(s, ' ikeja ').total_delivery_fee, 4000, s);
  }
});
t('Checkout "Abuja (FCT)" matches admin "FCT - Abuja" route', () => {
  assert.equal(fee('Abuja (FCT)', 'Garki').total_delivery_fee, 5000);
  assert.equal(resolveCanonicalStateName('Abuja (FCT)'), 'FCT - Abuja');
});
t('State-wide "All Cities" route covers any town of that state only', () => {
  assert.equal(fee('Rivers', 'Port Harcourt').total_delivery_fee, 3500);
  assert.equal(fee('Anambra', 'Port Harcourt').route_found, false);
});

// ---- Unconfigured / inactive destinations ----
t('Unconfigured destination => manual quote with clear reason, never a zero fee', () => {
  const c = fee('Kano', 'Kano');
  assert.equal(c.route_found, false);
  assert.equal(c.requires_manual_quote, true);
  assert.equal(c.total_delivery_fee, null);
  assert.match(c.manual_quote_reason, /No configured delivery route.*Kano/);
});
t('Inactive route is not treated as configured', () => {
  assert.equal(fee('Enugu', 'Enugu').route_found, false);
  assert.equal(listConfiguredCitiesForState(routes, 'Enugu').length, 0);
});
t('Configured route is NEVER reported as missing; fee matches admin rate', () => {
  for (const [s, c, f] of [['Anambra', 'Awka', 2500], ['Anambra', 'Onitsha', 1500], ['Lagos', 'Ikeja', 4000]]) {
    const calc = fee(s, c);
    assert.equal(calc.route_found, true);
    assert.equal(calc.requires_manual_quote, false);
    assert.equal(calc.total_delivery_fee, f);
    assert.equal(calc.total_payable, 20000 + f);
  }
});

console.log(`\nAll ${passed} delivery tests passed.`);

