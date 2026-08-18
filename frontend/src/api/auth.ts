// Auth API — POST /api/v1/auth/*
// Stub: functions will be implemented in Phase 1
import apiClient, { normalizeApiError } from './client';
import type { AuthTokens, LoginRequest, RegisterRequest, User } from '@/types';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<{ tokens: AuthTokens; user: User }> => {
    try {
      const { data } = await apiClient.post('/api/v1/auth/login/', credentials);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  register: async (payload: RegisterRequest): Promise<{ message: string }> => {
    try {
      const { data } = await apiClient.post('/api/v1/auth/register/', payload);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/api/v1/auth/logout/');
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  refreshToken: async (): Promise<AuthTokens> => {
    try {
      const { data } = await apiClient.post('/api/v1/auth/token/refresh/');
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

  updateMe: async (payload: Partial<User>): Promise<User> => {
    try {
      const { data } = await apiClient.patch('/api/v1/users/me/', payload);
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
};
