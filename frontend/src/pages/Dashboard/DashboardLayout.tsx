import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import CorporateFooter from '@/components/common/CorporateFooter';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  isExternal?: boolean;
}

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const navItems: NavItem[] = [
    {
      label: 'Overview',
      path: '/dashboard',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1"></rect>
          <rect x="14" y="3" width="7" height="5" rx="1"></rect>
          <rect x="14" y="12" width="7" height="9" rx="1"></rect>
          <rect x="3" y="16" width="7" height="5" rx="1"></rect>
        </svg>
      ),
    },
    {
      label: 'Orders',
      path: '/dashboard/orders',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
      ),
    },
    {
      label: 'Save2Own',
      path: '/dashboard/save2own',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <circle cx="12" cy="12" r="6"></circle>
          <circle cx="12" cy="12" r="2"></circle>
        </svg>
      ),
    },
    {
      label: 'Profile',
      path: '/dashboard/profile',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      ),
    },
    {
      label: 'Saved Addresses',
      path: '/dashboard/addresses',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      ),
    },
    {
      label: 'Wishlist',
      path: '/dashboard/wishlist',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      ),
    },
    {
      label: 'Recently Viewed',
      path: '/dashboard/recently-viewed',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      ),
    },
    {
      label: 'My Reviews',
      path: '/dashboard/reviews',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      ),
    },
    {
      label: 'Refund Requests',
      path: '/dashboard/refunds',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      ),
    },
    {
      label: 'Notifications',
      path: '/dashboard/notifications',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      ),
    },
    {
      label: 'Account Settings',
      path: '/dashboard/settings',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      ),
    },
    {
      label: 'Security',
      path: '/dashboard/security',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      ),
    },
    {
      label: 'Support',
      path: 'https://wa.me/2347014109517',
      isExternal: true,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.811.922 3.145.922 3.18 0 5.767-2.587 5.767-5.766 0-3.181-2.587-5.764-5.763-5.764zM16.1 14.153c-.157.447-.905.867-1.285.932-.38.065-.898.114-2.868-.696-2.359-.968-3.874-3.376-3.99-3.532-.116-.156-.954-1.272-.954-2.428 0-1.156.602-1.725.815-1.947.213-.222.463-.278.618-.278.155 0 .31.002.449.009.146.007.342-.058.524.382.182.44.622 1.52.678 1.636.056.116.094.252.016.408-.078.156-.118.252-.234.389-.116.136-.245.292-.35.402-.116.116-.238.243-.105.474.133.23.593.979 1.277 1.594.88.793 1.611 1.042 1.838 1.157.227.116.36.097.494-.056.134-.153.58-675.722-.82.143-.146.338-.119.531-.016l3.35 1.593c.22.106.367.159.421.248.054.089.054.517-.103.964z" />
          <path d="M12 2C6.477 2 2 6.477 2 12c0 1.761.455 3.424 1.267 4.908L2 22l5.228-1.185A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zM12 20.301c-1.42 0-2.812-.358-4.053-1.03l-.291-.157-3.003.681.693-2.905-.175-.29A8.324 8.324 0 013.699 12C3.699 7.424 7.424 3.699 12 3.699S20.301 7.424 20.301 12 16.576 20.301 12 20.301z" />
        </svg>
      ),
    },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const currentItem = navItems.find((item) => isActive(item.path)) || navItems[0];

  const renderNavLinks = () => (
    <>
      <div style={sidebarUserHeaderStyles}>
        <div style={avatarStyles}>
          {(user?.first_name?.[0] || 'U').toUpperCase()}
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={userNameStyles}>
            {user?.first_name ? `${user.first_name} ${user?.last_name || ''}` : 'My Account'}
          </div>
          <div style={userEmailStyles}>{user?.email || 'Logged in'}</div>
        </div>
      </div>

      <div style={sidebarSectionHeaderStyles}>MY ACCOUNT MENU</div>

      <nav style={sidebarNavStyles}>
        {navItems.map((item) => {
          const active = isActive(item.path);
          if (item.isExternal) {
            return (
              <a
                key={item.path}
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  ...sidebarLinkStyles,
                  backgroundColor: 'transparent',
                  color: '#333333',
                  fontWeight: '500',
                  borderLeft: '4px solid transparent',
                }}
              >
                <span
                  style={{
                    ...sidebarIconStyles,
                    color: '#666666',
                  }}
                >
                  {item.icon}
                </span>
                <span style={{ flex: 1 }}>{item.label}</span>
                <span style={chevronStyles}>&rsaquo;</span>
              </a>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                ...sidebarLinkStyles,
                backgroundColor: active ? '#fff5eb' : 'transparent',
                color: active ? 'var(--color-primary, #ff7a00)' : '#333333',
                fontWeight: active ? '700' : '500',
                borderLeft: active ? '4px solid var(--color-primary, #ff7a00)' : '4px solid transparent',
              }}
            >
              <span
                style={{
                  ...sidebarIconStyles,
                  color: active ? 'var(--color-primary, #ff7a00)' : '#666666',
                }}
              >
                {item.icon}
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
              <span style={chevronStyles}>&rsaquo;</span>
            </Link>
          );
        })}

        <div style={{ padding: '8px 0', borderTop: '1px solid #f0f0f0', marginTop: '8px' }}>
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              handleLogout();
            }}
            style={{
              ...sidebarLinkStyles,
              backgroundColor: 'transparent',
              color: '#d63031',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              borderLeft: '4px solid transparent',
            }}
          >
            <span style={{ ...sidebarIconStyles, color: '#d63031' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </span>
            <span style={{ flex: 1 }}>Log Out</span>
            <span style={chevronStyles}>&rsaquo;</span>
          </button>
        </div>
      </nav>
    </>
  );

  return (
    <div className="container" style={layoutWrapperStyles}>
      {/* Top Left Navigation Bar (Mobile & Quick Switcher) */}
      <div className="dovi-dashboard-topbar" style={topBarStyles}>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={mobileToggleBtnStyles}
          aria-label="Toggle Dashboard Menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
          <span style={{ fontWeight: 700, fontSize: '13px' }}>Account Menu</span>
        </button>

        <div style={topBarTitleContainerStyles}>
          <span style={topBarBreadcrumbStyles}>Dashboard</span>
          <span style={{ color: '#999999', margin: '0 4px' }}>/</span>
          <span style={topBarActiveTitleStyles}>{currentItem.label}</span>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="dovi-mobile-drawer-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
          style={drawerBackdropStyles}
        >
          <div
            className="dovi-mobile-drawer-content"
            onClick={(e) => e.stopPropagation()}
            style={drawerContentStyles}
          >
            <div style={drawerHeaderStyles}>
              <span style={{ fontWeight: 700, fontSize: '15px', color: '#111827' }}>My Account</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                style={drawerCloseBtnStyles}
                aria-label="Close Menu"
              >
                &times;
              </button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '12px' }}>
              {renderNavLinks()}
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Desktop Left Sidebar + Content */}
      <div className="dovi-dashboard-grid" style={gridContainerStyles}>
        {/* Desktop Left Sidebar */}
        <aside className="dovi-desktop-sidebar" style={sidebarStyles}>
          {renderNavLinks()}
        </aside>

        {/* Dynamic Inner Page Content (Default: Overview) */}
        <main style={contentStyles}>
          <Outlet />
          <CorporateFooter />
        </main>
      </div>

      {/* Scoped CSS for responsive layout */}
      <style>{`
        .dovi-dashboard-topbar {
          display: flex;
        }
        .dovi-desktop-sidebar {
          display: none;
        }
        .dovi-dashboard-grid {
          display: block;
        }
        @media (min-width: 768px) {
          .dovi-dashboard-topbar {
            display: none;
          }
          .dovi-desktop-sidebar {
            display: block;
            min-width: 260px;
            max-width: 280px;
          }
          .dovi-dashboard-grid {
            display: grid;
            grid-template-columns: 270px 1fr;
            gap: 24px;
            align-items: start;
          }
        }
      `}</style>
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens & Jumia-Style Aesthetics
// ----------------------------------------------------------
const layoutWrapperStyles: React.CSSProperties = {
  paddingTop: 'var(--space-3)',
  paddingBottom: 'var(--space-12)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
};

