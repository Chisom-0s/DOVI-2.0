import { useEffect, useState, useCallback } from 'react';
import AutoSubNav from '@/components/auto/AutoSubNav';
import { autoApi } from '@/api/auto';
import { cartApi } from '@/api/cart';
import type { AutoAccessorySummary } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function AccessoryListingsPage() {
  const categories = [
    { key: '', label: 'All Accessories' },
    { key: 'electronics', label: 'Car Electronics' },
    { key: 'dashcams', label: 'Dashcams & Cameras' },
    { key: 'floor_mats', label: 'Floor Mats' },
    { key: 'seat_covers', label: 'Seat Covers' },
    { key: 'lighting', label: 'Car Lighting' },
    { key: 'interior', label: 'Interior Accessories' },
    { key: 'exterior', label: 'Exterior Accessories' },
  ];

  const [activeCategory, setActiveCategory] = useState('');
  const [accessories, setAccessories] = useState<AutoAccessorySummary[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  // Cart adding state mapping
  const [addingMap, setAddingMap] = useState<Record<string, boolean>>({});

  const fetchAccessories = useCallback(async () => {
    try {
      setIsLoading(true);
      const queryFilters: Record<string, any> = {
        page: currentPage,
        sub_category: activeCategory || undefined,
      };

      const data = await autoApi.listAccessories(queryFilters);
      setAccessories(data.results);
      setTotalPages(Math.ceil(data.count / 10) || 1); // Assuming 10 items per page
      setError(null);
    } catch (err) {
      console.error('Failed to load auto accessories:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, activeCategory]);

  useEffect(() => {
    fetchAccessories();
  }, [fetchAccessories]);

  const handleCategoryChange = (key: string) => {
    setActiveCategory(key);
    setCurrentPage(1);
  };

  const handleAddToCart = async (e: React.MouseEvent, acc: AutoAccessorySummary) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setAddingMap((prev) => ({ ...prev, [acc.id]: true }));
      await cartApi.addItem({
        product_id: acc.id,
        quantity: 1,
      });
      toast.success(`${acc.name} added to cart!`);
      window.dispatchEvent(new CustomEvent('cart:updated'));
    } catch (err) {
      console.error('Failed to add accessory to cart:', err);
      toast.error('Unable to add item to cart');
    } finally {
      setAddingMap((prev) => ({ ...prev, [acc.id]: false }));
    }
  };

  return (
    <div style={containerStyles}>
      <AutoSubNav />

      <div style={mainContentStyles}>
        {/* Category Tabs */}
        <div style={tabsWrapperStyles}>
          <div style={tabsListStyles}>
            {categories.map((cat) => (
              <button
                key={cat.key}
                style={{
                  ...tabBtnStyles,
                  backgroundColor: activeCategory === cat.key ? 'var(--color-primary, #ff7a00)' : '#ffffff',
                  color: activeCategory === cat.key ? '#ffffff' : '#4b5563',
                  borderColor: activeCategory === cat.key ? 'var(--color-primary, #ff7a00)' : '#e5e7eb',
                }}
                onClick={() => handleCategoryChange(cat.key)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Listings Display */}
        {isLoading ? (
          <div style={loadingGridStyles}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} style={loadingCardStyles}>
                <Skeleton height="160px" borderRadius="8px" />
                <div style={{ padding: '12px 0 0 0' }}>
                  <Skeleton width="80%" height="1.1rem" />
                  <div style={{ margin: '8px 0' }} />
                  <Skeleton width="30%" height="1rem" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div style={errorContainerStyles}>
            <ApiErrorMessage error={error} />
          </div>
        ) : accessories.length === 0 ? (
          <EmptyState
            title="No Accessories Found"
            subtitle="There are currently no items matching this category filter."
          />
        ) : (
          <>
            <div style={listingsHeaderStyles}>
              <p style={countStyles}>{accessories.length} accessories found</p>
            </div>

            <div style={listingGridStyles}>
              {accessories.map((acc) => (
                <Link key={acc.id} to={`/auto/accessories/${acc.id}`} style={accCardStyles}>
                  <div style={imgContainerStyles}>
                    {acc.primary_image_url ? (
                      <img src={acc.primary_image_url} alt={acc.name} style={imgStyles} />
                    ) : (
                          <div style={placeholderImgStyles}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="5" y="2" width="14" height="12" rx="2" ry="2"></rect>
                              <line x1="9" y1="22" x2="9" y2="14"></line>
                              <line x1="15" y1="22" x2="15" y2="14"></line>
                            </svg>
                          </div>
                    )}
                    <span style={categoryBadgeStyles}>
                      {acc.sub_category.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={detailsStyles}>
                    <h3 style={titleStyles}>{acc.name}</h3>
                    <p style={sellerNameStyles}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'middle' }}>
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      <span style={{ verticalAlign: 'middle' }}>{acc.vendor?.name || 'Trusted Vendor'}</span>
                    </p>

                    <div style={footerStyles}>
                      <span style={priceStyles}>₦{parseFloat(acc.price).toLocaleString()}</span>
                      <button
                        style={{
                          ...cartBtnStyles,
                          cursor: acc.stock_quantity === 0 || addingMap[acc.id] ? 'not-allowed' : 'pointer',
                          opacity: acc.stock_quantity === 0 ? 0.6 : 1,
                        }}
                        disabled={acc.stock_quantity === 0 || addingMap[acc.id]}
                        onClick={(e) => handleAddToCart(e, acc)}
                      >
                        {acc.stock_quantity === 0
                          ? 'Out of Stock'
                          : addingMap[acc.id]
                            ? 'Adding...'
                            : (
                              <>
                                Add to Cart
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="9" cy="21" r="1"></circle>
                                  <circle cx="20" cy="21" r="1"></circle>
                                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                                </svg>
                              </>
                            )}
                      </button>
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

const tabsWrapperStyles: React.CSSProperties = {
  overflowX: 'auto',
  paddingBottom: '16px',
  marginBottom: '24px',
};

const tabsListStyles: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
};

const tabBtnStyles: React.CSSProperties = {
  padding: '8px 18px',
  borderRadius: '9999px',
  border: '1px solid #e5e7eb',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'all 150ms ease',
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

const accCardStyles: React.CSSProperties = {
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

const categoryBadgeStyles: React.CSSProperties = {
  position: 'absolute',
  top: '12px',
  left: '12px',
  backgroundColor: 'rgba(17, 24, 39, 0.7)',
  color: '#ffffff',
  fontSize: '9px',
  fontWeight: 700,
  padding: '2px 8px',
  borderRadius: '4px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const detailsStyles: React.CSSProperties = {
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
};

const titleStyles: React.CSSProperties = {
  fontSize: 'var(--text-base, 1rem)',
  fontWeight: 700,
  color: '#1f2937',
  marginBottom: '6px',
  lineHeight: 1.3,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  height: '2.6rem',
};

const sellerNameStyles: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--color-text-muted, #6b7280)',
  marginBottom: '12px',
};

const footerStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 'auto',
  borderTop: '1px solid var(--color-border, #e5e7eb)',
  paddingTop: '12px',
};

const priceStyles: React.CSSProperties = {
  fontSize: 'var(--text-base, 1rem)',
  fontWeight: 800,
  color: '#1f2937',
};

const cartBtnStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 14px',
  backgroundColor: 'var(--color-primary, #ff7a00)',
  color: '#ffffff',
  border: 'none',
  borderRadius: '6px',
  fontWeight: 700,
  fontSize: '12px',
  boxShadow: '0 2px 4px rgba(255, 122, 0, 0.15)',
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
};

const pageIndicatorStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm, 0.875rem)',
  fontWeight: 600,
  color: 'var(--color-text-muted, #6b7280)',
};
