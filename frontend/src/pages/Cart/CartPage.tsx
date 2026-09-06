import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/utils/currency';
import { getProductImageUrl, getProductFallbackImage } from '@/utils/image';
import type { CartItem } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';

export default function CartPage() {
  const navigate = useNavigate();
  const { cart, isLoading, updateQty, removeItem, clearCart, validateCart } = useCart();
  const [validating, setValidating] = useState(false);

  // Validate cart on mount to get fresh stock status
  useEffect(() => {
    validateCart().catch(() => {});
  }, [validateCart]);

  const handleUpdateQty = async (itemId: string, newQty: number) => {
    if (newQty < 1) return;
    try {
      await updateQty(itemId, newQty);
    } catch {
      toast.error('Failed to update quantity.');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItem(itemId);
      toast.success('Item removed from cart.');
    } catch {
      toast.error('Failed to remove item.');
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      toast.success('Cart cleared.');
    } catch {
      toast.error('Failed to clear cart.');
    }
  };

  const handleProceedToCheckout = async () => {
    setValidating(true);
    try {
      const validated = await validateCart();
      if (validated && validated.is_valid !== false) {
        navigate('/checkout');
      } else {
        toast.error('Some items in your cart are no longer available. Please review.');
      }
    } catch {
      toast.error('Could not validate cart. Please try again.');
    } finally {
      setValidating(false);
    }
  };

  // Loading state
  if (isLoading && (!cart || !cart.items || cart.items.length === 0)) {
    return (
      <div className="container" style={pageStyles}>
        <h1 style={titleStyles}>Shopping Cart</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} width="100%" height="100px" borderRadius="var(--radius-md)" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
    return (
      <div className="container" style={pageStyles}>
        <h1 style={titleStyles}>Shopping Cart</h1>
        <div style={emptyStateStyles}>
          <span style={{ fontSize: '3rem' }}>🛒</span>
          <h3 style={emptyTitleStyles}>Your cart is empty</h3>
          <p style={emptyTextStyles}>Browse our marketplace to find high quality items from verified vendors.</p>
          <Link to="/products" style={continueBtnStyles}>Browse Marketplace</Link>
        </div>
      </div>
    );
  }

  const totalItemsCount = cart.item_count ?? cart.items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

  return (
    <div className="container" style={pageStyles}>
      <div style={headerRowStyles}>
        <h1 style={titleStyles}>
          Shopping Cart ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'})
        </h1>
        <button onClick={handleClearCart} style={clearBtnStyles} disabled={isLoading}>
          Clear Cart
        </button>
      </div>

      {/* Validation errors from API */}
      {cart.validation_errors && cart.validation_errors.length > 0 && (
        <div style={validationBannerStyles}>
          {cart.validation_errors.map((err, idx) => (
            <p key={idx} style={{ margin: 0 }}>{err}</p>
          ))}
        </div>
      )}

      <div className="cart-layout-grid">
        {/* Cart Items List */}
        <div style={itemsColStyles}>
          {cart.items.map((item: CartItem) => {
            const prod: any = item.product || {};
            const displayName = item.product_name || prod.name || 'Product';
            const displayImg = item.image_url || prod.primary_image_url || prod.image_url || getProductImageUrl(prod);
            const rawUnit = item.unit_price ?? item.price ?? prod.base_price ?? prod.price ?? '0';
            const numUnit = parseFloat(String(rawUnit)) || 0;
            const lineTotal = item.line_total ?? (numUnit * item.quantity).toFixed(2);
            const variantText =
              item.variant_name ||
              (typeof item.variant === 'object' && item.variant !== null ? (item.variant as any).name : null) ||
              item.variant_sku;
            const targetProductId = (prod.id && prod.id !== item.id) ? prod.id : (item.product_id && item.product_id !== item.id ? item.product_id : '');
            const productHref = targetProductId ? `/products/${targetProductId}` : '/products';

            return (
              <div key={item.id} style={itemCardStyles}>
                {/* Product Image */}
                <Link to={productHref} style={{ display: 'block', textDecoration: 'none', flexShrink: 0 }}>
                  <img
                    src={displayImg}
                    alt={displayName}
                    style={itemImageStyles}
                    onError={e => {
                      (e.target as HTMLImageElement).src = getProductFallbackImage(prod);
                    }}
                  />
                </Link>

                {/* Item Details */}
                <div style={itemDetailsStyles}>
                  <Link
                    to={productHref}
                    style={itemNameStyles}
                  >
                    {displayName}
                  </Link>

                  {variantText && (
                    <span style={variantLabelStyles}>
                      Option: {variantText}
                    </span>
                  )}

                  {/* Out of Stock Badge */}
                  {item.is_in_stock === false && (
                    <span style={outOfStockBadgeStyles}>Out of Stock</span>
                  )}

                  {/* Unit Price */}
                  <span style={unitPriceStyles}>
                    {formatPrice(rawUnit)}
                  </span>
                </div>

                {/* Quantity Stepper */}
                <div style={qtyColStyles}>
                  <div style={qtyWrapperStyles}>
                    <button
                      onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                      style={qtyBtnStyles}
                      disabled={item.quantity <= 1 || isLoading}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span style={qtyValueStyles}>{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                      style={qtyBtnStyles}
                      disabled={isLoading}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    style={removeBtnStyles}
                    disabled={isLoading}
                  >
                    Remove
                  </button>
                </div>

                {/* Line Total */}
                <div style={lineTotalStyles}>
                  {formatPrice(lineTotal)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Cart Summary Sidebar */}
        <div style={summaryCardStyles}>
          <h3 style={summaryTitleStyles}>Order Summary</h3>

          <div style={summaryRowStyles}>
            <span>Subtotal</span>
            <span style={summaryValueStyles}>
              {formatPrice(cart.subtotal)}
            </span>
          </div>

          {cart.delivery_estimate && (
            <div style={summaryRowStyles}>
              <span>Estimated Delivery</span>
              <span style={summaryValueStyles}>
                {formatPrice(cart.delivery_estimate)}
              </span>
            </div>
          )}

          <hr style={dividerStyles} />

          <div style={{ ...summaryRowStyles, fontWeight: 'var(--font-bold)' }}>
            <span>Total</span>
            <span style={{ ...summaryValueStyles, color: 'var(--color-primary)', fontSize: 'var(--text-lg)' }}>
              {formatPrice(cart.total)}
            </span>
          </div>

          <button
            onClick={handleProceedToCheckout}
            disabled={cart.is_valid === false || isLoading || validating}
            style={{
              ...checkoutBtnStyles,
              opacity: (cart.is_valid === false || isLoading || validating) ? 0.6 : 1,
              cursor: (cart.is_valid === false || isLoading || validating) ? 'not-allowed' : 'pointer',
            }}
          >
            {validating ? 'Validating...' : 'Proceed to Checkout'}
          </button>

          <Link to="/products" style={continueShoppingStyles}>
            ← Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const pageStyles: React.CSSProperties = {
  paddingTop: 'var(--space-6)',
  paddingBottom: 'var(--space-12)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-6)',
};

const titleStyles: React.CSSProperties = {
  fontSize: 'var(--text-2xl)',
  fontWeight: 'var(--font-bold)',
  margin: 0,
};

const headerRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid var(--color-border)',
  paddingBottom: 'var(--space-4)',
};

const clearBtnStyles: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--color-danger)',
  fontSize: 'var(--text-sm)',
  cursor: 'pointer',
  padding: 'var(--space-1) var(--space-2)',
  borderRadius: 'var(--radius-sm)',
};

const validationBannerStyles: React.CSSProperties = {
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  border: '1px solid var(--color-danger)',
  color: 'var(--color-danger)',
  padding: 'var(--space-3) var(--space-4)',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-sm)',
};

const itemsColStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
};

const itemCardStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '80px 1fr auto auto',
  gap: 'var(--space-4)',
  alignItems: 'center',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-4)',
};

