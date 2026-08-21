import { Link, Outlet, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from './Header';
import Footer from './Footer';

export default function MainLayout() {
  const location = useLocation();
  const hideFooter = location.pathname === '/' || location.pathname === '/products';

  return (
    <div style={layoutWrapperStyles} className="main-layout-wrapper">
      {/* Universal Header */}
      <Header />

      {/* Main Content Area */}
      <main style={mainContentStyles}>
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-nav">
        <Link to="/" className={`mobile-nav__item ${location.pathname === '/' ? 'mobile-nav__item--active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span>Home</span>
        </Link>
        <Link to="/products" className={`mobile-nav__item ${location.pathname === '/products' ? 'mobile-nav__item--active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
          <span>Market</span>
        </Link>
        <button onClick={() => toast.success('Vendor Portal is coming soon!')} className="mobile-nav__item mobile-nav__item--sell">
          <span>Sell</span>
        </button>
        <Link to="/cart" className={`mobile-nav__item ${location.pathname === '/cart' ? 'mobile-nav__item--active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          <span>Cart</span>
        </Link>
        <Link to="/dashboard" className={`mobile-nav__item ${location.pathname.startsWith('/dashboard') ? 'mobile-nav__item--active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span>Profile</span>
        </Link>
      </nav>

      {/* Universal Footer */}
      {!hideFooter && <Footer />}
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const layoutWrapperStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
};

const mainContentStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
};
