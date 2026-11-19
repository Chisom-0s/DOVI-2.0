// ============================================================
// DOVI Admin — Analytics Aggregator (pure functions, no I/O)
//
// Every dashboard metric is derived here from the SAME record lists that the
// individual management pages (Orders, Users, Products, Vendors, Refunds,
// Save2Own Goals/Contributions) display, so the dashboard can never disagree
// with them. Status semantics are explicit: statuses are never lumped together.
// ============================================================

export type AnalyticsRange = 'TODAY' | '7D' | '30D' | 'ALL';

export const ORDER_STATUS_GROUPS = {
  /** Awaiting payment — NOT revenue. */
  PENDING: ['PENDING_PAYMENT'],
  /** Money received, order being fulfilled. */
  IN_FULFILMENT: ['PAID', 'PROCESSING', 'SHIPPED', 'IN_TRANSIT'],
  /** Delivered / closed successfully. */
  COMPLETED: ['DELIVERED', 'RECEIVED', 'COMPLETED'],
  CANCELLED: ['CANCELLED'],
  REFUND: ['REFUND_REQUESTED', 'REFUND_REVIEW', 'REFUNDED'],
} as const;

/** Statuses whose order total counts as received revenue (money actually collected, not refunded/cancelled). */
export const REVENUE_ORDER_STATUSES: string[] = [
  ...ORDER_STATUS_GROUPS.IN_FULFILMENT,
  ...ORDER_STATUS_GROUPS.COMPLETED,
];

const CONFIRMED_CONTRIBUTION = ['CONFIRMED', 'COMPLETED', 'SUCCESSFUL', 'SUCCESS'];
const PENDING_CONTRIBUTION = ['PENDING', 'SUBMITTED', 'UNDER_REVIEW'];
const REJECTED_CONTRIBUTION = ['REJECTED', 'FAILED'];
const REVERSED_CONTRIBUTION = ['REVERSED', 'REFUNDED'];

export interface AnalyticsSourceStatus {
  name: string;
  ok: boolean;
  count: number;
  /** true when not every page could be loaded */
  truncated?: boolean;
  error?: string;
}

export interface RawAnalyticsInput {
  orders: any[];
  payments?: any[] | null;
  users: any[];
  vendors: any[];
  products: any[];
  refunds: any[];
  goals: any[];
  contributions: any[];
  range?: AnalyticsRange;
  now?: Date;
}

export interface AnalyticsOverviewResult {
  range: AnalyticsRange;
  generated_at: string;
  users: { total: number; new_in_range: number; new_today: number };
  vendors: { total: number; pending: number; approved: number };
  products: { total: number };
  orders: {
    total: number;
    by_status: Record<string, number>;
    pending: number;
    in_fulfilment: number;
    completed: number;
    cancelled: number;
    refund_related: number;
    other: number;
  };
  revenue: {
    /** marketplace order revenue in the selected range (revenue statuses only) */
    range_total: number;
    today: number;
    week: number;
    month: number;
    refunded_in_range: number;
    net_range_total: number;
    /** verified successful payments in range (cross-check; null when payments list unavailable) */
    verified_payments_total: number | null;
    revenue_basis: 'orders';
  };
  save2own: {
    goals_by_status: Record<string, number>;
    active_goals: number;
    total_goals: number;
    confirmed_contributions: number;
    pending_contributions: number;
    rejected_contributions: number;
    reversed_contributions: number;
    confirmed_amount: number;
    pending_amount: number;
  };
  refunds: { pending: number; by_status: Record<string, number> };
  recent_orders: Array<{ reference: string; total: string; status: string; created_at: string }>;
  recent_users: Array<{ id: string; email: string; first_name: string; last_name: string; date_joined: string }>;
  warnings: string[];
}

export function toNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? '0').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function orderTotal(o: any): number {
  // Backends expose `total`; older shapes expose `total_amount`. Reading only one of them yields ₦0 revenue.
  return toNumber(o?.total ?? o?.total_amount ?? o?.amount);
}

const norm = (s: unknown) => String(s ?? '').trim().toUpperCase();

function ts(v: unknown): number | null {
  if (!v) return null;
  const t = new Date(String(v)).getTime();
  return Number.isNaN(t) ? null : t;
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function rangeStart(range: AnalyticsRange, now: Date): number {
  switch (range) {
    case 'TODAY':
      return startOfDay(now);
    case '7D':
      return startOfDay(now) - 6 * 86400000; // today + previous 6 days
    case '30D':
      return startOfDay(now) - 29 * 86400000;
    default:
      return Number.NEGATIVE_INFINITY;
  }
}

/** Deduplicate by a stable identity so a record returned on two pages / twice is counted once. */
function dedupe<T>(items: T[], key: (item: T) => string | undefined): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const k = key(item);
    if (k) {
      if (seen.has(k)) continue;
      seen.add(k);
    }
    out.push(item);
  }
  return out;
}

