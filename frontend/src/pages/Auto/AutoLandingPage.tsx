import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AutoSubNav from '@/components/auto/AutoSubNav';
import { autoApi } from '@/api/auto';
import type { AutoListingSummary } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';

export default function AutoLandingPage() {
  const [featuredCars, setFeaturedCars] = useState<AutoListingSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setIsLoading(true);
        const data = await autoApi.listListings({ page: 1 });
        setFeaturedCars(data.results.slice(0, 4)); // Show first 4 listings
        setError(null);
      } catch (err) {
        console.error('Failed to load featured cars:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const categories = [
    {
      title: 'Cars & Vehicles',
      desc: 'Explore brand new and certified pre-owned vehicles.',
      path: '/auto/cars',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path>
          <circle cx="7" cy="17" r="2"></circle>
          <path d="M9 17h6"></path>
          <circle cx="17" cy="17" r="2"></circle>
        </svg>
      ),
      color: '#ff7a00',
    },
    {
      title: 'Car Parts',
      desc: 'Find OEM & aftermarket spare parts for your model.',
      path: '/auto/parts',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      ),
      color: '#00d2ff',
    },
    {
      title: 'Accessories',
      desc: 'Upgrade with car electronics, covers, mats, and more.',
      path: '/auto/accessories',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="12" rx="2" ry="2"></rect>
          <line x1="9" y1="22" x2="9" y2="14"></line>
          <line x1="15" y1="22" x2="15" y2="14"></line>
        </svg>
      ),
      color: '#00ff87',
    },
    {
      title: 'Rentals & Bookings',
      desc: 'Daily or weekly car rentals from certified partners.',
      path: '/auto/rentals',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      ),
      color: '#ff007a',
    },
    {
      title: 'Auto Services',
      desc: 'Book diagnostics, detailing, and servicing.',
      path: '/auto/services',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
        </svg>
      ),
      color: '#7a00ff',
    },
  ];

  return (
    <div style={containerStyles}>
      <AutoSubNav />

      {/* Hero Section */}
      <section style={heroStyles}>
        <div style={heroOverlayStyles}></div>
        <div style={heroContentStyles}>
          <h1 style={heroTitleStyles}>DRIVE WHAT YOU LOVE</h1>
          <p style={heroSubStyles}>
            Discover verified vehicles, premium parts, and hassle-free rental services all in one place.
          </p>
          <div style={heroActionsStyles}>
            <Link to="/auto/cars" style={heroBtnPrimaryStyles}>
              Browse Cars
            </Link>
            <Link to="/auto/parts" style={heroBtnSecondaryStyles}>
              Explore Parts
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section style={sectionStyles}>
        <div style={sectionHeaderStyles}>
          <h2 style={sectionTitleStyles}>Browse Dovi Auto</h2>
          <p style={sectionSubtitleStyles}>Pick a category to explore deals</p>
        </div>

        <div style={gridStyles}>
          {categories.map((cat) => (
            <Link key={cat.path} to={cat.path} style={cardStyles}>
              <div style={{ ...iconWrapperStyles, backgroundColor: `${cat.color}15`, color: cat.color }}>
                {cat.icon}
              </div>
              <h3 style={cardTitleStyles}>{cat.title}</h3>
              <p style={cardDescStyles}>{cat.desc}</p>
              <span style={{ ...cardLinkStyles, color: cat.color }}>
                Explore Category &rarr;
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Vehicles Section */}
      <section style={{ ...sectionStyles, backgroundColor: '#111827', color: '#ffffff' }}>
        <div style={sectionHeaderStyles}>
          <h2 style={{ ...sectionTitleStyles, color: '#ffffff' }}>Featured Listings</h2>
          <p style={{ ...sectionSubtitleStyles, color: '#9ca3af' }}>Handpicked deals from our trusted sellers</p>
        </div>

        {isLoading ? (
          <div style={loadingGridStyles}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={loadingCardStyles}>
                <Skeleton height="180px" borderRadius="12px" />
                <div style={{ padding: '16px 0 0 0' }}>
                  <Skeleton width="60%" height="1.25rem" />
                  <div style={{ margin: '8px 0' }} />
                  <Skeleton width="40%" height="1rem" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div style={errorContainerStyles}>
            <ApiErrorMessage error={error} />
          </div>
        ) : featuredCars.length === 0 ? (
          <EmptyState
            title="No Listings Found"
            subtitle="There are currently no active car listings on Dovi Auto."
          />
        ) : (
          <div style={listingGridStyles}>
            {featuredCars.map((car) => (
              <Link key={car.id} to={`/auto/cars/${car.id}`} style={listingCardStyles}>
                <div style={imgContainerStyles}>
                  {car.primary_image_url ? (
                    <img src={car.primary_image_url} alt={`${car.make} ${car.model}`} style={imgStyles} />
                  ) : (
                  <div style={placeholderImgStyles}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path>
                      <circle cx="7" cy="17" r="2"></circle>
                      <path d="M9 17h6"></path>
                      <circle cx="17" cy="17" r="2"></circle>
                    </svg>
                  </div>
                  )}
                  <span style={conditionBadgeStyles}>{car.condition}</span>
                </div>
                <div style={listingDetailsStyles}>
                  <span style={listingYearStyles}>{car.year}</span>
                  <h3 style={listingTitleStyles}>
                    {car.make} {car.model}
                  </h3>
                  <div style={listingSpecsStyles}>
                    <span style={specTagStyles}>{car.transmission}</span>
                    <span style={specTagStyles}>{car.fuel_type}</span>
                    {car.mileage !== null && (
                      <span style={specTagStyles}>{car.mileage.toLocaleString()} km</span>
                    )}
                  </div>
                  <div style={listingFooterStyles}>
                    <span style={listingPriceStyles}>₦{parseFloat(car.price).toLocaleString()}</span>
                    <span style={listingLocationStyles}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '3px', display: 'inline-block', verticalAlign: 'middle' }}>
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      <span style={{ verticalAlign: 'middle' }}>{car.location}</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Trust & Guarantee Section */}
      <section style={sectionStyles}>
        <div style={trustBannerStyles}>
          <div style={trustItemStyles}>
            <span style={trustIconStyles}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </span>
            <h4 style={trustTitleStyles}>Verified Listings</h4>
            <p style={trustDescStyles}>Every listing is vetted for specs authenticity and title status.</p>
          </div>
          <div style={trustItemStyles}>
            <span style={trustIconStyles}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </span>
            <h4 style={trustTitleStyles}>Compatibility Engine</h4>
            <p style={trustDescStyles}>Input your model specs to guarantee exact parts fitment matching.</p>
          </div>
          <div style={trustItemStyles}>
            <span style={trustIconStyles}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
            </span>
            <h4 style={trustTitleStyles}>Escrow Payments</h4>
            <p style={trustDescStyles}>Funds are held securely and released only on delivery sign-off.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

// ----------------------------------------------------------
// Inline Styling (Vanilla Tokens & Custom Theme)
// ----------------------------------------------------------
const containerStyles: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  minHeight: '100vh',
  fontFamily: 'var(--font-sans)',
};

const heroStyles: React.CSSProperties = {
  position: 'relative',
  backgroundImage: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
  padding: '80px 24px',
  color: '#ffffff',
  textAlign: 'center',
  overflow: 'hidden',
};

const heroOverlayStyles: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(255, 122, 0, 0.05)',
  pointerEvents: 'none',
};

const heroContentStyles: React.CSSProperties = {
  position: 'relative',
  zIndex: 1,
  maxWidth: '720px',
  margin: '0 auto',
};

const heroTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-4xl, 2.25rem)',
  fontWeight: 900,
  letterSpacing: '-1px',
  marginBottom: '16px',
  background: 'linear-gradient(90deg, #ffffff 0%, #f3f4f6 50%, #ff7a00 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
};

const heroSubStyles: React.CSSProperties = {
  fontSize: 'var(--text-lg, 1.125rem)',
  color: '#d1d5db',
  lineHeight: 1.5,
  marginBottom: '32px',
};

const heroActionsStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '16px',
  flexWrap: 'wrap',
};

