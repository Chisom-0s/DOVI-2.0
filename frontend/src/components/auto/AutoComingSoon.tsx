import { Link } from 'react-router-dom';
import AutoSubNav from './AutoSubNav';

interface AutoComingSoonProps {
  /** The specific section name, e.g. "Cars & Vehicles", "Car Parts" */
  sectionName?: string;
  /** Optional back link path */
  backPath?: string;
  /** Optional back link label */
  backLabel?: string;
}

/**
 * Shown when any Dovi Auto section's backend is not yet implemented.
 * Replaces the old seed-data fallback with an honest "coming soon" state.
 */
export default function AutoComingSoon({
  sectionName = 'Dovi Auto',
  backPath = '/auto',
  backLabel = 'Back to Auto',
}: AutoComingSoonProps) {
  return (
    <div style={containerStyles}>
      <AutoSubNav />

      <div style={contentStyles}>
        <div style={cardStyles}>
          {/* Animated car icon */}
          <div style={iconContainerStyles}>
            <span style={iconStyles}>🚧</span>
          </div>

          <h1 style={titleStyles}>Coming Soon</h1>
          <h2 style={subtitleStyles}>{sectionName}</h2>

          <p style={descStyles}>
            We're building something incredible. The {sectionName} marketplace
            is currently under development and will be available soon with
            verified listings, secure escrow payments, and premium automotive
            experiences.
          </p>

          <div style={featureGridStyles}>
            <div style={featureItemStyles}>
              <span style={featureIconStyles}>🔒</span>
              <span style={featureTextStyles}>Escrow Protection</span>
            </div>
            <div style={featureItemStyles}>
              <span style={featureIconStyles}>✓</span>
              <span style={featureTextStyles}>Verified Sellers</span>
            </div>
            <div style={featureItemStyles}>
              <span style={featureIconStyles}>🔍</span>
              <span style={featureTextStyles}>Vehicle Inspection</span>
            </div>
          </div>

          <div style={actionsStyles}>
            <Link to={backPath} style={backBtnStyles}>
              ← {backLabel}
            </Link>
            <Link to="/products" style={shopBtnStyles}>
              Shop Marketplace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------
// Styling
// ----------------------------------------------------------
const containerStyles: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  minHeight: '100vh',
  fontFamily: 'var(--font-sans)',
};

const contentStyles: React.CSSProperties = {
  maxWidth: '640px',
  margin: '0 auto',
  padding: '80px 24px 120px 24px',
  display: 'flex',
  justifyContent: 'center',
};

const cardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '24px',
  padding: '48px 40px',
  textAlign: 'center',
  boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
  width: '100%',
};

const iconContainerStyles: React.CSSProperties = {
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, rgba(255, 122, 0, 0.1) 0%, rgba(255, 149, 0, 0.15) 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 24px auto',
};

const iconStyles: React.CSSProperties = {
  fontSize: '36px',
};

const titleStyles: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 900,
  color: '#1f2937',
  marginBottom: '8px',
  letterSpacing: '-0.5px',
};

const subtitleStyles: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  color: 'var(--color-primary, #ff7a00)',
  marginBottom: '20px',
};

const descStyles: React.CSSProperties = {
  fontSize: '14px',
  color: '#6b7280',
  lineHeight: 1.7,
  marginBottom: '32px',
  maxWidth: '480px',
  margin: '0 auto 32px auto',
};

const featureGridStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '24px',
  marginBottom: '36px',
  flexWrap: 'wrap',
};

const featureItemStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 16px',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  border: '1px solid #f3f4f6',
};

const featureIconStyles: React.CSSProperties = {
  fontSize: '14px',
};

const featureTextStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#4b5563',
};

const actionsStyles: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  justifyContent: 'center',
  flexWrap: 'wrap',
};

const backBtnStyles: React.CSSProperties = {
  padding: '12px 24px',
  backgroundColor: '#ffffff',
  color: '#4b5563',
  border: '1px solid #e5e7eb',
  borderRadius: '10px',
  fontWeight: 700,
  fontSize: '14px',
  textDecoration: 'none',
  transition: 'all 150ms ease',
};

const shopBtnStyles: React.CSSProperties = {
  padding: '12px 24px',
  backgroundColor: 'var(--color-primary, #ff7a00)',
  color: '#ffffff',
  border: 'none',
  borderRadius: '10px',
  fontWeight: 700,
  fontSize: '14px',
  textDecoration: 'none',
  boxShadow: '0 4px 12px rgba(255, 122, 0, 0.25)',
  transition: 'all 150ms ease',
};
