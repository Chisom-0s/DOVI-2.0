// Auto API — /api/v1/auto/*
// Full implementation in Phase 10, 11, 12
import apiClient, { normalizeApiError } from './client';
import type {
  PaginatedResponse,
  AutoListing,
  AutoListingSummary,
  AutoPart,
  AutoPartSummary,
  AutoAccessorySummary,
  AutoRental,
  AutoRentalSummary,
  RentalBooking,
} from '@/types';

export interface AutoFilters {
  page?: number;
  make?: string;
  model?: string;
  year_from?: number;
  year_to?: number;
  fuel_type?: string;
  transmission?: string;
  condition?: string;
  min_price?: number;
  max_price?: number;
  location?: string;
}

export const autoApi = {
  listListings: async (filters?: AutoFilters): Promise<PaginatedResponse<AutoListingSummary>> => {
    try {
      const { data } = await apiClient.get('/api/v1/auto/listings/', { params: filters });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getListing: async (id: string): Promise<AutoListing> => {
    try {
      const { data } = await apiClient.get(`/api/v1/auto/listings/${id}/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  listParts: async (filters?: Record<string, unknown>): Promise<PaginatedResponse<AutoPartSummary>> => {
    try {
      const { data } = await apiClient.get('/api/v1/auto/parts/', { params: filters });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getPart: async (id: string): Promise<AutoPart> => {
    try {
      const { data } = await apiClient.get(`/api/v1/auto/parts/${id}/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  listAccessories: async (filters?: Record<string, unknown>): Promise<PaginatedResponse<AutoAccessorySummary>> => {
    try {
      const { data } = await apiClient.get('/api/v1/auto/accessories/', { params: filters });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getAccessory: async (id: string) => {
    try {
      const { data } = await apiClient.get(`/api/v1/auto/accessories/${id}/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  listRentals: async (filters?: Record<string, unknown>): Promise<PaginatedResponse<AutoRentalSummary>> => {
    try {
      const { data } = await apiClient.get('/api/v1/auto/rentals/', { params: filters });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getRental: async (id: string): Promise<AutoRental> => {
    try {
      const { data } = await apiClient.get(`/api/v1/auto/rentals/${id}/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  bookRental: async (id: string, payload: { pickup_date: string; return_date: string; provider: string; redirect_url: string }): Promise<RentalBooking> => {
    try {
      const { data } = await apiClient.post(`/api/v1/auto/rentals/${id}/book/`, payload);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  listBookings: async (): Promise<PaginatedResponse<RentalBooking>> => {
    try {
      const { data } = await apiClient.get('/api/v1/auto/rentals/bookings/');
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  cancelBooking: async (id: string): Promise<RentalBooking> => {
    try {
      const { data } = await apiClient.post(`/api/v1/auto/rentals/bookings/${id}/cancel/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  addFavorite: async (listingId: string): Promise<{ id: string }> => {
    try {
      const { data } = await apiClient.post('/api/v1/auto/favorites/', { listing_id: listingId });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  removeFavorite: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/v1/auto/favorites/${id}/`);
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  listFavorites: async (): Promise<AutoListingSummary[]> => {
    try {
      const { data } = await apiClient.get('/api/v1/auto/favorites/');
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};