const itemImageStyles: React.CSSProperties = {
  width: '80px',
  height: '80px',
  objectFit: 'cover',
  borderRadius: 'var(--radius-sm)',
  backgroundColor: 'var(--color-bg-subtle)',
};

const itemDetailsStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-1)',
};

const itemNameStyles: React.CSSProperties = {
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-medium)',
  color: 'var(--color-text)',
  textDecoration: 'none',
};

const variantLabelStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
};

const outOfStockBadgeStyles: React.CSSProperties = {
  display: 'inline-block',
  fontSize: 'var(--text-xs)',
  color: 'var(--color-danger)',
  fontWeight: 'var(--font-semibold)',
};

const unitPriceStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-muted)',
};

const qtyColStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 'var(--space-2)',
};

const qtyWrapperStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  overflow: 'hidden',
};

const qtyBtnStyles: React.CSSProperties = {
  width: '28px',
  height: '28px',
  background: 'var(--color-bg-subtle)',
  border: 'none',
  cursor: 'pointer',
  fontSize: 'var(--text-sm)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const qtyValueStyles: React.CSSProperties = {
  padding: '0 var(--space-3)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-medium)',
  minWidth: '24px',
  textAlign: 'center',
};

const removeBtnStyles: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--color-text-muted)',
  fontSize: 'var(--text-xs)',
  cursor: 'pointer',
};

const lineTotalStyles: React.CSSProperties = {
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  minWidth: '90px',
  textAlign: 'right',
};

const summaryCardStyles: React.CSSProperties = {
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-6)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  height: 'fit-content',
};

const summaryTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-lg)',
  fontWeight: 'var(--font-bold)',
  margin: 0,
};

const summaryRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-muted)',
};

const summaryValueStyles: React.CSSProperties = {
  color: 'var(--color-text)',
  fontWeight: 'var(--font-medium)',
};

const dividerStyles: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid var(--color-border)',
  margin: 'var(--space-2) 0',
};

const checkoutBtnStyles: React.CSSProperties = {
  width: '100%',
  padding: 'var(--space-3)',
  backgroundColor: 'var(--color-primary)',
  color: 'white',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-semibold)',
  transition: 'opacity var(--transition-fast)',
};

const continueShoppingStyles: React.CSSProperties = {
  textAlign: 'center',
  fontSize: 'var(--text-sm)',
  color: 'var(--color-primary)',
  textDecoration: 'none',
};

const emptyStateStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'var(--space-12) var(--space-4)',
  textAlign: 'center',
  gap: 'var(--space-3)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
};

const emptyTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-xl)',
  fontWeight: 'var(--font-bold)',
  margin: 0,
};

const emptyTextStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-muted)',
  margin: 0,
};

const continueBtnStyles: React.CSSProperties = {
  marginTop: 'var(--space-2)',
  padding: 'var(--space-2) var(--space-6)',
  backgroundColor: 'var(--color-primary)',
  color: 'white',
  borderRadius: 'var(--radius-md)',
  textDecoration: 'none',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-semibold)',
};
