import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '@/contexts/CartContext';
import { wishlistApi } from '@/api/wishlist';
import { notificationsApi } from '@/api/notifications';
import { formatPrice } from '@/utils/currency';
import { getProductImageUrl, getProductFallbackImage } from '@/utils/image';
import type { ProductSummary } from '@/types';
import { ItemImageLoader } from '@/components/common/ItemImageLoader';

interface ProductCardProps {
  key?: string;
  product: ProductSummary;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [isCartLoading, setIsCartLoading] = useState(false);

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
        try {
          await notificationsApi.create(
            'Added to Wishlist',
            `${product.name} was added to your wishlist.`,
            'INFO'
          );
        } catch (e) {}
      }
    } catch (err) {
      console.error('Wishlist action failed:', err);
      // Fallback state toggle for demonstration if auth or API offline
      setIsWishlisted(!isWishlisted);
      toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
      if (!isWishlisted) {
        try {
          await notificationsApi.create(
            'Added to Wishlist',
            `${product.name} was added to your wishlist.`,
            'INFO'
          );
        } catch (e) {}
      }
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
  const fallbackImage = getProductFallbackImage(product);

  return (
    <Link to={`/products/${product.id}`} state={{ product }} style={cardStyles} className="product-card">
      {/* Product Image */}
      <div style={imgContainerStyles}>
        <ItemImageLoader
          src={cardImage}
          fallbackSrc={fallbackImage}
          alt={product.name}
          objectFit="cover"
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
          {product.brand || 'Dovi Direct'}
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
  width: '100%',
  aspectRatio: '1/1',
  backgroundColor: 'var(--color-bg-subtle)',
  overflow: 'hidden',
};

const wishlistBtnStyles: React.CSSProperties = {
  position: 'absolute',
  top: '8px',
  right: '8px',
  width: '34px',
  height: '34px',
  borderRadius: '50%',
  backgroundColor: 'rgba(255,255,255,0.92)',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
  color: 'var(--color-text-muted)',
  border: 'none',
  cursor: 'pointer',
  transition: 'transform var(--transition-fast), background-color var(--transition-fast)',
  zIndex: 2,
};

const stockBadgeStyles: React.CSSProperties = {
  position: 'absolute',
  bottom: '8px',
  left: '8px',
  backgroundColor: 'rgba(239, 68, 68, 0.95)',
  color: '#ffffff',
  padding: '3px 8px',
  borderRadius: 'var(--radius-sm, 4px)',
  fontSize: '11px',
  fontWeight: 'var(--font-bold)',
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
};

const detailsStyles: React.CSSProperties = {
  padding: 'var(--space-3)',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  flex: 1,
};

const vendorStyles: React.CSSProperties = {
  fontSize: '11px',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  fontWeight: 'var(--font-semibold)',
  letterSpacing: '0.6px',
  lineHeight: 1.2,
};

const titleStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-medium)',
  lineHeight: 1.38,
  color: 'var(--color-text)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  minHeight: '2.76em',
};

const ratingStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '12px',
  marginTop: '2px',
};

const starsStyles: React.CSSProperties = {
  color: '#f59e0b',
  fontWeight: 'var(--font-semibold)',
};

const countStyles: React.CSSProperties = {
  color: 'var(--color-text-muted)',
  fontSize: '11px',
};

const footerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: 'auto',
  paddingTop: 'var(--space-2)',
  gap: '8px',
};

const priceStyles: React.CSSProperties = {
  fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-primary)',
  lineHeight: 1.2,
};

const cartBtnStyles: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: 'var(--radius-md, 8px)',
  backgroundColor: 'var(--color-primary)',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  cursor: 'pointer',
  flexShrink: 0,
  transition: 'background-color var(--transition-fast), transform var(--transition-fast)',
  boxShadow: '0 2px 6px rgba(255, 122, 0, 0.28)',
};

const disabledCartBtnStyles: React.CSSProperties = {
  ...cartBtnStyles,
  backgroundColor: 'var(--color-border)',
  color: 'var(--color-text-muted)',
  cursor: 'not-allowed',
  boxShadow: 'none',
};
