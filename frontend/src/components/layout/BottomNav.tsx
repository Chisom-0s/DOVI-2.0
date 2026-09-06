import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import React from 'react';

export default function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();

  // Determine if the user is a vendor
  const isVendor = user?.role === 'VENDOR' || user?.profile?.vendor_status === 'APPROVED';

  return (
    <nav className="mobile-nav">
      <Link to="/" className={`mobile-nav__item ${location.pathname === '/' ? 'mobile-nav__item--active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span>Home</span>
      </Link>
      
      <Link to="/products" className={`mobile-nav__item ${location.pathname === '/products' ? 'mobile-nav__item--active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1"/>
          <rect x="14" y="3" width="7" height="5" rx="1"/>
          <rect x="14" y="12" width="7" height="9" rx="1"/>
          <rect x="3" y="16" width="7" height="5" rx="1"/>
        </svg>
        <span>Market</span>
      </Link>

      {isVendor ? (
        <Link to="/vendor/dashboard" className={`mobile-nav__item mobile-nav__item--sell ${location.pathname.startsWith('/vendor') ? 'mobile-nav__item--active' : ''}`}>
          <span>Sell</span>
        </Link>
      ) : (
        <Link to="/save2own" className={`mobile-nav__item mobile-nav__item--sell ${location.pathname.startsWith('/save2own') ? 'mobile-nav__item--active' : ''}`}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1.1, color: 'white' }}>
            <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px' }}>SAVE</span>
            <span style={{ fontSize: '18px', fontWeight: 900, marginTop: '-2px', marginBottom: '-2px' }}>2</span>
            <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px' }}>OWN</span>
          </div>
        </Link>
      )}

      <Link to="/cart" className={`mobile-nav__item ${location.pathname === '/cart' ? 'mobile-nav__item--active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1"/>
          <circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        <span>Cart</span>
      </Link>
      
      <Link to={isVendor ? '/vendor/dashboard' : '/dashboard'} className={`mobile-nav__item ${(isVendor ? location.pathname.startsWith('/vendor') : location.pathname.startsWith('/dashboard')) ? 'mobile-nav__item--active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <span>Account</span>
      </Link>
    </nav>
  );
}
