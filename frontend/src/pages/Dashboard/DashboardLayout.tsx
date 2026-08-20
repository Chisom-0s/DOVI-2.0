import { Link, Outlet, useLocation } from 'react-router-dom';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

export default function DashboardLayout() {
  const location = useLocation();

  const navItems: NavItem[] = [
    { label: 'Overview', path: '/dashboard', icon: '📊' },
    { label: 'Orders', path: '/dashboard/orders', icon: '📦' },
    { label: 'Save2Own', path: '/dashboard/save2own', icon: '🎯' },
    { label: 'Profile', path: '/dashboard/profile', icon: '👤' },
    { label: 'Saved Addresses', path: '/dashboard/addresses', icon: '📍' },
    { label: 'Wishlist', path: '/dashboard/wishlist', icon: '❤️' },
    { label: 'Recently Viewed', path: '/dashboard/recently-viewed', icon: '👁️' },
    { label: 'My Reviews', path: '/dashboard/reviews', icon: '⭐' },
    { label: 'Refund Requests', path: '/dashboard/refunds', icon: '💵' },
    { label: 'My Rentals', path: '/dashboard/rentals', icon: '🔑' },
    { label: 'Notifications', path: '/dashboard/notifications', icon: '🔔' },
    { label: 'Saved Payments', path: '/dashboard/payment-methods', icon: '💳' },
    { label: 'Account Settings', path: '/dashboard/settings', icon: '⚙️' },
    { label: 'Security', path: '/dashboard/security', icon: '🔒' },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="container" style={layoutWrapperStyles}>
      {/* Mobile Horizontal Sub-Navigation Scroll Bar */}
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

      <div style={gridContainerStyles} className="dashboard-grid-container">
        {/* Desktop Sidebar Navigation */}
        <aside style={sidebarStyles} className="hide-mobile">
          <div style={sidebarTitleStyles}>Buyer Account</div>
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
                }}
              >
                <span style={sidebarIconStyles}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Dynamic Inner Page Content */}
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
  transition: 'all var(--transition-fast)',
  display: 'inline-flex',
  alignItems: 'center',
};

const gridContainerStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: 'var(--space-6)',
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
