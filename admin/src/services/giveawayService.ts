import type {
  LaunchGiveawayPromotion,
  GiveawayClaim,
  GiveawayStatus,
} from '@/types';

export const DEFAULT_LAUNCH_GIVEAWAY_PROMOTION: LaunchGiveawayPromotion = {
  id: 'promo-launch-earpod-2026',
  name: 'DOVI Launch Giveaway',
  headline: 'SHOP ₦30,000 OR MORE AND GET A FREE EARPOD!',
  subheadline: 'Limited gifts available. Offer ends 20 December 2026.',
  status: 'ACTIVE',
  qualifying_subtotal: 30000,
  gift_item: {
    id: 'promo-gift-earpod-2026',
    product_id: 'promo-gift-earpod-2026',
    name: 'DOVI Free EarPod (Launch Edition)',
    description: 'Complimentary DOVI Wireless EarPod with high-definition audio and charging case.',
    price: '0.00',
    unit_price: '0.00',
    quantity: 1,
    line_total: '0.00',
    is_promotional_gift: true,
    sku: 'DOV-GIFT-EARPOD-2026',
    image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80',
  },
  initial_stock: 20,
  total_stock: 20,
  max_allowed_stock: 50,
  available_stock: 20,
  reserved_stock: 0,
  confirmed_stock: 0,
  released_reservations_count: 0,
  start_date: '2026-11-22T00:00:00Z',
  end_date: '2026-12-20T23:59:59Z',
  max_per_customer: 1,
  claims: [],
  updated_at: '2026-11-22T20:00:00Z',
};

const STORAGE_KEY = 'dovi_launch_giveaway_db';

export function computeGiveawayStatus(promo: LaunchGiveawayPromotion): GiveawayStatus {
  if (promo.status === 'DISABLED') return 'DISABLED';
  const now = new Date();
  const start = new Date(promo.start_date);
  const end = new Date(promo.end_date);

  if (now < start) return 'SCHEDULED';
  if (now > end) return 'EXPIRED';
  if (promo.available_stock <= 0) return 'OUT_OF_STOCK';
  return 'ACTIVE';
}

export function getLocalGiveawayPromotion(): LaunchGiveawayPromotion {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id === DEFAULT_LAUNCH_GIVEAWAY_PROMOTION.id) {
        parsed.status = computeGiveawayStatus(parsed);
        return parsed;
      }
    }
  } catch {}
  return { ...DEFAULT_LAUNCH_GIVEAWAY_PROMOTION };
}

export function saveLocalGiveawayPromotion(promo: LaunchGiveawayPromotion): void {
  try {
    promo.status = computeGiveawayStatus(promo);
    promo.updated_at = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(promo));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dovi-giveaway-updated', { detail: promo }));
    }
  } catch {}
}

export async function fetchAuthoritativeGiveawayPromotion(): Promise<LaunchGiveawayPromotion> {
  try {
    const res = await fetch('/__dovi_delivery_db__');
    if (res.ok) {
      const store = await res.json();
      if (store?.launchGiveaway) {
        const promo: LaunchGiveawayPromotion = {
          ...DEFAULT_LAUNCH_GIVEAWAY_PROMOTION,
          ...store.launchGiveaway,
        };
        promo.status = computeGiveawayStatus(promo);
        saveLocalGiveawayPromotion(promo);
        return promo;
      }
    }
  } catch {}

  return getLocalGiveawayPromotion();
}

export async function pushAuthoritativeGiveawayPromotion(promo: LaunchGiveawayPromotion): Promise<void> {
  saveLocalGiveawayPromotion(promo);
  try {
    const res = await fetch('/__dovi_delivery_db__', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ launchGiveaway: promo }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json?.store?.launchGiveaway) {
        saveLocalGiveawayPromotion(json.store.launchGiveaway);
      }
    }
  } catch {}
}

export function checkCustomerGiveawayEligibility(params: {
  productSubtotal: number;
  customerId?: string;
  customerPhone?: string;
  promo?: LaunchGiveawayPromotion;
}): { eligible: boolean; reason?: string; promo: LaunchGiveawayPromotion } {
  const promo = params.promo || getLocalGiveawayPromotion();
  const effectiveStatus = computeGiveawayStatus(promo);

  if (effectiveStatus === 'DISABLED') {
    return { eligible: false, reason: 'Promotion is currently disabled.', promo };
  }
  if (effectiveStatus === 'EXPIRED') {
    return { eligible: false, reason: 'Promotion has ended on 20 December 2026.', promo };
  }
  if (effectiveStatus === 'SCHEDULED') {
    return { eligible: false, reason: 'Promotion has not started yet.', promo };
  }
  if (effectiveStatus === 'OUT_OF_STOCK' || promo.available_stock <= 0) {
    return { eligible: false, reason: 'All promotional gifts have been claimed.', promo };
  }

  if (params.productSubtotal < promo.qualifying_subtotal) {
    const diff = promo.qualifying_subtotal - params.productSubtotal;
    return {
      eligible: false,
      reason: `Add ₦${diff.toLocaleString()} more in products to unlock a FREE EarPod!`,
      promo,
    };
  }

  const cleanPhone = (params.customerPhone || '').replace(/[^0-9]/g, '');
  const existingClaim = promo.claims.find((c) => {
    if (c.status === 'RELEASED') return false;
    const matchId = Boolean(params.customerId && c.customer_id && c.customer_id === params.customerId);
    const matchPhone = Boolean(cleanPhone && cleanPhone.length >= 10 && c.customer_phone && c.customer_phone.replace(/[^0-9]/g, '') === cleanPhone);
    return matchId || matchPhone;
  });

  if (existingClaim) {
    return {
      eligible: false,
      reason: 'You have already claimed your complimentary Launch Giveaway EarPod (Limit 1 per customer).',
      promo,
    };
  }

  return { eligible: true, promo };
}

