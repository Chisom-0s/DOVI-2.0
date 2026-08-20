import { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

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
        // Forbidden for non-admins
        await logout();
        throw new Error('Access denied. Admin role required.');
      }
      setUser(me);
      setIsAuthenticated(true);
    } catch (err) {
      setUser(null);
      setIsAuthenticated(false);
      tokenStore.clear();
      throw err;
    }
  }, [logout]);

  const login = async (credentials: LoginRequest) => {
    const tokens = await authApi.login(credentials);
    tokenStore.set(tokens.access);
    try {
      await refreshUser();
    } catch (err) {
      tokenStore.clear();
      throw err;
    }
  };

  // On mount: attempt to load user profile (survival on browser refresh using refresh token cookie)
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Fetch access token via Django httpOnly refresh token endpoint first
        // If the access token refresh endpoint succeeds, client tokenStore is automatically updated
        // and we fetch the user profile
        await refreshUser();
      } catch {
        // Standard non-logged-in session
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();

    // Listen to global logout and forbidden events dispatched by Axios client interceptors
    const handleLogoutEvent = () => logout();
    const handleForbiddenEvent = () => {
      // Redirect or clear
    };

    window.addEventListener('auth:logout', handleLogoutEvent);
    window.addEventListener('auth:forbidden', handleForbiddenEvent);

    return () => {
      window.removeEventListener('auth:logout', handleLogoutEvent);
      window.removeEventListener('auth:forbidden', handleForbiddenEvent);
    };
  }, [refreshUser, logout]);

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
