import apiClient, { normalizeApiError, tokenStore } from './client';
import type { LoginRequest, User, AuthTokens } from '@/types';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthTokens> => {
    try {
      const { data } = await apiClient.post<AuthTokens>('/api/v1/auth/login/', credentials);
      tokenStore.set(data.access);
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/api/v1/auth/logout/');
    } catch (err) {
      // Ignored for logout
    } finally {
      tokenStore.clear();
    }
  },

  getMe: async (): Promise<User> => {
    try {
      const { data } = await apiClient.get<User>('/api/v1/users/me/');
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};
