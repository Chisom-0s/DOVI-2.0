import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// ============================================================
// RoleGuard
// Verifies user role comes from GET /api/v1/users/me/ (via AuthContext).
// Role is NEVER read from localStorage or frontend state.
// ============================================================
interface RoleGuardProps {
  role: UserRole;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ role, children, fallback }: RoleGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== role) {
    // Role mismatch — show fallback or access denied page
    if (fallback) return <>{fallback}</>;
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return <>{children}</>;
}
