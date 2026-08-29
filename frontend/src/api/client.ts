import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { APIError, AuthTokens } from '@/types';

// ============================================================
// Token storage
// Access token: in memory only (never localStorage)
// Refresh token: httpOnly cookie set by Django (not accessible from JS)
// ============================================================
let accessToken: string | null = null;

export const tokenStore = {
  get: () => accessToken,
  set: (token: string | null) => {
    accessToken = token;
  },
  clear: () => {
    accessToken = null;
  },
};

// ============================================================
// Axios instance
// ============================================================
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // required for httpOnly refresh cookie
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ============================================================
// Request interceptor — inject access token
// ============================================================
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.get();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============================================================
// Response interceptor — handle 401 (token refresh) and 403
// ============================================================
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401 — attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise(resolve => {
          subscribeTokenRefresh(token => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post<AuthTokens>(
          `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/token/refresh/`,
          {},
          { withCredentials: true }
        );
        tokenStore.set(data.access);
        onRefreshed(data.access);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.access}`;
        }
        return apiClient(originalRequest);
      } catch {
        tokenStore.clear();
        // Redirect to login — fire event so AuthContext can react
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    // 403 — access denied
    if (error.response?.status === 403) {
      window.dispatchEvent(new CustomEvent('auth:forbidden'));
    }

    return Promise.reject(error);
  }
);

// ============================================================
// Error normalizer
// Converts any Axios error into a consistent APIError shape
// ============================================================
export function normalizeApiError(error: unknown): APIError {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as Record<string, unknown>;

    // If the response already has our APIError shape, use it
    if (typeof data.message === 'string' && data.error === true) {
      return {
        error: true,
        message: data.message,
        code: (data.code as string) ?? 'UNKNOWN_ERROR',
        details: data.details as Record<string, string[]> | undefined,
      };
    }

    // Django REST Framework returns flat objects like:
    //   { "role": ["This field is required."], "email": ["Already exists."] }
    //   { "non_field_errors": ["Unable to log in with provided credentials."] }
    //   { "detail": "Authentication credentials were not provided." }
    if (typeof data.detail === 'string') {
      return {
        error: true,
        message: data.detail,
        code: 'API_ERROR',
      };
    }

    // Collect all field errors from the flat DRF response
    const details: Record<string, string[]> = {};
    let firstMessage = '';
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        details[key] = value.map(String);
        if (!firstMessage) {
          firstMessage = key === 'non_field_errors'
            ? value[0]
            : `${key}: ${value[0]}`;
        }
      }
    }

    if (Object.keys(details).length > 0) {
      return {
        error: true,
        message: details.non_field_errors?.[0] ?? firstMessage ?? 'Validation error.',
        code: 'VALIDATION_ERROR',
        details,
      };
    }

    return {
      error: true,
      message: 'An unexpected error occurred.',
      code: 'UNKNOWN_ERROR',
    };
  }
  return {
    error: true,
    message: 'A network error occurred. Please check your connection.',
    code: 'NETWORK_ERROR',
  };
}

export default apiClient;
