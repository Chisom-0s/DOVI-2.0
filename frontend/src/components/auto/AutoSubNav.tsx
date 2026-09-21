import { Link, useLocation } from 'react-router-dom';

export default function AutoSubNav() {
  const location = useLocation();

  const navItems = [
    { label: 'Overview', path: '/auto' },
    { label: 'Cars & Vehicles', path: '/auto/cars' },
    { label: 'Car Parts', path: '/auto/parts' },
    { label: 'Accessories', path: '/auto/accessories' },
    { label: 'Vehicle Rentals', path: '/auto/rentals' },
  ];

  const isActive = (path: string) => {
    if (path === '/auto') {
      return location.pathname === '/auto';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div style={navContainerStyles} className="auto-subnav">
      <div style={navInnerStyles} className="auto-subnav__inner">
        {/* Dovi Auto Section Logo Badge */}
        <Link to="/auto" style={brandBadgeStyles} className="auto-subnav__badge">
          <span style={brandIconStyles}>🚗</span>
          <span style={brandTitleStyles}>DOVI AUTO</span>
        </Link>

        {/* Sub-Nav Links */}
        <nav style={tabsNavStyles} className="auto-subnav__tabs no-scrollbar">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  ...tabLinkStyles,
                  color: active ? 'var(--color-primary, #ff7a00)' : '#9ca3af',
                  borderBottom: active ? '3px solid var(--color-primary, #ff7a00)' : '3px solid transparent',
                  fontWeight: active ? 700 : 500,
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const navContainerStyles: React.CSSProperties = {
  backgroundColor: '#111827',
  borderBottom: '1px solid #1f2937',
  padding: '0 var(--space-4, 16px)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  position: 'relative',
  zIndex: 40,
};

const navInnerStyles: React.CSSProperties = {
  maxWidth: '1280px',
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  minHeight: '52px',
  gap: '16px',
};

const brandBadgeStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  textDecoration: 'none',
};

const brandIconStyles: React.CSSProperties = {
  fontSize: '20px',
};

const brandTitleStyles: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 900,
  letterSpacing: '1px',
  color: '#ffffff',
  background: 'linear-gradient(90deg, #ff7a00 0%, #ff9500 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
};

const tabsNavStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  overflowX: 'auto',
  height: '100%',
};

const tabLinkStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: '100%',
  padding: '0 16px',
  fontSize: '13px',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  transition: 'all 150ms ease',
};
