import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { authApi } from '@/api/auth';
import { notificationsApi } from '@/api/notifications';
import { tokenStore } from '@/api/client';
import type { LoginRequest, User } from '@/types';

// ============================================================
// Shape of AuthContext
// ============================================================
interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<User>;
  loginWithGoogle: (idToken: string, role?: 'BUYER' | 'VENDOR') => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ============================================================
// AuthProvider
// Session strategy:
//   - Access token: in memory via tokenStore (and cached in localStorage)
//   - Refresh token: localStorage + httpOnly cookie
//   - On mount: attempt token refresh to restore session after page reload
//   - Proactive refresh every 10 minutes to prevent unexpected logout
// ============================================================
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => tokenStore.getUser<User>());
  const [isLoading, setIsLoading] = useState<boolean>(() => !tokenStore.getUser());
  const isRestoringSession = useRef(false);

  // ----------------------------------------------------------
  // Restore session on mount (survives browser refresh)
  // ----------------------------------------------------------
  useEffect(() => {
    if (isRestoringSession.current) return;
    isRestoringSession.current = true;

    // Skip redundant session restoration on dedicated auth pages to avoid cold-start request bursts
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (pathname === '/login' || pathname === '/register' || pathname === '/forgot-password' || pathname === '/reset-password') {
        setIsLoading(false);
        return;
      }
    }

    const restoreSession = async () => {
      const existingToken = tokenStore.get();
      const existingRefresh = tokenStore.getRefresh();

      // If neither access nor refresh token exists, user is unauthenticated
      if (!existingToken && !existingRefresh) {
        tokenStore.clear();
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        // Attempt to refresh access token using stored refresh token
        const tokens = await authApi.refreshToken(existingRefresh || undefined);
        tokenStore.set(tokens.access);
        if (tokens.refresh) {
          tokenStore.setRefresh(tokens.refresh);
        }
        // Fetch fresh user profile
        const me = await authApi.getMe();
        tokenStore.setUser(me);
        setUser(me);
      } catch (err: any) {
        const isDefinitiveAuthFailure =
          err?.status === 401 ||
          (err?.status === 400 && String(err?.message || '').toLowerCase().includes('token'));

        if (isDefinitiveAuthFailure) {
          console.warn('[AuthContext] Session expired. Signing out.');
          tokenStore.clear();
          setUser(null);
        } else {
          console.warn('[AuthContext] Temporary network issue restoring session. Preserving existing local session.');
          const cachedUser = tokenStore.getUser<User>();
          if (cachedUser) {
            setUser(cachedUser);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  // ----------------------------------------------------------
  // Listen for auth events from the Axios interceptor
  // ----------------------------------------------------------
  useEffect(() => {
    const handleLogout = () => {
      tokenStore.clear();
      setUser(null);
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  // ----------------------------------------------------------
  // Proactive token refresh (every 10 minutes) while user is logged in
  // ----------------------------------------------------------
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      const refresh = tokenStore.getRefresh();
      if (!refresh) return;

      try {
        const tokens = await authApi.refreshToken(refresh);
        tokenStore.set(tokens.access);
        if (tokens.refresh) {
          tokenStore.setRefresh(tokens.refresh);
        }
      } catch (err) {
        console.warn('[AuthContext] Proactive token refresh failed.', err);
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  // ----------------------------------------------------------
  // login()
  // ----------------------------------------------------------
  const login = useCallback(async (credentials: LoginRequest): Promise<User> => {
    const result = await authApi.login(credentials);
    tokenStore.set(result.tokens.access);
    if (result.tokens.refresh) {
      tokenStore.setRefresh(result.tokens.refresh);
    }
    tokenStore.setUser(result.user);
    setUser(result.user);
    try {
      await notificationsApi.create(
        'Welcome Back!',
        'We are glad to see you again. Explore our latest deals today.',
        'INFO'
      );
    } catch (e) {}
    return result.user;
  }, []);

  // ----------------------------------------------------------
  // loginWithGoogle()
  // ----------------------------------------------------------
  const loginWithGoogle = useCallback(async (idToken: string, role?: 'BUYER' | 'VENDOR'): Promise<User> => {
    const result = await authApi.googleAuth({ id_token: idToken, role });
    tokenStore.set(result.tokens.access);
    if (result.tokens.refresh) {
      tokenStore.setRefresh(result.tokens.refresh);
    }
    tokenStore.setUser(result.user);
    setUser(result.user);
    try {
      await notificationsApi.create(
        'Welcome Back!',
        'We are glad to see you again. Explore our latest deals today.',
        'INFO'
      );
    } catch (e) {}
    return result.user;
  }, []);

  // ----------------------------------------------------------
  // logout()
  // ----------------------------------------------------------
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      tokenStore.clear();
      setUser(null);
    }
  }, []);

  // ----------------------------------------------------------
  // refreshUser() — re-fetch profile without full re-login
  // ----------------------------------------------------------
  const refreshUser = useCallback(async () => {
    const me = await authApi.getMe();
    setUser(me);
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    loginWithGoogle,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================
// useAuth hook
// ============================================================
export function useAuth(): AuthContextValue {
  const context = useContext<AuthContextValue | null>(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
}
