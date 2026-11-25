import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useState, useEffect } from 'react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  isViewOnly?: boolean;
}

interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'overview',
    title: 'Overview',
    items: [
      {
        label: 'Dashboard',
        path: '/',
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" rx="1.5"></rect>
            <rect x="14" y="3" width="7" height="5" rx="1.5"></rect>
            <rect x="14" y="12" width="7" height="9" rx="1.5"></rect>
            <rect x="3" y="16" width="7" height="5" rx="1.5"></rect>
          </svg>
        ),
      },
    ],
  },
  {
    id: 'store',
    title: 'Store Management',
    items: [
      {
        label: 'Products',
        path: '/products',
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
            <line x1="7" y1="7" x2="7.01" y2="7"></line>
          </svg>
        ),
      },
      {
        label: 'Categories',
        path: '/categories',
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
        ),
      },
    ],
  },
  {
    id: 'orders-payments',
    title: 'Orders & Payments',
    items: [
      {
        label: 'Orders',
        path: '/orders',
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
        ),
      },
      {
        label: 'Delivery & Rates',
        path: '/delivery',
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13"></rect>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
            <circle cx="5.5" cy="18.5" r="2.5"></circle>
            <circle cx="18.5" cy="18.5" r="2.5"></circle>
          </svg>
        ),
      },
      {
        label: 'Payments',
        path: '/payments',
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
            <line x1="1" y1="10" x2="23" y2="10"></line>
          </svg>
        ),
        isViewOnly: true,
      },
      {
        label: 'Payment Accounts',
        path: '/payment-accounts',
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18"></path>
            <path d="M3 10h18"></path>
            <path d="M5 6l7-3 7 3"></path>
            <path d="M4 10v11"></path>
            <path d="M20 10v11"></path>
            <path d="M8 14v4"></path>
            <path d="M12 14v4"></path>
            <path d="M16 14v4"></path>
          </svg>
        ),
      },
      {
        label: 'Refunds',
        path: '/refunds',
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        ),
      },
    ],
  },
  {
    id: 'save2own',
    title: 'Save2Own',
    items: [
      {
        label: 'Dashboard',
        path: '/save2own/dashboard',
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
        ),
      },
      {
        label: 'Goals',
        path: '/save2own',
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="6"></circle>
            <circle cx="12" cy="12" r="2"></circle>
          </svg>
        ),
      },
      {
        label: 'Participants',
        path: '/save2own/participants',
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        ),
      },
      {
        label: 'Refunds',
        path: '/save2own/refunds',
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        ),
      },
    ],
  },
  {
    id: 'users',
    title: 'Users',
    items: [
      {
        label: 'User Management',
        path: '/users',
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        ),
      },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    items: [
      {
        label: 'Email Deliveries',
        path: '/emails',
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
        ),
      },
      {
        label: 'Audit Logs',
        path: '/audit-logs',
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
        ),
        isViewOnly: true,
      },
    ],
  },
];

