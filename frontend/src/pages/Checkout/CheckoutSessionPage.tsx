import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { checkoutApi } from '@/api/checkout';
import { paymentsApi } from '@/api/payments';
import { PARCEL_CLASSIFICATION_LABELS } from '@/services/deliveryPricingService';
import { normalizeUrl, getProductFallbackImage } from '@/utils/image';
import type { CheckoutSession, PaymentMethod } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';

// ----------------------------------------------------------
// CheckoutSessionPage — Step 2: Review + Payment
// Displays Consolidated Shipment Breakdown + Re-verifies delivery pricing before payment.
// ----------------------------------------------------------
export default function CheckoutSessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);

  // Rate-change review alert state (Section 7 / Edge Case 7)
  const [rateChangeAlert, setRateChangeAlert] = useState<{
    previousFee: string;
    newFee: string;
    newTotal: string;
    acknowledged: boolean;
  } | null>(null);

  const fetchSession = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [sess, methods] = await Promise.all([
        checkoutApi.getSession(id),
        paymentsApi.getMethods(),
      ]);

      // Check if delivery rates changed since session was created
      const reverify = await checkoutApi.reverifySessionDeliveryPricing(sess);
      if (reverify.changed) {
        setSession(reverify.updatedSession);
        setRateChangeAlert({
          previousFee: reverify.previousFee,
          newFee: reverify.newFee,
          newTotal: reverify.updatedSession.total,
          acknowledged: false,
        });
      } else {
        setSession(sess);
      }

      setPaymentMethods(methods.filter((m) => m.is_active));
      if (sess.payment_method) {
        setSelectedProvider(sess.payment_method);
      } else if (methods.length > 0) {
        const active = methods.find((m) => m.is_active);
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
    if (!id || !session || !selectedProvider) {
      toast.error('Please select a payment method.');
      return;
    }

    if (rateChangeAlert && !rateChangeAlert.acknowledged) {
      toast.error('Please review and accept the updated delivery total before proceeding.');
      return;
    }

    setIsConfirming(true);
    try {
      // Final pre-payment check to ensure delivery rates did not change right before payment
      const latestCheck = await checkoutApi.reverifySessionDeliveryPricing(session);
      if (latestCheck.changed) {
        setSession(latestCheck.updatedSession);
        setRateChangeAlert({
          previousFee: latestCheck.previousFee,
          newFee: latestCheck.newFee,
          newTotal: latestCheck.updatedSession.total,
          acknowledged: false,
        });
        toast.error(
          'Delivery rates were updated by the administrator. Please review the updated total before paying.'
        );
        setIsConfirming(false);
        return;
      }

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

  const formatCurrency = (val: string | number | null | undefined) => {
    if (val === null || val === undefined || val === '') return 'Manual Quote';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return 'Manual Quote';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const deliveryCalc = session.delivery_calculation;
  const shipmentCount = session.shipment_count ?? deliveryCalc?.shipment_count ?? 1;

  return (
    <div className="container" style={pageStyles}>
      <h1 style={pageTitleStyles}>Review Order, Consolidated Delivery & Pay</h1>

      {/* Pre-payment Delivery Rate Change Alert Banner (Section 7 / Edge Case 7) */}
      {rateChangeAlert && !rateChangeAlert.acknowledged && (
        <div
          style={{
            backgroundColor: '#fffbeb',
            border: '2px solid #f59e0b',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#92400e' }}>
            ⚠️ Delivery Rate Updated Before Payment — Please Review Updated Total
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#78350f', lineHeight: 1.5 }}>
            Transport rates for your route were updated before payment was completed. DOVI never silently increases delivery charges. Please review the updated delivery fee and total below before proceeding:
          </p>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '13px', color: '#78350f' }}>
            <span>
              Previous Delivery Fee: <strong>{formatCurrency(rateChangeAlert.previousFee)}</strong>
            </span>
            <span>
              Updated Delivery Fee: <strong>{formatCurrency(rateChangeAlert.newFee)}</strong>
            </span>
            <span>
              Updated Total Payable: <strong>{formatCurrency(rateChangeAlert.newTotal)}</strong>
            </span>
          </div>
          <div>
            <button
              type="button"
              onClick={() =>
                setRateChangeAlert((prev) => (prev ? { ...prev, acknowledged: true } : null))
              }
              style={{
                backgroundColor: '#d97706',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ✓ I Have Reviewed & Accept the Updated Total ({formatCurrency(rateChangeAlert.newTotal)})
            </button>
          </div>
        </div>
      )}

      <div className="checkout-layout-grid">
        {/* Main Column */}
        <div style={mainColStyles}>
          {/* Order & Shipment Review */}
          <section style={sectionStyles}>
            <h2 style={sectionTitleStyles}>
              <span style={stepNumberStyles}>3</span>
              Order & Onitsha Hub Shipment Review
            </h2>

            {/* Delivery Info */}
            {session.delivery_address && (
              <div style={infoCardStyles}>
                <span style={labelStyles}>Deliver to:</span>
                <span style={valueStyles}>
                  {session.delivery_address.full_name}, {session.delivery_address.address_line_1},{' '}
                  {session.delivery_address.city}, {session.delivery_address.state}
                </span>
              </div>
            )}

            {session.delivery_method && (
              <div style={infoCardStyles}>
                <span style={labelStyles}>Dispatch & Shipping:</span>
                <span style={valueStyles}>
                  Origin: Onitsha Hub · {session.delivery_method.name} ({session.delivery_method.estimated_days})
                </span>
              </div>
            )}

            {/* Consolidation Explanation */}
            {deliveryCalc && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: shipmentCount === 1 ? '#f0fdf4' : '#eff6ff',
                  border: `1px solid ${shipmentCount === 1 ? '#bbf7d0' : '#bfdbfe'}`,
                  fontSize: '12px',
                  color: shipmentCount === 1 ? '#166534' : '#1e40af',
                }}
              >
                <strong>
                  {shipmentCount === 1
                    ? '✓ Consolidated Single Shipment:'
                    : `${shipmentCount} Separate Shipments:`}
                </strong>{' '}
                {deliveryCalc.consolidation_summary}
              </div>
            )}

            {/* Shipment Groups Breakdown */}
            {deliveryCalc && deliveryCalc.shipment_groups.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                {deliveryCalc.shipment_groups.map((grp) => (
                  <div
                    key={grp.group_index}
                    style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px',
                      backgroundColor: '#fafafa',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '6px',
                        marginBottom: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '13px' }}>Shipment #{grp.group_index}</strong>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            backgroundColor: '#ffedd5',
                            color: '#9a3412',
                          }}
                        >
                          {PARCEL_CLASSIFICATION_LABELS[grp.shipment_classification]}
                        </span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>
                        Delivery Fee: {formatCurrency(grp.delivery_fee)}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                      Transport: {grp.transport_arrangement} · {grp.separation_reason}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

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
                    backgroundColor: selectedProvider === pm.id ? 'rgba(255, 122, 0, 0.04)' : '#ffffff',
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
            <span>Product Subtotal</span>
            <span style={summaryValStyles}>{formatCurrency(session.subtotal)}</span>
          </div>

          <div style={summaryRowStyles}>
            <span>Shipments</span>
            <span style={summaryValStyles}>
              {shipmentCount} {shipmentCount === 1 ? 'Consolidated Shipment' : 'Shipments'}
            </span>
          </div>

          {deliveryCalc && deliveryCalc.shipment_count > 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
              {deliveryCalc.shipment_groups.map((g) => (
                <div key={g.group_index} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)' }}>
                  <span>Shipment #{g.group_index} Fee:</span>
                  <span>{formatCurrency(g.delivery_fee)}</span>
                </div>
              ))}
            </div>
          )}

          <div style={summaryRowStyles}>
            <span>Total Delivery Fee</span>
            <span style={summaryValStyles}>{formatCurrency(session.delivery_fee)}</span>
          </div>

          <hr style={dividerStyles} />

          <div style={{ ...summaryRowStyles, fontWeight: 'var(--font-bold)' }}>
            <span>Total Payable</span>
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
            disabled={isConfirming || !selectedProvider || Boolean(rateChangeAlert && !rateChangeAlert.acknowledged)}
            style={{
              ...confirmBtnStyles,
              opacity:
                isConfirming || !selectedProvider || Boolean(rateChangeAlert && !rateChangeAlert.acknowledged)
                  ? 0.6
                  : 1,
              cursor:
                isConfirming || !selectedProvider || Boolean(rateChangeAlert && !rateChangeAlert.acknowledged)
                  ? 'not-allowed'
                  : 'pointer',
            }}
          >
            {isConfirming ? 'Processing...' : `Pay ${formatCurrency(session.total)}`}
          </button>

          <Link to="/checkout" style={backLinkStyles}>
            ← Change Destination / Address
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
