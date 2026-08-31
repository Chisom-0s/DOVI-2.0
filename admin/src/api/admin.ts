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

const SEED_SECTIONS: HomepageSection[] = [
  {
    id: 'sec-categories',
    name: 'Featured Categories',
    key: 'FEATURED_CATEGORIES',
    title: 'Featured Categories',
    subtitle: 'Find items by department',
    is_active: true,
    visible: true,
    sort_order: 1,
    display_order: 1,
    display_limit: 10,
    configuration: {
      layout: 'CATEGORY_PILLS',
      source: 'AUTOMATIC',
    },
    config: {},
  },
  {
    id: 'sec-flash-deals',
    name: 'Flash Deals',
    key: 'FLASH_DEALS',
    title: 'Flash Deals',
    subtitle: 'Limited time offers — ending soon!',
    is_active: true,
    visible: true,
    sort_order: 2,
    display_order: 2,
    display_limit: 6,
    configuration: {
      layout: 'HORIZONTAL_CAROUSEL',
      source: 'AUTOMATIC',
    },
    config: {},
  },
  {
    id: 'sec-new-arrivals',
    name: 'New Arrivals',
    key: 'NEW_ARRIVALS',
    title: 'New Arrivals',
    subtitle: 'Freshly added to the catalog',
    is_active: true,
    visible: true,
    sort_order: 3,
    display_order: 3,
    display_limit: 4,
    configuration: {
      layout: 'PRODUCT_GRID',
      source: 'AUTOMATIC',
    },
    config: {},
  },
  {
    id: 'sec-special-promo',
    name: 'Special Promo',
    key: 'SPECIAL_PROMO',
    title: 'Unlock Save2Own Benefits',
    subtitle: 'Contribute in bits towards purchasing high-value items without any interest.',
    is_active: true,
    visible: true,
    sort_order: 4,
    display_order: 4,
    display_limit: 1,
    configuration: {
      layout: 'BANNER',
      source: 'AUTOMATIC',
      cta_text: 'Start Saving',
      cta_url: '/save2own',
      background_color: 'rgba(255, 122, 0, 0.05)',
    },
    config: {},
  },
  {
    id: 'sec-hot-sales',
    name: 'Hot Sales',
    key: 'HOT_SALES',
    title: 'Hot Sales',
    subtitle: 'Most popular purchases this week',
    is_active: true,
    visible: true,
    sort_order: 5,
    display_order: 5,
    display_limit: 6,
    configuration: {
      layout: 'HORIZONTAL_CAROUSEL',
      source: 'AUTOMATIC',
    },
    config: {},
  },
  {
    id: 'sec-best-sellers',
    name: 'Best Sellers',
    key: 'BEST_SELLERS',
    title: 'Best Sellers',
    subtitle: 'Top performing products from our vendors',
    is_active: true,
    visible: true,
    sort_order: 6,
    display_order: 6,
    display_limit: 4,
    configuration: {
      layout: 'PRODUCT_GRID',
      source: 'AUTOMATIC',
    },
    config: {},
  },
  {
    id: 'sec-trending',
    name: 'Trending Now',
    key: 'TRENDING_NOW',
    title: 'Trending Now',
    subtitle: 'High demand products right now',
    is_active: true,
    visible: true,
    sort_order: 7,
    display_order: 7,
    display_limit: 6,
    configuration: {
      layout: 'HORIZONTAL_CAROUSEL',
      source: 'AUTOMATIC',
    },
    config: {},
  },
  {
    id: 'sec-save2own',
    name: 'Save2Own Featured',
    key: 'SAVE2OWN_FEATURED',
    title: 'Featured Save2Own items',
    subtitle: 'Start saving in micro-payments today',
    is_active: true,
    visible: true,
    sort_order: 8,
    display_order: 8,
    display_limit: 4,
    configuration: {
      layout: 'LARGE_PRODUCT_CARDS',
      source: 'AUTOMATIC',
    },
    config: {},
  },
  {
    id: 'sec-dovi-auto',
    name: 'Featured Cars',
    key: 'DOVI_AUTO',
    title: 'Dovi Auto Hub',
    subtitle: 'Premium car deals and accessories',
    is_active: true,
    visible: true,
    sort_order: 9,
    display_order: 9,
    display_limit: 4,
    configuration: {
      layout: 'AUTO_LISTING_GRID',
      source: 'AUTOMATIC',
    },
    config: {},
  },
  {
    id: 'sec-vendors',
    name: 'Top Vendors',
    key: 'TOP_VENDORS',
    title: 'Top Vendors',
    subtitle: 'Certified sellers with excellent delivery record',
    is_active: true,
    visible: true,
    sort_order: 10,
    display_order: 10,
    display_limit: 4,
    configuration: {
      layout: 'VENDOR_GRID',
      source: 'AUTOMATIC',
    },
    config: {},
  }
];