export default function AdminLayout() {
  const location = useLocation();
  const { user, logout } = useAdminAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Collapsed groups stored in localStorage
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('dovi_admin_nav_collapsed_groups');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      try {
        localStorage.setItem('dovi_admin_nav_collapsed_groups', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Close mobile drawer on route transition
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isItemActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    if (path === '/save2own') {
      return (
        location.pathname === '/save2own' ||
        (location.pathname.startsWith('/save2own/') &&
          !location.pathname.startsWith('/save2own/dashboard') &&
          !location.pathname.startsWith('/save2own/participants') &&
          !location.pathname.startsWith('/save2own/refunds'))
      );
    }
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
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
            aria-label="Toggle navigation menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={logoTextStyles}>DOVI</span>
            <span style={badgeStyles}>ADMIN HUB</span>
          </div>
        </div>

        <div style={userInfoStyles}>
          <div style={userBadgeWrapperStyles}>
            <div style={userAvatarStyles}>
              {(user?.first_name?.[0] || user?.email?.[0] || 'A').toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={userNameStyles}>
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Administrator'}
              </span>
              <span style={userEmailStyles}>{user?.email}</span>
            </div>
          </div>
          <button type="button" onClick={() => logout()} style={logoutBtnStyles}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={mobileBackdropStyles}
        />
      )}

      <div style={bodyWrapperStyles}>
        {/* Sidebar Nav */}
        <aside
          style={{
            ...sidebarStyles,
            transform: mobileMenuOpen ? 'translateX(0)' : undefined,
          }}
          className={mobileMenuOpen ? 'mobile-nav-open' : 'sidebar-aside'}
        >
          <div style={navScrollWrapperStyles}>
            {NAV_GROUPS.map((group) => {
              const isCollapsed = Boolean(collapsedGroups[group.id]);
              const groupHasActiveItem = group.items.some((it) => isItemActive(it.path));

              return (
                <div key={group.id} style={navGroupContainerStyles}>
                  {/* Group Header Button */}
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    style={navGroupHeaderStyles}
                    aria-expanded={!isCollapsed}
                  >
                    <span
                      style={{
                        ...navGroupTitleStyles,
                        color: groupHasActiveItem ? '#ff7a00' : '#6b7280',
                      }}
                    >
                      {group.title}
                    </span>
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                        transition: 'transform 180ms ease',
                        color: '#9ca3af',
                      }}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>

                  {/* Group Items */}
                  {!isCollapsed && (
                    <div style={navGroupItemsStyles}>
                      {group.items.map((item) => {
                        const active = isItemActive(item.path);
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setMobileMenuOpen(false)}
                            style={{
                              ...navLinkStyles,
                              backgroundColor: active ? 'rgba(255, 122, 0, 0.08)' : 'transparent',
                              color: active ? '#ff7a00' : '#374151',
                              fontWeight: active ? 700 : 500,
                              borderLeft: active ? '3px solid #ff7a00' : '3px solid transparent',
                            }}
                          >
                            <span
                              style={{
                                ...navIconStyles,
                                color: active ? '#ff7a00' : '#6b7280',
                              }}
                            >
                              {item.icon}
                            </span>
                            <span style={{ flex: 1 }}>{item.label}</span>
                            {item.isViewOnly && (
                              <span style={viewOnlyBadgeStyles}>Read</span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Footer info in Sidebar */}
          <div style={sidebarFooterStyles}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={statusDotStyles} />
              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>System Live</span>
            </div>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>v2.4.0</span>
          </div>
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
  backgroundColor: '#f8fafc',
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
};

const headerStyles: React.CSSProperties = {
  height: '60px',
  backgroundColor: '#ffffff',
  borderBottom: '1px solid #e2e8f0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 24px',
  position: 'sticky',
  top: 0,
  zIndex: 100,
  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
};

const logoWrapperStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const logoTextStyles: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 900,
  color: '#ff7a00',
  letterSpacing: '-0.5px',
};

const badgeStyles: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 800,
  backgroundColor: '#fef3c7',
  color: '#b45309',
  padding: '2px 8px',
  borderRadius: '4px',
  letterSpacing: '0.5px',
};

const hamburgerStyles: React.CSSProperties = {
  fontSize: '18px',
  color: '#475569',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  padding: '4px',
  borderRadius: '6px',
};

const userInfoStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
};

const userBadgeWrapperStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const userAvatarStyles: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  backgroundColor: '#ff7a00',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '13px',
  fontWeight: 700,
};

const userNameStyles: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
  color: '#1e293b',
  lineHeight: 1.2,
};

const userEmailStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#64748b',
  lineHeight: 1.2,
};

const logoutBtnStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#ef4444',
  border: '1px solid #fee2e2',
  padding: '5px 12px',
  borderRadius: '6px',
  backgroundColor: '#fff5f5',
  cursor: 'pointer',
  transition: 'all 150ms ease',
};

const bodyWrapperStyles: React.CSSProperties = {
  display: 'flex',
  flex: 1,
  position: 'relative',
};

const sidebarStyles: React.CSSProperties = {
  width: '240px',
  backgroundColor: '#ffffff',
  borderRight: '1px solid #e2e8f0',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  height: 'calc(100vh - 60px)',
  position: 'sticky',
  top: '60px',
  flexShrink: 0,
};

const navScrollWrapperStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  padding: '16px 0',
  overflowY: 'auto',
  gap: '8px',
};

const navGroupContainerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  paddingBottom: '4px',
};

const navGroupHeaderStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '6px 16px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
};

const navGroupTitleStyles: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 800,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  userSelect: 'none',
};

const navGroupItemsStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  padding: '2px 0',
};

const navLinkStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '8px 16px 8px 14px',
  fontSize: '13px',
  textDecoration: 'none',
  transition: 'background-color 140ms ease, color 140ms ease',
};

const navIconStyles: React.CSSProperties = {
  marginRight: '10px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '18px',
};

const viewOnlyBadgeStyles: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 700,
  backgroundColor: '#f1f5f9',
  color: '#64748b',
  padding: '2px 5px',
  borderRadius: '3px',
  textTransform: 'uppercase',
};

const sidebarFooterStyles: React.CSSProperties = {
  padding: '14px 16px',
  borderTop: '1px solid #f1f5f9',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#fafafa',
};

const statusDotStyles: React.CSSProperties = {
  width: '7px',
  height: '7px',
  borderRadius: '50%',
  backgroundColor: '#10b981',
  boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)',
};

const mobileBackdropStyles: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.4)',
  zIndex: 90,
};

const mainContentStyles: React.CSSProperties = {
  flex: 1,
  padding: '24px 32px',
  overflowY: 'auto',
  maxWidth: '1360px',
  margin: '0 auto',
  width: '100%',
};

const contentCardWrapperStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};
