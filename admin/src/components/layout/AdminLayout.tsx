import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useState } from 'react';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  isViewOnly?: boolean;
}

export default function AdminLayout() {
  const location = useLocation();
  const { user, logout } = useAdminAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    { label: 'Overview', path: '/', icon: '📊' },
    { label: 'Homepage CMS', path: '/homepage', icon: '🏠' },
    { label: 'Save2Own Goals', path: '/save2own', icon: '🎯' },
    { label: 'Users', path: '/users', icon: '👤' },
    { label: 'Vendors', path: '/vendors', icon: '🏢' },
    { label: 'Products', path: '/products', icon: '📦' },
    { label: 'Auto Listings', path: '/auto', icon: '🚗' },
    { label: 'Categories', path: '/categories', icon: '📁' },
    { label: 'Orders', path: '/orders', icon: '🛒' },
    { label: 'Payments', path: '/payments', icon: '💳', isViewOnly: true },
    { label: 'Refunds', path: '/refunds', icon: '💵' },
    { label: 'Reviews', path: '/reviews', icon: '⭐' },
    { label: 'Audit Logs', path: '/audit-logs', icon: '📜', isViewOnly: true },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div style={layoutContainerStyles}>
      {/* Top Header */}
      <header style={headerStyles}>
        <div style={logoWrapperStyles}>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={hamburgerStyles}
          >
            ☰
          </button>
          <span style={logoTextStyles}>DOVI Admin</span>
          <span style={badgeStyles}>Portal</span>
        </div>
        <div style={userInfoStyles}>
          <span style={userEmailStyles}>{user?.email}</span>
          <button type="button" onClick={() => logout()} style={logoutBtnStyles}>
            Logout
          </button>
        </div>
      </header>

      <div style={bodyWrapperStyles}>
        {/* Sidebar Nav */}
        <aside
          style={{
            ...sidebarStyles,
            display: mobileMenuOpen ? 'flex' : undefined,
          }}
          className={mobileMenuOpen ? 'mobile-nav-open' : 'sidebar-aside'}
        >
          <nav style={navWrapperStyles}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  ...navLinkStyles,
                  backgroundColor: isActive(item.path) ? 'rgba(255, 122, 0, 0.08)' : 'transparent',
                  color: isActive(item.path) ? 'var(--color-primary)' : 'var(--color-text)',
                  borderLeft: isActive(item.path) ? '4px solid var(--color-primary)' : '4px solid transparent',
                  paddingLeft: isActive(item.path) ? '12px' : '16px',
                }}
              >
                <span style={navIconStyles}>{item.icon}</span>
                <span style={{ flex: 1, fontWeight: isActive(item.path) ? 700 : 500 }}>
                  {item.label}
                </span>
                {item.isViewOnly && (
                  <span style={viewOnlyBadgeStyles}>Read</span>
                )}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main style={mainContentStyles}>
          <div style={contentCardWrapperStyles}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const layoutContainerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  backgroundColor: '#f3f4f6',
};

const headerStyles: React.CSSProperties = {
  height: '64px',
  backgroundColor: '#ffffff',
  borderBottom: '1px solid #e5e7eb',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 24px',
  position: 'sticky',
  top: 0,
  zIndex: 100,
};

const logoWrapperStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const logoTextStyles: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 800,
  color: '#1f2937',
  letterSpacing: '-0.5px',
};

const badgeStyles: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  backgroundColor: 'rgba(255,122,0,0.12)',
  color: '#ff7a00',
  padding: '2px 8px',
  borderRadius: '4px',
  textTransform: 'uppercase',
};

const hamburgerStyles: React.CSSProperties = {
  fontSize: '20px',
  color: '#4b5563',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  display: 'none', // Overridden in global media queries
};

const userInfoStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
};

const userEmailStyles: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#4b5563',
};

const logoutBtnStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#ef4444',
  border: '1px solid rgba(239, 68, 68, 0.2)',
  padding: '6px 14px',
  borderRadius: '9999px',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  transition: 'all 150ms ease',
};

const bodyWrapperStyles: React.CSSProperties = {
  display: 'flex',
  flex: 1,
};

const sidebarStyles: React.CSSProperties = {
  width: '260px',
  backgroundColor: '#ffffff',
  borderRight: '1px solid #e5e7eb',
  padding: '24px 0',
  flexDirection: 'column',
  gap: '8px',
};

const navWrapperStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const navLinkStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '12px 16px',
  fontSize: '14px',
  textDecoration: 'none',
  transition: 'all 150ms ease',
};

const navIconStyles: React.CSSProperties = {
  marginRight: '12px',
  fontSize: '16px',
  display: 'inline-flex',
  alignItems: 'center',
};

const viewOnlyBadgeStyles: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 700,
  backgroundColor: '#f3f4f6',
  color: '#9ca3af',
  padding: '2px 6px',
  borderRadius: '4px',
  textTransform: 'uppercase',
};

const mainContentStyles: React.CSSProperties = {
  flex: 1,
  padding: '32px',
  overflowY: 'auto',
  maxWidth: '1280px',
  margin: '0 auto',
  width: '100%',
};

const contentCardWrapperStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};
