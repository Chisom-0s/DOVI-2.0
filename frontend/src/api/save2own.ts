import apiClient, { normalizeApiError } from './client';
import type {
  PaginatedResponse,
  Save2OwnGoal,
  Save2OwnGoalSummary,
  PaymentInitResponse,
  ProductSummary,
  ProductVariant,
  Save2OwnContribution,
  Save2OwnProductChange,
} from '@/types';

function createStubProduct(
  id: string,
  name: string,
  price: string,
  img: string | null,
  vendorName = 'Dovi Partner'
): ProductSummary {
  return {
    id: id || '',
    name: name || 'Selected Goal Item',
    slug: '',
    base_price: price,
    price: price,
    primary_image_url: img,
    vendor: {
      id: '',
      name: vendorName,
      logo_url: null,
      rating: 5,
      review_count: 0,
      location: 'Lagos, Nigeria',
    },
    vendor_name: vendorName,
    average_rating: 0,
    review_count: 0,
    stock_quantity: 1,
    status: 'ACTIVE',
  };
}

export function normalizeGoal(raw: any): Save2OwnGoal {
  if (!raw) return raw;

  const targetAmount = raw.target_amount?.toString() || '0';
  const savedAmount = (raw.total_contributed ?? raw.saved_amount ?? '0').toString();
  const targetNum = parseFloat(targetAmount) || 0;
  const savedNum = parseFloat(savedAmount) || 0;
  const remainingNum = Math.max(0, targetNum - savedNum);
  const remainingAmount = (raw.remaining_amount ?? remainingNum.toString()).toString();

  const progressPercent =
    raw.progress_percentage ??
    raw.progress_percent ??
    (targetNum > 0 ? Math.min(100, Math.round((savedNum / targetNum) * 100)) : 0);

  // Safely construct product summary if raw.product is missing or partial
  const rawProduct = raw.product || {};
  const vendorName =
    rawProduct.vendor?.name ||
    rawProduct.vendor_name ||
    raw.vendor_name ||
    'Dovi Partner';

  const productId =
    rawProduct.id ||
    raw.product_id ||
    (raw.variant && typeof raw.variant === 'object' ? raw.variant.product_id : '') ||
    '';
  const productName = rawProduct.name || raw.product_name || 'Selected Goal Item';
  const productImg = rawProduct.primary_image_url || raw.product_image || null;

  const product: ProductSummary = createStubProduct(
    productId,
    productName,
    rawProduct.base_price || targetAmount,
    productImg,
    vendorName
  );

  // Safely construct variant
  let variant: ProductVariant | null = null;
  if (raw.variant && typeof raw.variant === 'object') {
    variant = {
      id: raw.variant.id || '',
      name: raw.variant.name || raw.variant_name || '',
      sku: raw.variant.sku || '',
      price: raw.variant.price?.toString() || targetAmount,
      stock_quantity: raw.variant.stock_quantity ?? 1,
      attributes: raw.variant.attributes || {},
      image_url: raw.variant.image_url || null,
    };
  } else if (raw.variant_name) {
    variant = {
      id: typeof raw.variant === 'string' ? raw.variant : '',
      name: raw.variant_name,
      sku: '',
      price: targetAmount,
      stock_quantity: 1,
      attributes: {},
      image_url: null,
    };
  }

  // Safely map history into product_changes if present
  const productChanges: Save2OwnProductChange[] = Array.isArray(raw.product_changes)
    ? raw.product_changes
    : [];

  if (productChanges.length === 0 && Array.isArray(raw.history)) {
    raw.history
      .filter(
        (h: any) =>
          h.event_type === 'PRODUCT_CHANGED' ||
          h.event_type === 'VARIANT_CHANGED' ||
          h.event_type === 'PRICE_CHANGED'
      )
      .forEach((h: any) => {
        const oldName = h.previous_value?.product_name || product.name;
        const oldId = h.previous_value?.product_id || product.id;
        const oldPrice = h.previous_value?.target_amount || targetAmount;
        const newName = h.new_value?.product_name || product.name;
        const newId = h.new_value?.product_id || product.id;
        const newPrice = h.new_value?.target_amount || targetAmount;

        productChanges.push({
          id: h.id || Math.random().toString(),
          old_product: createStubProduct(oldId, oldName, oldPrice, null),
          new_product: createStubProduct(newId, newName, newPrice, null),
          old_target: oldPrice,
          new_target: newPrice,
          changed_at: h.created_at || new Date().toISOString(),
        });
      });
  }

  // Safely map contributions
  const contributions: Save2OwnContribution[] = Array.isArray(raw.contributions)
    ? raw.contributions.map((c: any) => ({
        id: c.id,
        amount: c.amount?.toString() || '0',
        payment_status: c.payment_status || c.status || 'PENDING',
        payment_reference: c.payment_reference || '',
        created_at: c.created_at || new Date().toISOString(),
      }))
    : [];

  return {
    id: raw.id,
    product,
    variant,
    quantity: raw.quantity || 1,
    status: raw.status || 'ACTIVE',
    target_amount: targetAmount,
    total_contributed: savedAmount,
    remaining_amount: remainingAmount,
    progress_percentage: progressPercent,
    target_date: raw.target_date || null,
    contributions,
    product_changes: productChanges,
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || new Date().toISOString(),
  };
}

