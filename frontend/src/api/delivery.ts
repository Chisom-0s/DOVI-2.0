// Delivery API — /api/v1/delivery/* and Onitsha Hub Consolidation & Pricing
import apiClient, { normalizeApiError } from './client';
import {
  syncDeliveryStoreFromServer,
  listDeliveryRoutes,
  findActiveRoute,
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
  // DOVI ONITSHA HUB DELIVERY PRICING & CONSOLIDATION ENDPOINTS
  // ----------------------------------------------------------
  getActiveRoutes: async (): Promise<DeliveryRoute[]> => {
    await syncDeliveryStoreFromServer();
    try {
      const { data } = await apiClient.get('/api/v1/delivery/routes/', { params: { active_only: true } });
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch {
      // Fallback to synced shared store
    }
    return listDeliveryRoutes(false);
  },

  findRouteForDestination: async (
    destinationState: string,
    destinationCity: string,
    dispatchOrigin = 'Onitsha'
  ): Promise<DeliveryRoute | null> => {
    await syncDeliveryStoreFromServer();
    return findActiveRoute(destinationState, destinationCity, dispatchOrigin);
  },

  calculateConsolidatedDelivery: async (
    itemsOrParams: any[] | CalculateOrderDeliveryParams,
    destinationState = 'Lagos',
    destinationCity = 'Lagos',
    dispatchOrigin = 'Onitsha'
  ): Promise<DeliveryCalculationResult> => {
    await syncDeliveryStoreFromServer();
    if (!Array.isArray(itemsOrParams) && itemsOrParams && Array.isArray(itemsOrParams.items)) {
      return calculateOrderDelivery(itemsOrParams);
    }
    return calcConsolidatedFromItems(
      itemsOrParams,
      destinationState,
      destinationCity,
      dispatchOrigin
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
