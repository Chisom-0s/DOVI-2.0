import { useEffect, useState, useCallback } from 'react';
import AutoSubNav from '@/components/auto/AutoSubNav';
import AutoComingSoon from '@/components/auto/AutoComingSoon';
import { autoApi } from '@/api/auto';
import type { AutoRentalSummary } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function RentalListingsPage() {
  // Filters State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [minRate, setMinRate] = useState<number | ''>('');
  const [maxRate, setMaxRate] = useState<number | ''>('');
  const [location, setLocation] = useState('');

  // Pagination & Load States
  const [rentals, setRentals] = useState<AutoRentalSummary[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Search input debouncing (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Rentals
  const fetchRentals = useCallback(async () => {
    try {
      setIsLoading(true);
      const queryFilters: Record<string, any> = {
        page: currentPage,
        q: debouncedSearch || undefined,
        make: make || undefined,
        model: model || undefined,
        min_rate: minRate || undefined,
        max_rate: maxRate || undefined,
        location: location || undefined,
      };

      const data = await autoApi.listRentals(queryFilters);
      setRentals(data.results);
      setTotalPages(Math.ceil(data.count / 10) || 1);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch rentals:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, make, model, minRate, maxRate, location]);

  useEffect(() => {
    fetchRentals();
  }, [fetchRentals]);

  const handleClearFilters = () => {
    setSearch('');
    setMake('');
    setModel('');
    setMinRate('');
    setMaxRate('');
    setLocation('');
    setCurrentPage(1);
    toast.success('Filters cleared');
  };

  return (
    <div style={containerStyles}>
      <AutoSubNav />

      <div style={mainContentStyles}>
        {/* Mobile Filters Toggle */}
        <div style={mobileFiltersBarStyles}>
          <button style={toggleFilterBtnStyles} onClick={() => setShowMobileFilters(!showMobileFilters)}>
            {showMobileFilters ? (
              <span>Hide Filters</span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                <span>Filter Vehicles</span>
              </span>
            )}
          </button>
        </div>

        <div style={layoutGridStyles}>
          {/* Filters Sidebar */}
          <aside
            style={{
              ...sidebarStyles,
              display: showMobileFilters ? 'block' : undefined,
            }}
            className={showMobileFilters ? 'mobile-filters-open' : 'sidebar-aside'}
          >
            <div style={filterHeaderStyles}>
              <h3 style={filterHeadingStyles}>Filters</h3>
              <button style={clearFiltersBtnStyles} onClick={handleClearFilters}>
                Reset All
              </button>
            </div>

            <div style={filterSectionStyles}>
              <label style={labelStyles}>Quick Search</label>
              <input
                type="text"
                style={inputStyles}
                value={search}
                placeholder="e.g. Prado, Corolla"
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div style={filterSectionStyles}>
              <label style={labelStyles}>Vehicle Make</label>
              <input
                type="text"
                style={inputStyles}
                value={make}
                placeholder="e.g. Toyota"
                onChange={(e) => {
                  setMake(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div style={filterSectionStyles}>
              <label style={labelStyles}>Vehicle Model</label>
              <input
                type="text"
                style={inputStyles}
                value={model}
                placeholder="e.g. Prado"
                onChange={(e) => {
                  setModel(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div style={filterSectionStyles}>
              <label style={labelStyles}>Location</label>
              <input
                type="text"
                style={inputStyles}
                value={location}
                placeholder="e.g. Lagos"
                onChange={(e) => {
                  setLocation(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div style={filterSectionStyles}>
              <label style={labelStyles}>Daily Rate Range (₦)</label>
              <div style={rangeGridStyles}>
                <input
                  type="number"
                  placeholder="Min"
                  style={inputStyles}
                  value={minRate}
                  onChange={(e) => {
                    setMinRate(e.target.value ? parseFloat(e.target.value) : '');
                    setCurrentPage(1);
                  }}
                />
                <input
                  type="number"
                  placeholder="Max"
                  style={inputStyles}
                  value={maxRate}
                  onChange={(e) => {
                    setMaxRate(e.target.value ? parseFloat(e.target.value) : '');
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
          </aside>

          {/* Rentals Grid Area */}
          <main style={gridContainerStyles}>
            {isLoading ? (
              <div style={loadingGridStyles}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} style={loadingCardStyles}>
                    <Skeleton height="160px" borderRadius="8px" />
                    <div style={{ padding: '12px 0 0 0' }}>
                      <Skeleton width="80%" height="1.1rem" />
                      <div style={{ margin: '8px 0' }} />
                      <Skeleton width="50%" height="1rem" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <AutoComingSoon sectionName="Rentals & Bookings" backPath="/auto" backLabel="Back to Auto" />
            ) : rentals.length === 0 ? (
              <EmptyState
                title="No Rental Vehicles Found"
                subtitle="Try loosening your search filters or browse all rentals."
                action={{
                  label: 'Clear Filters',
                  onClick: handleClearFilters,
                }}
              />
            ) : (
              <>
                <div style={listingsHeaderStyles}>
                  <p style={countStyles}>{rentals.length} vehicles found</p>
                </div>

                <div style={listingGridStyles}>
                  {rentals.map((car) => (
                    <Link key={car.id} to={`/auto/rentals/${car.id}`} style={rentalCardStyles}>
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
                        <span style={locationBadgeStyles}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '3px', display: 'inline-block', verticalAlign: 'middle' }}>
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                          </svg>
                          <span style={{ verticalAlign: 'middle' }}>{car.pickup_location}</span>
                        </span>
                      </div>
                      <div style={rentalDetailsStyles}>
                        <h3 style={rentalTitleStyles}>
                          {car.make} {car.model} <span style={yearStyles}>{car.year}</span>
                        </h3>
                        <p style={vendorNameStyles}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'middle' }}>
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                          <span style={{ verticalAlign: 'middle' }}>Vendor: {car.vendor?.name || 'Trusted Dealer'}</span>
                        </p>

                        <div style={rentalFooterStyles}>
                          <div style={rateContainerStyles}>
                            <span style={rateStyles}>₦{parseFloat(car.daily_rate).toLocaleString()}</span>
                            <span style={rateUnitStyles}>/ day</span>
                          </div>
                          <span style={viewDetailsBtnStyles}>Book Now &rarr;</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={paginationStyles}>
                    <button
                      style={{
                        ...pageBtnStyles,
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        opacity: currentPage === 1 ? 0.5 : 1,
                      }}
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    >
                      &larr; Prev
                    </button>
                    <span style={pageIndicatorStyles}>
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      style={{
                        ...pageBtnStyles,
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        opacity: currentPage === totalPages ? 0.5 : 1,
                      }}
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    >
                      Next &rarr;
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const containerStyles: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  minHeight: '100vh',
  fontFamily: 'var(--font-sans)',
};

const mainContentStyles: React.CSSProperties = {
  maxWidth: '1280px',
  margin: '0 auto',
  padding: '32px var(--space-4, 16px)',
  width: '100%',
};

const mobileFiltersBarStyles: React.CSSProperties = {
  display: 'none',
  marginBottom: '16px',
};

const toggleFilterBtnStyles: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  backgroundColor: '#111827',
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 700,
  cursor: 'pointer',
};

const layoutGridStyles: React.CSSProperties = {
  display: 'flex',
  gap: '32px',
};

const sidebarStyles: React.CSSProperties = {
  width: '280px',
  flexShrink: 0,
  backgroundColor: '#ffffff',
  border: '1px solid var(--color-border, #e5e7eb)',
  borderRadius: 'var(--radius-xl, 12px)',
  padding: '24px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
  height: 'fit-content',
  position: 'sticky',
  top: '80px',
};

const filterHeaderStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid var(--color-border, #e5e7eb)',
  paddingBottom: '16px',
  marginBottom: '20px',
};

const filterHeadingStyles: React.CSSProperties = {
  fontSize: 'var(--text-base, 1rem)',
  fontWeight: 800,
  color: '#1f2937',
};

const clearFiltersBtnStyles: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--color-primary, #ff7a00)',
  fontSize: 'var(--text-xs, 0.75rem)',
  fontWeight: 700,
  cursor: 'pointer',
};

const filterSectionStyles: React.CSSProperties = {
  marginBottom: '18px',
};

const labelStyles: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  color: 'var(--color-text-muted, #6b7280)',
  marginBottom: '6px',
  letterSpacing: '0.5px',
};

const inputStyles: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--color-border, #e5e7eb)',
  borderRadius: 'var(--radius-md, 8px)',
  fontSize: 'var(--text-sm, 0.875rem)',
  color: '#1f2937',
  backgroundColor: '#f9fafb',
  outline: 'none',
};

const rangeGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '8px',
};

const gridContainerStyles: React.CSSProperties = {
  flex: 1,
};

const listingsHeaderStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
};

const countStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm, 0.875rem)',
  fontWeight: 600,
  color: 'var(--color-text-muted, #6b7280)',
};

const listingGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  gap: '24px',
};

const rentalCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: 'var(--radius-lg, 12px)',
  overflow: 'hidden',
  textDecoration: 'none',
  color: 'inherit',
  display: 'flex',
  flexDirection: 'column',
  border: '1px solid var(--color-border, #e5e7eb)',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
  transition: 'transform 200ms ease, box-shadow 200ms ease',
};

const imgContainerStyles: React.CSSProperties = {
  position: 'relative',
  height: '160px',
  backgroundColor: '#f3f4f6',
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
  color: '#9ca3af',
  backgroundColor: '#e5e7eb',
};

const locationBadgeStyles: React.CSSProperties = {
  position: 'absolute',
  top: '12px',
  left: '12px',
  backgroundColor: 'rgba(17, 24, 39, 0.75)',
  color: '#ffffff',
  fontSize: '10px',
  fontWeight: 700,
  padding: '3px 8px',
  borderRadius: '4px',
};

const rentalDetailsStyles: React.CSSProperties = {
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
};

const rentalTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-base, 1rem)',
  fontWeight: 800,
  color: '#1f2937',
  marginBottom: '6px',
  lineHeight: 1.3,
};

const yearStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs, 0.75rem)',
  color: 'var(--color-text-muted, #6b7280)',
  fontWeight: 500,
};

const vendorNameStyles: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--color-text-muted, #6b7280)',
  marginBottom: '16px',
};

const rentalFooterStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  marginTop: 'auto',
  borderTop: '1px solid var(--color-border, #e5e7eb)',
  paddingTop: '12px',
};

const rateContainerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '4px',
};

const rateStyles: React.CSSProperties = {
  fontSize: 'var(--text-base, 1rem)',
  fontWeight: 850,
  color: '#1f2937',
};

const rateUnitStyles: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--color-text-muted, #6b7280)',
  fontWeight: 600,
};

const viewDetailsBtnStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs, 0.75rem)',
  fontWeight: 700,
  color: 'var(--color-primary, #ff7a00)',
};

const loadingGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  gap: '24px',
};

const loadingCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: 'var(--radius-lg, 12px)',
  border: '1px solid var(--color-border, #e5e7eb)',
  padding: '16px',
};



const paginationStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '16px',
  marginTop: '40px',
};

const pageBtnStyles: React.CSSProperties = {
  padding: '8px 16px',
  border: '1px solid var(--color-border, #e5e7eb)',
  borderRadius: '8px',
  backgroundColor: '#ffffff',
  fontSize: 'var(--text-sm, 0.875rem)',
  fontWeight: 600,
  color: '#4b5563',
};

const pageIndicatorStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm, 0.875rem)',
  fontWeight: 600,
  color: 'var(--color-text-muted, #6b7280)',
};
