// Orders API — /api/v1/orders/*
import apiClient, { normalizeApiError } from './client';
import { getLocalOrdersMap, saveLocalOrder } from './checkout';
import {
  syncDeliveryStoreFromServer,
  getOrderShipments,
  deriveOverallOrderStatus,
  deriveOverallHubFulfillmentStatus,
  calculateOrderDelivery,
  buildOrderShipmentsFromCalculation,
  customerRespondToManualQuote,
} from '@/services/deliveryPricingService';
import type { Order, OrderSummary, PaginatedResponse } from '@/types';

function enrichOrderWithShipments(order: Order): Order {
  let shipments = getOrderShipments(order.reference);
  if ((!shipments || shipments.length === 0) && order.id) {
    shipments = getOrderShipments(order.id);
  }

  // If an existing order does not yet have persisted shipment records, synthesize them cleanly
  // from its items and delivery address so every order has structured Onitsha Hub shipment tracking.
  if ((!shipments || shipments.length === 0) && Array.isArray(order.items) && order.items.length > 0) {
    const destState = order.delivery_address?.state || 'Lagos';
    const destCity = order.delivery_address?.city || 'Lagos';
    const calc = calculateOrderDelivery({
      destinationState: destState,
      destinationCity: destCity,
      dispatchOrigin: 'Onitsha',
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
    const localOrders = Object.values(getLocalOrdersMap());
    const uniqueLocalMap = new Map<string, Order>();
    for (const lo of localOrders) {
      uniqueLocalMap.set(lo.reference, enrichOrderWithShipments(lo));
    }

    try {
      const { data } = await apiClient.get('/api/v1/orders/', { params: { page } });
      const results: OrderSummary[] = Array.isArray(data?.results) ? data.results : [];

      const seenRefs = new Set<string>();
      const merged: OrderSummary[] = [];

      // Include any local / manual-quote orders first
      for (const lo of uniqueLocalMap.values()) {
        seenRefs.add(lo.reference);
        merged.push({
          id: lo.id,
          reference: lo.reference,
          order_reference: lo.reference,
          status: lo.status,
          item_count: (lo.items || []).reduce((sum, i) => sum + i.quantity, 0),
          total: lo.total,
          created_at: lo.created_at,
        });
      }

      for (const r of results) {
        const ref = r.reference || r.order_reference || r.id;
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
          merged.push({
            ...r,
            status,
          });
        }
      }

      return {
        count: Math.max(data?.count || 0, merged.length),
        next: data?.next || null,
        previous: data?.previous || null,
        results: merged,
      };
    } catch (err) {
      if (uniqueLocalMap.size > 0) {
        const localSummaries: OrderSummary[] = Array.from(uniqueLocalMap.values()).map((lo) => ({
          id: lo.id,
          reference: lo.reference,
          order_reference: lo.reference,
          status: lo.status,
          item_count: (lo.items || []).reduce((sum, i) => sum + i.quantity, 0),
          total: lo.total,
          created_at: lo.created_at,
        }));
        return {
          count: localSummaries.length,
          next: null,
          previous: null,
          results: localSummaries,
        };
      }
      throw normalizeApiError(err);
    }
  },

  getByRef: async (ref: string): Promise<Order> => {
    await syncDeliveryStoreFromServer();
    try {
      const { data } = await apiClient.get(`/api/v1/orders/${ref}/`);
      return enrichOrderWithShipments(data);
    } catch (err) {
      const localOrder = getLocalOrdersMap()[ref];
      if (localOrder) {
        return enrichOrderWithShipments(localOrder);
      }
      throw normalizeApiError(err);
    }
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
