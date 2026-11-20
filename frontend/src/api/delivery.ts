// Delivery API — /api/v1/delivery/* and Fulfillment Consolidation & Pricing
import apiClient, { normalizeApiError } from './client';
import {
  syncDeliveryStoreFromServer,
  setLocalRoutes,
  listDeliveryRoutes,
  findRouteInList,
  canonicalStateKey,
  canonicalCityKey,
  calculateOrderDelivery,
  calculateConsolidatedDelivery as calcConsolidatedFromItems,
  getOrderShipments,
  customerRespondToManualQuote,
  type CalculateOrderDeliveryParams,
} from '@/services/deliveryPricingService';
import type {
  DeliveryGroup,
  PaginatedResponse,
  DeliveryRoute,
  DeliveryCalculationResult,
  OrderShipment,
} from '@/types';

/** Adapts a backend (Django) route record to the frontend DeliveryRoute shape. */
function adaptBackendRoute(r: any): DeliveryRoute {
  const num = (v: any) => (v === null || v === undefined || v === '' ? null : Number(v));
  return {
    id: String(r.id),
    dispatch_origin: r.dispatch_origin || r.origin || 'Onitsha',
    destination_state: r.destination_state || '',
    destination_city: r.destination_city || '',
    small_parcel_rate: num(r.small_parcel_rate),
    heavy_parcel_rate: num(r.heavy_parcel_rate),
    furniture_bulky_rate: num(r.furniture_bulky_rate),
    combined_furniture_rate: num(r.combined_furniture_rate),
    special_handling_surcharge: num(r.special_handling_surcharge),
    allows_furniture_small_consolidation: Boolean(
      r.allows_furniture_small_consolidation ?? r.allow_small_with_furniture ?? false
    ),
    max_furniture_items_consolidated: Number(r.max_furniture_items_consolidated ?? 2),
    max_small_parcel_weight_kg: Number(r.max_small_parcel_weight_kg ?? 15),
    max_heavy_parcel_weight_kg: Number(r.max_heavy_parcel_weight_kg ?? 80),
    special_delivery_requirements: r.special_delivery_requirements ?? null,
    estimated_delivery_days: r.estimated_delivery_days ?? r.estimated_delivery_info ?? null,
    is_active: r.is_active !== false,
    created_at: r.created_at || new Date(0).toISOString(),
    updated_at: r.updated_at || new Date(0).toISOString(),
    updated_by_id: r.updated_by_id ?? null,
    updated_by_email: r.updated_by_email ?? r.updated_by ?? null,
    updated_by_name: r.updated_by_name ?? r.updated_by ?? null,
  };
}

/**
 * Single loader for the customer-facing route list. Combines the backend routes (if the
 * endpoint exists and has data) with the shared admin store. When both describe the same
 * origin+state+city the most recently updated record wins. Inactive routes are excluded.
 */
async function loadActiveRoutes(): Promise<DeliveryRoute[]> {
  await syncDeliveryStoreFromServer();
  const destKey = (r: DeliveryRoute) => `${canonicalStateKey(r.destination_state)}|${canonicalCityKey(r.destination_city)}`;
  const merged = new Map<string, DeliveryRoute>();
  for (const r of listDeliveryRoutes(false)) {
    if (r.is_active && r.destination_state) merged.set(destKey(r), r);
  }

  try {
    const { data } = await apiClient.get('/api/v1/delivery/routes/', { params: { active_only: true } });
    const list = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
    for (const raw of list) {
      const r = adaptBackendRoute(raw);
      if (!r.is_active || !r.destination_state) continue;
      const key = destKey(r);
      const existing = merged.get(key);
      if (!existing || new Date(r.updated_at).getTime() > new Date(existing.updated_at).getTime()) {
        merged.set(key, r);
      }
    }
  } catch {
    // Backend delivery endpoint unavailable — shared admin store is used.
  }
  const activeList = Array.from(merged.values()).filter((r) => r.is_active);
  if (activeList.length > 0) {
    setLocalRoutes(activeList);
  }
  return activeList;
}

