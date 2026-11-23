import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { APIError, AuthTokens } from '@/types';

// ============================================================
// Token storage
// Persisted in localStorage and synchronized with in-memory cache
// Ensures sessions survive page refreshes, mobile app backgrounding,
// and background tab idling.
// ============================================================
const ACCESS_TOKEN_KEY = 'dovi_access_token';
const REFRESH_TOKEN_KEY = 'dovi_refresh_token';
const USER_SESSION_KEY = 'dovi_user_session';

let inMemoryAccessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;
let inMemoryRefreshToken: string | null = typeof window !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;

export const tokenStore = {
  get: (): string | null => {
    if (!inMemoryAccessToken && typeof window !== 'undefined') {
      inMemoryAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    }
    return inMemoryAccessToken;
  },
  set: (token: string | null) => {
    inMemoryAccessToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
      }
    }
  },
  getRefresh: (): string | null => {
    if (!inMemoryRefreshToken && typeof window !== 'undefined') {
      inMemoryRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return inMemoryRefreshToken;
  },
  setRefresh: (token: string | null) => {
    inMemoryRefreshToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem(REFRESH_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    }
  },
  getUser: <T = any>(): T | null => {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(USER_SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setUser: (user: any | null) => {
    if (typeof window === 'undefined') return;
    try {
      if (user) {
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_SESSION_KEY);
      }
    } catch {
      // ignore serialization error
    }
  },
  clear: () => {
    inMemoryAccessToken = null;
    inMemoryRefreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_SESSION_KEY);
    }
  },
};

/**
 * Resolves the backend API base URL
 */
export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL || 'https://dovi-2-0-backend.onrender.com';
}

let hasWarmedUp = false;

/**
 * Sends a single background health ping to warm up Render's free tier container
 */
export function warmupBackend() {
  if (hasWarmedUp) return;
  hasWarmedUp = true;
  const base = getApiBaseUrl();
  fetch(`${base.replace(/\/+$/, '')}/health/`, {
    method: 'GET',
    cache: 'no-cache',
  }).catch(() => {
    // Ignore warmup errors
  });
}

// ============================================================
// Axios instance
// ============================================================
const apiClient: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true, // required for httpOnly refresh cookie
  timeout: 45000, // 45s timeout to allow Render free tier container cold-start (30-50s)
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
  // If request data is FormData, remove Content-Type so Axios/browser automatically generates
  // 'multipart/form-data; boundary=----WebKitFormBoundary...'
  if (config.data instanceof FormData && config.headers) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// ============================================================
// Response interceptor — handle 401 (token refresh) and 403
// ============================================================
type RefreshSubscriber = {
  resolve: (token: string) => void;
  reject: (err: any) => void;
};

let isRefreshing = false;
let refreshSubscribers: RefreshSubscriber[] = [];

function subscribeTokenRefresh(subscriber: RefreshSubscriber) {
  refreshSubscribers.push(subscriber);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach(sub => sub.resolve(token));
  refreshSubscribers = [];
}

function onRefreshFailed(err: any) {
  refreshSubscribers.forEach(sub => sub.reject(err));
  refreshSubscribers = [];
}

apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _retryCount?: number };

    // Network error / cold-start retry (up to 2 retries with exponential backoff)
    // NEVER retry auth endpoints (login, register, token refresh) in background —
    // burst retries of auth calls trip Cloudflare / Render rate limits (429)!
    const originalUrl = originalRequest?.url || '';
    const isAuthEndpoint = originalUrl.includes('/auth/login/') || originalUrl.includes('/auth/token/') || originalUrl.includes('/auth/register/');

    const method = (originalRequest?.method || 'get').toLowerCase();
    const isSafeIdempotent = method === 'get' || method === 'head' || method === 'options';
    const isNetworkError = !error.response && Boolean(error.request);
    const retryCount = originalRequest._retryCount || 0;

    // Only auto-retry safe idempotent read requests (GET) to avoid duplicate transactions/orders/payments
    if (isSafeIdempotent && !isAuthEndpoint && isNetworkError && retryCount < 2 && (typeof navigator === 'undefined' || navigator.onLine)) {
      originalRequest._retryCount = retryCount + 1;
      const delay = retryCount === 0 ? 1500 : 3000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiClient(originalRequest);
    }

    // 401 — attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = tokenStore.getRefresh();

      // If no refresh token exists, reject without attempting refresh
      if (!refreshToken) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request until ongoing refresh completes
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(apiClient(originalRequest));
            },
            reject: (err: any) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post<AuthTokens>(
          `${getApiBaseUrl().replace(/\/+$/, '')}/api/v1/auth/token/refresh/`,
          { refresh: refreshToken },
          { withCredentials: true, timeout: 30000 }
        );

        const newAccessToken = data.access;
        const newRefreshToken = data.refresh || refreshToken;

        tokenStore.set(newAccessToken);
        tokenStore.setRefresh(newRefreshToken);

        onRefreshed(newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshErr: any) {
        onRefreshFailed(refreshErr);

        // ONLY clear tokens and trigger logout if server explicitly confirms the token is invalid/expired (HTTP 401 or 400 invalid token)
        const isDefinitiveAuthFailure =
          refreshErr.response &&
          (refreshErr.response.status === 401 ||
            (refreshErr.response.status === 400 &&
              JSON.stringify(refreshErr.response.data || {}).toLowerCase().includes('token')));

        if (isDefinitiveAuthFailure) {
          console.warn('[client] Refresh token is definitively expired or invalid. Logging out.');
          tokenStore.clear();
          window.dispatchEvent(new CustomEvent('auth:logout'));
        } else {
          console.warn('[client] Token refresh failed due to temporary network or server error. Preserving session.');
        }

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
  console.error('[normalizeApiError] Raw error:', error);
  if (axios.isAxiosError(error)) {
    console.error('[normalizeApiError] Axios error response data JSON:', JSON.stringify(error.response?.data, null, 2));
  }
  if (axios.isAxiosError(error)) {
    if (error.response) {
      let data = error.response.data as Record<string, unknown> | null;
      const status = error.response.status;
      const requestUrl = error.config?.url || '';
      const isAuthEndpoint = requestUrl.includes('/auth/login/') || requestUrl.includes('/auth/token/');

      // Wrong credentials check: 400/401 on login endpoints or explicit invalid credential messages
      const isCredentialError =
        (isAuthEndpoint && (status === 400 || status === 401 || status === 403)) ||
        (data &&
          typeof data === 'object' &&
          Boolean(
            JSON.stringify(data)
              .toLowerCase()
              .match(/(credentials|password|username|no active account|unable to log in|invalid email or password)/i)
          ));

      if (isCredentialError) {
        return {
          error: true,
          message: 'Wrong credentials',
          code: 'INVALID_CREDENTIALS',
          details: data?.details as Record<string, string[]> | undefined,
        };
      }

      if (data && typeof data === 'object') {
        // Handle nested "error" wrapper object or string
        if (data.error) {
          if (typeof data.error === 'string') {
            return {
              error: true,
              message: data.error,
              code: (data.code as string) ?? 'API_ERROR',
            };
          }
          if (typeof data.error === 'object' && data.error !== null) {
            data = data.error as Record<string, unknown>;
          }
        }

        // If the response already has our APIError shape, use it
        if (typeof data.message === 'string' && data.error === true) {
          return {
            error: true,
            message: data.message,
            code: (data.code as string) ?? 'UNKNOWN_ERROR',
            details: data.details as Record<string, string[]> | undefined,
          };
        }

        // Django REST Framework returns flat objects like detail string
        if (typeof data.detail === 'string') {
          return {
            error: true,
            message: data.detail,
            code: 'API_ERROR',
          };
        }

        // Collect all field errors
        const details: Record<string, string[]> = {};
        let firstMessage = '';

        if (data.details) {
          if (Array.isArray(data.details)) {
            for (const item of data.details) {
              if (item && typeof item === 'object') {
                for (const [key, value] of Object.entries(item)) {
                  if (Array.isArray(value)) {
                    details[key] = value.map(String);
                    if (!firstMessage) firstMessage = `${key}: ${value[0]}`;
                  } else if (typeof value === 'string') {
                    details[key] = [value];
                    if (!firstMessage) firstMessage = `${key}: ${value}`;
                  }
                }
              }
            }
          } else if (typeof data.details === 'object' && data.details !== null) {
            for (const [key, value] of Object.entries(data.details)) {
              if (Array.isArray(value)) {
                details[key] = value.map(String);
                if (!firstMessage) firstMessage = `${key}: ${value[0]}`;
              } else if (typeof value === 'string') {
                details[key] = [value];
                if (!firstMessage) firstMessage = `${key}: ${value}`;
              }
            }
          }
        }

        if (Object.keys(details).length === 0) {
          for (const [key, value] of Object.entries(data)) {
            if (key === 'details' || key === 'error' || key === 'message' || key === 'code' || key === 'request_id') {
              continue;
            }
            if (Array.isArray(value)) {
              details[key] = value.map(String);
              if (!firstMessage) firstMessage = key === 'non_field_errors' ? value[0] : `${key}: ${value[0]}`;
            } else if (typeof value === 'string') {
              details[key] = [value];
              if (!firstMessage) firstMessage = `${key}: ${value}`;
            }
          }
        }

        if (Object.keys(details).length > 0) {
          return {
            error: true,
            message: details.non_field_errors?.[0] ?? firstMessage ?? (typeof data.message === 'string' ? data.message : 'Validation error.'),
            code: 'VALIDATION_ERROR',
            details,
          };
        }

        if (typeof data.message === 'string') {
          return {
            error: true,
            message: data.message,
            code: typeof data.code === 'string' ? data.code : 'UNKNOWN_ERROR',
          };
        }
      }

      // If status code is 5xx or server had no parseable response body
      if (status >= 500) {
        return {
          error: true,
          message: status === 502 || status === 503 || status === 504
            ? "We're having trouble connecting to our servers right now. Please try again in a moment."
            : "Something went wrong on our end. Please try again in a moment.",
          code: 'SERVER_ERROR',
        };
      }
      if (status === 429) {
        return {
          error: true,
          message: 'We are receiving high traffic right now. Please wait a few moments and try again.',
          code: 'RATE_LIMITED',
        };
      }
      if (status === 404) {
        return {
          error: true,
          message: 'Item or endpoint not found.',
          code: 'NOT_FOUND',
        };
      }
      if (status === 403) {
        return {
          error: true,
          message: 'Permission denied.',
          code: 'FORBIDDEN',
        };
      }
      if (status === 401) {
        return {
          error: true,
          message: 'Please sign in to continue.',
          code: 'UNAUTHORIZED',
        };
      }
      return {
        error: true,
        message: `Request failed with status ${status}.`,
        code: 'HTTP_ERROR',
      };
    } else if (error.request || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      const isTimeout = error.code === 'ECONNABORTED' || (error.message && error.message.toLowerCase().includes('timeout'));

      if (isOffline) {
        return {
          error: true,
          message: 'You appear to be offline. Please check your internet connection and try again.',
          code: 'OFFLINE',
        };
      }

      if (isTimeout) {
        return {
          error: true,
          message: 'The server took too long to respond. Please check your connection and try again.',
          code: 'TIMEOUT',
        };
      }

      return {
        error: true,
        message: "We're having trouble connecting to our servers right now. Please check your internet connection or try again in a moment.",
        code: 'SERVER_UNAVAILABLE',
      };
    }
  }

  // General JS exception
  return {
    error: true,
    message: error instanceof Error ? error.message : 'Unable to complete request. Please try again.',
    code: 'NETWORK_ERROR',
  };
}

export default apiClient;
