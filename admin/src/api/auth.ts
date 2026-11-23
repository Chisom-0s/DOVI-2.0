import apiClient, { normalizeApiError, tokenStore } from './client';
import type { LoginRequest, User, AuthTokens } from '@/types';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthTokens> => {
    try {
      const { data } = await apiClient.post<any>('/api/v1/auth/login/', credentials);
      const access = data.access || data.tokens?.access || '';
      const refresh = data.refresh || data.tokens?.refresh || '';
      tokenStore.set(access);
      if (refresh) {
        tokenStore.setRefresh(refresh);
      }
      return { access, refresh };
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  refreshToken: async (refresh?: string): Promise<AuthTokens> => {
    try {
      const storedRefresh = refresh || tokenStore.getRefresh();
      const { data } = await apiClient.post<AuthTokens>(
        '/api/v1/auth/token/refresh/',
        storedRefresh ? { refresh: storedRefresh } : {}
      );
      tokenStore.set(data.access);
      if (data.refresh) {
        tokenStore.setRefresh(data.refresh);
      }
      return data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  logout: async (): Promise<void> => {
    try {
      const refresh = tokenStore.getRefresh();
      await apiClient.post('/api/v1/auth/logout/', refresh ? { refresh } : {});
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