export const deliveryApi = {
  list: async (params?: {
    page?: number;
    status?: string;
    search?: string;
  }): Promise<PaginatedResponse<DeliveryGroup>> => {
    try {
      const { data } = await apiClient.get('/api/v1/delivery/', { params });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getById: async (id: string): Promise<DeliveryGroup> => {
    try {
      const { data } = await apiClient.get(`/api/v1/delivery/${id}/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getByOrder: async (orderId: string): Promise<DeliveryGroup[]> => {
    try {
      const { data } = await apiClient.get(`/api/v1/orders/${orderId}/delivery-groups/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  markReady: async (id: string, notes?: string): Promise<DeliveryGroup> => {
    try {
      const { data } = await apiClient.post(`/api/v1/delivery/${id}/mark-ready/`, { notes });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  dispatch: async (
    id: string,
    payload: { tracking_reference?: string; vendor_notes?: string }
  ): Promise<DeliveryGroup> => {
    try {
      const { data } = await apiClient.post(`/api/v1/delivery/${id}/dispatch/`, payload);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  confirmPickup: async (id: string): Promise<DeliveryGroup> => {
    try {
      const { data } = await apiClient.post(`/api/v1/delivery/${id}/confirm-pickup/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  confirmDelivery: async (id: string): Promise<DeliveryGroup> => {
    try {
      const { data } = await apiClient.post(`/api/v1/delivery/${id}/confirm-delivery/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  // ----------------------------------------------------------
  // DOVI DIRECT DELIVERY DELIVERY PRICING & CONSOLIDATION ENDPOINTS
  // ----------------------------------------------------------
  getActiveRoutes: async (): Promise<DeliveryRoute[]> => {
    return loadActiveRoutes();
  },

  findRouteForDestination: async (
    destinationState: string,
    destinationCity: string,
    dispatchOrigin = 'Onitsha'
  ): Promise<DeliveryRoute | null> => {
    const routes = await loadActiveRoutes();
    return findRouteInList(routes, destinationState, destinationCity, dispatchOrigin).route;
  },

  calculateConsolidatedDelivery: async (
    itemsOrParams: any[] | CalculateOrderDeliveryParams,
    destinationState = '',
    destinationCity = '',
    dispatchOrigin = 'Onitsha'
  ): Promise<DeliveryCalculationResult> => {
    const origin = (dispatchOrigin && dispatchOrigin.trim()) || 'Onitsha';
    // The SAME route list that populates the checkout selectors is used for pricing,
    // so a destination the customer can pick is always priced against its configured route.
    const routes = await loadActiveRoutes();
    if (!Array.isArray(itemsOrParams) && itemsOrParams && Array.isArray(itemsOrParams.items)) {
      const params = itemsOrParams;
      const route = findRouteInList(
        routes,
        params.destinationState,
        params.destinationCity,
        params.dispatchOrigin || origin
      ).route;
      return calculateOrderDelivery({ ...params, routeOverride: params.routeOverride ?? route });
    }
    const route = findRouteInList(routes, destinationState, destinationCity, origin).route;
    return calcConsolidatedFromItems(
      itemsOrParams,
      destinationState,
      destinationCity,
      origin,
      route
    );
  },

  getShipmentsForOrder: async (orderIdOrRef: string): Promise<OrderShipment[]> => {
    await syncDeliveryStoreFromServer();
    try {
      const { data } = await apiClient.get(`/api/v1/delivery/orders/${orderIdOrRef}/shipments/`);
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch {
      // Fallback to synced shared store
    }
    return getOrderShipments(orderIdOrRef);
  },

  respondToManualQuote: async (orderIdOrRef: string, accepted: boolean) => {
    await syncDeliveryStoreFromServer();
    try {
      await apiClient.post(`/api/v1/delivery/orders/${orderIdOrRef}/respond-quote/`, { accepted });
    } catch {
      // Handled via shared store
    }
    return customerRespondToManualQuote(orderIdOrRef, accepted);
  },
};
