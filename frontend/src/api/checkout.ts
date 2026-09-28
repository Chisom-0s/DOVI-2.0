// Checkout API — /api/v1/checkout/*
import apiClient, { normalizeApiError } from './client';
import type { CheckoutSession, VendorDeliverySelection } from '@/types';

export const checkoutApi = {
  initializeSession: async (payload: {
    delivery_address_id?: string;
    delivery_method_id?: string;
    delivery_method?: string;
    vendor_delivery_selections?: VendorDeliverySelection[];
  }): Promise<CheckoutSession> => {
    try {
      const { data } = await apiClient.post('/api/v1/checkout/', payload);
      return data;
    } catch (err) {
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
    try {
      const { data } = await apiClient.get(`/api/v1/checkout/${id}/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  confirmSession: async (
    id: string,
    payload: { payment_provider: string }
  ): Promise<{ order_reference: string }> => {
    try {
      const { data } = await apiClient.post(`/api/v1/checkout/${id}/confirm/`, payload);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
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

