import { useEffect, useState, useCallback } from 'react';
import AutoSubNav from '@/components/auto/AutoSubNav';
import { autoApi, type AutoFilters } from '@/api/auto';
import type { AutoListingSummary } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function CarListingsPage() {
  // Filters State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [yearFrom, setYearFrom] = useState<number | ''>('');
  const [yearTo, setYearTo] = useState<number | ''>('');
  const [fuelType, setFuelType] = useState('');
  const [transmission, setTransmission] = useState('');
  const [condition, setCondition] = useState('');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [location, setLocation] = useState('');

  // Pagination & Load States
  const [listings, setListings] = useState<AutoListingSummary[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  // Favorite ID mapping for newly favorited items
  const [favoriteMap, setFavoriteMap] = useState<Record<string, string>>({});
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Search input debouncing (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch listings
  const fetchListings = useCallback(async () => {
    try {
      setIsLoading(true);
      const queryFilters: AutoFilters = {
        page: currentPage,
        make: make || undefined,
        model: model || undefined,
        year_from: yearFrom || undefined,
        year_to: yearTo || undefined,
        fuel_type: fuelType || undefined,
        transmission: transmission || undefined,
        condition: condition || undefined,
        min_price: minPrice || undefined,
        max_price: maxPrice || undefined,
        location: location || undefined,
      };

      // If we have search term, we can append it or handle it in params
      const data = await autoApi.listListings({
        ...queryFilters,
        // E.g. we can pass a 'q' or search param if the API accepts it, or filter by make/model
      });

      setListings(data.results);
      setTotalPages(Math.ceil(data.count / 10) || 1); // Assuming 10 items per page
      setError(null);
    } catch (err) {
      console.error('Failed to fetch listings:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, make, model, yearFrom, yearTo, fuelType, transmission, condition, minPrice, maxPrice, location, debouncedSearch]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Clear all filters
  const handleClearFilters = () => {
    setSearch('');
    setMake('');
    setModel('');
    setYearFrom('');
    setYearTo('');
    setFuelType('');
    setTransmission('');
    setCondition('');
    setMinPrice('');
    setMaxPrice('');
    setLocation('');
    setCurrentPage(1);
    toast.success('Filters cleared');
  };

  // Favorite toggle
  const toggleFavorite = async (e: React.MouseEvent, car: AutoListingSummary) => {
    e.preventDefault();
    e.stopPropagation();

    const isFav = car.is_favorited;
    const listingId = car.id;

    try {
      if (isFav) {
        // Unfavorite
        const favId = favoriteMap[listingId] || listingId; // Fallback to listingId if favorite id is unknown
        await autoApi.removeFavorite(favId);
        setListings((prev) =>
          prev.map((item) => (item.id === listingId ? { ...item, is_favorited: false } : item))
        );
        toast.success('Removed from favorites');
      } else {
        // Favorite
        const res = await autoApi.addFavorite(listingId);
        if (res && res.id) {
          setFavoriteMap((prev) => ({ ...prev, [listingId]: res.id }));
        }
        setListings((prev) =>
          prev.map((item) => (item.id === listingId ? { ...item, is_favorited: true } : item))
        );
        toast.success('Added to favorites');
      }
    } catch (err) {
      console.error('Favorite operation failed:', err);
      toast.error('Unable to update favorites');
    }
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
                <span>Filter &amp; Search</span>
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
              <label style={labelStyles}>Search Keyword</label>
              <input
                type="text"
                style={inputStyles}
                value={search}
                placeholder="e.g. Camry, V8, Toyota"
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div style={filterSectionStyles}>
              <label style={labelStyles}>Make</label>
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
              <label style={labelStyles}>Model</label>
              <input
                type="text"
                style={inputStyles}
                value={model}
                placeholder="e.g. Corolla"
                onChange={(e) => {
                  setModel(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div style={filterSectionStyles}>
              <label style={labelStyles}>Vehicle Condition</label>
              <select
                style={selectStyles}
                value={condition}
                onChange={(e) => {
                  setCondition(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Conditions</option>
                <option value="NEW">New</option>
                <option value="USED">Used</option>
              </select>
            </div>

            <div style={filterSectionStyles}>
              <label style={labelStyles}>Transmission</label>
              <select
                style={selectStyles}
                value={transmission}
                onChange={(e) => {
                  setTransmission(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Transmissions</option>
                <option value="AUTOMATIC">Automatic</option>
                <option value="MANUAL">Manual</option>
                <option value="CVT">CVT</option>
              </select>
            </div>

            <div style={filterSectionStyles}>
              <label style={labelStyles}>Fuel Type</label>
              <select
                style={selectStyles}
                value={fuelType}
                onChange={(e) => {
                  setFuelType(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Fuel Types</option>
                <option value="PETROL">Petrol</option>
                <option value="DIESEL">Diesel</option>
                <option value="ELECTRIC">Electric</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </div>

            <div style={filterSectionStyles}>
              <label style={labelStyles}>Year Range</label>
              <div style={rangeGridStyles}>
                <input
                  type="number"
                  placeholder="Min"
                  style={inputStyles}
                  value={yearFrom}
                  onChange={(e) => {
                    setYearFrom(e.target.value ? parseInt(e.target.value) : '');
                    setCurrentPage(1);
                  }}
                />
                <input
                  type="number"
                  placeholder="Max"
                  style={inputStyles}
                  value={yearTo}
                  onChange={(e) => {
                    setYearTo(e.target.value ? parseInt(e.target.value) : '');
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            <div style={filterSectionStyles}>
              <label style={labelStyles}>Price Range (₦)</label>
              <div style={rangeGridStyles}>
                <input
                  type="number"
                  placeholder="Min Price"
                  style={inputStyles}
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value ? parseFloat(e.target.value) : '');
                    setCurrentPage(1);
                  }}
                />
                <input
                  type="number"
                  placeholder="Max Price"
                  style={inputStyles}
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value ? parseFloat(e.target.value) : '');
                    setCurrentPage(1);
                  }}
                />
              </div>
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
          </aside>

          {/* Listings Display Area */}
          <main style={gridContainerStyles}>
            {isLoading ? (
              <div style={loadingGridStyles}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} style={loadingCardStyles}>
                    <Skeleton height="180px" borderRadius="12px" />
                    <div style={{ padding: '16px 0 0 0' }}>
                      <Skeleton width="60%" height="1.25rem" />
                      <div style={{ margin: '8px 0' }} />
                      <Skeleton width="45%" height="1rem" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div style={errorContainerStyles}>
                <ApiErrorMessage error={error} />
              </div>
            ) : listings.length === 0 ? (
              <EmptyState
                title="No Cars Match Your Filters"
                subtitle="Try loosening your search options or clearing filters to browse all vehicles."
                action={{
                  label: 'Clear Filters',
                  onClick: handleClearFilters,
                }}
              />
            ) : (
              <>
                <div style={listingsHeaderStyles}>
                  <p style={countStyles}>{listings.length} vehicles found</p>
                </div>

                <div style={listingGridStyles}>
                  {listings.map((car) => (
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
                        <button
                          style={{
                            ...favBtnStyles,
                            backgroundColor: car.is_favorited ? 'var(--color-primary, #ff7a00)' : 'rgba(17, 24, 39, 0.6)',
                          }}
                          onClick={(e) => toggleFavorite(e, car)}
                          title={car.is_favorited ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          {car.is_favorited ? '★' : '☆'}
                        </button>
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
                        <p style={sellerNameStyles}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'middle' }}>
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                          <span style={{ verticalAlign: 'middle' }}>{car.seller?.name || 'Private Seller'}</span>
                        </p>
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
  display: 'none', // Overridden in mobile view css
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

const selectStyles: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--color-border, #e5e7eb)',
  borderRadius: 'var(--radius-md, 8px)',
  fontSize: 'var(--text-sm, 0.875rem)',
  color: '#1f2937',
  backgroundColor: '#f9fafb',
  outline: 'none',
  cursor: 'pointer',
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

const listingCardStyles: React.CSSProperties = {
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
  height: '180px',
  backgroundColor: '#e5e7eb',
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
};

const conditionBadgeStyles: React.CSSProperties = {
  position: 'absolute',
  top: '12px',
  left: '12px',
  backgroundColor: 'var(--color-primary, #ff7a00)',
  color: '#ffffff',
  fontSize: '10px',
  fontWeight: 700,
  padding: '2px 8px',
  borderRadius: '4px',
  textTransform: 'uppercase',
};

const favBtnStyles: React.CSSProperties = {
  position: 'absolute',
  top: '12px',
  right: '12px',
  color: '#ffffff',
  border: 'none',
  borderRadius: '50%',
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '18px',
  cursor: 'pointer',
  transition: 'background-color 150ms ease',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

const listingDetailsStyles: React.CSSProperties = {
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
};

const listingYearStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs, 0.75rem)',
  color: 'var(--color-primary, #ff7a00)',
  fontWeight: 600,
  marginBottom: '4px',
};

const listingTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-base, 1rem)',
  fontWeight: 700,
  color: '#1f2937',
  marginBottom: '8px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const listingSpecsStyles: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  marginBottom: '12px',
  flexWrap: 'wrap',
};

const specTagStyles: React.CSSProperties = {
  backgroundColor: '#f3f4f6',
  color: '#4b5563',
  fontSize: '10px',
  fontWeight: 500,
  padding: '2px 6px',
  borderRadius: '4px',
};

const sellerNameStyles: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--color-text-muted, #6b7280)',
  marginBottom: '12px',
};

const listingFooterStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 'auto',
  borderTop: '1px solid var(--color-border, #e5e7eb)',
  paddingTop: '12px',
};

const listingPriceStyles: React.CSSProperties = {
  fontSize: 'var(--text-base, 1rem)',
  fontWeight: 800,
  color: '#1f2937',
};

const listingLocationStyles: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--color-text-muted, #6b7280)',
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

const errorContainerStyles: React.CSSProperties = {
  padding: '32px',
  textAlign: 'center',
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
  transition: 'all 150ms ease',
};

const pageIndicatorStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm, 0.875rem)',
  fontWeight: 600,
  color: 'var(--color-text-muted, #6b7280)',
};
