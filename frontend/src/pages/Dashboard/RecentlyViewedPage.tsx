import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { recentlyViewedApi } from '@/api/recently-viewed';
import { formatPrice } from '@/utils/currency';
import { getProductImageUrl } from '@/utils/image';
import type { ProductSummary } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';

export default function RecentlyViewedPage() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecentlyViewed = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await recentlyViewedApi.list();
      setProducts(data);
    } catch {
      toast.error('Failed to load recently viewed products.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentlyViewed();
  }, [fetchRecentlyViewed]);

  return (
    <div style={containerStyles}>
      <h2 style={titleStyles}>Recently Viewed</h2>
      <p style={subtitleStyles}>The list of products you recently viewed in our store.</p>

      {isLoading && (
        <div style={gridStyles}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} width="100%" height="280px" borderRadius="var(--radius-lg)" />
          ))}
        </div>
      )}

      {!isLoading && products.length === 0 && (
        <div style={emptyStyles}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          <p style={emptyTextStyles}>No recently viewed products.</p>
          <Link to="/products" style={actionBtnStyles}>Browse Products</Link>
        </div>
      )}

      {!isLoading && products.length > 0 && (
        <div style={gridStyles}>
          {products.map((product) => (
            <div key={product.id} style={cardStyles}>
              <div style={imgWrapperStyles}>
                <img
                  src={getProductImageUrl(product)}
                  alt={product.name}
                  style={productImgStyles}
                  onError={e => { (e.target as HTMLImageElement).src = '/logo.jpg?v=2'; }}
                />
              </div>

              <div style={infoWrapperStyles}>
                <Link to={`/products/${product.id}`} style={nameStyles}>
                  {product.name}
                </Link>
                <div style={ratingRowStyles}>
                  <span style={{ color: 'var(--color-warning)' }}>
                    ★ {product.average_rating.toFixed(1)}
                  </span>
                  <span style={reviewCountStyles}>({product.review_count})</span>
                </div>
                <div style={priceRowStyles}>
                  <strong style={priceStyles}>{formatPrice(product)}</strong>
                  {product.stock_quantity <= 0 ? (
                    <span style={outOfStockStyles}>Out of Stock</span>
                  ) : (
                    <span style={inStockStyles}>In Stock</span>
                  )}
                </div>
                <Link to={`/products/${product.id}`} style={viewBtnStyles}>
                  View Product
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------
// Styling
// ----------------------------------------------------------
const containerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
};

const titleStyles: React.CSSProperties = {
  fontSize: 'var(--text-lg)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  margin: 0,
};

const subtitleStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
  lineHeight: 1.4,
};

const gridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: 'var(--space-4)',
  marginTop: 'var(--space-2)',
};

const cardStyles: React.CSSProperties = {
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: '#ffffff',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
};

const imgWrapperStyles: React.CSSProperties = {
  width: '100%',
  height: '180px',
  backgroundColor: 'var(--color-bg-subtle)',
};

const productImgStyles: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const infoWrapperStyles: React.CSSProperties = {
  padding: 'var(--space-3)',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  flex: 1,
};

const nameStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  textDecoration: 'none',
  lineHeight: 1.4,
  height: '40px',
  overflow: 'hidden',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
};

const ratingRowStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: 'var(--text-xs)',
};

const reviewCountStyles: React.CSSProperties = {
  color: 'var(--color-text-muted)',
};

const priceRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '2px',
};

const priceStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text)',
};

const inStockStyles: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-success)',
};

const outOfStockStyles: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-danger)',
};

const viewBtnStyles: React.CSSProperties = {
  marginTop: 'var(--space-2)',
  padding: '8px',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  textAlign: 'center',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-bold)',
  textDecoration: 'none',
};

const emptyStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--space-3)',
  padding: 'var(--space-16) var(--space-4)',
  textAlign: 'center',
};

const emptyTextStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
};

const actionBtnStyles: React.CSSProperties = {
  padding: '10px 24px',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  borderRadius: 'var(--radius-md)',
  textDecoration: 'none',
  fontWeight: 'var(--font-bold)',
  fontSize: 'var(--text-sm)',
};
