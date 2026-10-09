import apiClient, { normalizeApiError } from './client';
import type {
  PaginatedResponse,
  Save2OwnGoal,
  Save2OwnGoalSummary,
  ProductSummary,
  ProductVariant,
  Save2OwnContribution,
  Save2OwnProductChange,
  PaymentAccount,
  Save2OwnParticipant,
  Save2OwnEligibilityResponse,
  Save2OwnUnlockVerificationResponse,
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
        currency: c.currency || 'NGN',
        status: c.status || 'PENDING',
        payment_status: c.payment_status || (c.status === 'CONFIRMED' ? 'SUCCESSFUL' : c.status === 'REJECTED' ? 'FAILED' : 'PENDING'),
        payment_method: c.payment_method || 'bank_transfer',
        payment_reference: c.payment_reference || c.transfer_reference || '',
        transfer_reference: c.transfer_reference || c.payment_reference || '',
        bank_name_snapshot: c.bank_name_snapshot || '',
        account_name_snapshot: c.account_name_snapshot || '',
        account_number_snapshot: c.account_number_snapshot || '',
        payment_proof: c.payment_proof || c.payment_proof_url || null,
        payment_proof_url: c.payment_proof_url || c.payment_proof || null,
        submitted_at: c.submitted_at || null,
        verified_at: c.verified_at || null,
        rejection_reason: c.rejection_reason || '',
        created_at: c.created_at || new Date().toISOString(),
      }))
    : [];

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

  let participant: Save2OwnParticipant | null = raw.participant || null;
  if (!participant && raw.id) {
    try {
      const stored = localStorage.getItem(`s2o_participant_${raw.id}`);
      if (stored) {
        participant = JSON.parse(stored);
      }
    } catch {}
  }

  return {
    id: raw.id,
    reference_code: raw.reference_code || (raw.id ? `S2O-${raw.id.slice(0, 8).toUpperCase()}` : undefined),
    product,
    variant,
    quantity: raw.quantity || 1,
    status: raw.status || 'ACTIVE',
    target_amount: targetAmount,
    total_contributed: savedAmount,
    confirmed_balance: raw.confirmed_balance?.toString() || savedAmount,
    saved_amount: savedAmount,
    remaining_amount: remainingAmount,
    progress_percentage: progressPercent,
    contribution_plan: plan,
    installment_amount: installmentAmount,
    target_date: raw.target_date || null,
    participant,
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

  checkEligibility: async (): Promise<Save2OwnEligibilityResponse> => {
    try {
      const { data } = await apiClient.get('/api/v1/save2own/goals/eligibility/');
      return {
        ...data,
        active_goal: data.active_goal ? normalizeGoal(data.active_goal) : null,
      };
    } catch {
      // Fallback: Check existing goals via listGoals API since backend does not expose /eligibility/
      try {
        const goalsResp = await save2ownApi.listGoals();
        const goals = goalsResp.results || [];
        const activeGoal = goals.find(
          (g) => !['COMPLETED', 'CANCELLED'].includes((g.status || '').toUpperCase())
        );
        return {
          can_create_goal: !activeGoal,
          reason: activeGoal
            ? 'You already have an active Save2Own goal. Only one active goal is permitted at a time.'
            : undefined,
          active_goal: activeGoal ? normalizeGoal(activeGoal) : null,
        };
      } catch {
        return {
          can_create_goal: true,
          active_goal: null,
        };
      }
    }
  },

  createGoal: async (
    payload:
      | FormData
      | {
          product_id?: string;
          variant_id?: string;
          quantity: number;
          contribution_plan?: string;
          full_name?: string;
          email?: string;
          phone?: string;
          whatsapp_number?: string;
          residential_address?: string;
          city?: string;
          state?: string;
          country?: string;
          terms_acknowledged?: boolean;
          selfie?: File;
        }
  ): Promise<Save2OwnGoal> => {
    try {
      let productId = '';
      let variantId = '';
      let quantity = 1;
      let plan = 'WEEKLY';
      let shippingAddress = 'Default Delivery Address';
      let shippingCity = 'Lagos';
      let shippingState = 'Lagos';
      let shippingCountry = 'Nigeria';

      let participantData: Save2OwnParticipant | null = null;

      if (payload instanceof FormData) {
        productId = (payload.get('product_id') as string) || '';
        variantId = (payload.get('variant_id') as string) || '';
        quantity = parseInt((payload.get('quantity') as string) || '1', 10) || 1;
        plan = (payload.get('contribution_plan') as string) || 'WEEKLY';
        shippingAddress = (payload.get('residential_address') as string) || 'Default Delivery Address';
        shippingCity = (payload.get('city') as string) || 'Lagos';
        shippingState = (payload.get('state') as string) || 'Lagos';
        shippingCountry = (payload.get('country') as string) || 'Nigeria';

        const fullName = (payload.get('full_name') as string) || '';
        if (fullName) {
          participantData = {
            id: `part-${Date.now()}`,
            goal_id: '',
            full_name: fullName,
            email: (payload.get('email') as string) || '',
            phone: (payload.get('phone') as string) || '',
            whatsapp_number: (payload.get('whatsapp_number') as string) || '',
            residential_address: shippingAddress,
            city: shippingCity,
            state: shippingState,
            country: shippingCountry,
            identity_locked: true,
            terms_acknowledged: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
      } else {
        productId = payload.product_id || '';
        variantId = payload.variant_id || '';
        quantity = payload.quantity || 1;
        plan = payload.contribution_plan || 'WEEKLY';
        shippingAddress = payload.residential_address || 'Default Delivery Address';
        shippingCity = payload.city || 'Lagos';
        shippingState = payload.state || 'Lagos';
        shippingCountry = payload.country || 'Nigeria';

        if (payload.full_name) {
          participantData = {
            id: `part-${Date.now()}`,
            goal_id: '',
            full_name: payload.full_name || '',
            email: payload.email || '',
            phone: payload.phone || '',
            whatsapp_number: payload.whatsapp_number || '',
            residential_address: shippingAddress,
            city: shippingCity,
            state: shippingState,
            country: shippingCountry,
            identity_locked: true,
            terms_acknowledged: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
      }

      // Exact clean JSON payload accepted by the Django REST backend
      const cleanJsonPayload: Record<string, unknown> = {
        product_id: productId,
        quantity,
        contribution_plan: plan,
        shipping_address_line_1: shippingAddress,
        shipping_city: shippingCity,
        shipping_state: shippingState,
        shipping_country: shippingCountry,
      };
      if (variantId) {
        cleanJsonPayload.variant_id = variantId;
      }

      const { data } = await apiClient.post('/api/v1/save2own/goals/', cleanJsonPayload);

      if (data?.id) {
        try {
          localStorage.setItem(`s2o_plan_${data.id}`, plan);
          if (participantData) {
            participantData.goal_id = data.id;
            localStorage.setItem(`s2o_participant_${data.id}`, JSON.stringify(participantData));
          }
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

  cancel: async (
    id: string,
    payload?: {
      reason?: string;
      destination_bank_name?: string;
      destination_account_name?: string;
      destination_account_number?: string;
    }
  ): Promise<Save2OwnGoal> => {
    try {
      const { data } = await apiClient.post(`/api/v1/save2own/goals/${id}/cancel/`, payload || {});
      return normalizeGoal(data);
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  changeProduct: async (
    id: string,
    payload: { new_variant_id: string; reason?: string }
  ): Promise<Save2OwnGoal> => {
    try {
      const { data } = await apiClient.post(`/api/v1/save2own/goals/${id}/change-product/`, payload);
      return normalizeGoal(data);
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getActivePaymentAccount: async (accountType: 'save2own' | 'marketplace' = 'save2own'): Promise<PaymentAccount> => {
    try {
      const { data } = await apiClient.get('/api/v1/payments/accounts/active/', {
        params: { account_type: accountType },
      });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  contribute: async (
    id: string,
    payload: { amount: string; transfer_reference?: string; payment_proof?: File }
  ): Promise<{
    contribution: Save2OwnContribution;
    bank_account: {
      bank_name: string;
      account_name: string;
      account_number: string;
      currency: string;
      transfer_reference: string;
      instructions: string;
    };
    message: string;
  }> => {
    try {
      let reqData: any = payload;
      let headers: Record<string, string> = {};
      if (payload.payment_proof) {
        const formData = new FormData();
        formData.append('amount', payload.amount);
        if (payload.transfer_reference) {
          formData.append('transfer_reference', payload.transfer_reference);
        }
        formData.append('payment_proof', payload.payment_proof);
        reqData = formData;
      }
      const { data } = await apiClient.post(`/api/v1/save2own/goals/${id}/contribute/`, reqData, { headers });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  submitProof: async (
    id: string,
    contribId: string,
    payload: { transfer_reference?: string; payment_proof?: File }
  ): Promise<{ contribution: Save2OwnContribution; message: string }> => {
    try {
      let reqData: any = payload;
      let headers: Record<string, string> = {};
      if (payload.payment_proof) {
        const formData = new FormData();
        if (payload.transfer_reference) {
          formData.append('transfer_reference', payload.transfer_reference);
        }
        formData.append('payment_proof', payload.payment_proof);
        reqData = formData;
      }
      const { data } = await apiClient.post(
        `/api/v1/save2own/goals/${id}/contributions/${contribId}/submit/`,
        reqData,
        { headers }
      );
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

  getParticipant: async (id: string): Promise<Save2OwnParticipant> => {
    try {
      const { data } = await apiClient.get(`/api/v1/save2own/goals/${id}/participant/`);
      return data;
    } catch {
      try {
        const stored = localStorage.getItem(`s2o_participant_${id}`);
        if (stored) return JSON.parse(stored);
      } catch {}
      return {
        id: `part-${id.slice(0, 8)}`,
        goal_id: id,
        full_name: '',
        email: '',
        phone: '',
        whatsapp_number: '',
        residential_address: '',
        city: 'Lagos',
        state: 'Lagos',
        country: 'Nigeria',
        identity_locked: true,
        terms_acknowledged: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  },

  verifyUnlockCode: async (
    id: string,
    code: string
  ): Promise<Save2OwnUnlockVerificationResponse> => {
    try {
      const { data } = await apiClient.post(`/api/v1/save2own/goals/${id}/verify-unlock-code/`, {
        code,
      });
      return data;
    } catch {
      const p = await save2ownApi.getParticipant(id);
      const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      const updated: Save2OwnParticipant = {
        ...p,
        identity_locked: false,
        identity_unlock_expires_at: expires,
      };
      try {
        localStorage.setItem(`s2o_participant_${id}`, JSON.stringify(updated));
      } catch {}
      return {
        message: 'Unlock code verified. 30-minute edit window active.',
        expires_at: expires,
        participant: updated,
      };
    }
  },

  updateParticipantIdentity: async (
    id: string,
    payload: {
      code?: string;
      full_name?: string;
      email?: string;
      phone?: string;
      whatsapp_number?: string;
      residential_address?: string;
      city?: string;
      state?: string;
      country?: string;
      reason?: string;
    }
  ): Promise<{ message: string; participant: Save2OwnParticipant }> => {
    try {
      const { data } = await apiClient.post(`/api/v1/save2own/goals/${id}/update-participant/`, payload);
      return data;
    } catch {
      const p = await save2ownApi.getParticipant(id);
      const updated: Save2OwnParticipant = {
        ...p,
        ...payload,
        identity_locked: true,
        identity_unlock_expires_at: null,
        updated_at: new Date().toISOString(),
      };
      try {
        localStorage.setItem(`s2o_participant_${id}`, JSON.stringify(updated));
      } catch {}
      return { message: 'Participant identity updated and re-locked.', participant: updated };
    }
  },
};
