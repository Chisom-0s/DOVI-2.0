import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { paymentsApi } from '@/api/payments';
import { notificationsApi } from '@/api/notifications';
import type { Payment } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';

// ----------------------------------------------------------
// PaymentSuccessPage — Verify payment via API
// Redirected here after payment provider callback.
// ----------------------------------------------------------
export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderRef = searchParams.get('ref') || searchParams.get('order_reference') || '';
  const paymentRef = searchParams.get('payment_ref') || searchParams.get('tx_ref') || searchParams.get('transaction_id') || '';

  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const verify = async () => {
      if (!paymentRef && !orderRef) {
        setError('Missing payment reference.');
        setIsLoading(false);
        return;
      }
      try {
        const ref = paymentRef || orderRef;
        const data = await paymentsApi.verify(ref);
        setPayment(data);
        if (data.status === 'SUCCESSFUL') {
          try {
            await notificationsApi.create(
              'Purchase Successful!',
              'Your order has been confirmed. Thank you for shopping with Dovi!',
              'SUCCESS'
            );
          } catch (e) {}
        }
      } catch {
        setError('Could not verify payment. Please check your order history.');
      } finally {
        setIsLoading(false);
      }
    };
    verify();
  }, [paymentRef, orderRef]);

  if (isLoading) {
    return (
      <div className="container" style={pageStyles}>
        <div style={centerStyles}>
          <Skeleton width="80px" height="80px" borderRadius="50%" />
          <Skeleton width="240px" height="24px" borderRadius="var(--radius-md)" />
          <Skeleton width="180px" height="16px" borderRadius="var(--radius-md)" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={pageStyles}>
        <div style={centerStyles}>
          <div style={iconCircleStyles('var(--color-warning)')}>⚠️</div>
          <h2 style={headingStyles}>Verification Issue</h2>
          <p style={subTextStyles}>{error}</p>
          <Link to="/dashboard/orders" style={primaryBtnStyles}>View My Orders</Link>
        </div>
      </div>
    );
  }

  const isSuccess = payment?.status === 'SUCCESSFUL';

  return (
    <div className="container" style={pageStyles}>
      <div style={centerStyles}>
        <div style={iconCircleStyles(isSuccess ? 'var(--color-success)' : 'var(--color-warning)')}>
          {isSuccess ? '✓' : '⏳'}
        </div>

        <h2 style={headingStyles}>
          {isSuccess ? 'Payment Successful!' : 'Payment Processing'}
        </h2>

        <p style={subTextStyles}>
          {isSuccess
            ? 'Your order has been confirmed and is being processed.'
            : 'Your payment is still being processed. We\'ll update your order shortly.'
          }
        </p>

        {payment && (
          <div style={detailCardStyles}>
            <div style={detailRowStyles}>
              <span style={detailLabelStyles}>Payment Ref</span>
              <span style={detailValueStyles}>{payment.reference}</span>
            </div>
            <div style={detailRowStyles}>
              <span style={detailLabelStyles}>Amount</span>
              <span style={detailValueStyles}>
                {new Intl.NumberFormat('en-NG', { style: 'currency', currency: payment.currency }).format(
                  parseFloat(payment.amount)
                )}
              </span>
            </div>
            <div style={detailRowStyles}>
              <span style={detailLabelStyles}>Provider</span>
              <span style={detailValueStyles}>{payment.provider}</span>
            </div>
            <div style={detailRowStyles}>
              <span style={detailLabelStyles}>Status</span>
              <span className="status-badge" style={{
                backgroundColor: isSuccess ? 'rgba(46, 213, 115, 0.12)' : 'rgba(255, 165, 2, 0.12)',
                color: isSuccess ? 'var(--color-success)' : 'var(--color-warning)',
              }}>
                {payment.status}
              </span>
            </div>
          </div>
        )}

        <div style={actionRowStyles}>
          {payment?.order_reference && (
            <Link to={`/orders/${payment.order_reference}`} style={primaryBtnStyles}>
              View Order
            </Link>
          )}
          <Link to="/products" style={secondaryBtnStyles}>
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
  maxWidth: '440px',
  margin: '0 auto',
  textAlign: 'center',
  padding: 'var(--space-8) 0',
};

const iconCircleStyles = (color: string): React.CSSProperties => ({
  width: '72px',
  height: '72px',
  borderRadius: '50%',
  backgroundColor: `${color}15`,
  border: `3px solid ${color}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '2rem',
  color,
});

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

const detailCardStyles: React.CSSProperties = {
  width: '100%',
  padding: 'var(--space-4)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: 'var(--color-bg-subtle)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
};

const detailRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 'var(--text-xs)',
};

const detailLabelStyles: React.CSSProperties = {
  color: 'var(--color-text-muted)',
};

const detailValueStyles: React.CSSProperties = {
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-text)',
};

const actionRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-3)',
  marginTop: 'var(--space-2)',
};

const primaryBtnStyles: React.CSSProperties = {
  padding: '10px 24px',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  borderRadius: 'var(--radius-md)',
  textDecoration: 'none',
  fontWeight: 'var(--font-bold)',
  fontSize: 'var(--text-sm)',
};

const secondaryBtnStyles: React.CSSProperties = {
  padding: '10px 24px',
  backgroundColor: 'transparent',
  color: 'var(--color-text-muted)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  textDecoration: 'none',
  fontWeight: 'var(--font-semibold)',
  fontSize: 'var(--text-sm)',
};
