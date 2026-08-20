import apiClient, { normalizeApiError } from './client';
import type {
  PaginatedResponse,
  User,
  Vendor,
  ProductSummary,
  Category,
  Order,
  OrderSummary,
  Payment,
  Refund,
  Review,
  AuditLog,
  HomepageBanner,
  HomepageSection,
  Save2OwnGoal,
  AutoListing,
  AutoListingSummary,
} from '@/types';

export const adminApi = {
  // --- Dashboard Analytics ---
  getAnalyticsOverview: async (): Promise<any> => {
    try {
      const { data } = await apiClient.get('/api/v1/admin/analytics/overview/');
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  // --- User Management ---
  listUsers: async (params?: { page?: number; q?: string; role?: string }): Promise<PaginatedResponse<User>> => {
    try {
      const { data } = await apiClient.get('/api/v1/admin/users/', { params });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getUser: async (id: string): Promise<User> => {
    try {
      const { data } = await apiClient.get(`/api/v1/admin/users/${id}/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  suspendUser: async (id: string): Promise<User> => {
    try {
      const { data } = await apiClient.patch(`/api/v1/admin/users/${id}/suspend/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  activateUser: async (id: string): Promise<User> => {
    try {
      const { data } = await apiClient.patch(`/api/v1/admin/users/${id}/activate/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  // --- Vendor Management ---
  listVendors: async (params?: { page?: number; status?: string; q?: string }): Promise<PaginatedResponse<Vendor>> => {
    try {
      const { data } = await apiClient.get('/api/v1/admin/vendors/', { params });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getVendor: async (id: string): Promise<Vendor> => {
    try {
      const { data } = await apiClient.get(`/api/v1/admin/vendors/${id}/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  approveVendor: async (id: string): Promise<Vendor> => {
    try {
      const { data } = await apiClient.post(`/api/v1/admin/vendors/${id}/approve/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  rejectVendor: async (id: string, reason: string): Promise<Vendor> => {
    try {
      const { data } = await apiClient.post(`/api/v1/admin/vendors/${id}/reject/`, { reason });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  suspendVendor: async (id: string): Promise<Vendor> => {
    try {
      const { data } = await apiClient.post(`/api/v1/admin/vendors/${id}/suspend/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  // --- Product Management ---
  listProducts: async (params?: { page?: number; q?: string; vendor?: string; category?: string }): Promise<PaginatedResponse<ProductSummary>> => {
    try {
      const { data } = await apiClient.get('/api/v1/admin/products/', { params });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  archiveProduct: async (id: string): Promise<any> => {
    try {
      const { data } = await apiClient.post(`/api/v1/admin/products/${id}/archive/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  // --- Category Management ---
  listCategories: async (): Promise<Category[]> => {
    try {
      const { data } = await apiClient.get('/api/v1/admin/categories/');
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  createCategory: async (payload: { name: string; slug: string; parent?: string | null; icon_url?: string }): Promise<Category> => {
    try {
      const { data } = await apiClient.post('/api/v1/admin/categories/', payload);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  updateCategory: async (id: string, payload: { name?: string; slug?: string; parent?: string | null; icon_url?: string }): Promise<Category> => {
    try {
      const { data } = await apiClient.patch(`/api/v1/admin/categories/${id}/`, payload);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  deleteCategory: async (id: string): Promise<any> => {
    try {
      const { data } = await apiClient.delete(`/api/v1/admin/categories/${id}/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  // --- Order Management ---
  listOrders: async (params?: { page?: number; status?: string; q?: string }): Promise<PaginatedResponse<OrderSummary>> => {
    try {
      const { data } = await apiClient.get('/api/v1/admin/orders/', { params });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getOrder: async (ref: string): Promise<Order> => {
    try {
      const { data } = await apiClient.get(`/api/v1/admin/orders/${ref}/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  updateOrderStatus: async (ref: string, status: string): Promise<Order> => {
    try {
      const { data } = await apiClient.patch(`/api/v1/admin/orders/${ref}/status/`, { status });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  // --- Payments Monitoring ---
  listPayments: async (params?: { page?: number; status?: string; provider?: string }): Promise<PaginatedResponse<Payment>> => {
    try {
      const { data } = await apiClient.get('/api/v1/admin/payments/', { params });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getPayment: async (ref: string): Promise<Payment> => {
    try {
      const { data } = await apiClient.get(`/api/v1/admin/payments/${ref}/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  // --- Refund Management ---
  listRefunds: async (params?: { page?: number; status?: string }): Promise<PaginatedResponse<Refund>> => {
    try {
      const { data } = await apiClient.get('/api/v1/admin/refunds/', { params });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getRefund: async (id: string): Promise<Refund> => {
    try {
      const { data } = await apiClient.get(`/api/v1/admin/refunds/${id}/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  approveRefund: async (id: string): Promise<Refund> => {
    try {
      const { data } = await apiClient.post(`/api/v1/admin/refunds/${id}/approve/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  rejectRefund: async (id: string, reason: string): Promise<Refund> => {
    try {
      const { data } = await apiClient.post(`/api/v1/admin/refunds/${id}/reject/`, { admin_note: reason });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  // --- Review Moderation ---
  listReviews: async (params?: { page?: number; rating?: number; q?: string }): Promise<PaginatedResponse<Review>> => {
    try {
      const { data } = await apiClient.get('/api/v1/admin/reviews/', { params });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  removeReview: async (id: string): Promise<any> => {
    try {
      const { data } = await apiClient.delete(`/api/v1/admin/reviews/${id}/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  // --- Audit Logs ---
  listAuditLogs: async (params?: { page?: number; user?: string; action?: string }): Promise<PaginatedResponse<AuditLog>> => {
    try {
      const { data } = await apiClient.get('/api/v1/admin/audit-logs/', { params });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  // --- Homepage Banners CMS ---
  listHomepageBanners: async (): Promise<HomepageBanner[]> => {
    try {
      const { data } = await apiClient.get('/api/v1/admin/homepage/banners/');
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  reorderHomepageBanners: async (ids: string[]): Promise<any> => {
    try {
      const { data } = await apiClient.post('/api/v1/admin/homepage/banners/reorder/', { ids });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  createHomepageBanner: async (payload: {
    title: string;
    subtitle?: string | null;
    cta_text?: string | null;
    cta_url?: string | null;
    desktop_image_url: string;
    mobile_image_url: string;
    slide_interval_ms?: number;
    start_date?: string | null;
    end_date?: string | null;
    is_active?: boolean;
  }): Promise<HomepageBanner> => {
    try {
      const { data } = await apiClient.post('/api/v1/admin/homepage/banners/', payload);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  updateHomepageBanner: async (
    id: string,
    payload: {
      title?: string;
      subtitle?: string | null;
      cta_text?: string | null;
      cta_url?: string | null;
      desktop_image_url?: string;
      mobile_image_url?: string;
      slide_interval_ms?: number;
      start_date?: string | null;
      end_date?: string | null;
      is_active?: boolean;
    }
  ): Promise<HomepageBanner> => {
    try {
      const { data } = await apiClient.patch(`/api/v1/admin/homepage/banners/${id}/`, payload);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  deleteHomepageBanner: async (id: string): Promise<any> => {
    try {
      const { data } = await apiClient.delete(`/api/v1/admin/homepage/banners/${id}/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  activateHomepageBanner: async (id: string): Promise<any> => {
    try {
      const { data } = await apiClient.post(`/api/v1/admin/homepage/banners/${id}/activate/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  deactivateHomepageBanner: async (id: string): Promise<any> => {
    try {
      const { data } = await apiClient.post(`/api/v1/admin/homepage/banners/${id}/deactivate/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  // --- Homepage Sections CMS ---
  listHomepageSections: async (): Promise<HomepageSection[]> => {
    try {
      const { data } = await apiClient.get('/api/v1/admin/homepage/sections/');
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  reorderHomepageSections: async (ids: string[]): Promise<any> => {
    try {
      const { data } = await apiClient.post('/api/v1/admin/homepage/sections/reorder/', { ids });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  updateHomepageSection: async (
    id: string,
    payload: {
      title?: string;
      visible?: boolean;
      config?: Record<string, any>;
    }
  ): Promise<HomepageSection> => {
    try {
      const { data } = await apiClient.patch(`/api/v1/admin/homepage/sections/${id}/`, payload);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  // --- Save2Own Admin Management ---
  listSave2OwnGoals: async (params?: { page?: number; status?: string; q?: string }): Promise<PaginatedResponse<Save2OwnGoal>> => {
    try {
      const { data } = await apiClient.get('/api/v1/admin/save2own/', { params });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getSave2OwnGoal: async (id: string): Promise<Save2OwnGoal> => {
    try {
      const { data } = await apiClient.get(`/api/v1/admin/save2own/${id}/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  suspendSave2OwnGoal: async (id: string, reason: string): Promise<Save2OwnGoal> => {
    try {
      const { data } = await apiClient.post(`/api/v1/admin/save2own/${id}/suspend/`, { reason });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  // --- Dovi Auto Admin Management ---
  listAutoListings: async (params?: { page?: number; q?: string }): Promise<PaginatedResponse<AutoListingSummary>> => {
    try {
      const { data } = await apiClient.get('/api/v1/admin/auto/listings/', { params });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  updateAutoListing: async (id: string, payload: Partial<AutoListing>): Promise<AutoListing> => {
    try {
      const { data } = await apiClient.patch(`/api/v1/admin/auto/listings/${id}/`, payload);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  deleteAutoListing: async (id: string): Promise<any> => {
    try {
      const { data } = await apiClient.delete(`/api/v1/admin/auto/listings/${id}/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};
