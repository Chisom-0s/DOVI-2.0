import assert from 'node:assert/strict';
import {
  computeAnalytics,
  ORDER_STATUS_GROUPS,
  REVENUE_ORDER_STATUSES,
  orderTotal,
  toNumber,
  rangeStart,
} from '../admin/src/services/analyticsAggregator.ts';

console.log('--- Testing Admin Analytics Aggregator & Reconciliation ---');

const now = new Date('2026-11-19T12:00:00Z');
const oneHourAgo = new Date('2026-11-19T11:00:00Z').toISOString();
const twoDaysAgo = new Date('2026-11-17T12:00:00Z').toISOString();
const tenDaysAgo = new Date('2026-11-09T12:00:00Z').toISOString();
const twoMonthsAgo = new Date('2026-09-10T12:00:00Z').toISOString();

// 1. Order Statuses & Revenue Recognition
const mockOrders = [
  // Completed order (revenue)
  { id: '1', reference: 'ORD-001', total: '15000', status: 'DELIVERED', created_at: oneHourAgo },
  // Paid in fulfilment (revenue)
  { id: '2', reference: 'ORD-002', total: '25000', status: 'PAID', created_at: twoDaysAgo },
  // Processing in fulfilment (revenue)
  { id: '3', reference: 'ORD-003', total: '10000', status: 'PROCESSING', created_at: tenDaysAgo },
  // Unpaid pending payment (NOT revenue)
  { id: '4', reference: 'ORD-004', total: '50000', status: 'PENDING_PAYMENT', created_at: oneHourAgo },
  // Cancelled order (NOT revenue)
  { id: '5', reference: 'ORD-005', total: '40000', status: 'CANCELLED', created_at: twoDaysAgo },
  // Older completed order (revenue outside 30D)
  { id: '6', reference: 'ORD-006', total: '30000', status: 'COMPLETED', created_at: twoMonthsAgo },
];

const mockUsers = [
  { id: 'u1', email: 'alice@example.com', first_name: 'Alice', date_joined: oneHourAgo },
  { id: 'u2', email: 'bob@example.com', first_name: 'Bob', date_joined: twoDaysAgo },
  { id: 'u3', email: 'charlie@example.com', first_name: 'Charlie', date_joined: twoMonthsAgo },
];

const mockVendors = [
  { id: 'v1', business_name: 'Vendor A', status: 'APPROVED' },
  { id: 'v2', business_name: 'Vendor B', status: 'PENDING' },
  { id: 'v3', business_name: 'Vendor C', status: 'PENDING_VERIFICATION' },
  { id: 'v4', business_name: 'Vendor D', status: 'REJECTED' },
];

const mockProducts = [
  { id: 'p1', title: 'Product 1', is_active: true },
  { id: 'p2', title: 'Product 2', is_active: true },
  { id: 'p3', title: 'Product 3', is_active: false },
];

const mockRefunds = [
  { id: 'r1', status: 'PENDING', amount: '5000' },
];

const mockGoals = [
  { id: 'g1', status: 'ACTIVE', target_amount: '200000' },
  { id: 'g2', status: 'IN_PROGRESS', target_amount: '150000' },
  { id: 'g3', status: 'COMPLETED', target_amount: '100000' },
];

const mockContributions = [
  { id: 'c1', amount: '50000', status: 'CONFIRMED', created_at: oneHourAgo },
  { id: 'c2', amount: '20000', status: 'PENDING', created_at: oneHourAgo },
  { id: 'c3', amount: '30000', status: 'COMPLETED', created_at: twoDaysAgo },
];

// Test Range: ALL
const resAll = computeAnalytics({
  orders: mockOrders,
  users: mockUsers,
  vendors: mockVendors,
  products: mockProducts,
  refunds: mockRefunds,
  goals: mockGoals,
  contributions: mockContributions,
  range: 'ALL',
  now,
});

// Check Orders breakdown
assert.equal(resAll.orders.total, 6, 'Total orders must be 6');
assert.equal(resAll.orders.pending, 1, 'Pending orders must be 1');
assert.equal(resAll.orders.in_fulfilment, 2, 'In fulfilment orders must be 2 (PAID + PROCESSING)');
assert.equal(resAll.orders.completed, 2, 'Completed orders must be 2 (DELIVERED + COMPLETED)');
assert.equal(resAll.orders.cancelled, 1, 'Cancelled orders must be 1');
console.log('PASS: Order statuses correctly partitioned without overlap');

// Check Revenue calculation (ALL time)
// Revenue statuses: ORD-001 (15k) + ORD-002 (25k) + ORD-003 (10k) + ORD-006 (30k) = 80,000
// ORD-004 (50k unpaid) and ORD-005 (40k cancelled) MUST NOT be included!
assert.equal(resAll.revenue.range_total, 80000, 'All-time fulfilled revenue must be 80,000');
assert.equal(resAll.revenue.today, 15000, 'Today revenue must be 15,000');
console.log('PASS: Revenue only counts fulfilled/paid orders and excludes unpaid and cancelled orders');

// Check Save2Own separation
// Save2Own confirmed: 50k + 30k = 80,000. Pending: 20k.
// MUST NOT leak into marketplace orders revenue!
assert.equal(resAll.save2own.confirmed_amount, 80000, 'Save2Own confirmed amount must be 80,000');
assert.equal(resAll.save2own.pending_amount, 20000, 'Save2Own pending amount must be 20,000');
assert.equal(resAll.save2own.active_goals, 2, 'Active Save2Own goals must be 2');
console.log('PASS: Save2Own contributions are strictly separated from marketplace order revenue');

// Check Users & Vendors
assert.equal(resAll.users.total, 3, 'Total users must be 3');
assert.equal(resAll.users.new_today, 1, 'New users today must be 1');
assert.equal(resAll.vendors.total, 4, 'Total vendors must be 4');
assert.equal(resAll.vendors.pending, 2, 'Pending vendors must be 2');
assert.equal(resAll.vendors.approved, 1, 'Approved vendors must be 1');
console.log('PASS: User and vendor status counts match individual records');

// Test Range: TODAY
const resToday = computeAnalytics({
  orders: mockOrders,
  users: mockUsers,
  vendors: mockVendors,
  products: mockProducts,
  refunds: mockRefunds,
  goals: mockGoals,
  contributions: mockContributions,
  range: 'TODAY',
  now,
});
assert.equal(resToday.revenue.range_total, 15000, 'Today range total must be 15,000');
assert.equal(resToday.users.new_in_range, 1, 'New users today in range must be 1');
console.log('PASS: Range filter TODAY restricts metrics accurately');

// Test Range: 7D
const res7D = computeAnalytics({
  orders: mockOrders,
  users: mockUsers,
  vendors: mockVendors,
  products: mockProducts,
  refunds: mockRefunds,
  goals: mockGoals,
  contributions: mockContributions,
  range: '7D',
  now,
});
// In last 7D: ORD-001 (15k) + ORD-002 (25k) = 40,000
assert.equal(res7D.revenue.range_total, 40000, '7D range total must be 40,000');
assert.equal(res7D.users.new_in_range, 2, 'New users in 7D must be 2');
console.log('PASS: Range filter 7D restricts metrics accurately');

console.log('\nAll analytics aggregator tests passed successfully!');

