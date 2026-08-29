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
  console.error('[normalizeApiError] Raw error:', error);
  if (axios.isAxiosError(error)) {
    console.error('[normalizeApiError] Axios error response data JSON:', JSON.stringify(error.response?.data, null, 2));
  }
  if (axios.isAxiosError(error)) {
    if (error.response) {
      let data = error.response.data as Record<string, unknown> | null;
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
      const status = error.response.status;
      if (status >= 500) {
        return {
          error: true,
          message: 'Server error. Please try again later.',
          code: 'SERVER_ERROR',
        };
      }
      return {
        error: true,
        message: `HTTP Error ${status}. Please try again.`,
        code: 'HTTP_ERROR',
      };
    } else if (error.request) {
      return {
        error: true,
        message: 'No response from server. Please check your network connection.',
        code: 'NETWORK_ERROR',
      };
    }
  }

  // General JS exception
  return {
    error: true,
    message: error instanceof Error ? error.message : 'An unexpected error occurred.',
    code: 'JS_ERROR',
  };
}

export default apiClient;
