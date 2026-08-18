import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer" style={footerStyles}>
      <div className="container" style={containerStyles}>
        {/* Footer Top */}
        <div style={gridStyles}>
          <div style={sectionStyles}>
            <h3 style={titleStyles}>DOVI</h3>
            <p style={descStyles}>
              Shop smarter, buy confidently. High quality products from verified local vendors.
            </p>
          </div>

          <div style={sectionStyles}>
            <h4 style={subTitleStyles}>Quick Links</h4>
            <ul style={listStyles}>
              <li><Link to="/products" style={linkStyles}>Marketplace</Link></li>
              <li><Link to="/auto" style={linkStyles}>Dovi Auto</Link></li>
              <li><Link to="/save2own" style={linkStyles}>Save2Own</Link></li>
            </ul>
          </div>

          <div style={sectionStyles}>
            <h4 style={subTitleStyles}>Support</h4>
            <ul style={listStyles}>
              <li><Link to="/faq" style={linkStyles}>FAQ</Link></li>
              <li><Link to="/contact" style={linkStyles}>Contact Support</Link></li>
              <li><Link to="/terms" style={linkStyles}>Terms & Conditions</Link></li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div style={bottomStyles}>
          <p style={copyStyles}>
            &copy; {new Date().getFullYear()} Dovi Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const footerStyles: React.CSSProperties = {
  backgroundColor: 'var(--color-bg-subtle)',
  borderTop: '1px solid var(--color-border)',
  paddingTop: 'var(--space-12)',
  paddingBottom: 'var(--space-8)',
  marginTop: 'auto', // pushes footer to the bottom
};

const containerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-8)',
};

const gridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 'var(--space-8)',
};

const sectionStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
};

const titleStyles: React.CSSProperties = {
  fontSize: 'var(--text-xl)',
  color: 'var(--color-primary)',
  fontWeight: 'var(--font-bold)',
};

const subTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-text)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const descStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-muted)',
  lineHeight: 'var(--leading-relaxed)',
};

const listStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
};

const linkStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-muted)',
  transition: 'color var(--transition-fast)',
};

const bottomStyles: React.CSSProperties = {
  borderTop: '1px solid var(--color-border)',
  paddingTop: 'var(--space-6)',
  textAlign: 'center',
};

const copyStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
};
