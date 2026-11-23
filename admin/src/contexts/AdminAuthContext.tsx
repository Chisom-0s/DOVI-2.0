import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '@/api/auth';
import { tokenStore } from '@/api/client';
import type { User, LoginRequest } from '@/types';

interface AdminAuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const cachedUser = tokenStore.getUser<User>();
  const [user, setUser] = useState<User | null>(cachedUser);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    Boolean(tokenStore.get() && cachedUser)
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const isInitializingRef = useRef(false);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      tokenStore.clear();
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const me = await authApi.getMe();
      if (me.role !== 'ADMIN') {
        await logout();
        throw new Error('Access denied. Admin role required.');
      }
      tokenStore.setUser(me);
      setUser(me);
      setIsAuthenticated(true);
    } catch (err: any) {
      const isDefinitiveAuthFailure =
        err?.status === 401 ||
        err?.status === 403 ||
        err?.code === 'FORBIDDEN' ||
        err?.code === 'UNAUTHORIZED';

      if (isDefinitiveAuthFailure) {
        setUser(null);
        setIsAuthenticated(false);
        tokenStore.clear();
        throw err;
      }
      // On temporary network errors or backend wakeups, keep existing cached session
      console.warn('[AdminAuthContext] Transient error refreshing admin profile. Preserving cached session.');
    }
  }, [logout]);

  const login = async (credentials: LoginRequest) => {
    const tokens = await authApi.login(credentials);
    tokenStore.set(tokens.access);
    if (tokens.refresh) {
      tokenStore.setRefresh(tokens.refresh);
    }
    try {
      await refreshUser();
    } catch (err) {
      tokenStore.clear();
      throw err;
    }
  };

  // On mount: restore and verify session
  useEffect(() => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    const initializeAuth = async () => {
      try {
        const existingToken = tokenStore.get();
        const existingRefresh = tokenStore.getRefresh();

        if (existingToken || existingRefresh) {
          // If token refresh is available, try refreshing token first to ensure validity
          if (existingRefresh) {
            try {
              await authApi.refreshToken(existingRefresh);
            } catch (refErr: any) {
              const isExpired = refErr?.status === 401 || refErr?.status === 400;
              if (isExpired) {
                tokenStore.clear();
                setUser(null);
                setIsAuthenticated(false);
                return;
              }
            }
          }
          await refreshUser();
        } else {
          tokenStore.clear();
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch {
        // If profile fetch fails definitively, tokenStore was cleared in refreshUser
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();

    // Listen to global logout and forbidden events dispatched by Axios client interceptors
    const handleLogoutEvent = () => logout();
    const handleForbiddenEvent = () => {
      logout();
    };

    window.addEventListener('auth:logout', handleLogoutEvent);
    window.addEventListener('auth:forbidden', handleForbiddenEvent);

    return () => {
      window.removeEventListener('auth:logout', handleLogoutEvent);
      window.removeEventListener('auth:forbidden', handleForbiddenEvent);
    };
  }, [refreshUser, logout]);

  // Periodic proactive token refresh (every 10 minutes) to prevent automatic session logout
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      const refresh = tokenStore.getRefresh();
      if (!refresh) return;

      try {
        await authApi.refreshToken(refresh);
      } catch (err) {
        console.warn('[AdminAuthContext] Proactive token refresh failed.', err);
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isInitialized,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
