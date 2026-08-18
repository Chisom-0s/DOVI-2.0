import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ordersApi } from '@/api/orders';
import type { Order } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';

// ----------------------------------------------------------
// OrderConfirmationPage — /orders/:ref
// Fetches the order from API by reference.
// ----------------------------------------------------------
export default function OrderConfirmationPage() {
  const { ref } = useParams<{ ref: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      if (!ref) return;
      setIsLoading(true);
      try {
        const data = await ordersApi.getByRef(ref);
        setOrder(data);
      } catch {
        setError('Order not found.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
  }, [ref]);

  const formatCurrency = (val: string) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(parseFloat(val));

  if (isLoading) {
    return (
      <div className="container" style={pageStyles}>
        <div style={centerStyles}>
          <Skeleton width="80px" height="80px" borderRadius="50%" />
          <Skeleton width="240px" height="24px" borderRadius="var(--radius-md)" />
          <Skeleton width="100%" height="200px" borderRadius="var(--radius-lg)" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container" style={pageStyles}>
        <div style={centerStyles}>
          <div style={iconCircleStyles}>?</div>
          <h2 style={headingStyles}>Order Not Found</h2>
          <p style={subTextStyles}>{error || 'The order could not be found.'}</p>
          <Link to="/dashboard/orders" style={primaryBtnStyles}>View My Orders</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={pageStyles}>
      <div style={centerStyles}>
        <div style={successCircleStyles}>✓</div>

        <h2 style={headingStyles}>Order Confirmed!</h2>
        <p style={subTextStyles}>
          Your order <strong>#{order.reference}</strong> has been placed successfully.
        </p>

        {/* Order Summary Card */}
        <div style={cardStyles}>
          <div style={cardRowStyles}>
            <span style={cardLabelStyles}>Order Reference</span>
            <span style={cardValueStyles}>{order.reference}</span>
          </div>
          <div style={cardRowStyles}>
            <span style={cardLabelStyles}>Status</span>
            <span
              className="status-badge"
              style={{
                backgroundColor: statusColor(order.status).bg,
                color: statusColor(order.status).text,
              }}
            >
              {order.status.replace(/_/g, ' ')}
            </span>
          </div>
          <div style={cardRowStyles}>
            <span style={cardLabelStyles}>Items</span>
            <span style={cardValueStyles}>{order.items.length}</span>
          </div>

          <hr style={dividerStyles} />

          <div style={cardRowStyles}>
            <span style={cardLabelStyles}>Subtotal</span>
            <span style={cardValueStyles}>{formatCurrency(order.subtotal)}</span>
          </div>
          <div style={cardRowStyles}>
            <span style={cardLabelStyles}>Delivery</span>
            <span style={cardValueStyles}>{formatCurrency(order.delivery_fee)}</span>
          </div>
          <div style={{ ...cardRowStyles, fontWeight: 'var(--font-bold)' }}>
            <span>Total</span>
            <span style={{ color: 'var(--color-primary)', fontSize: 'var(--text-base)' }}>
              {formatCurrency(order.total)}
            </span>
          </div>
        </div>

        {/* Items List */}
        <div style={itemsCardStyles}>
          {order.items.map((item) => (
            <div key={item.id} style={itemRowStyles}>
              <img
                src={item.product.primary_image_url || '/logo.jpg?v=2'}
                alt={item.product.name}
                style={itemImgStyles}
                onError={e => { (e.target as HTMLImageElement).src = '/logo.jpg?v=2'; }}
              />
              <div style={{ flex: 1 }}>
                <p style={itemNameStyles}>{item.product.name}</p>
                {item.variant && <p style={itemSubStyles}>{item.variant.name}</p>}
                <p style={itemSubStyles}>Qty: {item.quantity}</p>
              </div>
              <span style={itemPriceStyles}>{formatCurrency(item.line_total)}</span>
            </div>
          ))}
        </div>

        <div style={actionRowStyles}>
          <Link to={`/dashboard/orders/${order.reference}`} style={primaryBtnStyles}>
            Track Order
          </Link>
          <Link to="/products" style={secondaryBtnStyles}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

// Helpers
function statusColor(status: string) {
  switch (status) {
    case 'PAID':
    case 'DELIVERED':
    case 'COMPLETED':
      return { bg: 'rgba(46, 213, 115, 0.12)', text: 'var(--color-success)' };
    case 'CANCELLED':
    case 'REFUNDED':
      return { bg: 'rgba(231, 76, 60, 0.12)', text: 'var(--color-danger)' };
    case 'PENDING_PAYMENT':
    case 'PROCESSING':
      return { bg: 'rgba(255, 165, 2, 0.12)', text: 'var(--color-warning)' };
    default:
      return { bg: 'rgba(103, 58, 183, 0.08)', text: 'var(--color-primary)' };
  }
}

// Styling
const pageStyles: React.CSSProperties = {
  paddingTop: 'var(--space-6)',
  paddingBottom: 'var(--space-12)',
};

const centerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 'var(--space-4)',
  maxWidth: '480px',
  margin: '0 auto',
  textAlign: 'center',
  padding: 'var(--space-6) 0',
};

const successCircleStyles: React.CSSProperties = {
  width: '72px',
  height: '72px',
  borderRadius: '50%',
  backgroundColor: 'rgba(46, 213, 115, 0.1)',
  border: '3px solid var(--color-success)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '2rem',
  color: 'var(--color-success)',
  fontWeight: 'bold',
};

const iconCircleStyles: React.CSSProperties = {
  ...successCircleStyles,
  backgroundColor: 'rgba(255, 165, 2, 0.1)',
  border: '3px solid var(--color-warning)',
  color: 'var(--color-warning)',
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
  margin: 0,
};

const cardStyles: React.CSSProperties = {
  width: '100%',
  padding: 'var(--space-4)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: 'var(--color-bg-subtle)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
};

const cardRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 'var(--text-xs)',
  alignItems: 'center',
};

const cardLabelStyles: React.CSSProperties = {
  color: 'var(--color-text-muted)',
};

const cardValueStyles: React.CSSProperties = {
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-text)',
};

const dividerStyles: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid var(--color-border)',
  margin: 0,
};

const itemsCardStyles: React.CSSProperties = {
  width: '100%',
  padding: 'var(--space-3)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
};

const itemRowStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
  padding: 'var(--space-2) 0',
  borderBottom: '1px solid var(--color-border)',
};

const itemImgStyles: React.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: 'var(--radius-md)',
  objectFit: 'cover',
  border: '1px solid var(--color-border)',
};

const itemNameStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-semibold)',
};

const itemSubStyles: React.CSSProperties = {
  margin: 0,
  fontSize: '10px',
  color: 'var(--color-text-muted)',
};

const itemPriceStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-bold)',
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
