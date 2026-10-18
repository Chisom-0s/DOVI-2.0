import apiClient, { normalizeApiError } from './client';
import { normalizeUrl } from '@/utils/image';
import type {
  PaginatedResponse,
  User,
  AdminCreateUserPayload,
  AdminUpdateUserPayload,
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
  Save2OwnContribution,
  PaymentAccount,
  PaymentAccountType,
  AutoListing,
  AutoListingSummary,
  AdminSave2OwnParticipant,
  Save2OwnUnlockCode,
  Save2OwnUnlockConfig,
  Save2OwnIdentityAuditLog,
  PaymentAccountAuditLog,
  Save2OwnRefund,
  Save2OwnDashboardMetrics,
} from '@/types';

export const DEFAULT_PAYMENT_ACCOUNTS: PaymentAccount[] = [
  {
    id: 'acc-s2o-default',
    account_type: 'save2own',
    bank_name: 'Kuda Microfinance Bank',
    account_name: 'Dovi Save2Own Savings Trust',
    account_number: '2039485712',
    currency: 'NGN',
    is_active: true,
    instructions:
      'Transfer the exact savings amount to this dedicated Save2Own account. In your bank transfer narration/description, enter your Save2Own Reference Code. Once the transfer is completed, click "I\'ve Made the Transfer" and submit your details for verification.',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'acc-mkt-default',
    account_type: 'marketplace',
    bank_name: 'Zenith Bank',
    account_name: 'Dovi Direct Commerce Limited',
    account_number: '1012345678',
    currency: 'NGN',
    is_active: true,
    instructions:
      'For marketplace direct order bank transfers, transfer to this account and use your Order Reference Code (e.g. ORD-XXXX) in narration.',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

function getStoredPaymentAccounts(): PaymentAccount[] {
  try {
    const raw = localStorage.getItem('dovi_payment_accounts');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_PAYMENT_ACCOUNTS;
}

function saveStoredPaymentAccounts(accounts: PaymentAccount[]) {
  try {
    localStorage.setItem('dovi_payment_accounts', JSON.stringify(accounts));
  } catch {}
}

function getStoredAuditLogs(): AuditLog[] {
  try {
    const raw = localStorage.getItem('dovi_audit_logs');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function addAuditLogEntry(action: string, details?: string, targetId?: string, actorEmail = 'admin@dovi.com') {
  try {
    const logs = getStoredAuditLogs();
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      actor: {
        id: 'admin-1',
        email: actorEmail,
        first_name: 'Admin',
        last_name: 'User',
      },
      action,
      user: actorEmail,
      entity_type: 'SYSTEM',
      entity_id: targetId || 'system',
      ip_address: '127.0.0.1',
      result: 'SUCCESS',
      path: '/admin/action',
      status_code: 200,
      details: details ? { message: details, target_id: targetId } : {},
      created_at: new Date().toISOString(),
    };
    logs.unshift(newLog);
    localStorage.setItem('dovi_audit_logs', JSON.stringify(logs.slice(0, 500)));
  } catch {}
}

function getStoredGlobalContributions(): Save2OwnContribution[] {
  try {
    const raw = localStorage.getItem('dovi_global_s2o_contribs');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((c: any) => c && !String(c.id).includes('demo') && !String(c.user_id).includes('usr-') && !String(c.product_name).includes('iPhone 15') && !String(c.product_name).includes('Samsung Galaxy'));
      }
    }
  } catch {}
  return [];
}

function saveStoredGlobalContributions(contribs: Save2OwnContribution[]) {
  try {
    localStorage.setItem('dovi_global_s2o_contribs', JSON.stringify(contribs));
  } catch {}
}

const SEED_SECTIONS: HomepageSection[] = [
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

  createAdmin: async (payload: AdminCreateUserPayload): Promise<User> => {
    try {
      const { data } = await apiClient.post('/api/v1/admin/users/create-admin/', payload);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  updateUser: async (id: string, payload: AdminUpdateUserPayload): Promise<User> => {
    try {
      const { data } = await apiClient.patch(`/api/v1/admin/users/${id}/`, payload);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  promoteToAdmin: async (id: string): Promise<User> => {
    try {
      const { data } = await apiClient.post(`/api/v1/admin/users/${id}/promote/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  demoteAdmin: async (id: string, role: 'BUYER' | 'VENDOR' = 'BUYER'): Promise<User> => {
    try {
      const { data } = await apiClient.post(`/api/v1/admin/users/${id}/demote/`, { role });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  deleteUser: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/v1/admin/users/${id}/`);
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
  listProducts: async (params?: { page?: number; q?: string; search?: string; category?: string; vendor?: string }): Promise<PaginatedResponse<ProductSummary>> => {
    try {
      const queryParams: Record<string, any> = { page: params?.page, category: params?.category };
      if (params?.vendor) queryParams.vendor = params.vendor;
      if (params?.q || params?.search) queryParams.search = params?.q || params?.search;
      const { data } = await apiClient.get('/api/v1/products/', { params: queryParams });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getProduct: async (id: string): Promise<any> => {
    try {
      const { data } = await apiClient.get(`/api/v1/products/${id}/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  createProduct: async (payload: {
    name: string;
    category: string;
    base_price: number;
    description?: string;
    status?: string;
    variants?: Array<{
      name: string;
      sku: string;
      quantity: number;
      price_override?: number | null;
    }>;
  }): Promise<any> => {
    try {
      const { data } = await apiClient.post('/api/v1/products/', payload);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  updateProduct: async (
    id: string,
    payload: {
      name?: string;
      category?: string;
      base_price?: number;
      description?: string;
      status?: string;
    }
  ): Promise<any> => {
    try {
      const { data } = await apiClient.patch(`/api/v1/products/${id}/`, payload);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  uploadProductImage: async (
    productId: string,
    imageFile: File,
    isPrimary: boolean = false
  ): Promise<{
    id: string;
    product: string;
    image_url: string;
    thumbnail_url: string;
    storage_key: string;
    is_primary: boolean;
    created_at: string;
  }> => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile, imageFile.name);
      formData.append('file', imageFile, imageFile.name);
      formData.append('is_primary', isPrimary ? 'true' : 'false');

      const { data } = await apiClient.post(
        `/api/v1/products/${productId}/images/`,
        formData
      );
      return {
        ...data,
        image_url: normalizeUrl(data.image_url) || data.image_url,
        thumbnail_url: normalizeUrl(data.thumbnail_url) || data.thumbnail_url,
      };
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  deleteProductImage: async (productId: string, imageId: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/v1/products/${productId}/images/${imageId}/`);
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
      const logs = getStoredAuditLogs();
      let filtered = logs;
      if (params?.user) {
        filtered = filtered.filter((l) => l.user?.toLowerCase().includes(params.user!.toLowerCase()));
      }
      if (params?.action) {
        filtered = filtered.filter((l) => l.action?.toLowerCase().includes(params.action!.toLowerCase()));
      }
      const page = params?.page || 1;
      return {
        count: filtered.length,
        next: null,
        previous: null,
        results: filtered.slice((page - 1) * 20, page * 20),
      };
    }
  },

  createAuditLog: async (payload: { action: string; details?: string; target_id?: string; actor_email?: string }): Promise<void> => {
    addAuditLogEntry(payload.action, payload.details, payload.target_id, payload.actor_email);
    try {
      await apiClient.post('/api/v1/admin/audit-logs/', payload);
    } catch {}
  },

  // --- Payment Accounts Management ---
  listPaymentAccounts: async (): Promise<PaymentAccount[]> => {
    try {
      const { data } = await apiClient.get('/api/v1/admin/payment-accounts/');
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.results)) return data.results;
    } catch {}
    return getStoredPaymentAccounts();
  },

  getPaymentAccount: async (id: string): Promise<PaymentAccount> => {
    try {
      const { data } = await apiClient.get(`/api/v1/admin/payment-accounts/${id}/`);
      return data;
    } catch {
      const accounts = getStoredPaymentAccounts();
      const matched = accounts.find((a) => a.id === id);
      if (matched) return matched;
      throw new Error('Payment account not found.');
    }
  },

  createPaymentAccount: async (payload: {
    account_type: PaymentAccountType;
    bank_name: string;
    account_name: string;
    account_number: string;
    currency?: string;
    instructions?: string;
    is_active?: boolean;
  }): Promise<PaymentAccount> => {
    const newAcc: PaymentAccount = {
      id: `acc-${Math.random().toString(36).slice(2, 9)}`,
      account_type: payload.account_type,
      bank_name: payload.bank_name,
      account_name: payload.account_name,
      account_number: payload.account_number,
      currency: payload.currency || 'NGN',
      instructions: payload.instructions || '',
      is_active: payload.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { data } = await apiClient.post('/api/v1/admin/payment-accounts/', payload);
      addAuditLogEntry('PAYMENT_ACCOUNT_CREATED', `Created ${payload.account_type} account: ${payload.bank_name} (${payload.account_number})`, data?.id || newAcc.id);
      return data;
    } catch {
      const accounts = getStoredPaymentAccounts();
      if (newAcc.is_active) {
        accounts.forEach((a) => {
          if (a.account_type === payload.account_type) a.is_active = false;
        });
      }
      accounts.push(newAcc);
      saveStoredPaymentAccounts(accounts);
      addAuditLogEntry('PAYMENT_ACCOUNT_CREATED', `Created ${payload.account_type} account: ${payload.bank_name} (${payload.account_number})`, newAcc.id);
      return newAcc;
    }
  },

  updatePaymentAccount: async (
    id: string,
    payload: Partial<PaymentAccount>
  ): Promise<PaymentAccount> => {
    try {
      const { data } = await apiClient.patch(`/api/v1/admin/payment-accounts/${id}/`, payload);
      addAuditLogEntry('PAYMENT_ACCOUNT_UPDATED', `Updated payment account ${id}`, id);
      return data;
    } catch {
      const accounts = getStoredPaymentAccounts();
      let updated: PaymentAccount | null = null;
      const nextAccounts = accounts.map((a) => {
        if (a.id === id) {
          updated = {
            ...a,
            ...payload,
            updated_at: new Date().toISOString(),
          };
          return updated;
        }
        if (payload.is_active && a.account_type === (payload.account_type || a.account_type)) {
          return { ...a, is_active: false };
        }
        return a;
      });
      if (!updated) throw new Error('Payment account not found.');
      saveStoredPaymentAccounts(nextAccounts);
      addAuditLogEntry('PAYMENT_ACCOUNT_UPDATED', `Updated payment account ${id}`, id);
      return updated;
    }
  },

  activatePaymentAccount: async (id: string): Promise<PaymentAccount> => {
    try {
      const { data } = await apiClient.post(`/api/v1/admin/payment-accounts/${id}/activate/`);
      addAuditLogEntry('PAYMENT_ACCOUNT_ACTIVATED', `Activated payment account ${id}`, id);
      return data;
    } catch {
      const accounts = getStoredPaymentAccounts();
      const target = accounts.find((a) => a.id === id);
      if (!target) throw new Error('Payment account not found.');

      const nextAccounts = accounts.map((a) => {
        if (a.account_type === target.account_type) {
          return { ...a, is_active: a.id === id };
        }
        return a;
      });
      saveStoredPaymentAccounts(nextAccounts);
      addAuditLogEntry('PAYMENT_ACCOUNT_ACTIVATED', `Activated ${target.account_type} account: ${target.bank_name} (${target.account_number})`, id);
      return { ...target, is_active: true };
    }
  },

  deactivatePaymentAccount: async (id: string): Promise<PaymentAccount> => {
    try {
      const { data } = await apiClient.post(`/api/v1/admin/payment-accounts/${id}/deactivate/`);
      addAuditLogEntry('PAYMENT_ACCOUNT_DEACTIVATED', `Deactivated payment account ${id}`, id);
      return data;
    } catch {
      const accounts = getStoredPaymentAccounts();
      const target = accounts.find((a) => a.id === id);
      if (!target) throw new Error('Payment account not found.');

      const nextAccounts = accounts.map((a) => {
        if (a.id === id) return { ...a, is_active: false };
        return a;
      });
      saveStoredPaymentAccounts(nextAccounts);
      addAuditLogEntry('PAYMENT_ACCOUNT_DEACTIVATED', `Deactivated ${target.account_type} account: ${target.bank_name}`, id);
      return { ...target, is_active: false };
    }
  },

  deletePaymentAccount: async (id: string): Promise<any> => {
    try {
      const { data } = await apiClient.delete(`/api/v1/admin/payment-accounts/${id}/`);
      addAuditLogEntry('PAYMENT_ACCOUNT_DELETED', `Deleted payment account ${id}`, id);
      return data;
    } catch {
      const accounts = getStoredPaymentAccounts();
      const target = accounts.find((a) => a.id === id);
      const filtered = accounts.filter((a) => a.id !== id);
      saveStoredPaymentAccounts(filtered);
      addAuditLogEntry('PAYMENT_ACCOUNT_DELETED', `Deleted payment account: ${target?.bank_name || id}`, id);
      return { success: true };
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
      addAuditLogEntry('SAVE2OWN_GOAL_SUSPENDED', `Suspended Save2Own goal ${id}. Reason: ${reason}`, id);
      return data;
    } catch (err) {
      addAuditLogEntry('SAVE2OWN_GOAL_SUSPENDED', `Suspended Save2Own goal ${id}. Reason: ${reason}`, id);
      throw normalizeApiError(err);
    }
  },

  // --- Save2Own Contributions Verification Management ---
  listSave2OwnContributions: async (params?: {
    page?: number;
    status?: string;
    search?: string;
    goal_id?: string;
  }): Promise<PaginatedResponse<any>> => {
    try {
      const { data } = await apiClient.get('/api/v1/admin/save2own/contributions/', { params });
      return data;
    } catch {
      // Fallback: load global stored contributions without any mock user seeds
      const list = getStoredGlobalContributions();

      let filtered = [...list];
      if (params?.status) {
        filtered = filtered.filter((c) => (c.status || '').toLowerCase() === params.status!.toLowerCase());
      }
      if (params?.goal_id) {
        filtered = filtered.filter((c) => c.goal_id === params.goal_id);
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.transfer_reference?.toLowerCase().includes(q) ||
            c.user_email?.toLowerCase().includes(q) ||
            c.user_name?.toLowerCase().includes(q) ||
            c.product_name?.toLowerCase().includes(q) ||
            c.id?.toLowerCase().includes(q)
        );
      }

      const page = params?.page || 1;
      return {
        count: filtered.length,
        next: null,
        previous: null,
        results: filtered.slice((page - 1) * 20, page * 20),
      };
    }
  },

  getSave2OwnContribution: async (id: string): Promise<Save2OwnContribution> => {
    try {
      const { data } = await apiClient.get(`/api/v1/admin/save2own/contributions/${id}/`);
      return data;
    } catch {
      const list = getStoredGlobalContributions();
      const matched = list.find((c) => c.id === id);
      if (matched) return matched;
      throw new Error('Contribution record not found.');
    }
  },

  confirmSave2OwnContribution: async (id: string, notes?: string): Promise<any> => {
    try {
      const { data } = await apiClient.post(`/api/v1/admin/save2own/contributions/${id}/confirm/`, { notes });
      addAuditLogEntry('SAVE2OWN_CONTRIBUTION_CONFIRMED', `Confirmed contribution ${id}. Amount verified. Notes: ${notes || 'None'}`, id);
      return data;
    } catch {
      const list = getStoredGlobalContributions();
      let updatedContrib: any = null;

      const nextList = list.map((c) => {
        if (c.id === id) {
          updatedContrib = {
            ...c,
            status: 'confirmed',
            payment_status: 'SUCCESSFUL',
            verified_at: new Date().toISOString(),
            verified_by: 'admin@dovi.com',
            updated_at: new Date().toISOString(),
          };
          return updatedContrib;
        }
        return c;
      });

      if (!updatedContrib) throw new Error('Contribution not found.');
      saveStoredGlobalContributions(nextList);

      // Also update goal's local contributions list if present
      if (updatedContrib.goal_id) {
        try {
          const goalContribsRaw = localStorage.getItem(`dovi_s2o_contribs_${updatedContrib.goal_id}`);
          if (goalContribsRaw) {
            const goalContribs: any[] = JSON.parse(goalContribsRaw);
            const updatedGoalContribs = goalContribs.map((gc) => (gc.id === id ? updatedContrib : gc));
            localStorage.setItem(`dovi_s2o_contribs_${updatedContrib.goal_id}`, JSON.stringify(updatedGoalContribs));
          }
        } catch {}
      }

      addAuditLogEntry(
        'SAVE2OWN_CONTRIBUTION_CONFIRMED',
        `Confirmed bank transfer contribution ${id} of ₦${parseFloat(updatedContrib.amount).toLocaleString()} for goal ${updatedContrib.goal_id || 'N/A'}. Authoritative balance increased.`,
        id
      );
      return updatedContrib;
    }
  },

  rejectSave2OwnContribution: async (id: string, reason: string): Promise<any> => {
    try {
      const { data } = await apiClient.post(`/api/v1/admin/save2own/contributions/${id}/reject/`, { reason });
      addAuditLogEntry('SAVE2OWN_CONTRIBUTION_REJECTED', `Rejected contribution ${id}. Reason: ${reason}`, id);
      return data;
    } catch {
      const list = getStoredGlobalContributions();
      let updatedContrib: any = null;

      const nextList = list.map((c) => {
        if (c.id === id) {
          updatedContrib = {
            ...c,
            status: 'rejected',
            payment_status: 'FAILED',
            rejection_reason: reason,
            verified_at: new Date().toISOString(),
            verified_by: 'admin@dovi.com',
            updated_at: new Date().toISOString(),
          };
          return updatedContrib;
        }
        return c;
      });

      if (!updatedContrib) throw new Error('Contribution not found.');
      saveStoredGlobalContributions(nextList);

      if (updatedContrib.goal_id) {
        try {
          const goalContribsRaw = localStorage.getItem(`dovi_s2o_contribs_${updatedContrib.goal_id}`);
          if (goalContribsRaw) {
            const goalContribs: any[] = JSON.parse(goalContribsRaw);
            const updatedGoalContribs = goalContribs.map((gc) => (gc.id === id ? updatedContrib : gc));
            localStorage.setItem(`dovi_s2o_contribs_${updatedContrib.goal_id}`, JSON.stringify(updatedGoalContribs));
          }
        } catch {}
      }

      addAuditLogEntry(
        'SAVE2OWN_CONTRIBUTION_REJECTED',
        `Rejected bank transfer contribution ${id}. Reason: ${reason}. Balance remains unchanged.`,
        id
      );
      return updatedContrib;
    }
  },

  // --- Dovi Auto Admin Management ---
  listAutoListings: async (params?: { page?: number; q?: string; type?: string }): Promise<PaginatedResponse<AutoListingSummary>> => {
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


  // --- Save2Own Participants & Identity Administration ---
  listSave2OwnParticipants: async (params?: {
    page?: number;
    q?: string;
    status?: string;
    identity_locked?: string;
  }): Promise<PaginatedResponse<AdminSave2OwnParticipant>> => {
    try {
      const { data } = await apiClient.get('/api/v1/admin/save2own/participants/', { params });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getSave2OwnParticipant: async (id: string): Promise<AdminSave2OwnParticipant> => {
    try {
      const { data } = await apiClient.get(`/api/v1/admin/save2own/participants/${id}/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  lockSave2OwnParticipant: async (id: string): Promise<AdminSave2OwnParticipant> => {
    try {
      const { data } = await apiClient.post(`/api/v1/admin/save2own/participants/${id}/lock/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  unlockSave2OwnParticipant: async (id: string, hours = 24): Promise<AdminSave2OwnParticipant> => {
    try {
      const { data } = await apiClient.post(`/api/v1/admin/save2own/participants/${id}/unlock/`, { hours });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  generateSave2OwnUnlockCode: async (
    id: string,
    payload?: { fee_amount?: string | number; expires_hours?: number }
  ): Promise<{ id: string; code: string; fee_amount: string; expires_at: string; participant_id: string; participant_name: string }> => {
    try {
      const { data } = await apiClient.post(
        `/api/v1/admin/save2own/participants/${id}/generate-unlock-code/`,
        payload || {}
      );
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getSave2OwnParticipantHistory: async (id: string): Promise<{
    participant_id: string;
    full_name: string;
    identity_locked: boolean;
    audit_logs: Save2OwnIdentityAuditLog[];
    unlock_codes: Save2OwnUnlockCode[];
  }> => {
    try {
      const { data } = await apiClient.get(`/api/v1/admin/save2own/participants/${id}/history/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getSave2OwnUnlockFee: async (): Promise<Save2OwnUnlockConfig> => {
    try {
      const { data } = await apiClient.get('/api/v1/admin/save2own/participants/unlock-fee/');
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  updateSave2OwnUnlockFee: async (payload: {
    fee_amount: string | number;
    reason?: string;
  }): Promise<{ message: string; fee_amount: string; currency: string; updated_at: string; updated_by?: string }> => {
    try {
      const { data } = await apiClient.post('/api/v1/admin/save2own/participants/unlock-fee/', payload);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  exportSave2OwnParticipantsCsvUrl: (params?: { q?: string; status?: string; identity_locked?: string }) => {
    const query = new URLSearchParams();
    if (params?.q) query.append('q', params.q);
    if (params?.status) query.append('status', params.status);
    if (params?.identity_locked) query.append('identity_locked', params.identity_locked);
    const qs = query.toString();
    return `/api/v1/admin/save2own/participants/export-csv/${qs ? `?${qs}` : ''}`;
  },

  // --- Payment Account Audit Logs ---
  getPaymentAccountAuditLogs: async (params?: { account_type?: string; page?: number }): Promise<PaginatedResponse<PaymentAccountAuditLog>> => {
    try {
      const { data } = await apiClient.get('/api/v1/admin/payment-accounts/audit-logs/', { params });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  // --- Save2Own Financial Controls & Reversals ---
  reverseSave2OwnContribution: async (id: string, reason: string): Promise<any> => {
    try {
      const { data } = await apiClient.post(`/api/v1/admin/save2own/contributions/${id}/reverse/`, { reason });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  exportSave2OwnContributionsCsvUrl: (params?: Record<string, any>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
      });
    }
    const qs = query.toString();
    return `/api/v1/admin/save2own/contributions/export-csv/${qs ? `?${qs}` : ''}`;
  },

  // --- Save2Own Goals Management ---
  cancelSave2OwnGoal: async (id: string, payload?: { reason?: string; destination_bank_name?: string; destination_account_name?: string; destination_account_number?: string }): Promise<any> => {
    try {
      const { data } = await apiClient.post(`/api/v1/admin/save2own/goals/${id}/cancel/`, payload || {});
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  changeSave2OwnGoalProduct: async (id: string, payload: { new_variant_id: string; reason?: string }): Promise<any> => {
    try {
      const { data } = await apiClient.post(`/api/v1/admin/save2own/goals/${id}/change-product/`, payload);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  exportSave2OwnGoalsCsvUrl: (params?: Record<string, any>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
      });
    }
    const qs = query.toString();
    return `/api/v1/admin/save2own/goals/export-csv/${qs ? `?${qs}` : ''}`;
  },

  // --- Save2Own Refunds Management ---
  listSave2OwnRefunds: async (params?: { page?: number; status?: string; goal_id?: string; q?: string }): Promise<PaginatedResponse<Save2OwnRefund>> => {
    try {
      const { data } = await apiClient.get('/api/v1/admin/save2own/refunds/', { params });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  approveSave2OwnRefund: async (id: string): Promise<Save2OwnRefund> => {
    try {
      const { data } = await apiClient.post(`/api/v1/admin/save2own/refunds/${id}/approve/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  processSave2OwnRefund: async (id: string, payload?: { admin_notes?: string; payout_reference?: string }): Promise<Save2OwnRefund> => {
    try {
      const { data } = await apiClient.post(`/api/v1/admin/save2own/refunds/${id}/process/`, payload || {});
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  rejectSave2OwnRefund: async (id: string, reason: string): Promise<Save2OwnRefund> => {
    try {
      const { data } = await apiClient.post(`/api/v1/admin/save2own/refunds/${id}/reject/`, { reason });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  exportSave2OwnRefundsCsvUrl: (params?: Record<string, any>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
      });
    }
    const qs = query.toString();
    return `/api/v1/admin/save2own/refunds/export-csv/${qs ? `?${qs}` : ''}`;
  },

  // --- Save2Own Admin Dashboard ---
  getSave2OwnDashboardMetrics: async (): Promise<Save2OwnDashboardMetrics> => {
    try {
      const { data } = await apiClient.get('/api/v1/admin/save2own/dashboard/');
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};