const topBarStyles: React.CSSProperties = {
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#ffffff',
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid #eaeaea',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};

const mobileToggleBtnStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  backgroundColor: '#fff5eb',
  color: 'var(--color-primary, #ff7a00)',
  border: '1px solid #ffd8b2',
  padding: '7px 14px',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'all 150ms ease',
};

const topBarTitleContainerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  fontSize: '13px',
};

const topBarBreadcrumbStyles: React.CSSProperties = {
  color: '#666666',
  fontWeight: 500,
};

const topBarActiveTitleStyles: React.CSSProperties = {
  color: 'var(--color-primary, #ff7a00)',
  fontWeight: 700,
};

const gridContainerStyles: React.CSSProperties = {
  width: '100%',
};

const sidebarStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #eaeaea',
  borderRadius: '10px',
  padding: '16px 12px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
  position: 'sticky',
  top: '80px',
};

const sidebarUserHeaderStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '8px 12px 16px 12px',
  borderBottom: '1px solid #f0f0f0',
  marginBottom: '12px',
};

const avatarStyles: React.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  backgroundColor: 'var(--color-primary, #ff7a00)',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  fontSize: '16px',
  flexShrink: 0,
};

const userNameStyles: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 700,
  color: '#111827',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const userEmailStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#6b7280',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const sidebarSectionHeaderStyles: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#9ca3af',
  letterSpacing: '0.6px',
  padding: '4px 12px 8px 12px',
};

const sidebarNavStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const sidebarLinkStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '10px 12px',
  borderRadius: '6px',
  fontSize: '13.5px',
  textDecoration: 'none',
  transition: 'all 150ms ease',
};

const sidebarIconStyles: React.CSSProperties = {
  marginRight: '12px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const chevronStyles: React.CSSProperties = {
  fontSize: '16px',
  color: '#9ca3af',
  fontWeight: 600,
  marginLeft: 'auto',
};

const contentStyles: React.CSSProperties = {
  minHeight: '450px',
  width: '100%',
};

const drawerBackdropStyles: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  zIndex: 9999,
  display: 'flex',
  justifyContent: 'flex-start',
  animation: 'fadeIn 200ms ease',
};

const drawerContentStyles: React.CSSProperties = {
  width: '82%',
  maxWidth: '320px',
  height: '100%',
  backgroundColor: '#ffffff',
  boxShadow: '4px 0 16px rgba(0,0,0,0.15)',
  display: 'flex',
  flexDirection: 'column',
};

const drawerHeaderStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 20px',
  borderBottom: '1px solid #f0f0f0',
};

const drawerCloseBtnStyles: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '24px',
  fontWeight: 400,
  cursor: 'pointer',
  color: '#666666',
  padding: '0 4px',
};
