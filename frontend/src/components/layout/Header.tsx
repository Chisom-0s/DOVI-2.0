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
      <div className="container site-header__container">
        {/* Brand Logo (Row 1, Col 1 on mobile) */}
        <Link to="/" style={logoStyles} className="site-header__logo">
          <img src="/logo.jpg?v=2" alt="Dovi" style={logoImageStyles} />
        </Link>

        {/* Header Actions (Desktop only, hidden on mobile) */}
        <div style={actionsContainerStyles} className="site-header__actions hide-mobile">
          {/* Desktop Navigation Links */}
          <nav style={navLinksStyles} className="hide-mobile">
            <Link to="/products" style={navLinkStyles}>Marketplace</Link>
            <Link to="/auto" style={navLinkStyles}>Dovi Auto</Link>
            <Link to="/save2own" style={navLinkStyles}>Save2Own</Link>
          </nav>

          {/* Cart Status Indicator (visible everywhere) */}
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
            <span style={cartLabelStyles} className="hide-mobile">Cart</span>
          </Link>

          {/* User Account State (visible everywhere) */}
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
                <span style={userNameStyles} className="hide-mobile">{user?.first_name}</span>
              </Link>
              <button onClick={handleLogout} style={logoutBtnStyles} className="hide-mobile">Logout</button>
            </div>
          ) : (
            <div style={authButtonsStyles}>
              <Link to="/login" style={loginBtnStyles}>Sign In</Link>
              <Link to="/register" style={registerBtnStyles} className="hide-mobile">Register</Link>
            </div>
          )}
        </div>

        {/* Search Bar & Categories (Row 2 on mobile) */}
        <div style={searchContainerStyles} className="site-header__search-container">
          <SearchBar />
          <div style={categoryLinksStyles} className="no-scrollbar">
            {/* Nav links for mobile & desktop views */}
            <Link to="/products" className="header-category-link page-link">🛍️ Marketplace</Link>
            <Link to="/auto" className="header-category-link page-link">🚗 Dovi Auto</Link>
            <Link to="/save2own" className="header-category-link page-link">🎯 Save2Own</Link>
            
            {/* Extensive categories in premium orange block capsules */}
            <Link to="/categories/electronics" className="header-category-link">💻 Electronics</Link>
            <Link to="/categories/gadgets" className="header-category-link">🔌 Gadgets</Link>
            <Link to="/categories/phones-tablets" className="header-category-link">📱 Phones & Tablets</Link>
            <Link to="/categories/computers" className="header-category-link">🖥️ Computers</Link>
            <Link to="/categories/audio-video" className="header-category-link">🎧 Audio & Video</Link>
            <Link to="/categories/gaming" className="header-category-link">🎮 Gaming</Link>
            <Link to="/categories/smart-home" className="header-category-link">🏠 Smart Home</Link>
            <Link to="/categories/fashion" className="header-category-link">👗 Fashion & Apparel</Link>
            <Link to="/categories/shoes" className="header-category-link">👟 Shoes</Link>
            <Link to="/categories/books" className="header-category-link">📚 Books & Media</Link>
            <Link to="/categories/home-kitchen" className="header-category-link">🍳 Home & Kitchen</Link>
            <Link to="/categories/beauty-health" className="header-category-link">💄 Beauty & Health</Link>
            <Link to="/categories/sports-outdoors" className="header-category-link">⚽ Sports & Outdoors</Link>
            <Link to="/categories/automotive" className="header-category-link">🚗 Automotive</Link>
            <Link to="/categories/groceries" className="header-category-link">🍎 Groceries</Link>
            <Link to="/categories/toys-games" className="header-category-link">🧸 Toys & Games</Link>
          </div>
        </div>
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

const logoStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  fontWeight: 'var(--font-bold)',
  fontSize: 'var(--text-xl)',
  color: 'var(--color-primary)',
};

const searchContainerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const actionsContainerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-4)',
};

const navLinksStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-4)',
  marginRight: 'var(--space-2)',
};

const navLinkStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-medium)',
  color: 'var(--color-text)',
  textDecoration: 'none',
  transition: 'color var(--transition-fast)',
};

const cartButtonStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-1)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-medium)',
  color: 'var(--color-text)',
  textDecoration: 'none',
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
  textDecoration: 'none',
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
  backgroundColor: 'transparent',
  border: 'none',
  cursor: 'pointer',
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
  textDecoration: 'none',
};

const registerBtnStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  backgroundColor: 'var(--color-primary)',
  color: 'white',
  padding: 'var(--space-2) var(--space-4)',
  borderRadius: 'var(--radius-md)',
  fontWeight: 'var(--font-medium)',
  textDecoration: 'none',
};

const logoImageStyles: React.CSSProperties = {
  height: '48px',
  width: 'auto',
  objectFit: 'contain',
  display: 'block',
};

const categoryLinksStyles: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-2)',
  overflowX: 'auto',
  whiteSpace: 'nowrap',
  padding: '4px 0 8px 0',
  width: '100%',
};
