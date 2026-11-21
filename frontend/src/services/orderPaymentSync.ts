import type { Payment, Order } from '@/types';

const STORAGE_KEYS = {
  PAYMENTS: 'dovi_payments_submissions',
  LOCAL_ORDERS: 'dovi_local_orders_v1',
  LEGACY_ORDERS: 'dovi_orders',
  NOTIFICATIONS: 'dovi_local_notifications',
};

export function getLocalPayments(): Payment[] {
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
  } catch {}
}

export function getLocalOrders(): Record<string, Order> {
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
    ord.status = ord.status === 'PENDING_PAYMENT' ? 'ORDER_PLACED' : ord.status;
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
