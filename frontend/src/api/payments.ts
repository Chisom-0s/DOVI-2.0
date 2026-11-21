import apiClient, { normalizeApiError } from './client';
import type { Payment, PaymentInitResponse, PaymentMethod, PaymentAccount, PaymentAccountType } from '@/types';
import {
  savePaymentSubmissionSync,
  syncPaymentsAndOrdersFromServer,
  getPaymentByOrderRef,
  addCustomerNotification,
} from '@/services/orderPaymentSync';

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
    notes?: string;
  }): Promise<Payment> => {
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
    } catch {}

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
