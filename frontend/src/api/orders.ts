// Orders API — /api/v1/orders/*
import apiClient, { normalizeApiError, tokenStore } from './client';
import { getLocalOrdersMap, saveLocalOrder } from './checkout';
import {
  syncPaymentsAndOrdersFromServer,
  getPaymentByOrderRef,
} from '@/services/orderPaymentSync';
import {
  syncDeliveryStoreFromServer,
  getOrderShipments,
  deriveOverallOrderStatus,
  deriveOverallHubFulfillmentStatus,
  calculateOrderDelivery,
  buildOrderShipmentsFromCalculation,
  customerRespondToManualQuote,
} from '@/services/deliveryPricingService';
import type { Order, OrderSummary, PaginatedResponse, User } from '@/types';

function enrichOrderWithShipments(order: Order): Order {
  let shipments = getOrderShipments(order.reference);
  if ((!shipments || shipments.length === 0) && order.id) {
    shipments = getOrderShipments(order.id);
  }

  // If an existing order does not yet have persisted shipment records, synthesize them cleanly
  // from its items and delivery address so every order has structured direct delivery shipment tracking.
  if ((!shipments || shipments.length === 0) && Array.isArray(order.items) && order.items.length > 0) {
    // Never invent a destination: a missing address must not silently be priced as Lagos.
    const destState = order.delivery_address?.state || '';
    const destCity = order.delivery_address?.city || '';
    const calc = calculateOrderDelivery({
      destinationState: destState,
      destinationCity: destCity,
      dispatchOrigin: '',
      items: order.items.map((oi) => ({
        id: oi.id,
        product_id: String(oi.product?.id || oi.id),
        product_name: oi.product?.name || 'Order Item',
        variant_id: oi.variant?.id || null,
        variant_name: oi.variant?.name || null,
        quantity: oi.quantity,
        unit_price: Number(oi.unit_price || oi.product?.price || 0),
        delivery_classification: oi.product?.delivery_classification || 'SMALL_PARCEL',
        weight_kg: oi.product?.weight_kg ?? null,
        dimensions_cm: oi.product?.dimensions_cm ?? null,
        requires_special_handling: oi.product?.requires_special_handling ?? false,
        image_url: oi.product?.primary_image_url || oi.product?.image_url || null,
      })),
    });

    const addrStr = order.delivery_address
      ? `${order.delivery_address.address_line_1}, ${order.delivery_address.city}, ${order.delivery_address.state}`
      : `${destCity}, ${destState}`;
    shipments = buildOrderShipmentsFromCalculation(
      order.id || order.reference,
      order.reference,
      calc,
      addrStr
    );
  }

  if (shipments && shipments.length > 0) {
    const derivedStatus = deriveOverallOrderStatus(shipments);
    const hubStatus = deriveOverallHubFulfillmentStatus(shipments);

    // Enforce critical rule: Do NOT mark order as DELIVERED unless ALL shipments are DELIVERED
    let effectiveStatus = order.status;
    if (effectiveStatus === 'DELIVERED' && !shipments.every((s) => s.status === 'DELIVERED')) {
      effectiveStatus = derivedStatus;
    } else if (!['CANCELLED', 'REFUNDED', 'COMPLETED', 'RECEIVED'].includes(effectiveStatus)) {
      if (shipments.every((s) => s.status === 'DELIVERED')) {
        effectiveStatus = 'DELIVERED';
      } else if (shipments.some((s) => ['DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(s.status))) {
        effectiveStatus = derivedStatus;
      }
    }

    const anyRequiresQuote = shipments.some((s) => s.requires_manual_quote);
    const anyFeeConfirmed = shipments.some((s) => s.status === 'DELIVERY_FEE_CONFIRMED');
    const totalShipmentDeliveryFee = shipments.every((s) => s.delivery_fee !== null)
      ? shipments.reduce((sum, s) => sum + Number(s.delivery_fee || 0), 0)
      : null;

    const subtotalNum = Number(order.subtotal || 0);
    const resolvedDeliveryFee =
      totalShipmentDeliveryFee !== null ? String(totalShipmentDeliveryFee) : order.delivery_fee;
    const resolvedTotal =
      totalShipmentDeliveryFee !== null
        ? String(Number((subtotalNum + totalShipmentDeliveryFee).toFixed(2)))
        : order.total;

    let confirmationStatus = order.delivery_confirmation_status || 'NOT_REQUIRED';
    if (anyRequiresQuote) {
      confirmationStatus = 'PENDING_ADMIN_QUOTE';
    } else if (anyFeeConfirmed) {
      confirmationStatus = 'QUOTED_AWAITING_CUSTOMER';
    }

    return {
      ...order,
      status: effectiveStatus,
      delivery_fee: resolvedDeliveryFee,
      total: resolvedTotal,
      shipments,
      shipment_count: shipments.length,
      requires_delivery_confirmation: anyRequiresQuote || anyFeeConfirmed,
      delivery_confirmation_status: confirmationStatus,
      hub_fulfillment_status: hubStatus,
      dispatch_origin: 'Onitsha',
    };
  }

  return {
    ...order,
    dispatch_origin: 'Onitsha',
  };
}

export const ordersApi = {
  list: async (page?: number): Promise<PaginatedResponse<OrderSummary>> => {
    await syncDeliveryStoreFromServer();
    await syncPaymentsAndOrdersFromServer().catch(() => {});

    const currentUser = tokenStore.getUser<User>();
    const uId = currentUser ? String(currentUser.id).trim() : '';
    const uEmail = currentUser ? String(currentUser.email).toLowerCase().trim() : '';

    const isUserOrder = (order: any): boolean => {
      if (!currentUser) return true; // Guest or unauthenticated fallback
      const cId = String(order.customer_id || order.buyer_id || order.buyer?.id || order.user_id || '').trim();
      const cEmail = String(order.buyer_email || order.buyer?.email || order.email || order.delivery_address?.email || '').toLowerCase().trim();

      if (uId && cId && cId === uId) return true;
      if (uEmail && cEmail && cEmail === uEmail) return true;

      // If order in local storage has neither customer_id nor buyer_email, claim it for this active session
      if (!cId && !cEmail) {
        order.customer_id = uId;
        order.buyer_id = uId;
        order.buyer_email = uEmail;
        return true;
      }
      return false;
    };

    const localOrders = Object.values(getLocalOrdersMap());
    const uniqueLocalMap = new Map<string, Order>();
    for (const lo of localOrders) {
      if (isUserOrder(lo)) {
        uniqueLocalMap.set(lo.reference, enrichOrderWithShipments(lo));
      }
    }

    try {
      const { data } = await apiClient.get('/api/v1/orders/', {
        params: {
          page,
          customer_id: uId || undefined,
          buyer_email: uEmail || undefined,
        },
      });
      const results: any[] = Array.isArray(data?.results) ? data.results : [];

      const seenRefs = new Set<string>();
      const merged: OrderSummary[] = [];

      // Include local scoped orders first
      for (const lo of uniqueLocalMap.values()) {
        const ref = lo.reference || lo.id;
        seenRefs.add(ref);
        const payment = getPaymentByOrderRef(ref);
        const pStatus =
          payment?.status === 'VERIFIED'
            ? 'PAID'
            : payment?.status || lo.payment_status || 'PENDING_PAYMENT';

        const items = lo.items || [];
        const productNames = items
          .map((i: any) => i.product?.name || i.product_name || i.name)
          .filter(Boolean);
        const productImages = items
          .map((i: any) => i.product?.primary_image_url || i.product?.image_url || i.image_url)
          .filter(Boolean);

        merged.push({
          id: lo.id || ref,
          reference: lo.reference,
          reference_code: lo.reference,
          order_reference: lo.reference,
          customer_id: lo.customer_id || uId || undefined,
          buyer_id: lo.buyer_id || uId || undefined,
          buyer_email: lo.buyer_email || uEmail || undefined,
          buyer_name: lo.buyer_name || undefined,
          status: lo.status,
          payment_status: pStatus,
          fulfillment_status: lo.hub_fulfillment_status || lo.status,
          payment_evidence: payment || (lo as any).payment_evidence || null,
          item_count: items.reduce((sum, i) => sum + (i.quantity || 1), 0),
          items,
          product_names: productNames,
          product_images: productImages,
          total: lo.total,
          created_at: lo.created_at || new Date().toISOString(),
        });
      }

      // Merge server results (also scoped to user)
      for (const r of results) {
        if (!isUserOrder(r)) continue;
        const ref = r.reference || r.reference_code || r.order_reference || r.id;
        if (!seenRefs.has(ref)) {
          seenRefs.add(ref);
          const shipments = getOrderShipments(ref);
          let status = r.status;
          if (shipments.length > 0) {
            if (status === 'DELIVERED' && !shipments.every((s) => s.status === 'DELIVERED')) {
              status = deriveOverallOrderStatus(shipments);
            } else if (shipments.every((s) => s.status === 'DELIVERED')) {
              status = 'DELIVERED';
            }
          }
          const payment = getPaymentByOrderRef(ref);
          const pStatus =
            payment?.status === 'VERIFIED'
              ? 'PAID'
              : payment?.status || r.payment_status || 'PENDING_PAYMENT';

          const items = r.items || [];
          const productNames = r.product_names || items.map((i: any) => i.product?.name || i.name).filter(Boolean);
          const productImages = r.product_images || items.map((i: any) => i.product?.primary_image_url || i.product?.image_url || i.image_url).filter(Boolean);

          merged.push({
            ...r,
            id: r.id || ref,
            reference: ref,
            reference_code: ref,
            order_reference: ref,
            customer_id: r.customer_id || uId || undefined,
            buyer_id: r.buyer_id || uId || undefined,
            buyer_email: r.buyer_email || uEmail || undefined,
            status,
            payment_status: pStatus,
            fulfillment_status: r.fulfillment_status || r.hub_fulfillment_status || status,
            payment_evidence: payment || r.payment_evidence || null,
            item_count: r.item_count || items.reduce((sum: number, i: any) => sum + (i.quantity || 1), 0),
            items,
            product_names: productNames,
            product_images: productImages,
          });
        }
      }

      // Sort descending (newest first)
      merged.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

      return {
        count: Math.max(data?.count || 0, merged.length),
        next: data?.next || null,
        previous: data?.previous || null,
        results: merged,
      };
    } catch {
      // Graceful fallback to local scoped orders
      const localSummaries: OrderSummary[] = Array.from(uniqueLocalMap.values()).map((lo) => {
        const ref = lo.reference || lo.id;
        const payment = getPaymentByOrderRef(ref);
        const pStatus =
          payment?.status === 'VERIFIED'
            ? 'PAID'
            : payment?.status || lo.payment_status || 'PENDING_PAYMENT';
        const items = lo.items || [];
        const productNames = items
          .map((i: any) => i.product?.name || i.product_name || i.name)
          .filter(Boolean);
        const productImages = items
          .map((i: any) => i.product?.primary_image_url || i.product?.image_url || i.image_url)
          .filter(Boolean);

        return {
          id: lo.id || ref,
          reference: lo.reference,
          reference_code: lo.reference,
          order_reference: lo.reference,
          customer_id: lo.customer_id || uId || undefined,
          buyer_id: lo.buyer_id || uId || undefined,
          buyer_email: lo.buyer_email || uEmail || undefined,
          buyer_name: lo.buyer_name || undefined,
          status: lo.status,
          payment_status: pStatus,
          fulfillment_status: lo.hub_fulfillment_status || lo.status,
          payment_evidence: payment || null,
          item_count: items.reduce((sum, i) => sum + (i.quantity || 1), 0),
          items,
          product_names: productNames,
          product_images: productImages,
          total: lo.total,
          created_at: lo.created_at || new Date().toISOString(),
        };
      });

      localSummaries.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

      return {
        count: localSummaries.length,
        next: null,
        previous: null,
        results: localSummaries,
      };
    }
  },

  getByRef: async (ref: string): Promise<Order> => {
    await syncDeliveryStoreFromServer();
    await syncPaymentsAndOrdersFromServer().catch(() => {});
    const payment = getPaymentByOrderRef(ref);

    let rawOrder: any = null;
    try {
      const { data } = await apiClient.get(`/api/v1/orders/${ref}/`);
      rawOrder = data;
    } catch (err) {
      const localMap = getLocalOrdersMap();
      const match = localMap[ref] || Object.values(localMap).find(
        (o: any) => o && (o.reference === ref || o.id === ref || o.reference_code === ref || o.order_reference === ref)
      );
      if (match) {
        rawOrder = match;
      } else {
        throw normalizeApiError(err);
      }
    }

    const enriched = enrichOrderWithShipments(rawOrder);
    if (payment) {
      enriched.payment_status = payment.status === 'VERIFIED' ? 'PAID' : payment.status;
      (enriched as any).payment_evidence = payment;
      if (
        payment.status === 'VERIFIED' &&
        (enriched.status === 'PENDING_PAYMENT' || enriched.status === 'ORDER_PLACED')
      ) {
        enriched.status = 'PROCESSING';
      }
    }
    return enriched;
  },

  respondToDeliveryQuote: async (
    ref: string,
    shipmentIdOrAccepted: string | boolean,
    acceptedMaybe?: boolean
  ): Promise<Order> => {
    await syncDeliveryStoreFromServer();
    const accepted =
      typeof shipmentIdOrAccepted === 'boolean' ? shipmentIdOrAccepted : Boolean(acceptedMaybe);
    const { status } = customerRespondToManualQuote(ref, accepted);
    const localOrder = getLocalOrdersMap()[ref];
    if (localOrder) {
      localOrder.delivery_confirmation_status = status;
      saveLocalOrder(localOrder);
    }
    return ordersApi.getByRef(ref);
  },

  cancel: async (ref: string): Promise<Order> => {
    try {
      const { data } = await apiClient.post(`/api/v1/orders/${ref}/cancel/`);
      return enrichOrderWithShipments(data);
    } catch (err) {
      const localOrder = getLocalOrdersMap()[ref];
      if (localOrder) {
        localOrder.status = 'CANCELLED';
        localOrder.can_cancel = false;
        saveLocalOrder(localOrder);
        return enrichOrderWithShipments(localOrder);
      }
      throw normalizeApiError(err);
    }
  },

  confirmReceipt: async (ref: string): Promise<Order> => {
    try {
      const { data } = await apiClient.post(`/api/v1/orders/${ref}/confirm-receipt/`);
      return enrichOrderWithShipments(data);
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getTracking: async (ref: string) => {
    try {
      const { data } = await apiClient.get(`/api/v1/orders/${ref}/tracking/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};
