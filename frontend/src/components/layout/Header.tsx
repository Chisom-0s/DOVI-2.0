import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import SearchBar from '@/components/home/SearchBar';
import { notificationsApi } from '@/api/notifications';
import type { Notification } from '@/types';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isHomepage = location.pathname === '/';

  // Notification States
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const fetchUnread = useCallback(async () => {
    try {
      const data = await notificationsApi.getUnreadCount();
      setUnreadCount(data.count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, []);

  const fetchList = useCallback(async () => {
    try {
      const data = await notificationsApi.list(1);
      setNotifications(data.results.slice(0, 5));
    } catch (err) {
      console.error('Failed to fetch notifications preview:', err);
    }
  }, []);

  // Poll for notifications unread count every 30s as required by rules
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }
    fetchUnread();
    fetchList();

    const interval = setInterval(() => {
      fetchUnread();
      fetchList(); // also refresh the last 5 dropdown list items
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchUnread, fetchList]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationsApi.markAllRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    setIsOpen(false);
    if (!notif.is_read) {
      try {
        await notificationsApi.markRead(notif.id);
        fetchUnread();
      } catch (err) {
        console.error('Failed to mark read:', err);
      }
    }
    navigate('/dashboard/notifications');
  };

  return (
    <header className="site-header" style={headerStyles}>
      <div className="container site-header__container">
        {/* Brand Logo (Row 1, Col 1 on mobile) */}
        {!isHomepage && (
          <Link to="/" style={logoStyles} className="site-header__logo">
            <img src="/logo.jpg?v=2" alt="Dovi" style={logoImageStyles} />
          </Link>
        )}

        {/* Header Actions (Desktop only, hidden on mobile) */}
        <div style={actionsContainerStyles} className="site-header__actions hide-mobile">
          {/* Desktop Navigation Links */}
          <nav style={navLinksStyles} className="hide-mobile">
            <Link to="/products" className="header-nav-link">Marketplace</Link>
            <Link to="/auto" className="header-nav-link">Dovi Auto</Link>
            <Link to="/save2own" className="header-nav-link">Save2Own</Link>
          </nav>

          {/* Notification Bell Dropdown Wrapper */}
          {isAuthenticated && (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setIsOpen(!isOpen)}
                style={bellBtnStyles}
                title="Notifications"
              >
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
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span style={badgeStyles}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Menu Overlay */}
              {isOpen && (
                <div style={dropdownStyles}>
                  <div style={dropdownHeaderStyles}>
                    <strong style={{ fontSize: 'var(--text-xs)' }}>Notifications</strong>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} style={headerActionBtnStyles}>
                          Mark all read
                        </button>
                      )}
                      <Link
                        to="/dashboard/notifications"
                        onClick={() => setIsOpen(false)}
                        style={headerActionLinkStyles}
                      >
                        View all
                      </Link>
                    </div>
                  </div>

                  <div style={dropdownListStyles}>
                    {notifications.length === 0 ? (
                      <p style={emptyNotifStyles}>No notifications yet.</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          style={{
                            ...dropdownItemStyles,
                            backgroundColor: n.is_read ? 'transparent' : 'rgba(255, 122, 0, 0.03)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{
                              fontWeight: n.is_read ? 'var(--font-medium)' : 'var(--font-bold)',
                              color: 'var(--color-text)',
                            }}>
                              {n.title}
                            </span>
                            {!n.is_read && <span style={unreadDotStyles} />}
                          </div>
                          <p style={dropdownItemBodyStyles}>{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

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
        <div 
          style={{
            ...searchContainerStyles,
            maxWidth: isHomepage ? '900px' : undefined,
          }} 
          className="site-header__search-container"
        >
          <SearchBar />
          <div style={categoryLinksStyles} className="no-scrollbar">
            {/* Page links – visible on mobile only (desktop has them in the top nav) */}
            <Link to="/products" className="header-category-link page-link hide-desktop">🛍️ Marketplace</Link>
            <Link to="/auto" className="header-category-link page-link hide-desktop">🚗 Dovi Auto</Link>
            <Link to="/save2own" className="header-category-link page-link hide-desktop">🎯 Save2Own</Link>

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
  gap: 'var(--space-3)',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
};

const navLinksStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
  marginRight: 'var(--space-1)',
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
  height: '72px',
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

const bellBtnStyles: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--color-text)',
  cursor: 'pointer',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '4px',
};

const badgeStyles: React.CSSProperties = {
  position: 'absolute',
  top: '-2px',
  right: '-2px',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  fontSize: '8px',
  fontWeight: 'var(--font-bold)',
  width: '14px',
  height: '14px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: 'var(--shadow-sm)',
};

const dropdownStyles: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  right: 0,
  marginTop: '8px',
  width: '280px',
  backgroundColor: '#ffffff',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  padding: 'var(--space-3)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
  zIndex: 1000,
};

const dropdownHeaderStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid var(--color-border)',
  paddingBottom: '8px',
};

const headerActionBtnStyles: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--color-primary)',
  fontSize: '9px',
  fontWeight: 'var(--font-bold)',
  cursor: 'pointer',
  textDecoration: 'underline',
};

const headerActionLinkStyles: React.CSSProperties = {
  color: 'var(--color-text-muted)',
  fontSize: '9px',
  fontWeight: 'var(--font-semibold)',
  textDecoration: 'none',
};

const dropdownListStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  maxHeight: '260px',
  overflowY: 'auto',
};

const dropdownItemStyles: React.CSSProperties = {
  padding: 'var(--space-2) var(--space-1)',
  borderBottom: '1px solid var(--color-border)',
  cursor: 'pointer',
  transition: 'background-color var(--transition-fast)',
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const dropdownItemBodyStyles: React.CSSProperties = {
  margin: 0,
  fontSize: '10px',
  color: 'var(--color-text-muted)',
  lineHeight: 1.3,
};

const unreadDotStyles: React.CSSProperties = {
  width: '5px',
  height: '5px',
  borderRadius: '50%',
  backgroundColor: 'var(--color-primary)',
};

const emptyNotifStyles: React.CSSProperties = {
  margin: 0,
  padding: 'var(--space-4) 0',
  textAlign: 'center',
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
};
