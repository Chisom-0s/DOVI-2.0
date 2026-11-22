const fs = require('fs');

const productCardContent = `import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '@/contexts/CartContext';
import { wishlistApi } from '@/api/wishlist';
import { notificationsApi } from '@/api/notifications';
import { formatPrice } from '@/utils/currency';
import { getProductImageUrl, getProductFallbackImage } from '@/utils/image';
import type { ProductSummary } from '@/types';
import { ItemImageLoader } from '@/components/common/ItemImageLoader';
import { isDiscountActiveNow } from '@/services/homepagePlacementService';

interface ProductCardProps {
  key?: string;
  product: ProductSummary;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [now, setNow] = useState<Date>(new Date());

  const hasTimedDiscount = Boolean(product.discount_config?.end_time);

  // Update timer every second only if this specific product has an active timed discount
  useEffect(() => {
    if (!hasTimedDiscount) return;
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [hasTimedDiscount]);

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsWishlistLoading(true);
    try {
      if (isWishlisted) {
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
            \`\${product.name} was added to your wishlist.\`,
            'INFO'
          );
        } catch {}
      }
    } catch {
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
      toast.success(\`Added \${product.name} to cart!\`);
    } catch {
      toast.error('Could not add to cart. Please try again.');
    } finally {
      setIsCartLoading(false);
    }
  };

  // Discount validation
  const isDiscountValid = product.discount_config
    ? isDiscountActiveNow(product.discount_config, now)
    : Boolean(product.is_discount || (product.discount_percentage && product.discount_percentage > 0));

  // Individual countdown string calculation
  let countdownText: string | null = null;
  if (isDiscountValid && product.discount_config?.end_time) {
    const endMs = new Date(product.discount_config.end_time).getTime();
    const diff = endMs - now.getTime();
    if (!isNaN(endMs) && diff > 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      const pad = (n: number) => String(n).padStart(2, '0');

      if (hours >= 24) {
        const days = Math.floor(hours / 24);
        const remH = hours % 24;
        countdownText = \`\${days}d \${pad(remH)}h \${pad(minutes)}m\`;
      } else {
        countdownText = \`\${pad(hours)}h \${pad(minutes)}m \${pad(seconds)}s\`;
      }
    }
  }

  // Price calculations
  const effectiveSellingPrice = isDiscountValid
    ? (product.discount_config?.discount_price || product.price || product.base_price)
    : (product.original_price || product.base_price || product.price);

  const effectiveOriginalPrice = isDiscountValid
    ? (product.original_price || product.discount_config?.original_price || product.base_price)
    : null;

  const formattedPrice = formatPrice(effectiveSellingPrice);
  const cardImage = getProductImageUrl(product);
  const fallbackImage = getProductFallbackImage(product);

  const discountPct = product.discount_percentage || (
    effectiveOriginalPrice && Number(effectiveOriginalPrice) > Number(effectiveSellingPrice)
      ? Math.round(((Number(effectiveOriginalPrice) - Number(effectiveSellingPrice)) / Number(effectiveOriginalPrice)) * 100)
      : null
  );

  const isOutOfStock = product.stock_quantity !== undefined && product.stock_quantity <= 0;

  return (
    <Link
      to={\`/products/\${product.id}\`}
      state={{ product }}
      style={cardStyles}
      className="dovi-product-card"
    >
      {/* Product Image Container */}
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
          type="button"
          onClick={handleWishlistToggle}
          disabled={isWishlistLoading}
          style={wishlistBtnStyles}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill={isWishlisted ? '#ef4444' : 'none'}
            stroke={isWishlisted ? '#ef4444' : '#64748b'}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </button>

        {/* Status Badges */}
        {isOutOfStock ? (
          <div style={stockBadgeStyles}>Out of Stock</div>
        ) : isDiscountValid ? (
          <div style={dealBadgeStyles}>
            DEAL {discountPct ? \`-\${discountPct}%\` : ''}
          </div>
        ) : product.is_hot_sale ? (
          <div style={hotBadgeStyles}>🔥 Hot</div>
        ) : product.is_new_arrival ? (
          <div style={newBadgeStyles}>✨ New</div>
        ) : null}
      </div>

      {/* Product Content Details */}
      <div style={detailsStyles}>
        {/* Vendor/Brand Tag */}
        <span style={vendorStyles}>
          {product.brand || product.vendor_name || 'Dovi Direct'}
        </span>

        {/* Title */}
        <h3 style={titleStyles} title={product.name}>
          {product.name}
        </h3>

        {/* Individual Countdown Timer (only when timed discount is active) */}
        {countdownText && (
          <div style={countdownPillStyles}>
            <span style={{ fontSize: '10px' }}>⏱️</span>
            <span>Ends in {countdownText}</span>
          </div>
        )}

        {/* Price & Add to Cart Action Row */}
        <div style={footerStyles}>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={priceStyles}>{formattedPrice}</span>
            {isDiscountValid && effectiveOriginalPrice && Number(effectiveOriginalPrice) > Number(effectiveSellingPrice) && (
              <span style={originalPriceStyles}>
                {formatPrice(effectiveOriginalPrice)}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isCartLoading || isOutOfStock}
            style={isOutOfStock ? disabledCartBtnStyles : cartBtnStyles}
            aria-label="Add to cart"
            title={isOutOfStock ? 'Out of stock' : 'Add to cart'}
          >
            {isCartLoading ? (
              <span style={{ fontSize: '10px' }}>⏳</span>
            ) : (
              <svg
                width="14"
                height="14"
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
            )}
          </button>
        </div>
      </div>
    </Link>
  );
}

// ----------------------------------------------------------
// Streamlined, Responsive Styling Tokens (Compact Heights)
// ----------------------------------------------------------
const cardStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '10px',
  overflow: 'hidden',
  textDecoration: 'none',
  color: '#1f2937',
  transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
  position: 'relative',
  height: '100%',
  width: '100%',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
};

const imgContainerStyles: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  aspectRatio: '1 / 1',
  backgroundColor: '#f8fafc',
  overflow: 'hidden',
};

const wishlistBtnStyles: React.CSSProperties = {
  position: 'absolute',
  top: '6px',
  right: '6px',
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  backgroundColor: 'rgba(255, 255, 255, 0.94)',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
  color: '#64748b',
  border: 'none',
  cursor: 'pointer',
  transition: 'transform 0.15s ease',
  zIndex: 3,
  padding: 0,
};

const badgeBase: React.CSSProperties = {
  position: 'absolute',
  top: '6px',
  left: '6px',
  fontSize: '9.5px',
  fontWeight: 800,
  padding: '2px 6px',
  borderRadius: '4px',
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
  zIndex: 2,
  lineHeight: 1.2,
};

const dealBadgeStyles: React.CSSProperties = {
  ...badgeBase,
  backgroundColor: '#e11d48',
  color: '#ffffff',
};

const hotBadgeStyles: React.CSSProperties = {
  ...badgeBase,
  backgroundColor: '#ea580c',
  color: '#ffffff',
};

const newBadgeStyles: React.CSSProperties = {
  ...badgeBase,
  backgroundColor: '#2563eb',
  color: '#ffffff',
};

const stockBadgeStyles: React.CSSProperties = {
  ...badgeBase,
  backgroundColor: 'rgba(239, 68, 68, 0.95)',
  color: '#ffffff',
};

const detailsStyles: React.CSSProperties = {
  padding: '8px 10px 10px',
  display: 'flex',
  flexDirection: 'column',
  gap: '3px',
  flex: 1,
  backgroundColor: '#ffffff',
};

const vendorStyles: React.CSSProperties = {
  fontSize: '10px',
  textTransform: 'uppercase',
  color: '#94a3b8',
  fontWeight: 700,
  letterSpacing: '0.5px',
  lineHeight: 1.1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const titleStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  lineHeight: 1.25,
  color: '#1e293b',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  minHeight: '2.5em',
  margin: '1px 0',
};

const countdownPillStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '10px',
  fontWeight: 700,
  color: '#dc2626',
  backgroundColor: '#fef2f2',
  border: '1px solid #fee2e2',
  padding: '2px 6px',
  borderRadius: '4px',
  width: 'fit-content',
  lineHeight: 1.2,
  marginTop: '1px',
};

const footerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: 'auto',
  paddingTop: '6px',
  gap: '6px',
};

const priceStyles: React.CSSProperties = {
  fontSize: '13.5px',
  fontWeight: 800,
  color: '#ff7a00',
  lineHeight: 1.1,
  whiteSpace: 'nowrap',
};

const originalPriceStyles: React.CSSProperties = {
  fontSize: '10.5px',
  color: '#94a3b8',
  textDecoration: 'line-through',
  lineHeight: 1.1,
  marginTop: '1px',
};

const cartBtnStyles: React.CSSProperties = {
  width: '30px',
  height: '30px',
  borderRadius: '6px',
  backgroundColor: '#ff7a00',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  cursor: 'pointer',
  flexShrink: 0,
  transition: 'all 0.15s ease',
  boxShadow: '0 1px 4px rgba(255, 122, 0, 0.25)',
  padding: 0,
};

const disabledCartBtnStyles: React.CSSProperties = {
  ...cartBtnStyles,
  backgroundColor: '#f1f5f9',
  color: '#cbd5e1',
  cursor: 'not-allowed',
  boxShadow: 'none',
};
`;

fs.writeFileSync('frontend/src/components/product/ProductCard.tsx', productCardContent, 'utf8');
console.log('Successfully redesigned ProductCard.tsx with compact dimensions & individual countdown');
