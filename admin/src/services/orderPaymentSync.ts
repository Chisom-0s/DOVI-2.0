import type { Payment } from '@/types';
import { fetchSharedDbOnce } from './sharedDbSync';

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

export function getLocalOrders(): Record<string, any> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_ORDERS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLocalOrdersMap(ordersMap: Record<string, any>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LOCAL_ORDERS, JSON.stringify(ordersMap));
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

export async function syncPaymentsAndOrdersFromServer(): Promise<{ payments: Payment[]; orders: Record<string, any> }> {
  const serverData: any = await fetchSharedDbOnce();

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

export async function pushPaymentsAndOrdersToServer(payments?: Payment[], orders?: Record<string, any>): Promise<boolean> {
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

export function approvePaymentSync(
  paymentOrOrderRef: string,
  actor: { name?: string; email?: string } = {},
  notes: string = ''
): { payment: Payment; order?: any } {
  const payments = getLocalPayments();
  const targetPayment = payments.find(
    (p) => p.id === paymentOrOrderRef || p.reference === paymentOrOrderRef || p.order_reference === paymentOrOrderRef
  );

  const nowIso = new Date().toISOString();
  const adminName = actor.name || actor.email || 'Administrator';

  let effectivePayment: Payment;

  if (targetPayment) {
    targetPayment.status = 'VERIFIED';
    targetPayment.verified_at = nowIso;
    targetPayment.verified_by = adminName;
    if (notes) targetPayment.notes = notes;
    effectivePayment = targetPayment;
  } else {
    // Create payment entry if not existing yet
    effectivePayment = {
      id: `pay-${Date.now()}`,
      reference: `PAY-${paymentOrOrderRef}`,
      order_reference: paymentOrOrderRef,
      provider: 'BANK_TRANSFER',
      status: 'VERIFIED',
      amount: '0',
      currency: 'NGN',
      created_at: nowIso,
      verified_at: nowIso,
      verified_by: adminName,
      notes,
    };
    payments.unshift(effectivePayment);
  }
  saveLocalPayments(payments);

  // Update order status in orders storage
  const ordersMap = getLocalOrders();
  const orderRef: string = effectivePayment.order_reference || paymentOrOrderRef;
  let targetOrder = ordersMap[orderRef] || ordersMap[paymentOrOrderRef];

  if (targetOrder) {
    targetOrder.payment_status = 'PAID';
    // If order was awaiting payment, advance to PROCESSING
    if (
      targetOrder.status === 'PENDING_PAYMENT' ||
      targetOrder.status === 'ORDER_PLACED' ||
      targetOrder.status === 'AWAITING_DELIVERY_CONFIRMATION'
    ) {
      targetOrder.status = 'PROCESSING';
    }
    targetOrder.verified_at = nowIso;
    targetOrder.verified_by = adminName;
    ordersMap[orderRef] = targetOrder;
    if (targetOrder.id) ordersMap[targetOrder.id] = targetOrder;
  } else {
    targetOrder = {
      id: paymentOrOrderRef,
      reference: orderRef,
      reference_code: orderRef,
      payment_status: 'PAID',
      status: 'PROCESSING',
      verified_at: nowIso,
      verified_by: adminName,
      created_at: nowIso,
    };
    ordersMap[orderRef] = targetOrder;
  }
  saveLocalOrdersMap(ordersMap);

  // Notify customer
  addCustomerNotification(
    'Payment Approved! 🎉',
    `Your bank transfer payment for Order #${orderRef} has been verified and approved. Your order is now being processed.`,
    'SUCCESS'
  );

  void pushPaymentsAndOrdersToServer(payments, ordersMap);

  return { payment: effectivePayment, order: targetOrder };
}

export function rejectPaymentSync(
  paymentOrOrderRef: string,
  reason: string,
  actor: { name?: string; email?: string } = {}
): { payment: Payment; order?: any } {
  const payments = getLocalPayments();
  const targetPayment = payments.find(
    (p) => p.id === paymentOrOrderRef || p.reference === paymentOrOrderRef || p.order_reference === paymentOrOrderRef
  );

  const nowIso = new Date().toISOString();
  const adminName = actor.name || actor.email || 'Administrator';

  let effectivePayment: Payment;
  if (targetPayment) {
    targetPayment.status = 'REJECTED';
    targetPayment.rejection_reason = reason;
    targetPayment.verified_at = nowIso;
    targetPayment.verified_by = adminName;
    effectivePayment = targetPayment;
  } else {
    effectivePayment = {
      id: `pay-${Date.now()}`,
      reference: `PAY-${paymentOrOrderRef}`,
      order_reference: paymentOrOrderRef,
      provider: 'BANK_TRANSFER',
      status: 'REJECTED',
      amount: '0',
      currency: 'NGN',
      rejection_reason: reason,
      created_at: nowIso,
      verified_at: nowIso,
      verified_by: adminName,
    };
    payments.unshift(effectivePayment);
  }
  saveLocalPayments(payments);

  // Update order
  const ordersMap = getLocalOrders();
  const orderRef: string = effectivePayment.order_reference || paymentOrOrderRef;
  let targetOrder = ordersMap[orderRef] || ordersMap[paymentOrOrderRef];

  if (targetOrder) {
    targetOrder.payment_status = 'REJECTED';
    targetOrder.payment_rejection_reason = reason;
    targetOrder.status = 'PENDING_PAYMENT'; // keeps it open so customer can resubmit
    ordersMap[orderRef] = targetOrder;
    if (targetOrder.id) ordersMap[targetOrder.id] = targetOrder;
  } else {
    targetOrder = {
      id: paymentOrOrderRef,
      reference: orderRef,
      reference_code: orderRef,
      payment_status: 'REJECTED',
      payment_rejection_reason: reason,
      status: 'PENDING_PAYMENT',
      created_at: nowIso,
    };
    ordersMap[orderRef] = targetOrder;
  }
  saveLocalOrdersMap(ordersMap);

  // Notify customer
  addCustomerNotification(
    'Payment Evidence Needs Review',
    `Payment evidence for Order #${orderRef} was rejected: "${reason}". Please review your receipt and resubmit.`,
    'WARNING'
  );

  void pushPaymentsAndOrdersToServer(payments, ordersMap);

  return { payment: effectivePayment, order: targetOrder };
}

export function updateOrderStatusSync(
  orderIdOrRef: string,
  newStatus: string,
  actor: { name?: string; email?: string } = {}
): any {
  const ordersMap = getLocalOrders();
  let ord = ordersMap[orderIdOrRef];
  if (!ord) {
    for (const val of Object.values(ordersMap)) {
      if (val.id === orderIdOrRef || val.reference === orderIdOrRef || val.reference_code === orderIdOrRef) {
        ord = val;
        break;
      }
    }
  }

  const nowIso = new Date().toISOString();
  const actorName = actor.name || actor.email || 'Administrator';
  if (ord) {
    ord.status = newStatus;
    ord.updated_at = nowIso;
    ord.updated_by = actorName;
    ordersMap[ord.reference || orderIdOrRef] = ord;
    if (ord.id) ordersMap[ord.id] = ord;
  } else {
    ord = {
      id: orderIdOrRef,
      reference: orderIdOrRef,
      reference_code: orderIdOrRef,
      status: newStatus,
      updated_at: nowIso,
      updated_by: actorName,
    };
    ordersMap[orderIdOrRef] = ord;
  }
  saveLocalOrdersMap(ordersMap);

  // If status is DISPATCHED or DELIVERED, notify customer
  if (newStatus === 'DISPATCHED') {
    addCustomerNotification(
      'Order Dispatched! 🚚',
      `Your order #${ord.reference || orderIdOrRef} has been dispatched for delivery.`,
      'INFO'
    );
  } else if (newStatus === 'DELIVERED') {
    addCustomerNotification(
      'Order Delivered! 📦',
      `Your order #${ord.reference || orderIdOrRef} has been delivered. Thank you for shopping with DOVI!`,
      'SUCCESS'
    );
  }

  void pushPaymentsAndOrdersToServer(undefined, ordersMap);
  return ord;
}

export function getPaymentByOrderRef(orderRef: string): Payment | null {
  const list = getLocalPayments();
  return list.find((p) => p.order_reference === orderRef || p.id === orderRef) || null;
}
