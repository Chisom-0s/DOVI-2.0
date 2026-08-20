import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized, user, logout } = useAdminAuth();
  const location = useLocation();

  if (!isInitialized) {
    return (
      <div style={spinnerWrapperStyles}>
        <div style={spinnerStyles} />
        <span style={spinnerLabelStyles}>Initializing Admin Portal...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div style={forbiddenWrapperStyles}>
        <div style={forbiddenCardStyles}>
          <span style={forbiddenIconStyles}>🚫</span>
          <h2 style={forbiddenTitleStyles}>Access Denied</h2>
          <p style={forbiddenTextStyles}>
            Your account ({user?.email}) does not have administrative privileges.
          </p>
          <button type="button" onClick={() => logout()} style={forbiddenBtnStyles}>
            Log Out &amp; Switch Account
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const spinnerWrapperStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  backgroundColor: '#f9fafb',
  gap: '12px',
};

const spinnerStyles: React.CSSProperties = {
  width: '40px',
  height: '40px',
  border: '3px solid rgba(0,0,0,0.05)',
  borderTop: '3px solid #ff7a00',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

// Insert keyframes dynamically or use global css
const spinnerLabelStyles: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#4b5563',
};

const forbiddenWrapperStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  backgroundColor: '#f3f4f6',
  padding: '16px',
};

const forbiddenCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '32px',
  textAlign: 'center',
  maxWidth: '400px',
  width: '100%',
  boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '16px',
  border: '1px solid #e5e7eb',
};

const forbiddenIconStyles: React.CSSProperties = {
  fontSize: '48px',
};

const forbiddenTitleStyles: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 700,
  color: '#1f2937',
  margin: 0,
};

const forbiddenTextStyles: React.CSSProperties = {
  fontSize: '14px',
  color: '#6b7280',
  lineHeight: 1.5,
  margin: 0,
};

const forbiddenBtnStyles: React.CSSProperties = {
  backgroundColor: '#ef4444',
  color: '#ffffff',
  padding: '10px 20px',
  borderRadius: '9999px',
  fontWeight: 700,
  fontSize: '13px',
  cursor: 'pointer',
  transition: 'background-color 150ms ease',
  border: 'none',
};