export function normalizeGoalSummary(raw: any): Save2OwnGoalSummary {
  const goal = normalizeGoal(raw);
  return {
    id: goal.id,
    product: goal.product,
    status: goal.status,
    target_amount: goal.target_amount,
    total_contributed: goal.total_contributed,
    remaining_amount: goal.remaining_amount,
    progress_percentage: goal.progress_percentage,
    target_date: goal.target_date,
  };
}

export const save2ownApi = {
  listGoals: async (): Promise<PaginatedResponse<Save2OwnGoalSummary>> => {
    try {
      const { data } = await apiClient.get('/api/v1/save2own/goals/');
      if (data && Array.isArray(data.results)) {
        return {
          ...data,
          results: data.results.map(normalizeGoalSummary),
        };
      } else if (Array.isArray(data)) {
        return {
          count: data.length,
          next: null,
          previous: null,
          results: data.map(normalizeGoalSummary),
        };
      }
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  createGoal: async (payload: {
    product_id: string;
    variant_id?: string;
    quantity: number;
    contribution_plan?: string;
  }): Promise<Save2OwnGoal> => {
    try {
      const { data } = await apiClient.post('/api/v1/save2own/goals/', payload);
      return normalizeGoal(data);
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getGoal: async (id: string): Promise<Save2OwnGoal> => {
    try {
      const { data } = await apiClient.get(`/api/v1/save2own/goals/${id}/`);
      return normalizeGoal(data);
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  updateGoal: async (
    id: string,
    payload: { product_id?: string; variant_id?: string; quantity?: number }
  ): Promise<Save2OwnGoal> => {
    try {
      const { data } = await apiClient.patch(`/api/v1/save2own/goals/${id}/`, payload);
      return normalizeGoal(data);
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  pause: async (id: string): Promise<Save2OwnGoal> => {
    try {
      const { data } = await apiClient.post(`/api/v1/save2own/goals/${id}/pause/`);
      return normalizeGoal(data);
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  resume: async (id: string): Promise<Save2OwnGoal> => {
    try {
      const { data } = await apiClient.post(`/api/v1/save2own/goals/${id}/resume/`);
      return normalizeGoal(data);
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  cancel: async (id: string): Promise<Save2OwnGoal> => {
    try {
      const { data } = await apiClient.post(`/api/v1/save2own/goals/${id}/cancel/`);
      return normalizeGoal(data);
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  contribute: async (
    id: string,
    payload: { amount: string; provider: string; redirect_url: string }
  ): Promise<PaymentInitResponse> => {
    try {
      const { data } = await apiClient.post(`/api/v1/save2own/goals/${id}/contribute/`, payload);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getContributions: async (id: string) => {
    try {
      const { data } = await apiClient.get(`/api/v1/save2own/goals/${id}/contributions/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  checkout: async (id: string) => {
    try {
      const { data } = await apiClient.post(`/api/v1/save2own/goals/${id}/checkout/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getRefundStatus: async (id: string) => {
    try {
      const { data } = await apiClient.get(`/api/v1/save2own/goals/${id}/refund/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};
