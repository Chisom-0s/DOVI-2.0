import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import SearchBar from '@/components/home/SearchBar';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <header className="site-header" style={headerStyles}>
      <div className="container site-header__container" style={containerStyles}>
        {/* Brand Logo */}
        <Link to="/" style={logoStyles}>
          <span style={logoTextStyles}>DOVI</span>
        </Link>

        {/* Search Bar */}
        <div style={searchContainerStyles}>
          <SearchBar />
        </div>

        {/* Navigation Action Links */}
        <nav style={navStyles}>
          <Link to="/products" style={navLinkStyles}>Marketplace</Link>
          <Link to="/auto" style={navLinkStyles}>Dovi Auto</Link>
          <Link to="/save2own" style={navLinkStyles}>Save2Own</Link>

          {/* Cart Status Indicator */}
          <Link to="/cart" style={cartButtonStyles}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span style={cartLabelStyles}>Cart</span>
          </Link>

          {/* User Account State */}
          {isAuthenticated ? (
            <div style={userMenuStyles}>
              <Link to="/dashboard" style={avatarLinkStyles}>
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Profile" style={avatarStyles} />
                ) : (
                  <div style={avatarFallbackStyles}>
                    {user?.first_name?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                )}
                <span style={userNameStyles}>{user?.first_name}</span>
              </Link>
              <button onClick={handleLogout} style={logoutBtnStyles}>Logout</button>
            </div>
          ) : (
            <div style={authButtonsStyles}>
              <Link to="/login" style={loginBtnStyles}>Sign In</Link>
              <Link to="/register" style={registerBtnStyles}>Register</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

// ----------------------------------------------------------
// Functional Styling Tokens for Header
// ----------------------------------------------------------
const headerStyles: React.CSSProperties = {
  backgroundColor: 'var(--color-bg)',
  borderBottom: '1px solid var(--color-border)',
  position: 'sticky',
  top: 0,
  zIndex: 100,
};

const containerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--space-4)',
  paddingTop: 'var(--space-3)',
  paddingBottom: 'var(--space-3)',
};

const logoStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  fontWeight: 'var(--font-bold)',
  fontSize: 'var(--text-xl)',
  color: 'var(--color-primary)',
};

const logoTextStyles: React.CSSProperties = {
  letterSpacing: '1px',
};

const searchContainerStyles: React.CSSProperties = {
  flex: 1,
  maxWidth: '500px',
};

const navStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-6)',
};

const navLinkStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-medium)',
  color: 'var(--color-text)',
  transition: 'color var(--transition-fast)',
};

const cartButtonStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-1)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-medium)',
  color: 'var(--color-text)',
};

const cartLabelStyles: React.CSSProperties = {
  display: 'inline',
};

const userMenuStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-4)',
};

const avatarLinkStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  color: 'var(--color-text)',
};

const avatarStyles: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  objectFit: 'cover',
};

const avatarFallbackStyles: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  backgroundColor: 'var(--color-primary)',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-semibold)',
};

const userNameStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-semibold)',
};

const logoutBtnStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-danger)',
  fontWeight: 'var(--font-medium)',
};

const authButtonsStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
};

const loginBtnStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-muted)',
  fontWeight: 'var(--font-medium)',
};

const registerBtnStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  backgroundColor: 'var(--color-primary)',
  color: 'white',
  padding: 'var(--space-2) var(--space-4)',
  borderRadius: 'var(--radius-md)',
  fontWeight: 'var(--font-medium)',
};
