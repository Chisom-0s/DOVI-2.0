import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useState } from 'react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  isViewOnly?: boolean;
}

export default function AdminLayout() {
  const location = useLocation();
  const { user, logout } = useAdminAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      label: 'Overview',
      path: '/',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
      ),
    },
    {
      label: 'Homepage CMS',
      path: '/homepage',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      ),
    },
    {
      label: 'Save2Own Goals',
      path: '/save2own',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <circle cx="12" cy="12" r="6"></circle>
          <circle cx="12" cy="12" r="2"></circle>
        </svg>
      ),
    },
    {
      label: 'Users',
      path: '/users',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      ),
    },
    {
      label: 'Vendors',
      path: '/vendors',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
        </svg>
      ),
    },
    {
      label: 'Products',
      path: '/products',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
          <line x1="7" y1="7" x2="7.01" y2="7"></line>
        </svg>
      ),
    },
    {
      label: 'Auto Listings',
      path: '/auto',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path>
          <circle cx="7" cy="17" r="2"></circle>
          <path d="M9 17h6"></path>
          <circle cx="17" cy="17" r="2"></circle>
        </svg>
      ),
    },
    {
      label: 'Categories',
      path: '/categories',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
      ),
    },
    {
      label: 'Orders',
      path: '/orders',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
      ),
    },
    {
      label: 'Payments',
      path: '/payments',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
          <line x1="1" y1="10" x2="23" y2="10"></line>
        </svg>
      ),
      isViewOnly: true,
    },
    {
      label: 'Escrow Payouts',
      path: '/escrow-payouts',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      ),
    },
    {
      label: 'Refunds',
      path: '/refunds',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      ),
    },
    {
      label: 'Reviews',
      path: '/reviews',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      ),
    },
    {
      label: 'Audit Logs',
      path: '/audit-logs',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
      ),
      isViewOnly: true,
    },
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
