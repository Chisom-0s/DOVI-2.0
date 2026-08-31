import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { authApi } from '@/api/auth';
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
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ============================================================
// AuthProvider
// Session strategy:
//   - Access token: in memory via tokenStore (not localStorage)
//   - Refresh token: httpOnly cookie (set by Django, not readable from JS)
//   - On mount: attempt token refresh to restore session after page reload
// ============================================================
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // starts true — restoring session
  const isRestoringSession = useRef(false);

  // ----------------------------------------------------------
  // Restore session on mount (survives browser refresh)
  // ----------------------------------------------------------
  useEffect(() => {
    if (isRestoringSession.current) return;
    isRestoringSession.current = true;

    const restoreSession = async () => {
      try {
        // Attempt refresh — Django will use the httpOnly refresh cookie
        const tokens = await authApi.refreshToken();
        tokenStore.set(tokens.access);
        // Fetch user profile with the new access token
        const me = await authApi.getMe();
        setUser(me);
      } catch {
        // No valid session — user must log in
        tokenStore.clear();
        setUser(null);
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
  // login()
  // ----------------------------------------------------------
  const login = useCallback(async (credentials: LoginRequest): Promise<User> => {
    const result = await authApi.login(credentials);
    tokenStore.set(result.tokens.access);
    setUser(result.user);
    return result.user;
    // Note: Django sets the refresh token as an httpOnly cookie
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
