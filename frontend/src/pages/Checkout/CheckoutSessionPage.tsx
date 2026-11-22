import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { checkoutApi } from '@/api/checkout';
import { paymentsApi } from '@/api/payments';
import { getProductImageUrl, CLEAN_PRODUCT_PLACEHOLDER } from '@/utils/image';
import { useCart } from '@/contexts/CartContext';
import type { CheckoutSession, PaymentAccount, PaymentSession } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';

const NIGERIAN_BANKS = [
  'Access Bank',
  'First Bank of Nigeria',
  'Guaranty Trust Bank (GTBank)',
  'Kuda Microfinance Bank',
  'Moniepoint MFB',
  'OPay Digital Services',
  'PalmPay',
  'Stanbic IBTC Bank',
  'Sterling Bank',
  'United Bank for Africa (UBA)',
  'Wema Bank',
  'Zenith Bank',
  'Fidelity Bank',
  'Union Bank',
  'Other Bank',
];

export default function CheckoutSessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { removePurchasedItems } = useCart();

  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [bankAccount, setBankAccount] = useState<PaymentAccount | null>(null);
  const [paymentSession, setPaymentSession] = useState<PaymentSession | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(3600);
  const [isExpired, setIsExpired] = useState(false);
  const [isRenewingSession, setIsRenewingSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  // Evidence submission fields
  const [senderBank, setSenderBank] = useState('Zenith Bank');
  const [customBank, setCustomBank] = useState('');
  const [senderAccountName, setSenderAccountName] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isAgreed, setIsAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [submittedOrderRef, setSubmittedOrderRef] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Rate-change review alert state
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
      const [sess, account] = await Promise.all([
        checkoutApi.getSession(id),
        paymentsApi.getActiveAccount('marketplace'),
      ]);

      // Check if delivery rates changed since session was created
      const reverify = await checkoutApi.reverifySessionDeliveryPricing(sess);
      const effectiveSess = reverify.changed ? reverify.updatedSession : sess;
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

      setBankAccount(account);

      // Initialize or retrieve server 60-minute payment session
      const orderRef = effectiveSess.order_reference || effectiveSess.id;
      try {
        const psess = await paymentsApi.createOrGetPaymentSession({
          order_reference: orderRef,
          checkout_session_id: effectiveSess.id,
          amount: effectiveSess.total,
          subtotal: parseFloat(effectiveSess.subtotal || '0'),
        });
        setPaymentSession(psess);

        const expTime = new Date(psess.expires_at).getTime();
        const nowTime = Date.now();
        const rem = Math.max(0, Math.floor((expTime - nowTime) / 1000));
        setRemainingSeconds(rem);
        setIsExpired(rem <= 0 || psess.status === 'EXPIRED');
      } catch (err: any) {
        console.warn('Payment session initialization warning:', err);
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

  // Live countdown timer running every second using server expiration timestamp
  useEffect(() => {
    if (!paymentSession || paymentSession.status === 'EVIDENCE_SUBMITTED' || isSubmittedSuccess) return;

    const timer = setInterval(() => {
      const expTime = new Date(paymentSession.expires_at).getTime();
      const nowTime = Date.now();
      const rem = Math.max(0, Math.floor((expTime - nowTime) / 1000));
      setRemainingSeconds(rem);

      if (rem <= 0) {
        setIsExpired(true);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentSession, isSubmittedSuccess]);

  const handleRenewPaymentSession = async () => {
    if (!session) return;
    setIsRenewingSession(true);
    try {
      const orderRef = session.order_reference || session.id;
      const renewed = await paymentsApi.renewPaymentSession(paymentSession?.id || orderRef);
      setPaymentSession(renewed);
      const expTime = new Date(renewed.expires_at).getTime();
      const rem = Math.max(0, Math.floor((expTime - Date.now()) / 1000));
      setRemainingSeconds(rem);
      setIsExpired(false);
      toast.success('Fresh 60-minute payment session started!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to renew payment session.');
    } finally {
      setIsRenewingSession(false);
    }
  };

  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleCopyAccountNumber = () => {
    if (!bankAccount?.account_number) return;
    navigator.clipboard.writeText(bankAccount.account_number);
    setIsCopied(true);
    toast.success('Account number copied to clipboard!');
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, or WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Receipt image size must not exceed 10MB.');
      return;
    }

    setReceiptFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setReceiptPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitEvidence = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!session) return;

    if (isExpired) {
      toast.error('This payment session has expired. Please initiate a new payment session to complete your payment.');
      return;
    }

    if (rateChangeAlert && !rateChangeAlert.acknowledged) {
      toast.error('Please review and accept the updated delivery total before proceeding.');
      return;
    }

    const effectiveBank = senderBank === 'Other Bank' ? customBank.trim() : senderBank;
    if (!effectiveBank) {
      toast.error('Please specify your bank name.');
      return;
    }

    if (!senderAccountName.trim()) {
      toast.error('Please enter the sender account name used for the transfer.');
      return;
    }

    if (!receiptPreview) {
      toast.error('Please upload a screenshot or photo of your transfer receipt.');
      return;
    }

    if (!isAgreed) {
      toast.error('Please confirm that you have made the transfer.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Re-verify delivery pricing one last time
      const latestCheck = await checkoutApi.reverifySessionDeliveryPricing(session);
      if (latestCheck.changed) {
        setSession(latestCheck.updatedSession);
        setRateChangeAlert({
          previousFee: latestCheck.previousFee,
          newFee: latestCheck.newFee,
          newTotal: latestCheck.updatedSession.total,
          acknowledged: false,
        });
        toast.error('Delivery rates were updated. Please review the updated total before submitting.');
        setIsSubmitting(false);
        return;
      }

      // Confirm session if not already confirmed
      let orderRef = session.order_reference;
      if (!orderRef) {
        const confirmResult = await checkoutApi.confirmSession(session.id, {
          payment_provider: 'BANK_TRANSFER',
        });
        orderRef = confirmResult.order_reference;
      }

      // Upload receipt file if available to get persistent server file URL
      let uploadedProofUrl = receiptPreview;
      if (receiptFile) {
        try {
          const uploadRes = await paymentsApi.uploadReceipt(receiptFile, orderRef);
          if (uploadRes && uploadRes.receipt_url) {
            uploadedProofUrl = uploadRes.receipt_url;
          }
        } catch (uploadErr) {
          console.warn('Receipt upload fallback:', uploadErr);
        }
      }

      // Submit payment evidence (linking to payment_session_id)
      await paymentsApi.submitPaymentEvidence({
        order_reference: orderRef,
        sender_bank: effectiveBank,
        sender_account_name: senderAccountName.trim(),
        transaction_reference: transactionRef.trim() || orderRef,
        amount: session.total,
        currency: 'NGN',
        payment_proof_url: uploadedProofUrl,
        payment_session_id: paymentSession?.id,
        notes: notes.trim(),
      });

      if (paymentSession) {
        setPaymentSession({
          ...paymentSession,
          status: 'EVIDENCE_SUBMITTED',
          evidence_submitted_at: new Date().toISOString(),
        });
      }

      // Remove purchased items only from shopping cart
      try {
        const purchasedItems = (session?.cart_snapshot?.items || (session as any)?.items || []);
        const purchasedIds = purchasedItems.map((i: any) => i.id || i.product_id || (typeof i.product === 'object' ? i.product?.id : i.product)).filter(Boolean);
        if (purchasedIds.length > 0) {
          removePurchasedItems(purchasedIds);
        }
      } catch {}

      setSubmittedOrderRef(orderRef);
      setIsSubmittedSuccess(true);
      toast.success('Payment evidence submitted for verification!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit payment evidence. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (isSubmittedSuccess) {
    return (
      <div className="container" style={{ ...pageStyles, maxWidth: '720px', margin: '40px auto' }}>
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #10b981',
            borderRadius: '16px',
            padding: '36px 24px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              margin: '0 auto 20px auto',
            }}
          >
            ✓
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#064e3b', marginBottom: '8px' }}>
            Payment Evidence Received
          </h2>
          <p style={{ color: '#047857', fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>
            Status: <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '3px 10px', borderRadius: '999px', fontSize: '13px' }}>PENDING VERIFICATION</span>
          </p>

          <p style={{ color: '#4b5563', fontSize: '14px', lineHeight: 1.6, maxWidth: '520px', margin: '0 auto 24px auto' }}>
            Thank you! Your payment receipt and transfer details for order{' '}
            <strong>{submittedOrderRef}</strong> have been recorded.
            Our finance team will verify the payment against our bank records. Your order status will automatically update once verified.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to={submittedOrderRef ? `/dashboard/orders/${submittedOrderRef}` : '/dashboard/orders'}
              style={{
                backgroundColor: 'var(--color-primary)',
                color: '#ffffff',
                textDecoration: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              View My Order →
            </Link>
            <Link
              to="/dashboard/orders"
              style={{
                backgroundColor: '#ffffff',
                color: 'var(--color-primary)',
                border: '1px solid var(--color-primary)',
                textDecoration: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              All Orders
            </Link>
            <Link
              to="/"
              style={{
                backgroundColor: '#f3f4f6',
                color: '#374151',
                textDecoration: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const deliveryCalc = session.delivery_calculation;
  const shipmentCount = session.shipment_count ?? deliveryCalc?.shipment_count ?? 1;

  return (
    <div className="container" style={pageStyles}>
      <h1 style={pageTitleStyles}>Review Order & Complete Bank Transfer</h1>

      {/* Strict 60-Minute Live Payment Session Countdown Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: isExpired ? '#fef2f2' : remainingSeconds < 300 ? '#fff7ed' : '#f0fdf4',
          border: `1.5px solid ${isExpired ? '#fca5a5' : remainingSeconds < 300 ? '#fdba74' : '#86efac'}`,
          borderRadius: '14px',
          padding: '16px 20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '240px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: isExpired ? '#fee2e2' : remainingSeconds < 300 ? '#ffedd5' : '#dcfce7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isExpired ? '#dc2626' : remainingSeconds < 300 ? '#ea580c' : '#16a34a',
              flexShrink: 0,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: isExpired ? '#991b1b' : remainingSeconds < 300 ? '#9a3412' : '#14532d' }}>
              {isExpired ? 'Payment Session Expired' : 'Complete your payment within:'}
            </div>
            <div style={{ fontSize: '12px', color: isExpired ? '#b91c1c' : 'var(--color-text-muted)', marginTop: '2px' }}>
              {isExpired
                ? 'Your 60-minute payment window has elapsed. Click the button to start a fresh session for this order.'
                : 'Session is authoritative from the server and remains accurate across refreshes.'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 800,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              letterSpacing: '1.5px',
              color: isExpired ? '#dc2626' : remainingSeconds < 300 ? '#ea580c' : '#16a34a',
              backgroundColor: '#ffffff',
              padding: '8px 18px',
              borderRadius: '10px',
              border: `1px solid ${isExpired ? '#fca5a5' : remainingSeconds < 300 ? '#fed7aa' : '#86efac'}`,
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}
          >
            {formatCountdown(remainingSeconds)}
          </div>
          {isExpired && (
            <button
              onClick={handleRenewPaymentSession}
              disabled={isRenewingSession}
              style={{
                padding: '10px 18px',
                backgroundColor: 'var(--color-primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: isRenewingSession ? 'not-allowed' : 'pointer',
                opacity: isRenewingSession ? 0.7 : 1,
                boxShadow: '0 2px 6px rgba(255,122,0,0.3)',
              }}
            >
              {isRenewingSession ? 'Renewing...' : 'Initiate New Payment Session'}
            </button>
          )}
        </div>
      </div>

      {/* Pre-payment Delivery Rate Change Alert Banner */}
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
              Order &amp; Delivery Review
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
                <span style={labelStyles}>Direct Delivery:</span>
                <span style={valueStyles}>
                  {session.delivery_method.name} ({session.delivery_method.estimated_days})
                </span>
              </div>
            )}

            {/* Consolidation Explanation */}
            {deliveryCalc && (
              <div
                style={{
                  padding: '10px 12px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12px',
                  color: '#475569',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ fontWeight: 700, color: '#1e293b' }}>
                  📦 {deliveryCalc.consolidation_summary || 'Consolidated Shipment'}
                </div>
                <div>
                  Origin: <strong>{deliveryCalc.dispatch_origin || 'Warri, Delta'}</strong> → Destination: <strong>{session.delivery_address?.city}, {session.delivery_address?.state}</strong>
                </div>
              </div>
            )}

            {/* Items List */}
            <div style={itemsContainerStyles}>
              {(session.cart_snapshot?.items || (session as any).items || []).map((item: any) => {
                const prodName = item.product_name || item.product?.name || 'Product';
                const prodImg = getProductImageUrl(
                  item.product || {
                    id: item.product_id || item.id,
                    name: prodName,
                    primary_image_url: item.image_url,
                  },
                  CLEAN_PRODUCT_PLACEHOLDER
                );
                const varName = item.variant_name || (typeof item.variant === 'object' ? item.variant?.name : item.variant);
                const itemTotal = item.line_total ?? String((parseFloat(String(item.unit_price || item.price || 0)) * (Number(item.quantity) || 1)));

                return (
                  <div key={item.id} style={itemRowStyles}>
                    <img
                      src={prodImg}
                      alt={prodName}
                      style={itemImgStyles}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = CLEAN_PRODUCT_PLACEHOLDER;
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <p style={itemNameStyles}>{prodName}</p>
                      {varName && <p style={itemSubStyles}>{varName}</p>}
                      <p style={itemSubStyles}>Qty: {item.quantity}</p>
                    </div>
                    <span style={itemPriceStyles}>{formatCurrency(itemTotal)}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Payment Method — Manual Bank Transfer */}
          <section style={sectionStyles}>
            <h2 style={sectionTitleStyles}>
              <span style={stepNumberStyles}>4</span>
              Payment Method: Manual Bank Transfer
            </h2>

            {/* Account Details Box */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: '#64748b',
                  }}
                >
                  Official DOVI Product Purchase Account
                </span>
                <span
                  style={{
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                  }}
                >
                  Verified Business Account
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Bank Name</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                    {bankAccount?.bank_name || 'Zenith Bank'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Account Name</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                    {bankAccount?.account_name || 'Dovi Direct Commerce Limited'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Account Number</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '20px',
                        fontWeight: 800,
                        letterSpacing: '0.05em',
                        color: 'var(--color-primary)',
                        fontFamily: 'monospace',
                      }}
                    >
                      {bankAccount?.account_number || '5601660874'}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyAccountNumber}
                      style={{
                        backgroundColor: isCopied ? '#10b981' : '#f1f5f9',
                        color: isCopied ? '#ffffff' : '#334155',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isCopied ? '✓ Copied!' : '📋 Copy'}
                    </button>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Total Payable</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                    {formatCurrency(session.total)}
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div
                style={{
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  fontSize: '13px',
                  color: '#1e40af',
                  lineHeight: 1.5,
                }}
              >
                💡 <strong>Transfer Instructions:</strong> {bankAccount?.instructions || 'Transfer the exact order total to this account. In the transfer narration/remarks, enter your Order Reference Code. After completing the transfer, upload your payment receipt below.'}
              </div>
            </div>

            {/* Transfer Evidence Form */}
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#1e293b' }}>
                Step 2: Submit Transfer Evidence
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Sender Bank <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={senderBank}
                    onChange={(e) => setSenderBank(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    {NIGERIAN_BANKS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  {senderBank === 'Other Bank' && (
                    <input
                      type="text"
                      placeholder="Specify your bank name"
                      value={customBank}
                      onChange={(e) => setCustomBank(e.target.value)}
                      style={{
                        width: '100%',
                        marginTop: '8px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                      }}
                    />
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Sender Account Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Name as it appears on your bank account"
                    value={senderAccountName}
                    onChange={(e) => setSenderAccountName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Transaction Reference / Narration (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Session Ref or Bank Transaction ID"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Payment Notes / Remarks (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Any additional remarks about this transfer"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                    }}
                  />
                </div>
              </div>

              {/* Receipt File Upload */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Upload Payment Receipt / Screenshot <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />

                {receiptPreview ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <img
                      src={receiptPreview}
                      alt="Payment Receipt Preview"
                      style={{
                        width: '120px',
                        height: '120px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '2px solid #10b981',
                      }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#059669', fontWeight: 700 }}>
                        ✓ Receipt uploaded successfully
                      </span>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          backgroundColor: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          width: 'fit-content',
                        }}
                      >
                        Change Receipt
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      width: '100%',
                      padding: '24px',
                      border: '2px dashed #94a3b8',
                      borderRadius: '10px',
                      backgroundColor: '#f8fafc',
                      color: '#475569',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span style={{ fontSize: '28px' }}>🧾</span>
                    <span>Click to upload your transfer receipt (PNG, JPG, or WEBP)</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Max file size 10MB</span>
                  </button>
                )}
              </div>

              {/* Confirmation Checkbox */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  cursor: 'pointer',
                  backgroundColor: '#f8fafc',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <input
                  type="checkbox"
                  checked={isAgreed}
                  onChange={(e) => setIsAgreed(e.target.checked)}
                  style={{ marginTop: '3px', accentColor: 'var(--color-primary)' }}
                />
                <span style={{ fontSize: '13px', color: '#334155', lineHeight: 1.4 }}>
                  I confirm that I have transferred the exact total of{' '}
                  <strong>{formatCurrency(session.total)}</strong> to the official DOVI account
                  above and that the uploaded receipt is genuine.
                </span>
              </label>
            </div>
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
                <div
                  key={g.group_index}
                  style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)' }}
                >
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

          <p style={expiryStyles}>
            Session expires: {new Date(session.expires_at).toLocaleTimeString()}
          </p>

          <button
            onClick={handleSubmitEvidence}
            disabled={
              isSubmitting ||
              isExpired ||
              !isAgreed ||
              !receiptPreview ||
              !senderAccountName.trim() ||
              Boolean(rateChangeAlert && !rateChangeAlert.acknowledged)
            }
            style={{
              ...confirmBtnStyles,
              opacity:
                isSubmitting ||
                isExpired ||
                !isAgreed ||
                !receiptPreview ||
                !senderAccountName.trim() ||
                Boolean(rateChangeAlert && !rateChangeAlert.acknowledged)
                  ? 0.5
                  : 1,
              cursor:
                isSubmitting ||
                isExpired ||
                !isAgreed ||
                !receiptPreview ||
                !senderAccountName.trim() ||
                Boolean(rateChangeAlert && !rateChangeAlert.acknowledged)
                  ? 'not-allowed'
                  : 'pointer',
              backgroundColor: isExpired ? '#dc2626' : 'var(--color-primary)',
            }}
          >
            {isSubmitting
              ? 'Submitting Evidence...'
              : isExpired
              ? 'Payment Session Expired — Please Renew Above'
              : 'Submit Payment Evidence'}
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
