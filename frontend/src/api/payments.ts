import apiClient, { normalizeApiError } from './client';
import type {
  Payment,
  PaymentInitResponse,
  PaymentMethod,
  PaymentAccount,
  PaymentAccountType,
  PaymentSession,
  MinimumOrderSettings,
} from '@/types';
import {
  savePaymentSubmissionSync,
  syncPaymentsAndOrdersFromServer,
  getPaymentByOrderRef,
  addCustomerNotification,
} from '@/services/orderPaymentSync';

export const DEFAULT_MINIMUM_ORDER_SETTINGS: MinimumOrderSettings = {
  enabled: true,
  minimum_amount: 10000,
  updated_at: '2026-11-21T00:00:00Z',
  updated_by: 'Administrator',
};

export function getLocalPaymentSessions(): Record<string, PaymentSession> {
  try {
    const raw = localStorage.getItem('dovi_payment_sessions');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLocalPaymentSession(session: PaymentSession): void {
  try {
    const map = getLocalPaymentSessions();
    map[session.id] = session;
    map[session.order_reference] = session;
    localStorage.setItem('dovi_payment_sessions', JSON.stringify(map));
  } catch {}
}

export function getLocalPaymentSession(key: string): PaymentSession | null {
  const map = getLocalPaymentSessions();
  return map[key] || null;
}

export const DEFAULT_MARKETPLACE_ACCOUNT: PaymentAccount = {
  id: 'acc-mkt-default',
  account_type: 'marketplace',
  bank_name: 'Zenith Bank',
  account_name: 'Dovi Direct Commerce Limited',
  account_number: '1012345678',
  currency: 'NGN',
  is_active: true,
  instructions:
    'Transfer the exact order total to this dedicated DOVI Product Purchase account. In your bank transfer narration or remarks, enter your Order Reference Code. Once transferred, upload your payment receipt below to submit for verification.',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

export function getStoredPaymentAccounts(): PaymentAccount[] {
  try {
    const raw = localStorage.getItem('dovi_payment_accounts');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [DEFAULT_MARKETPLACE_ACCOUNT];
}

export const paymentsApi = {
  // Only manual bank transfer is active (Flutterwave & OPay permanently removed from customer checkout)
  getMinimumOrderSettings: async (): Promise<MinimumOrderSettings> => {
    try {
      const { data } = await apiClient.get<MinimumOrderSettings>('/api/v1/settings/minimum-order/');
      if (data && typeof data.minimum_amount === 'number') {
        localStorage.setItem('dovi_min_order_settings', JSON.stringify(data));
        return data;
      }
    } catch {}

    // Check shared delivery DB
    try {
      const res = await fetch('/__dovi_delivery_db__');
      if (res.ok) {
        const s = await res.json();
        if (s?.minimumOrderSettings) {
          localStorage.setItem('dovi_min_order_settings', JSON.stringify(s.minimumOrderSettings));
          return s.minimumOrderSettings;
        }
      }
    } catch {}

    try {
      const cached = localStorage.getItem('dovi_min_order_settings');
      if (cached) return JSON.parse(cached);
    } catch {}

    return DEFAULT_MINIMUM_ORDER_SETTINGS;
  },

  createOrGetPaymentSession: async (payload: {
    order_reference: string;
    checkout_session_id?: string;
    amount: string;
    currency?: string;
    customer_id?: string;
    customer_name?: string;
    customer_email?: string;
    force_new?: boolean;
    subtotal?: number;
  }): Promise<PaymentSession> => {
    try {
      const { data } = await apiClient.post<PaymentSession>('/api/v1/payments/sessions/', payload);
      if (data && data.id && data.expires_at) {
        saveLocalPaymentSession(data);
        return data;
      }
    } catch (err: any) {
      if (err?.code === 'MINIMUM_ORDER_VALUE_NOT_MET' || err?.response?.data?.error === 'MINIMUM_ORDER_VALUE_NOT_MET') {
        throw normalizeApiError(err);
      }
    }

    // Fallback: local session store with authoritative 60-min timer
    const existing = getLocalPaymentSession(payload.order_reference);
    const now = new Date();
    if (existing && !payload.force_new) {
      const exp = new Date(existing.expires_at);
      if (exp > now && existing.status === 'ACTIVE') {
        existing.remaining_seconds = Math.max(0, Math.floor((exp.getTime() - now.getTime()) / 1000));
        return existing;
      } else if (exp <= now && existing.status === 'ACTIVE') {
        existing.status = 'EXPIRED';
        existing.remaining_seconds = 0;
        saveLocalPaymentSession(existing);
      } else if (existing.status === 'EVIDENCE_SUBMITTED') {
        return existing;
      }
    }

    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    const newSession: PaymentSession = {
      id: `psess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      order_reference: payload.order_reference,
      checkout_session_id: payload.checkout_session_id,
      customer_id: payload.customer_id,
      customer_name: payload.customer_name,
      customer_email: payload.customer_email,
      amount: payload.amount,
      currency: payload.currency || 'NGN',
      created_at: now.toISOString(),
      expires_at: expiresAt,
      remaining_seconds: 3600,
      server_time: now.toISOString(),
      status: 'ACTIVE',
      evidence_submitted_at: null,
      payment_evidence_id: null,
      payment_verification_status: 'PENDING',
    };
    saveLocalPaymentSession(newSession);
    return newSession;
  },

  getPaymentSession: async (orderRefOrId: string): Promise<PaymentSession | null> => {
    try {
      const { data } = await apiClient.get<PaymentSession>(`/api/v1/payments/sessions/${orderRefOrId}/`);
      if (data && data.id) {
        saveLocalPaymentSession(data);
        return data;
      }
    } catch {}

    const local = getLocalPaymentSession(orderRefOrId);
    if (local) {
      const now = new Date();
      const exp = new Date(local.expires_at);
      if (exp <= now && local.status === 'ACTIVE') {
        local.status = 'EXPIRED';
        local.remaining_seconds = 0;
        saveLocalPaymentSession(local);
      } else if (local.status === 'ACTIVE') {
        local.remaining_seconds = Math.max(0, Math.floor((exp.getTime() - now.getTime()) / 1000));
      }
      return local;
    }
    return null;
  },

  renewPaymentSession: async (orderRefOrId: string): Promise<PaymentSession> => {
    try {
      const { data } = await apiClient.post<{ success: boolean; session: PaymentSession }>(
        `/api/v1/payments/sessions/${orderRefOrId}/renew/`
      );
      if (data?.session) {
        saveLocalPaymentSession(data.session);
        return data.session;
      }
    } catch {}

    // Local renew
    const existing = getLocalPaymentSession(orderRefOrId);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    const newSession: PaymentSession = {
      id: `psess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      order_reference: existing?.order_reference || orderRefOrId,
      checkout_session_id: existing?.checkout_session_id,
      customer_id: existing?.customer_id,
      customer_name: existing?.customer_name,
      customer_email: existing?.customer_email,
      amount: existing?.amount || '0',
      currency: existing?.currency || 'NGN',
      created_at: now.toISOString(),
      expires_at: expiresAt,
      remaining_seconds: 3600,
      server_time: now.toISOString(),
      status: 'ACTIVE',
      evidence_submitted_at: null,
      payment_evidence_id: null,
      payment_verification_status: 'PENDING',
    };
    saveLocalPaymentSession(newSession);
    return newSession;
  },

  uploadReceipt: async (file: File, orderRef?: string): Promise<{ success: boolean; receipt_url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    if (orderRef) {
      formData.append('order_reference', orderRef);
    }

    try {
      const { data } = await apiClient.post<{ success: boolean; receipt_url: string; filename: string }>(
        '/api/v1/payments/upload-receipt/',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      if (data && data.receipt_url) {
        return data;
      }
    } catch (err) {
      console.warn('API receipt upload failed, falling back to data URL', err);
    }

    // Fallback: convert to Data URL if upload endpoint is unreachable
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          success: true,
          receipt_url: reader.result as string,
          filename: file.name,
        });
      };
      reader.onerror = () => reject(new Error('Failed to read receipt file'));
      reader.readAsDataURL(file);
    });
  },

  getMethods: async (): Promise<PaymentMethod[]> => {
    return [
      {
        id: 'BANK_TRANSFER',
        name: 'Direct Bank Transfer',
        description: 'Pay directly into verified DOVI official bank account and upload receipt',
        logo_url: null,
        is_active: true,
      },
    ];
  },

  getActiveAccount: async (type: PaymentAccountType = 'marketplace'): Promise<PaymentAccount> => {
    try {
      const { data } = await apiClient.get<PaymentAccount>(`/api/v1/payment-accounts/active/?type=${type}`);
      if (data && data.account_number && data.account_type === type) return data;
    } catch {}

    const all = getStoredPaymentAccounts();
    const active = all.find((a) => a.account_type === type && a.is_active !== false);
    if (active) return active;
    const fallback = all.find((a) => a.account_type === type);
    if (fallback) return fallback;

    return DEFAULT_MARKETPLACE_ACCOUNT;
  },

  submitPaymentEvidence: async (payload: {
    order_reference: string;
    sender_bank: string;
    sender_account_name: string;
    transaction_reference?: string;
    amount: string;
    currency?: string;
    payment_proof_url?: string;
    payment_session_id?: string;
    notes?: string;
  }): Promise<Payment> => {
    // Check local session expiry before submitting
    const session = getLocalPaymentSession(payload.order_reference);
    if (session) {
      const now = new Date();
      const exp = new Date(session.expires_at);
      if (session.status === 'EXPIRED' || (exp < now && session.status === 'ACTIVE')) {
        session.status = 'EXPIRED';
        saveLocalPaymentSession(session);
        throw new Error('This payment session has expired. Please initiate a new payment session to complete your bank transfer.');
      }
    }

    const paymentRecord: Payment = {
      id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      reference: `PAY-${payload.order_reference}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      order_reference: payload.order_reference,
      provider: 'BANK_TRANSFER',
      status: 'PENDING_VERIFICATION',
      amount: payload.amount,
      currency: payload.currency || 'NGN',
      sender_bank: payload.sender_bank,
      sender_account_name: payload.sender_account_name,
      payment_proof_url: payload.payment_proof_url,
      transaction_reference: payload.transaction_reference,
      notes: payload.notes,
      created_at: new Date().toISOString(),
      verified_at: null,
      verified_by: null,
      rejection_reason: null,
    };

    // Update local payment session state to EVIDENCE_SUBMITTED
    if (session) {
      session.status = 'EVIDENCE_SUBMITTED';
      session.evidence_submitted_at = new Date().toISOString();
      session.payment_evidence_id = paymentRecord.id;
      session.payment_verification_status = 'PENDING_VERIFICATION';
      saveLocalPaymentSession(session);
    }

    // Save and synchronize locally and to shared delivery database
    savePaymentSubmissionSync(paymentRecord);

    addCustomerNotification(
      'Payment Proof Submitted',
      `Your bank transfer proof for Order #${payload.order_reference} has been received and is currently under verification.`,
      'INFO'
    );

    // Also attempt backend POST
    try {
      const { data } = await apiClient.post<Payment>('/api/v1/payments/submit-evidence/', payload);
      if (data && data.status) {
        savePaymentSubmissionSync(data);
        return data;
      }
    } catch (err: any) {
      if (err?.response?.data?.error === 'PAYMENT_SESSION_EXPIRED' || err?.code === 'PAYMENT_SESSION_EXPIRED') {
        throw normalizeApiError(err);
      }
    }

    return paymentRecord;
  },

  getPaymentSubmission: async (orderReference: string): Promise<Payment | null> => {
    try {
      await syncPaymentsAndOrdersFromServer();
    } catch {}

    const localMatch = getPaymentByOrderRef(orderReference);
    if (localMatch) return localMatch;

    try {
      const { data } = await apiClient.get<Payment>(`/api/v1/payments/evidence/?order_reference=${orderReference}`);
      if (data) return data;
    } catch {}

    return null;
  },

  initialize: async (payload: {
    order_reference: string;
    provider: string;
    redirect_url: string;
  }): Promise<PaymentInitResponse> => {
    return {
      payment_reference: `PAY-${payload.order_reference}`,
      payment_link: '',
      provider: 'BANK_TRANSFER',
      amount: '0',
      currency: 'NGN',
    };
  },

  verify: async (ref: string): Promise<Payment> => {
    try {
      const { data } = await apiClient.get(`/api/v1/payments/${ref}/verify/`);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  retry: async (ref: string): Promise<PaymentInitResponse> => {
    return {
      payment_reference: `PAY-${ref}`,
      payment_link: '',
      provider: 'BANK_TRANSFER',
      amount: '0',
      currency: 'NGN',
    };
  },

  getSavedMethods: async (): Promise<any[]> => {
    return [];
  },
};