const isSave2OwnOrder = (o: any): boolean =>
  Boolean(o?.save2own_goal || o?.save2own_goal_id || o?.goal_id) ||
  norm(o?.source) === 'SAVE2OWN' ||
  norm(o?.order_type) === 'SAVE2OWN';

export function computeAnalytics(input: RawAnalyticsInput): AnalyticsOverviewResult {
  const now = input.now ?? new Date();
  const range = input.range ?? 'ALL';
  const start = rangeStart(range, now);
  const todayStart = startOfDay(now);
  const weekStart = rangeStart('7D', now);
  const monthStart = rangeStart('30D', now);
  const warnings: string[] = [];

  const inRange = (v: unknown): boolean => {
    const t = ts(v);
    // Records without a usable timestamp are only counted for "ALL" so they never silently inflate a period.
    return t === null ? range === 'ALL' : t >= start && t <= now.getTime() + 60000;
  };

  // ---- Orders ----
  const orders = dedupe(input.orders || [], (o) => String(o?.id ?? o?.reference ?? o?.reference_code ?? ''));
  const ordersInRange = orders.filter((o) => inRange(o?.created_at));
  const byStatus: Record<string, number> = {};
  for (const o of ordersInRange) {
    const s = norm(o?.status) || 'UNKNOWN';
    byStatus[s] = (byStatus[s] || 0) + 1;
  }
  const countIn = (list: readonly string[]) => list.reduce((acc, s) => acc + (byStatus[s] || 0), 0);
  const known = new Set<string>(Object.values(ORDER_STATUS_GROUPS).flat());
  const other = Object.entries(byStatus)
    .filter(([s]) => !known.has(s))
    .reduce((acc, [, n]) => acc + n, 0);
  if (other > 0) {
    warnings.push(`${other} order(s) have a status outside the known set and are reported under "Other".`);
  }

  // Revenue: only revenue statuses; Save2Own-originated orders excluded because their cash is already
  // counted as confirmed Save2Own contributions (counting both would double-count the same money).
  const revenueOrders = orders.filter(
    (o) => REVENUE_ORDER_STATUSES.includes(norm(o?.status)) && !isSave2OwnOrder(o)
  );
  const sumRevenue = (from: number) =>
    revenueOrders.filter((o) => {
      const t = ts(o?.created_at);
      return t !== null && t >= from;
    }).reduce((acc, o) => acc + orderTotal(o), 0);

  const revenueRange = revenueOrders
    .filter((o) => inRange(o?.created_at))
    .reduce((acc, o) => acc + orderTotal(o), 0);
  const refundedRange = orders
    .filter((o) => norm(o?.status) === 'REFUNDED' && !isSave2OwnOrder(o) && inRange(o?.created_at))
    .reduce((acc, o) => acc + orderTotal(o), 0);

  // ---- Payments (cross-check only) ----
  let verifiedPayments: number | null = null;
  if (Array.isArray(input.payments)) {
    const payments = dedupe(input.payments, (p) => String(p?.id ?? p?.payment_reference ?? p?.reference ?? ''));
    verifiedPayments = payments
      .filter((p) => ['SUCCESS', 'SUCCESSFUL', 'PAID'].includes(norm(p?.status)) && inRange(p?.created_at))
      .reduce((acc, p) => acc + toNumber(p?.amount), 0);
  }

  // ---- Users ----
  const users = dedupe(input.users || [], (u) => String(u?.id ?? u?.email ?? ''));
  const sortedUsers = [...users].sort((a, b) => (ts(b?.date_joined) ?? 0) - (ts(a?.date_joined) ?? 0));

  // ---- Vendors ----
  const vendors = dedupe(input.vendors || [], (v) => String(v?.id ?? ''));
  const vendorPending = vendors.filter((v) =>
    ['PENDING', 'PENDING_VERIFICATION', 'UNDER_REVIEW', 'SUBMITTED'].includes(norm(v?.status))
  ).length;
  const vendorApproved = vendors.filter((v) => ['APPROVED', 'ACTIVE'].includes(norm(v?.status))).length;

  // ---- Save2Own ----
  const goals = dedupe(input.goals || [], (g) => String(g?.id ?? ''));
  const goalsByStatus: Record<string, number> = {};
  for (const g of goals) {
    const s = norm(g?.status) || 'UNKNOWN';
    goalsByStatus[s] = (goalsByStatus[s] || 0) + 1;
  }
  const contributions = dedupe(
    input.contributions || [],
    (c) => String(c?.id ?? c?.transfer_reference ?? c?.payment_reference ?? '')
  ).filter((c) => inRange(c?.created_at ?? c?.submitted_at));
  const isConfirmedContribution = (c: any): boolean => {
    const s = norm(c?.status);
    if (REJECTED_CONTRIBUTION.includes(s) || REVERSED_CONTRIBUTION.includes(s)) return false;
    return CONFIRMED_CONTRIBUTION.includes(s) || norm(c?.payment_status) === 'SUCCESSFUL';
  };
  const confirmed = contributions.filter(isConfirmedContribution);
  const pendingC = contributions.filter(
    (c) => PENDING_CONTRIBUTION.includes(norm(c?.status)) && !isConfirmedContribution(c)
  );
  const rejectedC = contributions.filter((c) => REJECTED_CONTRIBUTION.includes(norm(c?.status)));
  const reversedC = contributions.filter((c) => REVERSED_CONTRIBUTION.includes(norm(c?.status)));

  // ---- Refunds ----
  const refunds = dedupe(input.refunds || [], (r) => String(r?.id ?? ''));
  const refundsByStatus: Record<string, number> = {};
  for (const r of refunds) {
    const s = norm(r?.status) || 'UNKNOWN';
    refundsByStatus[s] = (refundsByStatus[s] || 0) + 1;
  }

  const recentOrders = [...orders]
    .sort((a, b) => (ts(b?.created_at) ?? 0) - (ts(a?.created_at) ?? 0))
    .slice(0, 5)
    .map((o) => ({
      reference: String(o?.reference ?? o?.reference_code ?? String(o?.id ?? '').slice(0, 8)),
      total: String(orderTotal(o)),
      status: norm(o?.status) || 'UNKNOWN',
      created_at: String(o?.created_at ?? ''),
    }));

  return {
    range,
    generated_at: now.toISOString(),
    users: {
      total: users.length,
      new_in_range: users.filter((u) => inRange(u?.date_joined)).length,
      new_today: users.filter((u) => (ts(u?.date_joined) ?? -1) >= todayStart).length,
    },
    vendors: { total: vendors.length, pending: vendorPending, approved: vendorApproved },
    products: { total: (input.products || []).length },
    orders: {
      total: ordersInRange.length,
      by_status: byStatus,
      pending: countIn(ORDER_STATUS_GROUPS.PENDING),
      in_fulfilment: countIn(ORDER_STATUS_GROUPS.IN_FULFILMENT),
      completed: countIn(ORDER_STATUS_GROUPS.COMPLETED),
      cancelled: countIn(ORDER_STATUS_GROUPS.CANCELLED),
      refund_related: countIn(ORDER_STATUS_GROUPS.REFUND),
      other,
    },
    revenue: {
      range_total: round2(revenueRange),
      today: round2(sumRevenue(todayStart)),
      week: round2(sumRevenue(weekStart)),
      month: round2(sumRevenue(monthStart)),
      refunded_in_range: round2(refundedRange),
      net_range_total: round2(revenueRange),
      verified_payments_total: verifiedPayments === null ? null : round2(verifiedPayments),
      revenue_basis: 'orders',
    },
    save2own: {
      goals_by_status: goalsByStatus,
      active_goals:
        (goalsByStatus['ACTIVE'] || 0) +
        (goalsByStatus['IN_PROGRESS'] || 0) +
        (goalsByStatus['ONGOING'] || 0) +
        (goalsByStatus['OPEN'] || 0),
      total_goals: goals.length,
      confirmed_contributions: confirmed.length,
      pending_contributions: pendingC.length,
      rejected_contributions: rejectedC.length,
      reversed_contributions: reversedC.length,
      confirmed_amount: round2(confirmed.reduce((a, c) => a + toNumber(c?.amount), 0)),
      pending_amount: round2(pendingC.reduce((a, c) => a + toNumber(c?.amount), 0)),
    },
    refunds: {
      pending: (refundsByStatus['PENDING'] || 0) + (refundsByStatus['UNDER_REVIEW'] || 0),
      by_status: refundsByStatus,
    },
    recent_orders: recentOrders,
    recent_users: sortedUsers.slice(0, 5).map((u) => ({
      id: String(u?.id ?? ''),
      email: String(u?.email ?? ''),
      first_name: String(u?.first_name ?? ''),
      last_name: String(u?.last_name ?? ''),
      date_joined: String(u?.date_joined ?? ''),
    })),
    warnings,
  };
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
