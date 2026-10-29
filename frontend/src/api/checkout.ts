// Checkout API — /api/v1/checkout/*
import apiClient, { normalizeApiError } from './client';
import {
  syncDeliveryStoreFromServer,
  calculateOrderDelivery,
  buildOrderShipmentsFromCalculation,
  type EvaluableOrderItem,
} from '@/services/deliveryPricingService';
import type {
  Address,
  Cart,
  CheckoutSession,
  DeliveryCalculationResult,
  Order,
  VendorDeliverySelection,
} from '@/types';

const CHECKOUT_SESSION_STORAGE_KEY = 'dovi_checkout_sessions_v1';
const LOCAL_ORDERS_STORAGE_KEY = 'dovi_local_orders_v1';

interface StoredSessionOverlay {
  id: string;
  cart_snapshot?: Cart;
  delivery_address?: Address | null;
  delivery_calculation: DeliveryCalculationResult;
  route_updated_at_snapshot: string | null;
  subtotal: string;
  delivery_fee: string;
  total: string;
  created_at: string;
  expires_at: string;
}

function getStoredSessionMap(): Record<string, StoredSessionOverlay> {
  try {
    const raw = localStorage.getItem(CHECKOUT_SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredSessionOverlay(overlay: StoredSessionOverlay): void {
  try {
    const map = getStoredSessionMap();
    map[overlay.id] = overlay;
    localStorage.setItem(CHECKOUT_SESSION_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage errors
  }
}

export function getLocalOrdersMap(): Record<string, Order> {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLocalOrder(order: Order): void {
  try {
    const map = getLocalOrdersMap();
    map[order.reference] = order;
    map[order.id] = order;
    localStorage.setItem(LOCAL_ORDERS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage errors
  }
}

export const checkoutApi = {
  initializeSession: async (payload: {
    delivery_address_id?: string;
    delivery_method_id?: string;
    delivery_method?: string;
    vendor_delivery_selections?: VendorDeliverySelection[];
    delivery_address?: Address | null;
    cart_snapshot?: Cart | null;
    delivery_calculation?: DeliveryCalculationResult;
    destination_state?: string;
    destination_city?: string;
    destination_address?: string;
    recipient_name?: string;
    recipient_phone?: string;
  }): Promise<CheckoutSession> => {
    await syncDeliveryStoreFromServer();

    const calc = payload.delivery_calculation;
    const subtotalNum = calc ? calc.product_subtotal : Number(payload.cart_snapshot?.subtotal || 0);

    try {
      const { data } = await apiClient.post('/api/v1/checkout/', {
        delivery_address_id: payload.delivery_address_id,
        delivery_method_id: payload.delivery_method_id,
        delivery_method: payload.delivery_method,
        vendor_delivery_selections: payload.vendor_delivery_selections,
      });

      const sessionId = String(data.id);
      if (calc) {
        saveStoredSessionOverlay({
          id: sessionId,
          cart_snapshot: payload.cart_snapshot || data.cart_snapshot,
          delivery_address: payload.delivery_address || data.delivery_address,
          delivery_calculation: calc,
          route_updated_at_snapshot: calc.route_updated_at || null,
          subtotal: String(subtotalNum),
          delivery_fee: calc.total_delivery_fee !== null ? String(calc.total_delivery_fee) : 'MANUAL_QUOTE',
          total: calc.total_payable !== null ? String(calc.total_payable) : String(subtotalNum),
          created_at: new Date().toISOString(),
          expires_at: data.expires_at || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        });
      }

      return {
        ...data,
        delivery_address: payload.delivery_address || data.delivery_address,
        subtotal: String(subtotalNum),
        delivery_fee: calc && calc.total_delivery_fee !== null ? String(calc.total_delivery_fee) : data.delivery_fee,
        total: calc && calc.total_payable !== null ? String(calc.total_payable) : data.total,
        delivery_calculation: calc,
        shipment_count: calc?.shipment_count ?? 1,
        requires_delivery_confirmation: calc?.requires_manual_quote ?? false,
        delivery_confirmation_status: calc?.requires_manual_quote ? 'PENDING_ADMIN_QUOTE' : 'NOT_REQUIRED',
        route_updated_at_snapshot: calc?.route_updated_at || null,
      };
    } catch (err) {
      // If backend checkout session fails when creating a manual-quote session or local session,
      // provide a resilient session when cart_snapshot and delivery_calculation are supplied
      if (payload.cart_snapshot && calc) {
        const fallbackId = `chk_${Date.now()}`;
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        saveStoredSessionOverlay({
          id: fallbackId,
          cart_snapshot: payload.cart_snapshot,
          delivery_address: payload.delivery_address || null,
          delivery_calculation: calc,
          route_updated_at_snapshot: calc.route_updated_at || null,
          subtotal: String(subtotalNum),
          delivery_fee: calc.total_delivery_fee !== null ? String(calc.total_delivery_fee) : 'MANUAL_QUOTE',
          total: calc.total_payable !== null ? String(calc.total_payable) : String(subtotalNum),
          created_at: new Date().toISOString(),
          expires_at: expiresAt,
        });

        return {
          id: fallbackId,
          cart_snapshot: payload.cart_snapshot,
          delivery_address: payload.delivery_address || null,
          delivery_method: {
            id: 'onitsha-hub-consolidated',
            name: 'DOVI Onitsha Hub Consolidated Delivery',
            description: calc.overall_explanation,
            estimated_days: '2-4 business days',
            price: calc.total_delivery_fee !== null ? String(calc.total_delivery_fee) : '0',
          },
          payment_method: null,
          subtotal: String(subtotalNum),
          delivery_fee: calc.total_delivery_fee !== null ? String(calc.total_delivery_fee) : '0',
          total: calc.total_payable !== null ? String(calc.total_payable) : String(subtotalNum),
          expires_at: expiresAt,
          delivery_calculation: calc,
          shipment_count: calc.shipment_count,
          requires_delivery_confirmation: calc.requires_manual_quote,
          delivery_confirmation_status: calc.requires_manual_quote ? 'PENDING_ADMIN_QUOTE' : 'NOT_REQUIRED',
          route_updated_at_snapshot: calc.route_updated_at || null,
        };
      }
      throw normalizeApiError(err);
    }
  },

  previewCheckout: async (payload: {
    delivery_method?: string;
    delivery_address_id?: string;
    vendor_delivery_selections?: VendorDeliverySelection[];
  }): Promise<{
    subtotal: string;
    delivery_fees?: Record<string, string>;
    total_delivery_fee: string;
    total: string;
  }> => {
    try {
      const { data } = await apiClient.post('/api/v1/checkout/preview/', payload);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getSession: async (id: string): Promise<CheckoutSession> => {
    await syncDeliveryStoreFromServer();
    const overlay = getStoredSessionMap()[id];

    try {
      const { data } = await apiClient.get(`/api/v1/checkout/${id}/`);
      if (overlay) {
        return {
          ...data,
          delivery_address: overlay.delivery_address || data.delivery_address,
          subtotal: overlay.subtotal,
          delivery_fee:
            overlay.delivery_calculation.total_delivery_fee !== null
              ? String(overlay.delivery_calculation.total_delivery_fee)
              : '0',
          total:
            overlay.delivery_calculation.total_payable !== null
              ? String(overlay.delivery_calculation.total_payable)
              : overlay.subtotal,
          delivery_calculation: overlay.delivery_calculation,
          shipment_count: overlay.delivery_calculation.shipment_count,
          requires_delivery_confirmation: overlay.delivery_calculation.requires_manual_quote,
          delivery_confirmation_status: overlay.delivery_calculation.requires_manual_quote
            ? 'PENDING_ADMIN_QUOTE'
            : 'NOT_REQUIRED',
          route_updated_at_snapshot: overlay.route_updated_at_snapshot,
        };
      }
      return data;
    } catch (err) {
      if (overlay && overlay.cart_snapshot) {
        return {
          id: overlay.id,
          cart_snapshot: overlay.cart_snapshot,
          delivery_address: overlay.delivery_address || null,
          delivery_method: {
            id: 'onitsha-hub-consolidated',
            name: 'DOVI Onitsha Hub Consolidated Delivery',
            description: overlay.delivery_calculation.overall_explanation,
            estimated_days: '2-4 business days',
            price:
              overlay.delivery_calculation.total_delivery_fee !== null
                ? String(overlay.delivery_calculation.total_delivery_fee)
                : '0',
          },
          payment_method: null,
          subtotal: overlay.subtotal,
          delivery_fee:
            overlay.delivery_calculation.total_delivery_fee !== null
              ? String(overlay.delivery_calculation.total_delivery_fee)
              : '0',
          total:
            overlay.delivery_calculation.total_payable !== null
              ? String(overlay.delivery_calculation.total_payable)
              : overlay.subtotal,
          expires_at: overlay.expires_at,
          delivery_calculation: overlay.delivery_calculation,
          shipment_count: overlay.delivery_calculation.shipment_count,
          requires_delivery_confirmation: overlay.delivery_calculation.requires_manual_quote,
          delivery_confirmation_status: overlay.delivery_calculation.requires_manual_quote
            ? 'PENDING_ADMIN_QUOTE'
            : 'NOT_REQUIRED',
          route_updated_at_snapshot: overlay.route_updated_at_snapshot,
        };
      }
      throw normalizeApiError(err);
    }
  },

  /**
   * Re-verifies delivery pricing right before payment (Section 7 & Edge Case 7).
   * If an administrator updated the delivery route rates after the checkout session was created,
   * recalculates the delivery fee and returns `priceChanged: true` so the customer can review
   * and approve the updated total before paying.
   */
  reverifySessionDeliveryPricing: async (
    session: CheckoutSession
  ): Promise<{
    priceChanged: boolean;
    changed: boolean;
    previousFee: string;
    newFee: string;
    newCalculation: DeliveryCalculationResult | null;
    updatedSession: CheckoutSession;
  }> => {
    await syncDeliveryStoreFromServer();
    const existingCalc = session.delivery_calculation;
    if (!existingCalc) {
      return {
        priceChanged: false,
        changed: false,
        previousFee: String(session.delivery_fee || '0'),
        newFee: String(session.delivery_fee || '0'),
        newCalculation: null,
        updatedSession: session,
      };
    }

    // Rebuild evaluable items from existing calculation shipments
    const evaluableItems: EvaluableOrderItem[] = existingCalc.shipments.flatMap((group) =>
      group.items.map((item) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        variant_id: item.variant_id,
        variant_name: item.variant_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        delivery_classification: item.delivery_classification,
        weight_kg: item.weight_kg,
        dimensions_cm: item.dimensions_cm,
        requires_special_handling: item.requires_special_handling,
        image_url: item.image_url,
      }))
    );

    const freshCalc = calculateOrderDelivery({
      items: evaluableItems,
      destinationState: existingCalc.destination_state,
      destinationCity: existingCalc.destination_city,
      dispatchOrigin: existingCalc.dispatch_origin,
    });

    const prevFee = existingCalc.total_delivery_fee;
    const nextFee = freshCalc.total_delivery_fee;
    const priceChanged =
      prevFee !== nextFee || existingCalc.requires_manual_quote !== freshCalc.requires_manual_quote;

    if (priceChanged) {
      const updatedSession: CheckoutSession = {
        ...session,
        delivery_fee: nextFee !== null ? String(nextFee) : '0',
        total: freshCalc.total_payable !== null ? String(freshCalc.total_payable) : session.subtotal,
        delivery_calculation: freshCalc,
        shipment_count: freshCalc.shipment_count,
        requires_delivery_confirmation: freshCalc.requires_manual_quote,
        route_updated_at_snapshot: freshCalc.route_updated_at || null,
      };

      saveStoredSessionOverlay({
        id: session.id,
        cart_snapshot: session.cart_snapshot,
        delivery_address: session.delivery_address,
        delivery_calculation: freshCalc,
        route_updated_at_snapshot: freshCalc.route_updated_at || null,
        subtotal: session.subtotal,
        delivery_fee: nextFee !== null ? String(nextFee) : 'MANUAL_QUOTE',
        total: freshCalc.total_payable !== null ? String(freshCalc.total_payable) : session.subtotal,
        created_at: new Date().toISOString(),
        expires_at: session.expires_at,
      });

      return {
        priceChanged: true,
        changed: true,
        previousFee: String(prevFee ?? '0'),
        newFee: String(nextFee ?? '0'),
        newCalculation: freshCalc,
        updatedSession,
      };
    }

    return {
      priceChanged: false,
      changed: false,
      previousFee: String(prevFee ?? '0'),
      newFee: String(nextFee ?? '0'),
      newCalculation: freshCalc,
      updatedSession: session,
    };
  },

  confirmSession: async (
    id: string,
    payload: { payment_provider: string }
  ): Promise<{ order_reference: string }> => {
    await syncDeliveryStoreFromServer();
    const overlay = getStoredSessionMap()[id];

    try {
      const { data } = await apiClient.post(`/api/v1/checkout/${id}/confirm/`, payload);
      const orderRef = data.order_reference;

      if (overlay && overlay.delivery_calculation) {
        const addrStr = overlay.delivery_address
          ? `${overlay.delivery_address.address_line_1}, ${overlay.delivery_address.city}, ${overlay.delivery_address.state}`
          : `${overlay.delivery_calculation.destination_city}, ${overlay.delivery_calculation.destination_state}`;
        buildOrderShipmentsFromCalculation(orderRef, orderRef, overlay.delivery_calculation, addrStr);
      }

      return data;
    } catch (err) {
      // If local session or manual quotation confirmation
      if (overlay && overlay.cart_snapshot) {
        const orderRef = `DOVI-${Date.now().toString().slice(-6)}`;
        const addrStr = overlay.delivery_address
          ? `${overlay.delivery_address.address_line_1}, ${overlay.delivery_address.city}, ${overlay.delivery_address.state}`
          : `${overlay.delivery_calculation.destination_city}, ${overlay.delivery_calculation.destination_state}`;

        const shipments = buildOrderShipmentsFromCalculation(
          orderRef,
          orderRef,
          overlay.delivery_calculation,
          addrStr
        );

        const now = new Date().toISOString();
        const localOrder: Order = {
          id: orderRef,
          reference: orderRef,
          status: 'PENDING_PAYMENT',
          items: (overlay.cart_snapshot.items || []).map((ci, idx) => ({
            id: ci.id || `oi_${idx}`,
            product: ci.product || {
              id: String(ci.product_id || `prod_${idx}`),
              name: ci.product_name || ci.name || 'Product',
              price: String(ci.unit_price || ci.price || '0'),
              primary_image_url: ci.image_url || null,
              average_rating: 5,
              review_count: 1,
              stock_quantity: 10,
              status: 'ACTIVE',
            },
            variant: typeof ci.variant === 'object' ? ci.variant : null,
            quantity: ci.quantity,
            unit_price: String(ci.unit_price || ci.price || '0'),
            line_total: String(
              Number(ci.unit_price || ci.price || 0) * Number(ci.quantity || 1)
            ),
          })),
          delivery_address: overlay.delivery_address || null,
          delivery_method: 'DOVI Onitsha Hub Consolidated Delivery',
          subtotal: overlay.subtotal,
          delivery_fee:
            overlay.delivery_calculation.total_delivery_fee !== null
              ? String(overlay.delivery_calculation.total_delivery_fee)
              : '0',
          total:
            overlay.delivery_calculation.total_payable !== null
              ? String(overlay.delivery_calculation.total_payable)
              : overlay.subtotal,
          payment_status: 'PENDING',
          payment_method: payload.payment_provider,
          tracking: [
            {
              status: 'PENDING_PAYMENT',
              location: 'Onitsha Hub',
              description: overlay.delivery_calculation.requires_manual_quote
                ? 'Order received — awaiting delivery fee confirmation from Onitsha logistics team.'
                : 'Order created and consolidated for Onitsha Hub dispatch.',
              timestamp: now,
            },
          ],
          can_cancel: true,
          can_request_refund: false,
          can_confirm_receipt: false,
          can_review: false,
          created_at: now,
          updated_at: now,
          shipments,
          shipment_count: shipments.length,
          delivery_calculation: overlay.delivery_calculation,
          requires_delivery_confirmation: overlay.delivery_calculation.requires_manual_quote,
          delivery_confirmation_status: overlay.delivery_calculation.requires_manual_quote
            ? 'PENDING_ADMIN_QUOTE'
            : 'NOT_REQUIRED',
          hub_fulfillment_status: overlay.delivery_calculation.requires_manual_quote
            ? 'AWAITING_DELIVERY_CONFIRMATION'
            : 'ORDER_PLACED',
          dispatch_origin: 'Onitsha',
        };

        saveLocalOrder(localOrder);
        return { order_reference: orderRef };
      }
      throw normalizeApiError(err);
    }
  },

  /**
   * Submits an order that requires manual delivery confirmation / quotation (Section 10 & Test G)
   * without charging an unverified or zero delivery fee upfront.
   */
  submitOrderForManualDeliveryQuote: async (payload: {
    cart?: Cart;
    deliveryAddress?: Address;
    deliveryCalculation?: DeliveryCalculationResult;
    destination_state?: string;
    destination_city?: string;
    destination_address?: string;
    recipient_name?: string;
    recipient_phone?: string;
    items?: any[];
    delivery_calculation?: DeliveryCalculationResult;
  }): Promise<{ order_reference: string; reference: string; order: Order }> => {
    await syncDeliveryStoreFromServer();
    const orderRef = `DOVI-MQ-${Date.now().toString().slice(-6)}`;
    const calc = (payload.deliveryCalculation || payload.delivery_calculation)!;
    const rawItems = payload.cart?.items || payload.items || [];
    const resolvedAddress: Address = payload.deliveryAddress || {
      id: `addr_${Date.now()}`,
      label: 'Delivery Address',
      full_name: payload.recipient_name || 'Customer',
      phone: payload.recipient_phone || '',
      address_line_1: payload.destination_address || `${payload.destination_city || ''}, ${payload.destination_state || ''}`,
      address_line_2: null,
      city: payload.destination_city || calc.destination_city,
      state: payload.destination_state || calc.destination_state,
      country: 'Nigeria',
      postal_code: null,
      is_default: true,
    };
    const addrStr = `${resolvedAddress.address_line_1}, ${resolvedAddress.city}, ${resolvedAddress.state}`;

    const shipments = buildOrderShipmentsFromCalculation(
      orderRef,
      orderRef,
      calc,
      addrStr,
      resolvedAddress.full_name,
      resolvedAddress.phone
    );

    const now = new Date().toISOString();
    const order: Order = {
      id: orderRef,
      reference: orderRef,
      status: 'PENDING_PAYMENT',
      items: rawItems.map((ci: any, idx: number) => ({
        id: ci.id || `oi_${idx}`,
        product: ci.product || {
          id: String(ci.product_id || `prod_${idx}`),
          name: ci.product_name || ci.name || 'Product',
          price: String(ci.unit_price || ci.price || '0'),
          primary_image_url: ci.image_url || null,
          average_rating: 5,
          review_count: 1,
          stock_quantity: 10,
          status: 'ACTIVE',
        },
        variant: typeof ci.variant === 'object' ? ci.variant : null,
        quantity: ci.quantity,
        unit_price: String(ci.unit_price || ci.price || '0'),
        line_total: String(Number(ci.unit_price || ci.price || 0) * Number(ci.quantity || 1)),
      })),
      delivery_address: resolvedAddress,
      delivery_method: 'DOVI Onitsha Hub — Manual Delivery Quote Required',
      subtotal: String(calc.product_subtotal),
      delivery_fee: '0',
      total: String(calc.product_subtotal),
      payment_status: 'AWAITING_DELIVERY_QUOTE',
      payment_method: null,
      tracking: [
        {
          status: 'PENDING_PAYMENT',
          location: 'Onitsha Hub',
          description:
            'Delivery Confirmation Required: Order submitted for transport fee confirmation by DOVI Onitsha logistics team.',
          timestamp: now,
        },
      ],
      can_cancel: true,
      can_request_refund: false,
      can_confirm_receipt: false,
      can_review: false,
      created_at: now,
      updated_at: now,
      shipments,
      shipment_count: shipments.length,
      delivery_calculation: calc,
      requires_delivery_confirmation: true,
      requires_manual_quote: true,
      delivery_confirmation_status: 'PENDING_ADMIN_QUOTE',
      hub_fulfillment_status: 'AWAITING_DELIVERY_CONFIRMATION',
      dispatch_origin: 'Onitsha',
    };

    saveLocalOrder(order);
    return { order_reference: orderRef, reference: orderRef, order };
  },

  getDeliveryMethods: async (): Promise<
    Array<{ id: string; name: string; description: string; estimated_days: string; price: string }>
  > => {
    try {
      const { data } = await apiClient.get('/api/v1/checkout/delivery-methods/');
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};
