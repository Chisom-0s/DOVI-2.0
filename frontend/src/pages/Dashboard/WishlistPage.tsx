import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { wishlistApi } from '@/api/wishlist';
import type { WishlistItem } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWishlist = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await wishlistApi.list();
      setItems(data);
    } catch {
      toast.error('Failed to load wishlist.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleRemove = async (id: string) => {
    try {
      await wishlistApi.remove(id);
      setItems(prev => prev.filter(item => item.id !== id));
      toast.success('Removed from wishlist.');
    } catch {
      toast.error('Failed to remove item.');
    }
  };

  const formatCurrency = (val: string) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(parseFloat(val));

  return (
    <div style={containerStyles}>
      <h2 style={titleStyles}>My Wishlist</h2>

      {isLoading && (
        <div style={gridStyles}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} width="100%" height="280px" borderRadius="var(--radius-lg)" />
          ))}
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div style={emptyStyles}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <h3 style={emptyTitleStyles}>Your wishlist is empty</h3>
          <p style={emptySubStyles}>Save items you want to check out later here.</p>
          <Link to="/products" style={actionBtnStyles}>Start Browsing</Link>
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div style={gridStyles}>
          {items.map((item) => (
            <div key={item.id} style={cardStyles}>
              {/* Product Image */}
              <div style={imgWrapperStyles}>
                <img
                  src={item.product.primary_image_url || '/logo.jpg?v=2'}
                  alt={item.product.name}
                  style={productImgStyles}
                  onError={e => { (e.target as HTMLImageElement).src = '/logo.jpg?v=2'; }}
                />
                <button
                  onClick={() => handleRemove(item.id)}
                  style={removeIconStyles}
                  title="Remove from wishlist"
                >
                  ✕
                </button>
              </div>

              {/* Product Details */}
              <div style={infoWrapperStyles}>
                <Link to={`/products/${item.product.id}`} style={nameStyles}>
                  {item.product.name}
                </Link>
                <div style={ratingRowStyles}>
                  <span style={{ color: 'var(--color-warning)' }}>
                    ★ {item.product.average_rating.toFixed(1)}
                  </span>
                  <span style={reviewCountStyles}>({item.product.review_count})</span>
                </div>
                <div style={priceRowStyles}>
                  <strong style={priceStyles}>{formatCurrency(item.product.price)}</strong>
                  {item.product.stock_quantity <= 0 ? (
                    <span style={outOfStockStyles}>Out of Stock</span>
                  ) : (
                    <span style={inStockStyles}>In Stock</span>
                  )}
                </div>
                <Link
                  to={`/products/${item.product.id}`}
                  style={{
                    ...viewBtnStyles,
                    pointerEvents: item.product.stock_quantity <= 0 ? 'none' : 'auto',
                    opacity: item.product.stock_quantity <= 0 ? 0.6 : 1,
                  }}
                >
                  {item.product.stock_quantity <= 0 ? 'Unavailable' : 'View Product'}
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
  gap: 'var(--space-4)',
};

const titleStyles: React.CSSProperties = {
  fontSize: 'var(--text-lg)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  margin: 0,
};

const gridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: 'var(--space-4)',
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
  position: 'relative',
};

const productImgStyles: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const removeIconStyles: React.CSSProperties = {
  position: 'absolute',
  top: '10px',
  right: '10px',
  width: '26px',
  height: '26px',
  borderRadius: '50%',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-danger)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  fontSize: '11px',
  fontWeight: 'bold',
  boxShadow: 'var(--shadow-sm)',
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

const emptyTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-md)',
  fontWeight: 'var(--font-bold)',
  margin: 0,
};

const emptySubStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
  margin: 0,
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
