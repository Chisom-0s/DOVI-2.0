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
  PaymentAccount,
  PaymentAccountType,
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
  const targetNum = parseFloat(targetAmount) || 0;

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
  // Retrieve local contributions if available
  let localContribs: any[] = [];
  try {
    const stored = localStorage.getItem(`dovi_s2o_contribs_${raw.id}`);
    if (stored) localContribs = JSON.parse(stored);
  } catch {}

  const mergedRawContribs = Array.isArray(raw.contributions) && raw.contributions.length > 0
    ? raw.contributions
    : localContribs;

  const contributions: Save2OwnContribution[] = Array.isArray(mergedRawContribs)
    ? mergedRawContribs.map((c: any) => {
        const rawStatus = (c.status || c.payment_status || 'submitted').toLowerCase();
        let normalizedStatus = rawStatus;
        if (rawStatus === 'successful' || rawStatus === 'completed' || rawStatus === 'paid') {
          normalizedStatus = 'confirmed';
        }

        return {
          id: c.id || `contrib-${Math.random().toString(36).slice(2, 9)}`,
          goal_id: c.goal_id || raw.id,
          user_id: c.user_id || raw.user_id,
          amount: c.amount?.toString() || '0',
          currency: c.currency || 'NGN',
          payment_method: c.payment_method || 'bank_transfer',
          payment_account_id: c.payment_account_id || '',
          transfer_reference: c.transfer_reference || c.payment_reference || '',
          payment_reference: c.payment_reference || c.transfer_reference || '',
          payment_proof_path: c.payment_proof_path || null,
          status: normalizedStatus as any,
          payment_status: normalizedStatus === 'confirmed' ? 'SUCCESSFUL' : 'PENDING',
          submitted_at: c.submitted_at || c.created_at || new Date().toISOString(),
          verified_at: c.verified_at || null,
          verified_by: c.verified_by || null,
          rejection_reason: c.rejection_reason || null,
          bank_name_snapshot: c.bank_name_snapshot || '',
          account_name_snapshot: c.account_name_snapshot || '',
          account_number_snapshot: c.account_number_snapshot || '',
          instructions_snapshot: c.instructions_snapshot || '',
          created_at: c.created_at || new Date().toISOString(),
          updated_at: c.updated_at || c.created_at || new Date().toISOString(),
        };
      })
    : [];

  // Authoritative financial calculation:
  // ONLY 'confirmed' contributions count towards total_contributed / saved_amount!
  const confirmedSum = contributions
    .filter(c => c.status === 'confirmed' || (c.status as string) === 'CONFIRMED' || c.payment_status === 'SUCCESSFUL')
    .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

  // If backend provided total_contributed or saved_amount, use it only if higher or equal,
  // but if local contributions exist, sum is authoritative.
  const savedNum = contributions.length > 0
    ? confirmedSum
    : (parseFloat(raw.total_contributed ?? raw.saved_amount ?? '0') || 0);

  const savedAmount = savedNum.toString();
  const remainingNum = Math.max(0, targetNum - savedNum);
  const remainingAmount = remainingNum.toString();

  const progressPercent =
    targetNum > 0 ? Math.min(100, Math.round((savedNum / targetNum) * 100)) : 0;

  let storedPlan: 'DAILY' | 'WEEKLY' | 'MONTHLY' = 'WEEKLY';
  try {
    const local = localStorage.getItem(`s2o_plan_${raw.id}`);
    if (local === 'DAILY' || local === 'WEEKLY' || local === 'MONTHLY') {
      storedPlan = local;
    }
  } catch {}

  const plan: 'DAILY' | 'WEEKLY' | 'MONTHLY' =
    raw.contribution_plan ||
    (Array.isArray(raw.history)
      ? raw.history.find((h: any) => h.event_type === 'GOAL_CREATED')?.new_value?.contribution_plan
      : null) ||
    storedPlan;

  let divisor = 10;
  if (plan === 'DAILY') divisor = 30;
  if (plan === 'MONTHLY') divisor = 4;

  const rawInstallment = Math.ceil(targetNum / divisor);
  const installmentAmount = (
    remainingNum > 0 && rawInstallment > remainingNum ? remainingNum : rawInstallment
  ).toString();

  // Status transitions to COMPLETED if fully funded and active
  let status = raw.status || 'ACTIVE';
  if (targetNum > 0 && savedNum >= targetNum && status === 'ACTIVE') {
    status = 'COMPLETED';
  }

  return {
    id: raw.id,
    product,
    variant,
    quantity: raw.quantity || 1,
    status,
    target_amount: targetAmount,
    total_contributed: savedAmount,
    remaining_amount: remainingAmount,
    progress_percentage: progressPercent,
    contribution_plan: plan,
    installment_amount: installmentAmount,
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
    contribution_plan: goal.contribution_plan,
    installment_amount: goal.installment_amount,
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
      if (payload.contribution_plan && data?.id) {
        try {
          localStorage.setItem(`s2o_plan_${data.id}`, payload.contribution_plan);
        } catch {}
      }
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

  activate: async (id: string): Promise<Save2OwnGoal> => {
    try {
      const { data } = await apiClient.post(`/api/v1/save2own/goals/${id}/activate/`);
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

  /**
   * Retrieves the active dedicated payment account (either save2own or marketplace).
   */
  getActivePaymentAccount: async (
    type: PaymentAccountType = 'save2own'
  ): Promise<PaymentAccount> => {
    try {
      const { data } = await apiClient.get('/api/v1/payment-accounts/active/', {
        params: { account_type: type },
      });
      if (data && data.id) {
        return data;
      }
    } catch {}

    // Fallback from stored/default accounts
    const accounts = getStoredPaymentAccounts();
    const active = accounts.find((a) => a.account_type === type && a.is_active);
    if (active) return active;
    const fallback = accounts.find((a) => a.account_type === type);
    if (fallback) return fallback;
    return DEFAULT_PAYMENT_ACCOUNTS.find((a) => a.account_type === type)!;
  },

  /**
   * Submits a Bank Transfer contribution for Save2Own.
   * Preserves snapshot of bank details and creates a pending_verification/submitted contribution.
   */
  submitBankTransferContribution: async (
    goalId: string,
    payload: {
      amount: string;
      transfer_reference: string;
      payment_proof_path?: string | null;
      payment_account_id?: string;
      bank_name_snapshot?: string;
      account_name_snapshot?: string;
      account_number_snapshot?: string;
      instructions_snapshot?: string;
    }
  ): Promise<Save2OwnContribution> => {
    const contributionPayload = {
      goal_id: goalId,
      amount: payload.amount,
      currency: 'NGN',
      payment_method: 'bank_transfer',
      payment_account_id: payload.payment_account_id || '',
      transfer_reference: payload.transfer_reference,
      payment_proof_path: payload.payment_proof_path || null,
      status: 'submitted',
      bank_name_snapshot: payload.bank_name_snapshot || '',
      account_name_snapshot: payload.account_name_snapshot || '',
      account_number_snapshot: payload.account_number_snapshot || '',
      instructions_snapshot: payload.instructions_snapshot || '',
      submitted_at: new Date().toISOString(),
    };

    try {
      const { data } = await apiClient.post(
        `/api/v1/save2own/goals/${goalId}/contribute/`,
        contributionPayload
      );
      return data;
    } catch (err) {
      // Offline/fallback storage
      const newContrib: Save2OwnContribution = {
        id: `contrib-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        goal_id: goalId,
        amount: payload.amount,
        currency: 'NGN',
        payment_method: 'bank_transfer',
        payment_account_id: payload.payment_account_id || '',
        transfer_reference: payload.transfer_reference,
        payment_reference: payload.transfer_reference,
        payment_proof_path: payload.payment_proof_path || null,
        status: 'submitted',
        payment_status: 'PENDING',
        submitted_at: new Date().toISOString(),
        bank_name_snapshot: payload.bank_name_snapshot || '',
        account_name_snapshot: payload.account_name_snapshot || '',
        account_number_snapshot: payload.account_number_snapshot || '',
        instructions_snapshot: payload.instructions_snapshot || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      try {
        let existing: any[] = [];
        const stored = localStorage.getItem(`dovi_s2o_contribs_${goalId}`);
        if (stored) existing = JSON.parse(stored);
        existing.unshift(newContrib);
        localStorage.setItem(`dovi_s2o_contribs_${goalId}`, JSON.stringify(existing));

        // Also add to global admin pending queue
        let globalList: any[] = [];
        const globalStored = localStorage.getItem('dovi_global_s2o_contribs');
        if (globalStored) globalList = JSON.parse(globalStored);
        globalList.unshift(newContrib);
        localStorage.setItem('dovi_global_s2o_contribs', JSON.stringify(globalList));
      } catch {}

      return newContrib;
    }
  },

  /**
   * @deprecated Provider payments removed from Save2Own. Use submitBankTransferContribution.
   */
  contribute: async (
    id: string,
    payload: { amount: string; provider?: string; redirect_url?: string }
  ): Promise<any> => {
    return save2ownApi.submitBankTransferContribution(id, {
      amount: payload.amount,
      transfer_reference: `S2O-${id.slice(0, 8)}-${Date.now().toString().slice(-4)}`,
    });
  },

  getContributions: async (id: string) => {
    try {
      const { data } = await apiClient.get(`/api/v1/save2own/goals/${id}/contributions/`);
      return data;
    } catch (err) {
      try {
        const stored = localStorage.getItem(`dovi_s2o_contribs_${id}`);
        if (stored) return JSON.parse(stored);
      } catch {}
      return [];
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