export async function reserveGiveawayGift(params: {
  orderReference: string;
  productSubtotal: number;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  isTest?: boolean;
}): Promise<{ success: boolean; claim?: GiveawayClaim; error?: string }> {
  const promo = await fetchAuthoritativeGiveawayPromotion();

  const eligibility = checkCustomerGiveawayEligibility({
    productSubtotal: params.productSubtotal,
    customerId: params.customerId,
    customerPhone: params.customerPhone,
    promo,
  });

  if (!eligibility.eligible && !params.isTest) {
    return { success: false, error: eligibility.reason || 'Not eligible for giveaway.' };
  }

  if (promo.available_stock <= 0) {
    return { success: false, error: 'Promotional EarPod stock is exhausted.' };
  }

  const normRef = params.orderReference.toUpperCase().trim();
  const existingOrderClaim = promo.claims.find(
    (c) => c.order_reference.toUpperCase().trim() === normRef && c.status === 'RESERVED'
  );
  if (existingOrderClaim) {
    return { success: true, claim: existingOrderClaim };
  }

  const nowIso = new Date().toISOString();
  const newClaim: GiveawayClaim = {
    id: `claim-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    customer_id: params.customerId,
    customer_name: params.customerName,
    customer_email: params.customerEmail,
    customer_phone: params.customerPhone,
    order_reference: normRef,
    status: 'RESERVED',
    reserved_at: nowIso,
    confirmed_at: null,
    released_at: null,
    release_reason: null,
    is_test: Boolean(params.isTest),
  };

  if (!params.isTest) {
    promo.available_stock = Math.max(0, promo.available_stock - 1);
    promo.reserved_stock = promo.reserved_stock + 1;
    promo.claims.unshift(newClaim);
    await pushAuthoritativeGiveawayPromotion(promo);
  }

  return { success: true, claim: newClaim };
}

export async function releaseGiveawayReservation(params: {
  orderReference: string;
  reason: string;
  isTest?: boolean;
}): Promise<boolean> {
  const promo = await fetchAuthoritativeGiveawayPromotion();
  const normRef = params.orderReference.toUpperCase().trim();

  const claim = promo.claims.find(
    (c) => c.order_reference.toUpperCase().trim() === normRef && c.status === 'RESERVED'
  );

  if (!claim) return false;

  claim.status = 'RELEASED';
  claim.released_at = new Date().toISOString();
  claim.release_reason = params.reason;

  if (!params.isTest) {
    promo.reserved_stock = Math.max(0, promo.reserved_stock - 1);
    promo.available_stock = Math.min(
      promo.total_stock - promo.confirmed_stock,
      promo.available_stock + 1
    );
    promo.released_reservations_count = promo.released_reservations_count + 1;
    await pushAuthoritativeGiveawayPromotion(promo);
  }

  return true;
}

export async function confirmGiveawayReservation(params: {
  orderReference: string;
  isTest?: boolean;
}): Promise<boolean> {
  const promo = await fetchAuthoritativeGiveawayPromotion();
  const normRef = params.orderReference.toUpperCase().trim();

  const claim = promo.claims.find(
    (c) => c.order_reference.toUpperCase().trim() === normRef && c.status === 'RESERVED'
  );

  if (!claim) return false;

  claim.status = 'CONFIRMED';
  claim.confirmed_at = new Date().toISOString();

  if (!params.isTest) {
    promo.reserved_stock = Math.max(0, promo.reserved_stock - 1);
    promo.confirmed_stock = promo.confirmed_stock + 1;
    await pushAuthoritativeGiveawayPromotion(promo);
  }

  return true;
}

export async function updateAdminGiveawayConfig(params: {
  status?: GiveawayStatus;
  total_stock?: number;
  qualifying_subtotal?: number;
  start_date?: string;
  end_date?: string;
  headline?: string;
}): Promise<{ success: boolean; promo?: LaunchGiveawayPromotion; error?: string }> {
  const promo = await fetchAuthoritativeGiveawayPromotion();

  if (params.total_stock !== undefined) {
    if (params.total_stock > 50) {
      return {
        success: false,
        error: 'Promotional stock cannot exceed the maximum configured limit of 50 units.',
      };
    }
    const minRequired = promo.reserved_stock + promo.confirmed_stock;
    if (params.total_stock < minRequired) {
      return {
        success: false,
        error: `Cannot reduce total stock below currently allocated units (${minRequired} units reserved/confirmed).`,
      };
    }
    promo.total_stock = params.total_stock;
    promo.available_stock = params.total_stock - minRequired;
  }

  if (params.status !== undefined) promo.status = params.status;
  if (params.qualifying_subtotal !== undefined) promo.qualifying_subtotal = Math.max(0, params.qualifying_subtotal);
  if (params.start_date !== undefined) promo.start_date = params.start_date;
  if (params.end_date !== undefined) promo.end_date = params.end_date;
  if (params.headline !== undefined) promo.headline = params.headline;

  promo.status = computeGiveawayStatus(promo);
  await pushAuthoritativeGiveawayPromotion(promo);
  return { success: true, promo };
}
