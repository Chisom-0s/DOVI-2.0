import React from 'react';
import { NavLink } from 'react-router-dom';

interface InfoLayoutProps {
  badge: string;
  title: string;
  tagline?: string;
  children: React.ReactNode;
}

const navItems = [
  { path: '/about', label: 'About Dovi' },
  { path: '/faq', label: 'FAQ' },
  { path: '/contact', label: 'Contact Us' },
  { path: '/shipping', label: 'Shipping & Delivery' },
  { path: '/returns', label: 'Returns & Refunds' },
  { path: '/terms', label: 'Terms of Service' },
  { path: '/privacy', label: 'Privacy Policy' },
];

export default function InfoLayout({ badge, title, tagline, children }: InfoLayoutProps) {
  return (
    <div style={containerStyles}>
      {/* Top Banner Header */}
      <div style={headerCardStyles}>
        <span style={badgeStyles}>{badge}</span>
        <h1 style={titleStyles}>{title}</h1>
        {tagline && <p style={taglineStyles}>{tagline}</p>}

        {/* Quick Nav Pills */}
        <nav style={navPillsStyles}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                ...pillBaseStyles,
                ...(isActive ? pillActiveStyles : {}),
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div style={contentCardStyles}>{children}</div>
    </div>
  );
}

const containerStyles: React.CSSProperties = {
  maxWidth: '960px',
  margin: '0 auto',
  padding: 'var(--space-6) var(--space-4) var(--space-16)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-6)',
};

const headerCardStyles: React.CSSProperties = {
  backgroundColor: 'var(--color-card)',
  borderRadius: '16px',
  padding: 'var(--space-8) var(--space-6)',
  border: '1px solid var(--color-border)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  textAlign: 'center',
};

const badgeStyles: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: 'rgba(255, 122, 0, 0.1)',
  color: 'var(--color-primary)',
  padding: '4px 12px',
  borderRadius: '9999px',
  fontSize: '0.8rem',
  fontWeight: 700,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  marginBottom: '12px',
};

const titleStyles: React.CSSProperties = {
  fontSize: 'clamp(1.75rem, 3.5vw, 2.25rem)',
  fontWeight: 800,
  color: 'var(--color-text)',
  margin: '0 0 8px',
  lineHeight: 1.2,
};

const taglineStyles: React.CSSProperties = {
  fontSize: '1rem',
  color: 'var(--color-text-muted)',
  maxWidth: '650px',
  margin: '0 auto 24px',
};

const navPillsStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '8px',
  flexWrap: 'wrap',
  borderTop: '1px solid var(--color-border)',
  paddingTop: '20px',
};

const pillBaseStyles: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: '9999px',
  fontSize: '0.85rem',
  fontWeight: 500,
  textDecoration: 'none',
  color: 'var(--color-text-muted)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  transition: 'all 0.15s ease',
};

const pillActiveStyles: React.CSSProperties = {
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  borderColor: 'var(--color-primary)',
  fontWeight: 600,
};

const contentCardStyles: React.CSSProperties = {
  backgroundColor: 'var(--color-card)',
  borderRadius: '16px',
  padding: 'clamp(1.5rem, 4vw, 2.5rem)',
  border: '1px solid var(--color-border)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  lineHeight: 1.7,
  color: 'var(--color-text)',
};