const heroBtnPrimaryStyles: React.CSSProperties = {
  backgroundColor: 'var(--color-primary, #ff7a00)',
  color: '#ffffff',
  padding: '12px 28px',
  borderRadius: 'var(--radius-lg, 12px)',
  fontSize: '15px',
  fontWeight: 700,
  textDecoration: 'none',
  boxShadow: '0 4px 14px rgba(255, 122, 0, 0.4)',
  transition: 'transform 150ms ease',
};

const heroBtnSecondaryStyles: React.CSSProperties = {
  backgroundColor: 'transparent',
  color: '#ffffff',
  padding: '11px 27px',
  borderRadius: 'var(--radius-lg, 12px)',
  fontSize: '15px',
  fontWeight: 700,
  textDecoration: 'none',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  transition: 'all 150ms ease',
};

const sectionStyles: React.CSSProperties = {
  padding: '64px var(--space-4, 16px)',
  maxWidth: '1280px',
  margin: '0 auto',
  width: '100%',
};

const sectionHeaderStyles: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '40px',
};

const sectionTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-2xl, 1.5rem)',
  fontWeight: 800,
  color: 'var(--color-text, #1f2937)',
  marginBottom: '8px',
};

const sectionSubtitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm, 0.875rem)',
  color: 'var(--color-text-muted, #6b7280)',
};

const gridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '24px',
};

const cardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid var(--color-border, #e5e7eb)',
  borderRadius: 'var(--radius-lg, 12px)',
  padding: '24px',
  textDecoration: 'none',
  color: 'inherit',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 200ms ease, box-shadow 200ms ease',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
};

const iconWrapperStyles: React.CSSProperties = {
  width: '48px',
  height: '48px',
  borderRadius: 'var(--radius-md, 8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '24px',
  marginBottom: '16px',
};

const cardTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-base, 1rem)',
  fontWeight: 700,
  marginBottom: '8px',
  color: '#1f2937',
};

const cardDescStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs, 0.75rem)',
  color: 'var(--color-text-muted, #6b7280)',
  lineHeight: 1.5,
  flex: 1,
  marginBottom: '16px',
};

const cardLinkStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs, 0.75rem)',
  fontWeight: 700,
  display: 'inline-flex',
  alignItems: 'center',
};

const loadingGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  gap: '24px',
};

const errorContainerStyles: React.CSSProperties = {
  padding: '32px',
  textAlign: 'center',
};

const listingGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  gap: '24px',
};

const listingCardStyles: React.CSSProperties = {
  backgroundColor: '#1f2937',
  borderRadius: 'var(--radius-lg, 12px)',
  overflow: 'hidden',
  textDecoration: 'none',
  color: 'inherit',
  display: 'flex',
  flexDirection: 'column',
  border: '1px solid #374151',
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
  transition: 'transform 200ms ease',
};

const imgContainerStyles: React.CSSProperties = {
  position: 'relative',
  height: '180px',
  backgroundColor: '#374151',
};

const imgStyles: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const placeholderImgStyles: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '48px',
  color: '#4b5563',
};

const conditionBadgeStyles: React.CSSProperties = {
  position: 'absolute',
  top: '12px',
  left: '12px',
  backgroundColor: '#ff7a00',
  color: '#ffffff',
  fontSize: '10px',
  fontWeight: 700,
  padding: '2px 8px',
  borderRadius: '4px',
  textTransform: 'uppercase',
};

const listingDetailsStyles: React.CSSProperties = {
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
};

const listingYearStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs, 0.75rem)',
  color: '#ff7a00',
  fontWeight: 600,
  marginBottom: '4px',
};

const listingTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-base, 1rem)',
  fontWeight: 700,
  color: '#ffffff',
  marginBottom: '12px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const listingSpecsStyles: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  marginBottom: '16px',
  flexWrap: 'wrap',
};

const specTagStyles: React.CSSProperties = {
  backgroundColor: '#374151',
  color: '#d1d5db',
  fontSize: '10px',
  fontWeight: 500,
  padding: '2px 6px',
  borderRadius: '4px',
};

const listingFooterStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 'auto',
  borderTop: '1px solid #374151',
  paddingTop: '12px',
};

const listingPriceStyles: React.CSSProperties = {
  fontSize: 'var(--text-base, 1rem)',
  fontWeight: 800,
  color: '#ffffff',
};

const listingLocationStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#9ca3af',
};

const loadingCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: 'var(--radius-lg, 12px)',
  border: '1px solid var(--color-border, #e5e7eb)',
  padding: '16px',
};

const trustBannerStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '32px',
  backgroundColor: '#ffffff',
  border: '1px solid var(--color-border, #e5e7eb)',
  borderRadius: 'var(--radius-xl, 16px)',
  padding: '40px 32px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
};

const trustItemStyles: React.CSSProperties = {
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const trustIconStyles: React.CSSProperties = {
  fontSize: '36px',
  marginBottom: '16px',
};

const trustTitleStyles: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 700,
  color: '#1f2937',
  marginBottom: '8px',
};

const trustDescStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs, 0.75rem)',
  color: 'var(--color-text-muted, #6b7280)',
  lineHeight: 1.5,
  maxWidth: '260px',
};
