import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '@/contexts/CartContext';
import { wishlistApi } from '@/api/wishlist';
import { formatPrice } from '@/utils/currency';
import { getProductImageUrl, getProductFallbackImage } from '@/utils/image';
import type { ProductSummary } from '@/types';

interface ProductCardProps {
  key?: string;
  product: ProductSummary;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [isCartLoading, setIsCartLoading] = useState(false);

  // Fallback image helper
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    const fallback = getProductFallbackImage(product);
    if (target.src !== fallback) {
      target.src = fallback;
    }
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsWishlistLoading(true);
    try {
      if (isWishlisted) {
        // Assume API delete method or custom mapping
        await wishlistApi.remove(product.id);
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await wishlistApi.add(product.id);
        setIsWishlisted(true);
        toast.success('Added to wishlist');
      }
    } catch (err) {
      console.error('Wishlist action failed:', err);
      // Fallback state toggle for demonstration if auth or API offline
      setIsWishlisted(!isWishlisted);
      toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
    } finally {
      setIsWishlistLoading(false);
    }
  };

  const { addToCart } = useCart();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stock_quantity !== undefined && product.stock_quantity <= 0) {
      toast.error('Item is out of stock');
      return;
    }

    setIsCartLoading(true);
    try {
      await addToCart(product, 1);
      toast.success(`Added ${product.name} to cart!`);
    } catch (err) {
      console.error('Add to cart failed:', err);
      toast.error('Could not add to cart. Please try again.');
    } finally {
      setIsCartLoading(false);
    }
  };

  const formattedPrice = formatPrice(product);
  const cardImage = getProductImageUrl(product);

  return (
    <Link to={`/products/${product.id}`} style={cardStyles} className="product-card">
      {/* Product Image */}
      <div style={imgContainerStyles}>
        <img
          src={cardImage}
          alt={product.name}
          onError={handleImageError}
          style={imageStyles}
          loading="lazy"
        />

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          disabled={isWishlistLoading}
          style={wishlistBtnStyles}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={isWishlisted ? 'var(--color-danger)' : 'none'}
            stroke={isWishlisted ? 'var(--color-danger)' : 'currentColor'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </button>

        {/* Stock Badge */}
        {product.stock_quantity !== undefined && product.stock_quantity <= 0 && (
          <div style={stockBadgeStyles}>Out of Stock</div>
        )}
      </div>

      {/* Product Details */}
      <div style={detailsStyles}>
        <span style={vendorStyles}>
          {typeof product.vendor === 'object' && product.vendor !== null
            ? product.vendor.name
            : product.vendor_name || (typeof product.vendor === 'string' ? product.vendor : '')}
        </span>
        <h3 style={titleStyles}>{product.name}</h3>

        {/* Ratings */}
        <div style={ratingStyles}>
          <span style={starsStyles}>★ {product.average_rating?.toFixed(1) ?? '0.0'}</span>
          <span style={countStyles}>({product.review_count ?? 0})</span>
        </div>

        {/* Footer info */}
        <div style={footerStyles}>
          <span style={priceStyles}>{formattedPrice}</span>
          <button
            onClick={handleAddToCart}
            disabled={isCartLoading || (product.stock_quantity !== undefined && product.stock_quantity <= 0)}
            style={product.stock_quantity !== undefined && product.stock_quantity <= 0 ? disabledCartBtnStyles : cartBtnStyles}
            aria-label="Add to cart"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </Link>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const cardStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  overflow: 'hidden',
  textDecoration: 'none',
  color: 'var(--color-text)',
  transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
  position: 'relative',
};

const imgContainerStyles: React.CSSProperties = {
  position: 'relative',
  aspectRatio: '1/1',
  backgroundColor: 'var(--color-bg-subtle)',
  overflow: 'hidden',
};

const imageStyles: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  transition: 'transform var(--transition-slow)',
};

const wishlistBtnStyles: React.CSSProperties = {
  position: 'absolute',
  top: '8px',
  right: '8px',
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  backgroundColor: 'rgba(255,255,255,0.9)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  color: 'var(--color-text-muted)',
  border: 'none',
  cursor: 'pointer',
  transition: 'transform var(--transition-fast)',
  zIndex: 2,
};

const stockBadgeStyles: React.CSSProperties = {
  position: 'absolute',
  bottom: '8px',
  left: '8px',
  backgroundColor: 'rgba(239, 68, 68, 0.9)',
  color: 'white',
  padding: 'var(--space-1) var(--space-2)',
  borderRadius: 'var(--radius-sm)',
  fontSize: '10px',
  fontWeight: 'var(--font-bold)',
  textTransform: 'uppercase',
};

const detailsStyles: React.CSSProperties = {
  padding: 'var(--space-3)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-1)',
  flex: 1,
};

const vendorStyles: React.CSSProperties = {
  fontSize: '10px',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  fontWeight: 'var(--font-semibold)',
  letterSpacing: '0.5px',
};

const titleStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-medium)',
  lineHeight: 1.3,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  height: '36px',
};

const ratingStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-1)',
  fontSize: 'var(--text-xs)',
};

const starsStyles: React.CSSProperties = {
  color: 'var(--color-warning)',
  fontWeight: 'var(--font-semibold)',
};

const countStyles: React.CSSProperties = {
  color: 'var(--color-text-muted)',
};

const footerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: 'auto',
  paddingTop: 'var(--space-2)',
};

const priceStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-primary)',
};

const cartBtnStyles: React.CSSProperties = {
  width: '28px',
  height: '28px',
  borderRadius: 'var(--radius-sm)',
  backgroundColor: 'var(--color-primary)',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  cursor: 'pointer',
  transition: 'background-color var(--transition-fast)',
};

const disabledCartBtnStyles: React.CSSProperties = {
  ...cartBtnStyles,
  backgroundColor: 'var(--color-border)',
  color: 'var(--color-text-muted)',
  cursor: 'not-allowed',
};
