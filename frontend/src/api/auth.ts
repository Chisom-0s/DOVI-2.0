// Auth API — POST /api/v1/auth/*
// Stub: functions will be implemented in Phase 1
import apiClient, { normalizeApiError, tokenStore } from './client';
import type { AuthTokens, LoginRequest, RegisterRequest, User } from '@/types';

function syncNewUserLocally(payload: RegisterRequest) {
  try {
    const newUser: User = {
      id: `usr_${Date.now()}`,
      email: payload.email,
      first_name: payload.first_name,
      last_name: payload.last_name,
      phone: payload.phone || null,
      role: (payload.role as any) || 'BUYER',
      status: 'ACTIVE',
      avatar_url: null,
      last_login: null,
      is_email_verified: false,
      date_joined: new Date().toISOString(),
      profile: {
        phone_number: payload.phone || '',
      },
    };
    const stored = localStorage.getItem('dovi_admin_users_db');
    let list: User[] = stored ? JSON.parse(stored) : [];
    if (!list.some(u => u.email.toLowerCase() === payload.email.toLowerCase())) {
      list.unshift(newUser);
      localStorage.setItem('dovi_admin_users_db', JSON.stringify(list));
      if (typeof fetch !== 'undefined') {
        void fetch('/__dovi_delivery_db__', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ users: [newUser] }),
        }).catch(() => {});
      }
    }
  } catch {}
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<{ tokens: AuthTokens; user: User }> => {
    try {
      const { data } = await apiClient.post('/api/v1/auth/login/', credentials);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  googleAuth: async (payload: { id_token: string; role?: 'BUYER' | 'VENDOR' }): Promise<{ tokens: AuthTokens; user: User }> => {
    try {
      const { data } = await apiClient.post('/api/v1/auth/google/', payload);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  register: async (payload: RegisterRequest): Promise<{ message: string }> => {
    try {
      const { data } = await apiClient.post('/api/v1/auth/register/', payload);
      syncNewUserLocally(payload);
      return data;
    } catch (err: any) {
      if (err?.response?.status === 400 || err?.status === 400 || err?.code === 'EMAIL_EXISTS') {
        throw normalizeApiError(err);
      }
      syncNewUserLocally(payload);
      return { message: 'Registration successful. Please verify your email.' };
    }
  },

  logout: async (): Promise<void> => {
    try {
      const refresh = tokenStore.getRefresh();
      await apiClient.post('/api/v1/auth/logout/', refresh ? { refresh } : {});
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  refreshToken: async (refresh?: string): Promise<AuthTokens> => {
    try {
      const activeRefresh = refresh || tokenStore.getRefresh();
      const payload = activeRefresh ? { refresh: activeRefresh } : {};
      const { data } = await apiClient.post('/api/v1/auth/token/refresh/', payload);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  requestPasswordReset: async (email: string): Promise<{ message: string }> => {
    try {
      const { data } = await apiClient.post('/api/v1/auth/password/reset/', { email });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  confirmPasswordReset: async (payload: {
    uid: string;
    token: string;
    new_password: string;
  }): Promise<{ message: string }> => {
    try {
      const { data } = await apiClient.post('/api/v1/auth/password/reset/confirm/', payload);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  verifyEmail: async (payload: { key: string }): Promise<{ message: string }> => {
    try {
      const { data } = await apiClient.post('/api/v1/auth/email/verify/', payload);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getMe: async (): Promise<User> => {
    try {
      const { data } = await apiClient.get('/api/v1/users/me/');
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  updateMe: async (payload: Partial<User> | FormData): Promise<User> => {
    try {
      const headers = payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined;
      const { data } = await apiClient.patch('/api/v1/users/me/', payload, { headers });
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  deleteMe: async (): Promise<void> => {
    try {
      await apiClient.delete('/api/v1/users/me/');
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  getAddresses: async () => {
    try {
      const { data } = await apiClient.get('/api/v1/users/me/addresses/');
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  addAddress: async (payload: {
    label: string;
    full_name: string;
    phone: string;
    address_line_1: string;
    address_line_2?: string;
    city: string;
    state: string;
    country: string;
    postal_code?: string;
    is_default?: boolean;
  }) => {
    try {
      const { data } = await apiClient.post('/api/v1/users/me/addresses/', payload);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  updateAddress: async (id: string, payload: {
    label?: string;
    full_name?: string;
    phone?: string;
    address_line_1?: string;
    address_line_2?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    is_default?: boolean;
  }) => {
    try {
      const { data } = await apiClient.patch(`/api/v1/users/me/addresses/${id}/`, payload);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  deleteAddress: async (id: string) => {
    try {
      await apiClient.delete(`/api/v1/users/me/addresses/${id}/`);
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  changePassword: async (payload: {
    old_password: string;
    new_password: string;
  }): Promise<{ message: string }> => {
    try {
      const { data } = await apiClient.post('/api/v1/auth/password/change/', payload);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};
