import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { checkoutApi } from '@/api/checkout';
import { notificationsApi } from '@/api/notifications';
import { paymentsApi } from '@/api/payments';
import { normalizeUrl, getProductFallbackImage } from '@/utils/image';
import type { CheckoutSession, PaymentMethod } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';

// ----------------------------------------------------------
// CheckoutSessionPage — Step 2: Review + Payment
// Fetches the session + payment methods from API.
// ----------------------------------------------------------
export default function CheckoutSessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);

  const fetchSession = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [sess, methods] = await Promise.all([
        checkoutApi.getSession(id),
        paymentsApi.getMethods(),
      ]);
      setSession(sess);
      setPaymentMethods(methods.filter(m => m.is_active));
      if (sess.payment_method) {
        setSelectedProvider(sess.payment_method);
      } else if (methods.length > 0) {
        const active = methods.find(m => m.is_active);
        if (active) setSelectedProvider(active.id);
      }
    } catch {
      toast.error('Failed to load checkout session.');
      navigate('/checkout');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const handleConfirm = async () => {
    if (!id || !selectedProvider) {
      toast.error('Please select a payment method.');
      return;
    }
    setIsConfirming(true);
    try {
      const result = await checkoutApi.confirmSession(id, { payment_provider: selectedProvider });

      // After confirmation, initialize payment with the provider
      const paymentInit = await paymentsApi.initialize({
        order_reference: result.order_reference,
        provider: selectedProvider,
        redirect_url: `${window.location.origin}/payment/success?ref=${result.order_reference}`,
      });

      // Redirect to payment provider
      if (paymentInit.payment_link) {
        window.location.href = paymentInit.payment_link;
      } else {
        navigate(`/payment/success?ref=${result.order_reference}`);
      }
    } catch {
      toast.error('Order confirmation failed. Please try again.');
    } finally {
      setIsConfirming(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container" style={pageStyles}>
        <Skeleton width="200px" height="28px" borderRadius="var(--radius-md)" />
        <div className="checkout-layout-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Skeleton width="100%" height="200px" borderRadius="var(--radius-md)" />
            <Skeleton width="100%" height="120px" borderRadius="var(--radius-md)" />
          </div>
          <Skeleton width="100%" height="300px" borderRadius="var(--radius-lg)" />
        </div>
      </div>
    );
  }

  if (!session) return null;

  const formatCurrency = (val: string) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(parseFloat(val));

  return (
    <div className="container" style={pageStyles}>
      <h1 style={pageTitleStyles}>Review & Pay</h1>

      <div className="checkout-layout-grid">
        {/* Main Column */}
        <div style={mainColStyles}>
          {/* Order Review */}
          <section style={sectionStyles}>
            <h2 style={sectionTitleStyles}>
              <span style={stepNumberStyles}>3</span>
              Order Review
            </h2>

            {/* Delivery Info */}
            {session.delivery_address && (
              <div style={infoCardStyles}>
                <span style={labelStyles}>Deliver to:</span>
                <span style={valueStyles}>
                  {session.delivery_address.full_name}, {session.delivery_address.address_line_1},
                  {session.delivery_address.city}, {session.delivery_address.state}
                </span>
              </div>
            )}

            {session.delivery_method && (
              <div style={infoCardStyles}>
                <span style={labelStyles}>Shipping:</span>
                <span style={valueStyles}>
                  {session.delivery_method.name} ({session.delivery_method.estimated_days})
                </span>
              </div>
            )}

            {/* Items snapshot */}
            <div style={itemsContainerStyles}>
              {session.cart_snapshot.items.map((item: any) => {
                const prodName = item.product_name || item.product?.name || 'Product';
                const fallbackImg = getProductFallbackImage(item.product || { name: prodName });
                const prodImg = normalizeUrl(item.image_url || item.product?.primary_image_url) || fallbackImg;
                const varName = item.variant_name || (typeof item.variant === 'object' ? item.variant?.name : item.variant);
                const itemTotal = item.line_total ?? String((parseFloat(String(item.unit_price || item.price || 0)) * (Number(item.quantity) || 1)));

                return (
                  <div key={item.id} style={itemRowStyles}>
                    <img
                      src={prodImg}
                      alt={prodName}
                      style={itemImgStyles}
                      onError={e => { (e.target as HTMLImageElement).src = fallbackImg; }}
                    />
                    <div style={{ flex: 1 }}>
                      <p style={itemNameStyles}>{prodName}</p>
                      {varName && (
                        <p style={itemSubStyles}>{varName}</p>
                      )}
                      <p style={itemSubStyles}>Qty: {item.quantity}</p>
                    </div>
                    <span style={itemPriceStyles}>{formatCurrency(itemTotal)}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Payment Method Selection */}
          <section style={sectionStyles}>
            <h2 style={sectionTitleStyles}>
              <span style={stepNumberStyles}>4</span>
              Payment Method
            </h2>

            {paymentMethods.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                No payment methods available.
              </p>
            ) : (
              paymentMethods.map((pm) => (
                <label
                  key={pm.id}
                  style={{
                    ...pmCardStyles,
                    borderColor: selectedProvider === pm.id ? 'var(--color-primary)' : 'var(--color-border)',
                    backgroundColor: selectedProvider === pm.id ? 'rgba(103, 58, 183, 0.04)' : '#ffffff',
                  }}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    checked={selectedProvider === pm.id}
                    onChange={() => setSelectedProvider(pm.id)}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  {pm.logo_url && (
                    <img
                      src={pm.logo_url}
                      alt={pm.name}
                      style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: 'var(--text-sm)' }}>{pm.name}</strong>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {pm.description}
                    </p>
                  </div>
                </label>
              ))
            )}
          </section>
        </div>

        {/* Summary Sidebar */}
        <div style={summaryCardStyles}>
          <h3 style={summaryTitleStyles}>Payment Summary</h3>

          <div style={summaryRowStyles}>
            <span>Subtotal</span>
            <span style={summaryValStyles}>{formatCurrency(session.subtotal)}</span>
          </div>

          <div style={summaryRowStyles}>
            <span>Delivery</span>
            <span style={summaryValStyles}>{formatCurrency(session.delivery_fee)}</span>
          </div>

          <hr style={dividerStyles} />

          <div style={{ ...summaryRowStyles, fontWeight: 'var(--font-bold)' }}>
            <span>Total</span>
            <span style={{ ...summaryValStyles, color: 'var(--color-primary)', fontSize: 'var(--text-lg)' }}>
              {formatCurrency(session.total)}
            </span>
          </div>

          {/* Session Expiry */}
          <p style={expiryStyles}>
            Session expires: {new Date(session.expires_at).toLocaleTimeString()}
          </p>

          <button
            onClick={handleConfirm}
            disabled={isConfirming || !selectedProvider}
            style={{
              ...confirmBtnStyles,
              opacity: (isConfirming || !selectedProvider) ? 0.6 : 1,
              cursor: (isConfirming || !selectedProvider) ? 'not-allowed' : 'pointer',
            }}
          >
            {isConfirming ? 'Processing...' : `Pay ${formatCurrency(session.total)}`}
          </button>

          <Link to="/checkout" style={backLinkStyles}>
            ← Change Address / Method
          </Link>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------
// Styling
// ----------------------------------------------------------
const pageStyles: React.CSSProperties = {
  paddingTop: 'var(--space-6)',
  paddingBottom: 'var(--space-12)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-6)',
};

const pageTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-2xl)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
};

const mainColStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-6)',
};

const sectionStyles: React.CSSProperties = {
  padding: 'var(--space-5)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: '#ffffff',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
};

const sectionTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
  margin: 0,
};

