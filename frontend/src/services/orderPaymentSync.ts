import type { Payment, Order } from '@/types';

const STORAGE_KEYS = {
  PAYMENTS: 'dovi_payments_submissions',
  LOCAL_ORDERS: 'dovi_local_orders_v1',
  LEGACY_ORDERS: 'dovi_orders',
  NOTIFICATIONS: 'dovi_local_notifications',
};

export const SYSTEM_RESET_VERSION = '2026-11-22-audit-ready-v2';

export function enforceSystemResetCheck(serverData?: any): void {
  try {
    const applied = localStorage.getItem('dovi_system_reset_version');
    const targetVersion = serverData?.system_reset_version || SYSTEM_RESET_VERSION;
    // Only reset ONCE if the local client has not yet applied the target version
    const needsReset = !applied || applied !== targetVersion;
    if (needsReset) {
      localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
      localStorage.removeItem(STORAGE_KEYS.LOCAL_ORDERS);
      localStorage.removeItem(STORAGE_KEYS.LEGACY_ORDERS);
      localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
      localStorage.removeItem('dovi_payment_sessions');
      localStorage.removeItem('dovi_save2own_goals');
      localStorage.removeItem('dovi_save2own_participants');
      localStorage.removeItem('dovi_global_s2o_contribs');
      localStorage.removeItem('dovi_stored_refunds');
      localStorage.removeItem('dovi_cart');
      localStorage.removeItem('dovi_cart_selected_items');
      localStorage.removeItem('dovi_deleted_product_ids');
      localStorage.removeItem('dovi_payment_accounts');

      // Purge non-admin test user session
      const userRaw = localStorage.getItem('dovi_user_session');
      if (userRaw) {
        try {
          const u = JSON.parse(userRaw);
          if (u.role !== 'ADMIN' && u.email !== 'admin@dovi.com') {
            localStorage.removeItem('dovi_user_session');
            localStorage.removeItem('dovi_access_token');
            localStorage.removeItem('dovi_refresh_token');
          }
        } catch {
          localStorage.removeItem('dovi_user_session');
        }
      }

      localStorage.setItem('dovi_system_reset_version', SYSTEM_RESET_VERSION);
    }
  } catch {}
}

export function getLocalPayments(): Payment[] {
  enforceSystemResetCheck();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalPayments(payments: Payment[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
  } catch {
    try {
      const sanitized = payments.map((p) => {
        if (p.payment_proof_url && p.payment_proof_url.startsWith('data:') && p.payment_proof_url.length > 500) {
          return { ...p, payment_proof_url: '' };
        }
        return p;
      });
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(sanitized));
    } catch {}
  }
}

export function getLocalOrders(): Record<string, Order> {
  enforceSystemResetCheck();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_ORDERS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLocalOrdersMap(ordersMap: Record<string, Order>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LOCAL_ORDERS, JSON.stringify(ordersMap));
    // Also sync legacy orders list
    localStorage.setItem(STORAGE_KEYS.LEGACY_ORDERS, JSON.stringify(Object.values(ordersMap)));
  } catch {}
}

export function addCustomerNotification(title: string, message: string, type: 'SUCCESS' | 'WARNING' | 'INFO' = 'INFO') {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    const list = raw ? JSON.parse(raw) : [];
    const notif = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      message,
      type,
      action_url: null,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    list.unshift(notif);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
  } catch {}
}

export async function syncPaymentsAndOrdersFromServer(): Promise<{ payments: Payment[]; orders: Record<string, Order> }> {
  let serverData: any = null;
  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      const res = await fetch('/__dovi_delivery_db__', {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        serverData = await res.json();
      }
    } catch {
      // Fallback
    }
  }

  enforceSystemResetCheck(serverData);

  // 1. Merge payments
  const localPayments = getLocalPayments();
  const serverPayments: Payment[] = Array.isArray(serverData?.payments) ? serverData.payments : [];
  const paymentMap = new Map<string, Payment>();

  for (const p of localPayments) {
    if (p && p.order_reference) paymentMap.set(p.order_reference, p);
  }
  for (const p of serverPayments) {
    if (p && p.order_reference) {
      const existing = paymentMap.get(p.order_reference);
      if (!existing || new Date(p.created_at || '').getTime() >= new Date(existing.created_at || '').getTime()) {
        paymentMap.set(p.order_reference, p);
      }
    }
  }
  const mergedPayments = Array.from(paymentMap.values());
  saveLocalPayments(mergedPayments);

  // 2. Merge orders
  const localOrdersMap = getLocalOrders();
  const serverOrders: any[] = Array.isArray(serverData?.orders) ? serverData.orders : [];

  for (const ord of serverOrders) {
    const ref = ord.reference || ord.reference_code || ord.id;
    if (ref) {
      const existing = localOrdersMap[ref];
      if (!existing) {
        localOrdersMap[ref] = ord;
      } else {
        // Sync payment status and order status from server if newer or verified
        localOrdersMap[ref] = {
          ...existing,
          ...ord,
          status: ord.status || existing.status,
          payment_status: ord.payment_status || existing.payment_status,
        };
      }
    }
  }
  saveLocalOrdersMap(localOrdersMap);

  return {
    payments: mergedPayments,
    orders: localOrdersMap,
  };
}

export async function pushPaymentsAndOrdersToServer(payments?: Payment[], orders?: Record<string, Order>): Promise<boolean> {
  const currentPayments = payments || getLocalPayments();
  const currentOrdersMap = orders || getLocalOrders();
  const ordersList = Object.values(currentOrdersMap);

  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      const res = await fetch('/__dovi_delivery_db__', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payments: currentPayments,
          orders: ordersList,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
  return false;
}

export function savePaymentSubmissionSync(payment: Payment): void {
  const list = getLocalPayments();
  const filtered = list.filter((p) => p.order_reference !== payment.order_reference && p.id !== payment.id);
  filtered.unshift(payment);
  saveLocalPayments(filtered);

  // Update associated order
  const ordersMap = getLocalOrders();
  const ord = ordersMap[payment.order_reference];
  if (ord) {
    ord.payment_status = 'PENDING_VERIFICATION';
    if (ord.status === 'PENDING_PAYMENT' || (ord.status as string) === 'PENDING') {
      ord.status = 'ORDER_PLACED';
    }
    (ord as any).payment_reference = payment.reference;
    (ord as any).payment_submitted_at = payment.created_at;
    (ord as any).payment_proof_url = payment.payment_proof_url;
    (ord as any).sender_bank = payment.sender_bank;
    (ord as any).sender_account_name = payment.sender_account_name;
    (ord as any).transaction_reference = payment.transaction_reference;
    ordersMap[payment.order_reference] = ord;
    if (ord.id) ordersMap[ord.id] = ord;
    saveLocalOrdersMap(ordersMap);
  }

  void pushPaymentsAndOrdersToServer(filtered, ordersMap);
}

export function getPaymentByOrderRef(orderRef: string): Payment | null {
  const list = getLocalPayments();
  return list.find((p) => p.order_reference === orderRef || p.id === orderRef) || null;
}
