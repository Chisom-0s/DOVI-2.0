import axios, { AxiosError } from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { APIError, AuthTokens } from '@/types';

// ============================================================
// Token storage (persisted in localStorage for Admin SPA)
// ============================================================
const ADMIN_TOKEN_KEY = 'dovi_admin_token';
let accessToken: string | null = null;

export const tokenStore = {
  get: () => {
    if (accessToken) return accessToken;
    try {
      const stored = localStorage.getItem(ADMIN_TOKEN_KEY);
      if (stored) {
        accessToken = stored;
        return stored;
      }
    } catch {}
    return null;
  },
  set: (token: string | null) => {
    accessToken = token;
    try {
      if (token) {
        localStorage.setItem(ADMIN_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
      }
    } catch {}
  },
  clear: () => {
    accessToken = null;
    try {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
    } catch {}
  },
};

// ============================================================
// Cold start & server wake tracking
// ============================================================
let activeRequestsCount = 0;
let slowTimer: ReturnType<typeof setTimeout> | null = null;
let isSlowNotified = false;

function notifyRequestStart() {
  activeRequestsCount++;
  if (!slowTimer && !isSlowNotified) {
    slowTimer = setTimeout(() => {
      if (activeRequestsCount > 0) {
        isSlowNotified = true;
        window.dispatchEvent(new CustomEvent('api:cold_start', { detail: { isWakingUp: true } }));
      }
    }, 2800);
  }
}

function notifyRequestEnd() {
  activeRequestsCount = Math.max(0, activeRequestsCount - 1);
  if (activeRequestsCount === 0) {
    if (slowTimer) {
      clearTimeout(slowTimer);
      slowTimer = null;
    }
    if (isSlowNotified) {
      isSlowNotified = false;
      window.dispatchEvent(new CustomEvent('api:cold_start', { detail: { isWakingUp: false } }));
    }
  }
}

/**
 * Sends a background health ping to warm up Render's free tier container
 */
export function warmupBackend() {
  const base = import.meta.env.VITE_API_BASE_URL || '';
  if (!base) return;
  fetch(`${base.replace(/\/+$/, '')}/health/`, {
    method: 'GET',
    mode: 'cors',
    cache: 'no-cache',
  }).catch(() => {
    // Ignore warmup errors
  });
}

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
// Request interceptor — inject access token & track requests
// ============================================================
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  notifyRequestStart();
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
  response => {
    notifyRequestEnd();
    return response;
  },
  async (error: AxiosError) => {
    notifyRequestEnd();
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
        // Redirect to login — fire event so AdminAuthContext can react
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
    const data = error.response.data as Partial<APIError>;
    return {
      error: true,
      message: data.message ?? 'An unexpected error occurred.',
      code: data.code ?? 'UNKNOWN_ERROR',
      details: data.details,
    };
  }
  return {
    error: true,
    message: 'A network error occurred. Please check your connection.',
    code: 'NETWORK_ERROR',
  };
}

export default apiClient;