const stepNumberStyles: React.CSSProperties = {
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  fontWeight: 'var(--font-bold)',
  flexShrink: 0,
};

const infoCardStyles: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-2)',
  padding: 'var(--space-2) var(--space-3)',
  backgroundColor: 'var(--color-bg-subtle)',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--text-xs)',
};

const labelStyles: React.CSSProperties = {
  color: 'var(--color-text-muted)',
  fontWeight: 'var(--font-semibold)',
  whiteSpace: 'nowrap',
};

const valueStyles: React.CSSProperties = {
  color: 'var(--color-text)',
};

const itemsContainerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
  marginTop: 'var(--space-2)',
};

const itemRowStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
  padding: 'var(--space-2) 0',
  borderBottom: '1px solid var(--color-border)',
};

const itemImgStyles: React.CSSProperties = {
  width: '48px',
  height: '48px',
  borderRadius: 'var(--radius-md)',
  objectFit: 'cover',
  border: '1px solid var(--color-border)',
  flexShrink: 0,
};

const itemNameStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-text)',
};

const itemSubStyles: React.CSSProperties = {
  margin: 0,
  fontSize: '11px',
  color: 'var(--color-text-muted)',
};

const itemPriceStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
};

const pmCardStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
  padding: 'var(--space-3) var(--space-4)',
  border: '2px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  transition: 'all var(--transition-fast)',
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
  margin: 0,
};

const summaryRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-muted)',
};

const summaryValStyles: React.CSSProperties = {
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-text)',
};

const dividerStyles: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid var(--color-border)',
  margin: 0,
};

const expiryStyles: React.CSSProperties = {
  fontSize: '10px',
  color: 'var(--color-warning)',
  fontWeight: 'var(--font-medium)',
  textAlign: 'center',
  margin: 0,
};

const confirmBtnStyles: React.CSSProperties = {
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

const backLinkStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
  textDecoration: 'none',
  textAlign: 'center',
  fontWeight: 'var(--font-medium)',
};
