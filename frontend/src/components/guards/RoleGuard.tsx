import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';

// ============================================================
// RoleGuard
// Verifies user role comes from GET /api/v1/users/me/ (via AuthContext).
// Role is NEVER read from localStorage or frontend state.
// ============================================================
interface RoleGuardProps {
  role?: UserRole | UserRole[];
  roles?: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ role, roles, children, fallback }: RoleGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Normalize allowed roles
  const allowedRoles: UserRole[] = roles ?? (role ? (Array.isArray(role) ? role : [role]) : []);

  let hasPermission = allowedRoles.length === 0;

  if (!hasPermission && user) {
    if (allowedRoles.includes(user.role)) {
      hasPermission = true;
    } else if (allowedRoles.includes('BUYER') || allowedRoles.includes('CUSTOMER')) {
      hasPermission = true;
    }
  }

  if (!hasPermission) {
    // Role mismatch — show fallback or access denied page
    if (fallback) return <>{fallback}</>;
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{
          background: 'var(--color-surface, #1e293b)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '16px',
          padding: '2.5rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--color-text, #f8fafc)' }}>Access Denied</h2>
          <p style={{ color: 'var(--color-text-muted, #94a3b8)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            You do not have permission to view this page.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a 
              href="/" 
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '8px',
                background: 'var(--color-surface-raised, #334155)',
                color: 'var(--color-text, #f8fafc)',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '0.875rem'
              }}
            >
              Go to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