function getMockSections(): HomepageSection[] {
  const data = localStorage.getItem('dovi_homepage_sections_db');
  if (!data) {
    localStorage.setItem('dovi_homepage_sections_db', JSON.stringify(SEED_SECTIONS));
    return SEED_SECTIONS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return SEED_SECTIONS;
  }
}

function saveMockSections(sections: HomepageSection[]) {
  localStorage.setItem('dovi_homepage_sections_db', JSON.stringify(sections));
}

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
  listProducts: async (params?: { page?: number; q?: string; search?: string; vendor?: string; category?: string }): Promise<PaginatedResponse<ProductSummary>> => {
    try {
      const queryParams: Record<string, any> = { page: params?.page, vendor: params?.vendor, category: params?.category };
      if (params?.q || params?.search) queryParams.search = params?.q || params?.search;
      const { data } = await apiClient.get('/api/v1/products/', { params: queryParams });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  archiveProduct: async (id: string): Promise<any> => {
    try {
      const { data } = await apiClient.delete(`/api/v1/products/${id}/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  // --- Category Management ---
  listCategories: async (): Promise<Category[]> => {
    try {
      const { data } = await apiClient.get('/api/v1/categories/');
      return Array.isArray(data) ? data : (data?.results || []);
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  createCategory: async (payload: { name: string; slug: string; parent?: string | null; icon_url?: string }): Promise<Category> => {
    try {
      const { data } = await apiClient.post('/api/v1/categories/', payload);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  updateCategory: async (id: string, payload: { name?: string; slug?: string; parent?: string | null; icon_url?: string }): Promise<Category> => {
    try {
      const { data } = await apiClient.put(`/api/v1/categories/${id}/`, payload);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  deleteCategory: async (id: string): Promise<any> => {
    try {
      const { data } = await apiClient.delete(`/api/v1/categories/${id}/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  // --- Order Management ---
  listOrders: async (params?: { page?: number; status?: string; q?: string; search?: string }): Promise<PaginatedResponse<OrderSummary>> => {
    try {
      const queryParams: Record<string, any> = { page: params?.page, status: params?.status };
      if (params?.q || params?.search) queryParams.search = params?.q || params?.search;
      const { data } = await apiClient.get('/api/v1/orders/', { params: queryParams });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getOrder: async (id: string): Promise<Order> => {
    try {
      const { data } = await apiClient.get(`/api/v1/orders/${id}/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  updateOrderStatus: async (id: string, status: string): Promise<Order> => {
    try {
      const { data } = await apiClient.post(`/api/v1/orders/${id}/transition/`, { status });
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
      const { data } = await apiClient.get('/api/v1/refunds/', { params });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getRefund: async (id: string): Promise<Refund> => {
    try {
      const { data } = await apiClient.get(`/api/v1/refunds/${id}/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  reviewRefund: async (id: string, payload: { action: 'approve' | 'reject'; notes?: string }): Promise<Refund> => {
    try {
      const { data } = await apiClient.post(`/api/v1/refunds/${id}/review/`, payload);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  approveRefund: async (id: string, notes = 'Approved by admin'): Promise<Refund> => {
    try {
      const { data } = await apiClient.post(`/api/v1/refunds/${id}/review/`, { action: 'approve', notes });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  rejectRefund: async (id: string, reason: string): Promise<Refund> => {
    try {
      const { data } = await apiClient.post(`/api/v1/refunds/${id}/review/`, { action: 'reject', notes: reason });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  // --- Review Moderation ---
  listReviews: async (params?: { page?: number; rating?: number; q?: string; search?: string }): Promise<PaginatedResponse<Review>> => {
    try {
      const queryParams: Record<string, any> = { page: params?.page, rating: params?.rating };
      if (params?.q || params?.search) queryParams.search = params?.q || params?.search;
      const { data } = await apiClient.get('/api/v1/reviews/', { params: queryParams });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  removeReview: async (id: string): Promise<any> => {
    try {
      const { data } = await apiClient.delete(`/api/v1/reviews/${id}/`);
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
      console.warn('Backend sections list failed, loading from LocalStorage mock database...', err);
      return getMockSections();
    }
  },

  reorderHomepageSections: async (ids: string[]): Promise<any> => {
    try {
      const { data } = await apiClient.post('/api/v1/admin/homepage/sections/reorder/', { ids });
      return data;
    } catch (err) {
      console.warn('Backend section reordering failed, sorting Mock database...', err);
      const mockList = getMockSections();
      const updated = ids.map((id, index) => {
        const matched = mockList.find((s) => s.id === id);
        if (matched) {
          matched.sort_order = index + 1;
          matched.display_order = index + 1;
        }
        return matched;
      }).filter(Boolean) as HomepageSection[];
      saveMockSections(updated);
      return { success: true };
    }
  },

  updateHomepageSection: async (
    id: string,
    payload: Partial<HomepageSection>
  ): Promise<HomepageSection> => {
    try {
      const { data } = await apiClient.patch(`/api/v1/admin/homepage/sections/${id}/`, payload);
      return data;
    } catch (err) {
      console.warn(`Backend patch for section ${id} failed, writing mock database...`, err);
      const mockList = getMockSections();
      let updatedSection: HomepageSection | null = null;
      const updated = mockList.map((s) => {
        if (s.id === id) {
          updatedSection = {
            ...s,
            ...payload,
            visible: payload.is_active !== undefined ? payload.is_active : s.visible,
            config: payload.configuration !== undefined ? payload.configuration : s.config,
            updated_at: new Date().toISOString(),
          };
          return updatedSection;
        }
        return s;
      });
      if (!updatedSection) throw new Error('Section not found in mock database.');
      saveMockSections(updated);
      return updatedSection;
    }
  },

  createHomepageSection: async (payload: Omit<HomepageSection, 'id' | 'sort_order' | 'display_order' | 'visible'>): Promise<HomepageSection> => {
    try {
      const { data } = await apiClient.post('/api/v1/admin/homepage/sections/', payload);
      return data;
    } catch (err) {
      console.warn('Backend create section failed, writing to mock database...', err);
      const mockList = getMockSections();
      const nextSort = mockList.length + 1;
      const newSection: HomepageSection = {
        ...payload,
        id: `sec-${Math.random().toString(36).substr(2, 9)}`,
        sort_order: nextSort,
        display_order: nextSort,
        visible: payload.is_active,
        config: payload.configuration,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockList.push(newSection);
      saveMockSections(mockList);
      return newSection;
    }
  },

  deleteHomepageSection: async (id: string): Promise<any> => {
    try {
      const { data } = await apiClient.delete(`/api/v1/admin/homepage/sections/${id}/`);
      return data;
    } catch (err) {
      console.warn(`Backend delete section ${id} failed, removing from mock database...`, err);
      const mockList = getMockSections();
      const filtered = mockList.filter((s) => s.id !== id);
      saveMockSections(filtered);
      return { success: true };
    }
  },

  duplicateHomepageSection: async (id: string): Promise<HomepageSection> => {
    try {
      const { data } = await apiClient.post(`/api/v1/admin/homepage/sections/${id}/duplicate/`);
      return data;
    } catch (err) {
      console.warn(`Backend duplicate section ${id} failed, copying in mock database...`, err);
      const mockList = getMockSections();
      const target = mockList.find((s) => s.id === id);
      if (!target) throw new Error('Source section not found.');
      const nextSort = mockList.length + 1;
      const duplicate: HomepageSection = {
        ...target,
        id: `sec-${Math.random().toString(36).substr(2, 9)}`,
        name: `${target.name} (Copy)`,
        title: `${target.title} (Copy)`,
        sort_order: nextSort,
        display_order: nextSort,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockList.push(duplicate);
      saveMockSections(mockList);
      return duplicate;
    }
  },

  // --- Save2Own Admin Management ---
  listSave2OwnGoals: async (params?: { page?: number; status?: string; q?: string; search?: string }): Promise<PaginatedResponse<Save2OwnGoal>> => {
    try {
      const queryParams: Record<string, any> = { page: params?.page, status: params?.status };
      if (params?.q || params?.search) queryParams.search = params?.q || params?.search;
      const { data } = await apiClient.get('/api/v1/save2own/goals/', { params: queryParams });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getSave2OwnGoal: async (id: string): Promise<Save2OwnGoal> => {
    try {
      const { data } = await apiClient.get(`/api/v1/save2own/goals/${id}/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  suspendSave2OwnGoal: async (id: string, reason: string): Promise<Save2OwnGoal> => {
    try {
      const { data } = await apiClient.patch(`/api/v1/save2own/goals/${id}/`, { status: 'CANCELLED', notes: reason });
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
