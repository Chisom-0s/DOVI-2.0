import { Link } from 'react-router-dom';
import type { VendorSummary } from '@/types';

interface VendorSectionProps {
  vendor?: VendorSummary | string | null;
  vendorName?: string;
}

export default function VendorSection({ vendor, vendorName }: VendorSectionProps) {
  if (!vendor && !vendorName) return null;

  const vendorId = typeof vendor === 'object' && vendor !== null ? vendor.id : (typeof vendor === 'string' ? vendor : '');
  const name = (typeof vendor === 'object' && vendor !== null && vendor.name) ? vendor.name : (vendorName || 'Authorized Vendor');
  const logoUrl = (typeof vendor === 'object' && vendor !== null) ? vendor.logo_url : undefined;
  
  const rawRating = typeof vendor === 'object' && vendor !== null ? vendor.rating : 5.0;
  const rating = typeof rawRating === 'number' ? rawRating : (parseFloat(String(rawRating || 5.0)) || 5.0);

  const rawReviews = typeof vendor === 'object' && vendor !== null ? vendor.review_count : 0;
  const reviewCount = typeof rawReviews === 'number' ? rawReviews : (parseInt(String(rawReviews || 0), 10) || 0);

  // Premium fallback logo if vendor has no custom logo
  const fallbackLogo = '/logo.jpg?v=2';

  return (
    <div style={sectionWrapperStyles}>
      <div className="vendor-section-header">
        {/* Vendor Logo & Info */}
        <div style={profileStyles}>
          <img
            src={logoUrl || fallbackLogo}
            alt={`${name} Logo`}
            style={logoStyles}
            onError={e => {
              (e.target as HTMLImageElement).src = fallbackLogo;
            }}
          />
          <div style={infoStyles}>
            <div style={nameRowStyles}>
              <Link to={`/vendors/${vendorId}`} style={nameStyles}>
                {name}
              </Link>
              <span style={badgeStyles} title="Verified Vendor">
                ✓ Verified
              </span>
            </div>
            {/* Rating summary */}
            <div style={ratingStyles}>
              <span style={starsStyles}>
                ★ {rating.toFixed(1)}
              </span>
              <span style={countStyles}>
                ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={actionsStyles}>
          <Link to={`/vendors/${vendorId}`} style={visitBtnStyles}>
            🏪 Visit Store
          </Link>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const sectionWrapperStyles: React.CSSProperties = {
  backgroundColor: 'var(--color-bg-subtle)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-4)',
  marginTop: 'var(--space-4)',
  marginBottom: 'var(--space-4)',
  width: '100%',
};

const profileStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-4)',
};

const logoStyles: React.CSSProperties = {
  width: '56px',
  height: '56px',
  borderRadius: '50%',
  border: '1px solid var(--color-border)',
  objectFit: 'cover',
  backgroundColor: '#ffffff',
};

const infoStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const nameRowStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  flexWrap: 'wrap',
};

const nameStyles: React.CSSProperties = {
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  textDecoration: 'none',
};

const badgeStyles: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 'var(--font-bold)',
  color: '#ffffff',
  backgroundColor: 'var(--color-success)',
  padding: '2px 8px',
  borderRadius: 'var(--radius-full)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const ratingStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  fontSize: 'var(--text-sm)',
};

const starsStyles: React.CSSProperties = {
  color: '#f39c12',
  fontWeight: 'var(--font-bold)',
};

const countStyles: React.CSSProperties = {
  color: 'var(--color-text-muted)',
};

const actionsStyles: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-2)',
  flexWrap: 'wrap',
};

const visitBtnStyles: React.CSSProperties = {
  flex: '1',
  padding: '8px 16px',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-semibold)',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  border: 'none',
  textAlign: 'center',
  textDecoration: 'none',
  cursor: 'pointer',
  transition: 'background-color var(--transition-fast)',
  minWidth: '140px',
};
