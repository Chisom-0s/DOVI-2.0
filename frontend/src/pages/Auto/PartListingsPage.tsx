import { useEffect, useState, useCallback } from 'react';
import AutoSubNav from '@/components/auto/AutoSubNav';
import AutoComingSoon from '@/components/auto/AutoComingSoon';
import { autoApi } from '@/api/auto';
import type { AutoPartSummary } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Link } from 'react-router-dom';
import { NoInternetBanner } from '@/components/common/NoInternetBanner';
import toast from 'react-hot-toast';

export default function PartListingsPage() {
  // Filters State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number | ''>('');
  const [partType, setPartType] = useState('');
  const [condition, setCondition] = useState('');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [inStock, setInStock] = useState(false);

  // Pagination & Load States
  const [parts, setParts] = useState<AutoPartSummary[]>([]);
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

  // Fetch Parts
  const fetchParts = useCallback(async () => {
    try {
      setIsLoading(true);
      const queryFilters: Record<string, any> = {
        page: currentPage,
        q: debouncedSearch || undefined,
        make: make || undefined,
        model: model || undefined,
        year: year || undefined,
        part_type: partType || undefined,
        condition: condition || undefined,
        min_price: minPrice || undefined,
        max_price: maxPrice || undefined,
        in_stock: inStock ? 'true' : undefined,
      };

      const data = await autoApi.listParts(queryFilters);
      setParts(data.results);
      setTotalPages(Math.ceil(data.count / 10) || 1); // Assuming 10 items per page
      setError(null);
    } catch (err) {
      console.error('Failed to fetch parts:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, make, model, year, partType, condition, minPrice, maxPrice, inStock]);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  const handleClearFilters = () => {
    setSearch('');
    setMake('');
    setModel('');
    setYear('');
    setPartType('');
    setCondition('');
    setMinPrice('');
    setMaxPrice('');
    setInStock(false);
    setCurrentPage(1);
    toast.success('Filters cleared');
  };

  if (error) {
    if (!navigator.onLine || error?.code === 'NETWORK_ERROR' || error?.message?.toLowerCase().includes('internet signal')) {
      return (
        <div style={containerStyles}>
          <AutoSubNav />
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 16px' }}>
            <NoInternetBanner onRetry={() => window.location.reload()} />
          </div>
        </div>
      );
    }
    return (
      <AutoComingSoon sectionName="Car Parts" backPath="/auto" backLabel="Back to Auto" />
    );
  }

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
                <span>Filter Parts</span>
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
              <label style={labelStyles}>Search Parts</label>
              <input
                type="text"
                style={inputStyles}
                value={search}
                placeholder="e.g. Brake pads, spark plug"
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div style={filterSectionStyles}>
              <label style={labelStyles}>Compatible Make</label>
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
              <label style={labelStyles}>Compatible Model</label>
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
              <label style={labelStyles}>Compatible Year</label>
              <input
                type="number"
                style={inputStyles}
                value={year}
                placeholder="e.g. 2020"
                onChange={(e) => {
                  setYear(e.target.value ? parseInt(e.target.value) : '');
                  setCurrentPage(1);
                }}
              />
            </div>

            <div style={filterSectionStyles}>
              <label style={labelStyles}>Part Category/Type</label>
              <select
                style={selectStyles}
                value={partType}
                onChange={(e) => {
                  setPartType(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Categories</option>
                <option value="OEM">OEM (Original)</option>
                <option value="AFTERMARKET">Aftermarket</option>
              </select>
            </div>

            <div style={filterSectionStyles}>
              <label style={labelStyles}>Condition</label>
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
                <option value="USED">Used (Refurbished)</option>
              </select>
            </div>

            <div style={filterSectionStyles}>
              <label style={labelStyles}>Price Range (₦)</label>
              <div style={rangeGridStyles}>
                <input
                  type="number"
                  placeholder="Min"
                  style={inputStyles}
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value ? parseFloat(e.target.value) : '');
                    setCurrentPage(1);
                  }}
                />
                <input
                  type="number"
                  placeholder="Max"
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
              <label style={checkboxLabelStyles}>
                <input
                  type="checkbox"
                  style={checkboxStyles}
                  checked={inStock}
                  onChange={(e) => {
                    setInStock(e.target.checked);
                    setCurrentPage(1);
                  }}
                />
                In Stock Only
              </label>
            </div>
          </aside>

          {/* Parts Grid Area */}
          <main style={gridContainerStyles}>
            {isLoading ? (
              <div style={loadingGridStyles}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} style={loadingCardStyles}>
                    <Skeleton height="160px" borderRadius="8px" />
                    <div style={{ padding: '12px 0 0 0' }}>
                      <Skeleton width="70%" height="1.1rem" />
                      <div style={{ margin: '8px 0' }} />
                      <Skeleton width="40%" height="1rem" />
                    </div>
                  </div>
                ))}
              </div>
            ) : parts.length === 0 ? (
              <EmptyState
                title="No Auto Parts Found"
                subtitle="Try loosening your search filters or browse all parts."
                action={{
                  label: 'Clear Filters',
                  onClick: handleClearFilters,
                }}
              />
            ) : (
              <>
                <div style={listingsHeaderStyles}>
                  <p style={countStyles}>{parts.length} parts found</p>
                </div>

                <div style={listingGridStyles}>
                  {parts.map((part) => (
                    <Link key={part.id} to={`/auto/parts/${part.id}`} style={partCardStyles}>
                      <div style={imgContainerStyles}>
                        {part.primary_image_url ? (
                          <img src={part.primary_image_url} alt={part.name} style={imgStyles} />
                        ) : (
                          <div style={placeholderImgStyles}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="3"></circle>
                              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                          </div>
                        )}
                        <span style={partTypeBadgeStyles}>{part.part_type}</span>
                      </div>
                      <div style={partDetailsStyles}>
                        <span style={partNumberStyles}>Part #: {part.part_number}</span>
                        <h3 style={partTitleStyles}>{part.name}</h3>

                        <div style={compRowStyles}>
                          <span style={compTitleStyles}>Fits:</span>
                          <span style={compTextStyles}>
                            {part.compatible_vehicles && part.compatible_vehicles.length > 0
                              ? part.compatible_vehicles.map((v) => `${v.make} ${v.model} (${v.year_from}-${v.year_to})`).join(', ')
                              : 'Universal Fit'}
                          </span>
                        </div>

                        <div style={partFooterStyles}>
                          <div style={priceContainerStyles}>
                            <span style={priceStyles}>₦{parseFloat(part.price).toLocaleString()}</span>
                            {part.stock_quantity <= 3 && part.stock_quantity > 0 && (
                              <span style={lowStockStyles}>Only {part.stock_quantity} left</span>
                            )}
                            {part.stock_quantity === 0 && (
                              <span style={outOfStockStyles}>Out of Stock</span>
                            )}
                          </div>
                          <span style={viewDetailsBtnStyles}>Details &rarr;</span>
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

const checkboxLabelStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: 'var(--text-sm, 0.875rem)',
  color: '#1f2937',
  cursor: 'pointer',
  fontWeight: 500,
};

const checkboxStyles: React.CSSProperties = {
  width: '16px',
  height: '16px',
  cursor: 'pointer',
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

const partCardStyles: React.CSSProperties = {
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

const partTypeBadgeStyles: React.CSSProperties = {
  position: 'absolute',
  top: '12px',
  left: '12px',
  backgroundColor: '#1f2937',
  color: '#ffffff',
  fontSize: '9px',
  fontWeight: 700,
  padding: '2px 8px',
  borderRadius: '4px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const partDetailsStyles: React.CSSProperties = {
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
};

const partNumberStyles: React.CSSProperties = {
  fontSize: '10px',
  color: 'var(--color-text-muted, #6b7280)',
  fontWeight: 600,
  textTransform: 'uppercase',
  marginBottom: '4px',
};

const partTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-base, 1rem)',
  fontWeight: 700,
  color: '#1f2937',
  marginBottom: '8px',
  lineHeight: 1.3,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  height: '2.6rem',
};

const compRowStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs, 0.75rem)',
  color: '#4b5563',
  marginBottom: '16px',
  display: 'flex',
  gap: '4px',
};

const compTitleStyles: React.CSSProperties = {
  fontWeight: 700,
  flexShrink: 0,
};

const compTextStyles: React.CSSProperties = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const partFooterStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  marginTop: 'auto',
  borderTop: '1px solid var(--color-border, #e5e7eb)',
  paddingTop: '12px',
};

const priceContainerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const priceStyles: React.CSSProperties = {
  fontSize: 'var(--text-base, 1rem)',
  fontWeight: 800,
  color: '#1f2937',
};

const lowStockStyles: React.CSSProperties = {
  fontSize: '9px',
  color: 'var(--color-danger, #ef4444)',
  fontWeight: 700,
  marginTop: '2px',
};

const outOfStockStyles: React.CSSProperties = {
  fontSize: '9px',
  color: 'var(--color-text-muted, #6b7280)',
  fontWeight: 700,
  marginTop: '2px',
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
