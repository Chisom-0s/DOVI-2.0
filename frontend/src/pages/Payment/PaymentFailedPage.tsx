import { useSearchParams, Link } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { paymentsApi } from '@/api/payments';

// ----------------------------------------------------------
// PaymentFailedPage — Retry or choose different method
// ----------------------------------------------------------
export default function PaymentFailedPage() {
  const [searchParams] = useSearchParams();
  const paymentRef = searchParams.get('payment_ref') || '';
  const orderRef = searchParams.get('ref') || '';
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (!paymentRef) {
      toast.error('No payment reference found. Please start a new order.');
      return;
    }
    setIsRetrying(true);
    try {
      const result = await paymentsApi.retry(paymentRef);
      if (result.payment_link) {
        window.location.href = result.payment_link;
      } else {
        toast.error('Retry failed. Please try a different payment method.');
      }
    } catch {
      toast.error('Retry failed. Please try a different payment method or contact support.');
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="container" style={pageStyles}>
      <div style={centerStyles}>
        <div style={iconCircleStyles}>✕</div>

        <h2 style={headingStyles}>Payment Failed</h2>

        <p style={subTextStyles}>
          Your payment could not be processed. This could be due to insufficient funds, a network error, or a declined transaction.
        </p>

        <div style={actionColStyles}>
          {paymentRef && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              style={{
                ...retryBtnStyles,
                opacity: isRetrying ? 0.6 : 1,
              }}
            >
              {isRetrying ? 'Retrying...' : 'Retry Payment'}
            </button>
          )}

          {orderRef && (
            <Link to={`/orders/${orderRef}`} style={secondaryBtnStyles}>
              View Order Details
            </Link>
          )}

          <Link to="/dashboard/orders" style={linkStyles}>
            View All Orders
          </Link>

          <Link to="/products" style={linkStyles}>
            Continue Shopping
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
  paddingTop: 'var(--space-8)',
  paddingBottom: 'var(--space-12)',
};

const centerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 'var(--space-4)',
  maxWidth: '420px',
  margin: '0 auto',
  textAlign: 'center',
  padding: 'var(--space-8) 0',
};

const iconCircleStyles: React.CSSProperties = {
  width: '72px',
  height: '72px',
  borderRadius: '50%',
  backgroundColor: 'rgba(231, 76, 60, 0.1)',
  border: '3px solid var(--color-danger)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '2rem',
  color: 'var(--color-danger)',
  fontWeight: 'bold',
};

const headingStyles: React.CSSProperties = {
  fontSize: 'var(--text-xl)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  margin: 0,
};

const subTextStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-muted)',
  lineHeight: 1.6,
  margin: 0,
};

const actionColStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
  width: '100%',
  marginTop: 'var(--space-2)',
};

const retryBtnStyles: React.CSSProperties = {
  width: '100%',
  height: '44px',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontWeight: 'var(--font-bold)',
  fontSize: 'var(--text-sm)',
  cursor: 'pointer',
};

const secondaryBtnStyles: React.CSSProperties = {
  width: '100%',
  height: '44px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'transparent',
  color: 'var(--color-text)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  fontWeight: 'var(--font-semibold)',
  fontSize: 'var(--text-sm)',
  textDecoration: 'none',
};

const linkStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
  textDecoration: 'underline',
  fontWeight: 'var(--font-medium)',
};
