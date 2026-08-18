import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '@/contexts/CartContext';
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
      if (validated && validated.is_valid) {
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
  if (isLoading && !cart) {
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
  if (!cart || cart.items.length === 0) {
    return (
      <div className="container" style={pageStyles}>
        <h1 style={titleStyles}>Shopping Cart</h1>
        <div style={emptyStateStyles}>
          <span style={{ fontSize: '3rem' }}>🛒</span>
          <h3 style={emptyTitleStyles}>Your cart is empty</h3>
          <p style={emptyTextStyles}>Browse our marketplace to find amazing products.</p>
          <Link to="/products" style={continueBtnStyles}>Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={pageStyles}>
      <div style={headerRowStyles}>
        <h1 style={titleStyles}>Shopping Cart ({cart.item_count} {cart.item_count === 1 ? 'item' : 'items'})</h1>
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
          {cart.items.map((item: CartItem) => (
            <div key={item.id} style={itemCardStyles}>
              {/* Product Image */}
              <img
                src={item.product.primary_image_url || '/logo.jpg?v=2'}
                alt={item.product.name}
                style={itemImageStyles}
                onError={e => { (e.target as HTMLImageElement).src = '/logo.jpg?v=2'; }}
              />

              {/* Item Details */}
              <div style={itemDetailsStyles}>
                <Link to={`/products/${item.product.id}`} style={itemNameStyles}>
                  {item.product.name}
                </Link>

                {item.variant && (
                  <span style={variantLabelStyles}>
                    {item.variant.name}
                  </span>
                )}

                {/* Out of Stock Badge */}
                {!item.is_in_stock && (
                  <span style={outOfStockBadgeStyles}>Out of Stock</span>
                )}

                {/* Unit Price from API */}
                <span style={unitPriceStyles}>
                  {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(
                    parseFloat(item.unit_price)
                  )}
                </span>
              </div>

              {/* Quantity Stepper */}
              <div style={qtyColStyles}>
                <div style={qtyWrapperStyles}>
                  <button
                    onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                    style={qtyBtnStyles}
                    disabled={item.quantity <= 1 || isLoading}
                  >
                    −
                  </button>
                  <span style={qtyValueStyles}>{item.quantity}</span>
                  <button
                    onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                    style={qtyBtnStyles}
                    disabled={isLoading}
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

              {/* Line Total from API */}
              <div style={lineTotalStyles}>
                {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(
                  parseFloat(item.line_total)
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Cart Summary Sidebar — ALL values from API */}
        <div style={summaryCardStyles}>
          <h3 style={summaryTitleStyles}>Order Summary</h3>

          <div style={summaryRowStyles}>
            <span>Subtotal</span>
            <span style={summaryValueStyles}>
              {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(
                parseFloat(cart.subtotal)
              )}
            </span>
          </div>

          {cart.delivery_estimate && (
            <div style={summaryRowStyles}>
              <span>Estimated Delivery</span>
              <span style={summaryValueStyles}>
                {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(
                  parseFloat(cart.delivery_estimate)
                )}
              </span>
            </div>
          )}

          <hr style={dividerStyles} />

          <div style={{ ...summaryRowStyles, fontWeight: 'var(--font-bold)' }}>
            <span>Total</span>
            <span style={{ ...summaryValueStyles, color: 'var(--color-primary)', fontSize: 'var(--text-lg)' }}>
              {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(
                parseFloat(cart.total)
              )}
            </span>
          </div>

          <button
            onClick={handleProceedToCheckout}
            disabled={!cart.is_valid || isLoading || validating}
            style={{
              ...checkoutBtnStyles,
              opacity: (!cart.is_valid || isLoading || validating) ? 0.6 : 1,
              cursor: (!cart.is_valid || isLoading || validating) ? 'not-allowed' : 'pointer',
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
  color: 'var(--color-text)',
};

const headerRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 'var(--space-2)',
};

const clearBtnStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-danger)',
  fontWeight: 'var(--font-semibold)',
  backgroundColor: 'transparent',
  border: '1px solid var(--color-danger)',
  borderRadius: 'var(--radius-md)',
  padding: '6px 14px',
  cursor: 'pointer',
};

const validationBannerStyles: React.CSSProperties = {
  backgroundColor: 'rgba(231, 76, 60, 0.08)',
  border: '1px solid var(--color-danger)',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-3) var(--space-4)',
  fontSize: 'var(--text-sm)',
  color: 'var(--color-danger)',
};

const itemsColStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
};

const itemCardStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-4)',
  padding: 'var(--space-4)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  backgroundColor: '#ffffff',
  flexWrap: 'wrap',
};

const itemImageStyles: React.CSSProperties = {
  width: '80px',
  height: '80px',
  borderRadius: 'var(--radius-md)',
  objectFit: 'cover',
  border: '1px solid var(--color-border)',
  flexShrink: 0,
};

const itemDetailsStyles: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  minWidth: '120px',
};

const itemNameStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-text)',
  textDecoration: 'none',
};

const variantLabelStyles: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--color-text-muted)',
  fontWeight: 'var(--font-medium)',
};

const outOfStockBadgeStyles: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 'var(--font-bold)',
  color: '#ffffff',
  backgroundColor: 'var(--color-danger)',
  padding: '2px 8px',
  borderRadius: 'var(--radius-full)',
  width: 'fit-content',
  textTransform: 'uppercase',
};

const unitPriceStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
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
  border: '2px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  overflow: 'hidden',
  height: '36px',
};

const qtyBtnStyles: React.CSSProperties = {
  width: '32px',
  height: '100%',
  backgroundColor: 'var(--color-bg-subtle)',
  color: 'var(--color-text)',
  fontWeight: 'var(--font-bold)',
  fontSize: 'var(--text-base)',
  border: 'none',
  cursor: 'pointer',
};

const qtyValueStyles: React.CSSProperties = {
  padding: '0 10px',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
  minWidth: '28px',
  textAlign: 'center',
};

const removeBtnStyles: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--color-danger)',
  fontWeight: 'var(--font-medium)',
  backgroundColor: 'transparent',
  border: 'none',
  cursor: 'pointer',
  textDecoration: 'underline',
};

const lineTotalStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  minWidth: '90px',
  textAlign: 'right',
};

const summaryCardStyles: React.CSSProperties = {
  padding: 'var(--space-6)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: 'var(--color-bg-subtle)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  height: 'fit-content',
  position: 'sticky',
  top: 'var(--space-4)',
};

const summaryTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  margin: 0,
};

const summaryRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-muted)',
};

const summaryValueStyles: React.CSSProperties = {
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-text)',
};

const dividerStyles: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid var(--color-border)',
  margin: 0,
};

const checkoutBtnStyles: React.CSSProperties = {
  width: '100%',
  height: '44px',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  border: 'none',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
  transition: 'background-color var(--transition-fast)',
};

const continueShoppingStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
  textDecoration: 'none',
  textAlign: 'center',
  fontWeight: 'var(--font-medium)',
};

const emptyStateStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 'var(--space-3)',
  padding: 'var(--space-16) var(--space-4)',
  textAlign: 'center',
};

const emptyTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-lg)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  margin: 0,
};

const emptyTextStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-muted)',
  margin: 0,
};

const continueBtnStyles: React.CSSProperties = {
  padding: '10px 24px',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  borderRadius: 'var(--radius-md)',
  textDecoration: 'none',
  fontWeight: 'var(--font-bold)',
  fontSize: 'var(--text-sm)',
};
