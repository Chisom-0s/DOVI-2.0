import React from 'react';
import { Link } from 'react-router-dom';

export default function MarketplaceFooter() {
  return (
    <footer style={footerStyles}>
      <div style={innerStyles}>
        {/* Brand & Mission Column */}
        <div style={colStyles}>
          <div style={brandStyles}>
            <img src="/logo.jpg" alt="Dovi Logo" style={logoStyles} />
            <span style={brandTextStyles}>DOVI</span>
          </div>
          <p style={taglineStyles}>
            <strong>Dovi — Shop Smart. Feel Good.</strong>
          </p>
          <p style={descStyles}>
            Nigeria's premier student-focused centralized marketplace. Built with 100% Escrow Buyer Protection, Save2Own zero-interest micro-installments, and fast campus fulfillment from our Onitsha Logistics Hub.
          </p>
          <div style={badgeContainerStyles}>
            <span style={badgeStyles}>🛡️ 100% Escrow Protection</span>
            <span style={badgeStyles}>🚚 Campus Logistics Network</span>
          </div>
        </div>

        {/* Explore Links */}
        <div style={colStyles}>
          <h4 style={headingStyles}>Explore Marketplace</h4>
          <ul style={listStyles}>
            <li><Link to="/products" style={linkStyles}>All Products Catalog</Link></li>
            <li><Link to="/categories/phones-tablets-gadgets" style={linkStyles}>Phones & Gadgets</Link></li>
            <li><Link to="/categories/computing-accessories" style={linkStyles}>Laptops & Computing</Link></li>
            <li><Link to="/categories/electronics-appliances" style={linkStyles}>Electronics & Living</Link></li>
            <li><Link to="/categories/fashion-clothing" style={linkStyles}>Campus Fashion</Link></li>
            <li><Link to="/save2own" style={linkStyles}>Save2Own Goals</Link></li>
          </ul>
        </div>

        {/* Customer Support & Policies */}
        <div style={colStyles}>
          <h4 style={headingStyles}>Customer Help & Trust</h4>
          <ul style={listStyles}>
            <li><Link to="/about" style={linkStyles}>About Dovi</Link></li>
            <li><Link to="/faq" style={linkStyles}>Help Center & FAQ</Link></li>
            <li><Link to="/shipping" style={linkStyles}>Shipping & Delivery Rates</Link></li>
            <li><Link to="/returns" style={linkStyles}>Returns & Refunds (48-Hr)</Link></li>
            <li><Link to="/contact" style={linkStyles}>Contact Support</Link></li>
          </ul>
        </div>

        {/* Direct Contacts & Legal */}
        <div style={colStyles}>
          <h4 style={headingStyles}>Reach Out to Us</h4>
          <p style={contactInfoStyles}>
            <strong>Customer Care:</strong><br />
            <a href="mailto:support@dovishop.com" style={linkStyles}>support@dovishop.com</a>
          </p>
          <p style={contactInfoStyles}>
            <strong>General Inquiries:</strong><br />
            <a href="mailto:hello@dovishop.com" style={linkStyles}>hello@dovishop.com</a>
          </p>
          <p style={contactInfoStyles}>
            <strong>Operating Hours:</strong><br />
            Mon – Sat: 8:00 AM – 8:00 PM WAT
          </p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <Link to="/terms" style={{ ...linkStyles, fontSize: '0.8rem' }}>Terms</Link>
            <span style={{ color: '#4b5563' }}>•</span>
            <Link to="/privacy" style={{ ...linkStyles, fontSize: '0.8rem' }}>Privacy</Link>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={bottomBarStyles}>
        <div style={bottomInnerStyles}>
          <p style={{ margin: 0 }}>
            &copy; {new Date().getFullYear()} Dovi Technologies. A product of Malc Nexus Technologies Limited. All rights reserved.
          </p>
          <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.75rem' }}>
            Central Logistics Hub: Onitsha, Anambra State, Nigeria.
          </p>
        </div>
      </div>
    </footer>
  );
}

const footerStyles: React.CSSProperties = {
  backgroundColor: '#111827',
  color: '#e5e7eb',
  paddingTop: '3.5rem',
  paddingBottom: 'clamp(4rem, 8vw, 2rem)', // space for mobile bottom nav
  marginTop: 'auto',
  borderTop: '1px solid #1f2937',
  fontSize: '0.9rem',
};

const innerStyles: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '0 1.25rem',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '2.5rem',
  marginBottom: '2.5rem',
};

const colStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

const brandStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const logoStyles: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '8px',
  objectFit: 'cover',
};

const brandTextStyles: React.CSSProperties = {
  fontSize: '1.4rem',
  fontWeight: 800,
  color: '#ffffff',
  letterSpacing: '0.05em',
};

const taglineStyles: React.CSSProperties = {
  color: '#ff7a00',
  fontSize: '0.95rem',
  margin: 0,
};

const descStyles: React.CSSProperties = {
  color: '#9ca3af',
  fontSize: '0.825rem',
  lineHeight: 1.6,
  margin: 0,
};

const badgeContainerStyles: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  marginTop: '8px',
};

const badgeStyles: React.CSSProperties = {
  backgroundColor: '#1f2937',
  color: '#d1d5db',
  border: '1px solid #374151',
  padding: '4px 8px',
  borderRadius: '6px',
  fontSize: '0.75rem',
  fontWeight: 600,
};

const headingStyles: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '1rem',
  fontWeight: 700,
  margin: '0 0 0.5rem',
};

const listStyles: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const linkStyles: React.CSSProperties = {
  color: '#9ca3af',
  textDecoration: 'none',
  fontSize: '0.875rem',
  transition: 'color 0.15s ease',
};

const contactInfoStyles: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#9ca3af',
  margin: 0,
  lineHeight: 1.5,
};

const bottomBarStyles: React.CSSProperties = {
  borderTop: '1px solid #1f2937',
  padding: '1.5rem 1.25rem 0',
};

const bottomInnerStyles: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '12px',
  fontSize: '0.8rem',
  color: '#9ca3af',
};

