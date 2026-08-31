import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import VendorStoreSetup from './VendorStoreSetup';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

export default function VendorDashboardLayout() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  // 1. If user has not created a vendor store profile yet
  if (!user || !user.profile || user.profile.vendor_status === 'N/A') {
    return <VendorStoreSetup />;
  }

  // 2. If store registration is pending review
  if (user.profile.vendor_status === 'PENDING') {
    return (
      <div style={guardContainerStyles}>
        <div style={guardCardStyles}>
          <div style={guardContentStyles}>
            <span style={pillStyles}>MERCHANT Hub</span>
            <h1 style={titleStyles}>Validation Review Pending</h1>
            <p style={subtitleStyles}>
              Our compliance team is verifying your merchant store registration profile details.
              Verification is required before you can list products and process orders.
            </p>
            
            <button onClick={() => window.location.reload()} style={reloadBtnStyles}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }}>
                <path d="M23 4v6h-6"></path>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
              <span>Recheck Verification Status</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Store is approved — show dashboard
  const navItems: NavItem[] = [
    {
      label: 'Overview',
      path: '/vendor/dashboard',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
      ),
    },
    {
      label: 'Products',
      path: '/vendor/dashboard/products',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
          <line x1="7" y1="7" x2="7.01" y2="7"></line>
        </svg>
      ),
    },
    {
      label: 'Orders',
      path: '/vendor/dashboard/orders',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
      ),
    },
  ];

  const isActive = (path: string) => {
    if (path === '/vendor/dashboard') {
      return location.pathname === '/vendor/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="container" style={layoutWrapperStyles}>
      {/* Mobile Horizontal Navigation */}
      <div style={mobileNavStyles} className="no-scrollbar hide-desktop">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              ...mobileNavItemStyles,
              backgroundColor: isActive(item.path) ? 'var(--color-primary)' : 'var(--color-bg-subtle)',
              color: isActive(item.path) ? '#ffffff' : 'var(--color-text)',
              borderColor: isActive(item.path) ? 'var(--color-primary)' : 'var(--color-border)',
            }}
          >
            <span style={{ marginRight: '4px' }}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>

      <div style={gridContainerStyles}>
        {/* Desktop Sidebar Navigation */}
        <aside style={sidebarStyles} className="hide-mobile">
          <div style={{ padding: '0 4px 12px 4px', borderBottom: '1px solid var(--color-border)' }}>
            <span style={pillStyles}>🏪 Merchant Hub</span>
            <div style={{ fontWeight: '700', fontSize: 'var(--text-md, 16px)', color: 'var(--color-text)' }}>
              {user?.vendor_store?.name || 'My Store'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              {user?.email}
            </div>
          </div>

          <div style={sidebarTitleStyles}>Store Management</div>
          <nav style={sidebarNavStyles}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  ...sidebarLinkStyles,
                  backgroundColor: isActive(item.path) ? 'rgba(255, 122, 0, 0.08)' : 'transparent',
                  color: isActive(item.path) ? 'var(--color-primary)' : 'var(--color-text)',
                  fontWeight: isActive(item.path) ? 'var(--font-bold)' : 'var(--font-medium)',
                  borderLeft: isActive(item.path) ? '3px solid var(--color-primary)' : '3px solid transparent',
                }}
              >
                <span style={sidebarIconStyles}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
            <Link
              to="/dashboard"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-bg-subtle)',
                color: 'var(--color-text)',
                fontSize: 'var(--text-xs, 12px)',
                fontWeight: '600',
                textDecoration: 'none',
                border: '1px solid var(--color-border)',
              }}
            >
              <span>🛒</span>
              <span>Switch to Buyer Mode</span>
            </Link>
          </div>
        </aside>

        {/* Dynamic Sub-Route Page Content */}
        <main style={contentStyles}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const guardContainerStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '60vh',
  padding: '2rem 1rem',
  backgroundColor: 'var(--color-bg-subtle)',
};

const guardCardStyles: React.CSSProperties = {
  width: '100%',
  maxWidth: '540px',
  background: '#ffffff',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
  padding: '2.5rem 2rem',
};

const guardContentStyles: React.CSSProperties = {
  textAlign: 'center',
};

const pillStyles: React.CSSProperties = {
  background: 'rgba(255, 122, 0, 0.08)',
  color: 'var(--color-primary)',
  fontSize: '0.75rem',
  fontWeight: '700',
  padding: '4px 10px',
  borderRadius: 'var(--radius-full)',
  display: 'inline-block',
  marginBottom: '1rem',
};

const titleStyles: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: '700',
  color: 'var(--color-text)',
  marginBottom: '0.75rem',
};

const subtitleStyles: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--color-text-muted)',
  lineHeight: '1.5',
  marginBottom: '2rem',
};

const reloadBtnStyles: React.CSSProperties = {
  background: 'var(--color-primary)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  padding: '12px 24px',
  fontWeight: '700',
  fontSize: '0.9rem',
  cursor: 'pointer',
};

const layoutWrapperStyles: React.CSSProperties = {
  paddingTop: 'var(--space-4)',
  paddingBottom: 'var(--space-12)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
};

const mobileNavStyles: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-2)',
  overflowX: 'auto',
  whiteSpace: 'nowrap',
  paddingBottom: 'var(--space-2)',
  borderBottom: '1px solid var(--color-border)',
};

const mobileNavItemStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-semibold)',
  padding: '6px 14px',
  borderRadius: 'var(--radius-full)',
  textDecoration: 'none',
  border: '1px solid var(--color-border)',
  display: 'inline-flex',
  alignItems: 'center',
};

const gridContainerStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '200px 1fr',
  gap: 'var(--space-6)',
  marginTop: '1rem',
};

const sidebarStyles: React.CSSProperties = {
  borderRight: '1px solid var(--color-border)',
  paddingRight: 'var(--space-6)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
};

const sidebarTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-bold)',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  letterSpacing: '0.5px',
  paddingLeft: 'var(--space-3)',
};

const sidebarNavStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const sidebarLinkStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '10px var(--space-4)',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-sm)',
  textDecoration: 'none',
  transition: 'all var(--transition-fast)',
};

const sidebarIconStyles: React.CSSProperties = {
  marginRight: 'var(--space-3)',
  fontSize: '16px',
};

const contentStyles: React.CSSProperties = {
  minHeight: '400px',
  width: '100%',
};
export { guardContainerStyles, guardCardStyles, guardContentStyles, pillStyles, titleStyles, subtitleStyles, reloadBtnStyles, layoutWrapperStyles, mobileNavStyles, mobileNavItemStyles, gridContainerStyles, sidebarStyles, sidebarTitleStyles, sidebarNavStyles, sidebarLinkStyles, sidebarIconStyles, contentStyles };
