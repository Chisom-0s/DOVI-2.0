import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ordersApi } from '@/api/orders';
import type { Order, OrderTracking } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';

// ----------------------------------------------------------
// OrderDetailPage — /dashboard/orders/:ref
// Fetches order + tracking from API.
// ----------------------------------------------------------
export default function OrderDetailPage() {
  const { ref } = useParams<{ ref: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchOrder = useCallback(async () => {
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
  }, [ref]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleCancel = async () => {
    if (!ref) return;
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setActionLoading(true);
    try {
      const updated = await ordersApi.cancel(ref);
      setOrder(updated);
      toast.success('Order cancelled successfully.');
    } catch {
      toast.error('Failed to cancel order.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReceipt = async () => {
    if (!ref) return;
    setActionLoading(true);
    try {
      const updated = await ordersApi.confirmReceipt(ref);
      setOrder(updated);
      toast.success('Receipt confirmed!');
    } catch {
      toast.error('Failed to confirm receipt.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (val: string) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(parseFloat(val));

  if (isLoading) {
    return (
      <div className="container" style={pageStyles}>
        <Skeleton width="200px" height="28px" borderRadius="var(--radius-md)" />
        <div className="order-detail-grid">
          <Skeleton width="100%" height="400px" borderRadius="var(--radius-lg)" />
          <Skeleton width="100%" height="280px" borderRadius="var(--radius-lg)" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container" style={pageStyles}>
        <div style={centerStyles}>
          <h2 style={headingStyles}>Order Not Found</h2>
          <p style={subTextStyles}>{error}</p>
          <Link to="/dashboard/orders" style={primaryBtnStyles}>View All Orders</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={pageStyles}>
      <div style={headerRowStyles}>
        <div>
          <Link to="/dashboard/orders" style={backLinkStyles}>← My Orders</Link>
          <h1 style={titleStyles}>Order #{order.reference}</h1>
        </div>
        <span
          className="status-badge"
          style={{
            backgroundColor: statusColor(order.status).bg,
            color: statusColor(order.status).text,
            fontSize: '11px',
            padding: '4px 12px',
          }}
        >
          {order.status.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="order-detail-grid">
        {/* Main Column */}
        <div style={mainColStyles}>
          {/* Items */}
          <section style={sectionStyles}>
            <h3 style={sectionTitleStyles}>Order Items</h3>
            {order.items.map((item) => (
              <div key={item.id} style={itemRowStyles}>
                <img
                  src={item.product.primary_image_url || '/logo.jpg?v=2'}
                  alt={item.product.name}
                  style={itemImgStyles}
                  onError={e => { (e.target as HTMLImageElement).src = '/logo.jpg?v=2'; }}
                />
                <div style={{ flex: 1 }}>
                  <Link to={`/products/${item.product.id}`} style={itemNameStyles}>
                    {item.product.name}
                  </Link>
                  {item.variant && <p style={itemSubStyles}>{item.variant.name}</p>}
                  <p style={itemSubStyles}>Qty: {item.quantity} × {formatCurrency(item.unit_price)}</p>
                </div>
                <span style={itemPriceStyles}>{formatCurrency(item.line_total)}</span>
              </div>
            ))}
          </section>

          {/* Status Timeline */}
          {order.tracking && order.tracking.length > 0 && (
            <section style={sectionStyles}>
              <h3 style={sectionTitleStyles}>Order Timeline</h3>
              <div style={timelineContainerStyles}>
                {order.tracking.map((track: OrderTracking, idx: number) => (
                  <div key={idx} style={timelineItemStyles}>
                    <div style={timelineDotStyles(idx === 0)} />
                    {idx < order.tracking.length - 1 && <div style={timelineLineStyles} />}
                    <div style={timelineContentStyles}>
                      <span style={timelineStatusStyles(idx === 0)}>
                        {track.status.replace(/_/g, ' ')}
                      </span>
                      <p style={timelineDescStyles}>{track.description}</p>
                      {track.location && (
                        <p style={timelineLocStyles}>📍 {track.location}</p>
                      )}
                      <span style={timelineDateStyles}>
                        {new Date(track.timestamp).toLocaleString('en-NG', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Delivery Address */}
          <section style={sectionStyles}>
            <h3 style={sectionTitleStyles}>Delivery Address</h3>
            <p style={addrTextStyles}>
              {order.delivery_address.full_name}<br />
              {order.delivery_address.phone}<br />
              {order.delivery_address.address_line_1}
              {order.delivery_address.address_line_2 ? `, ${order.delivery_address.address_line_2}` : ''}<br />
              {order.delivery_address.city}, {order.delivery_address.state}
            </p>
          </section>
        </div>

        {/* Sidebar */}
        <div style={sidebarStyles}>
          <div style={summaryCardStyles}>
            <h3 style={summaryTitleStyles}>Order Summary</h3>

            <div style={summaryRowStyles}>
              <span>Subtotal</span>
              <span style={summaryValStyles}>{formatCurrency(order.subtotal)}</span>
            </div>
            <div style={summaryRowStyles}>
              <span>Delivery ({order.delivery_method})</span>
              <span style={summaryValStyles}>{formatCurrency(order.delivery_fee)}</span>
            </div>

            <hr style={dividerStyles} />

            <div style={{ ...summaryRowStyles, fontWeight: 'var(--font-bold)' }}>
              <span>Total</span>
              <span style={{ color: 'var(--color-primary)', fontSize: 'var(--text-base)' }}>
                {formatCurrency(order.total)}
              </span>
            </div>

            <div style={summaryRowStyles}>
              <span>Payment</span>
              <span style={summaryValStyles}>{order.payment_method || 'Pending'}</span>
            </div>

            <div style={summaryRowStyles}>
              <span>Payment Status</span>
              <span style={summaryValStyles}>{order.payment_status}</span>
            </div>

            <div style={summaryRowStyles}>
              <span>Placed on</span>
              <span style={summaryValStyles}>
                {new Date(order.created_at).toLocaleDateString('en-NG', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={actionsCardStyles}>
            {order.can_cancel && (
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                style={dangerBtnStyles}
              >
                {actionLoading ? 'Cancelling...' : 'Cancel Order'}
              </button>
            )}

            {order.can_confirm_receipt && (
              <button
                onClick={handleConfirmReceipt}
                disabled={actionLoading}
                style={primaryBtnStyles}
              >
                {actionLoading ? 'Confirming...' : 'Confirm Receipt'}
              </button>
            )}

            {order.can_request_refund && (
              <Link
                to={`/dashboard/refunds?order=${order.reference}`}
                style={{ ...secondaryBtnStyles, textAlign: 'center' }}
              >
                Request Refund
              </Link>
            )}

            {order.can_review && (
              <Link
                to={`/dashboard/reviews?order=${order.reference}`}
                style={{ ...secondaryBtnStyles, textAlign: 'center' }}
              >
                Write Review
              </Link>
            )}
          </div>
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
    case 'RECEIVED':
      return { bg: 'rgba(46, 213, 115, 0.12)', text: 'var(--color-success)' };
    case 'CANCELLED':
    case 'REFUND_REQUESTED':
    case 'REFUNDED':
      return { bg: 'rgba(231, 76, 60, 0.12)', text: 'var(--color-danger)' };
    case 'PENDING_PAYMENT':
    case 'PROCESSING':
    case 'REFUND_REVIEW':
      return { bg: 'rgba(255, 165, 2, 0.12)', text: 'var(--color-warning)' };
    case 'SHIPPED':
    case 'IN_TRANSIT':
      return { bg: 'rgba(103, 58, 183, 0.08)', text: 'var(--color-primary)' };
    default:
      return { bg: 'var(--color-bg-subtle)', text: 'var(--color-text-muted)' };
  }
}

// Styling
const pageStyles: React.CSSProperties = {
  paddingTop: 'var(--space-6)',
  paddingBottom: 'var(--space-12)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-5)',
};

const headerRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: 'var(--space-3)',
};

const backLinkStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
  textDecoration: 'none',
  fontWeight: 'var(--font-medium)',
};

const titleStyles: React.CSSProperties = {
  fontSize: 'var(--text-xl)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  marginTop: 'var(--space-1)',
};

const centerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 'var(--space-3)',
  padding: 'var(--space-12)',
  textAlign: 'center',
};

const headingStyles: React.CSSProperties = {
  fontSize: 'var(--text-xl)',
  fontWeight: 'var(--font-bold)',
  margin: 0,
};

const subTextStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--color-text-muted)',
  margin: 0,
};

const mainColStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-5)',
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
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
  color: 'var(--color-text)',
  margin: 0,
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
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-text)',
  textDecoration: 'none',
  display: 'block',
};

const itemSubStyles: React.CSSProperties = {
  margin: 0,
  fontSize: '11px',
  color: 'var(--color-text-muted)',
};

const itemPriceStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
};

// Timeline
const timelineContainerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
  paddingLeft: 'var(--space-2)',
};

const timelineItemStyles: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-3)',
  position: 'relative',
  paddingBottom: 'var(--space-4)',
};

const timelineDotStyles = (isActive: boolean): React.CSSProperties => ({
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  backgroundColor: isActive ? 'var(--color-primary)' : 'var(--color-border)',
  flexShrink: 0,
  marginTop: '4px',
  zIndex: 1,
});

const timelineLineStyles: React.CSSProperties = {
  position: 'absolute',
  left: '5px',
  top: '16px',
  width: '2px',
  bottom: 0,
  backgroundColor: 'var(--color-border)',
};

const timelineContentStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const timelineStatusStyles = (isActive: boolean): React.CSSProperties => ({
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-bold)',
  color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
  textTransform: 'capitalize',
});

const timelineDescStyles: React.CSSProperties = {
  margin: 0,
  fontSize: '11px',
  color: 'var(--color-text-muted)',
};

const timelineLocStyles: React.CSSProperties = {
  margin: 0,
  fontSize: '10px',
  color: 'var(--color-text-muted)',
};

const timelineDateStyles: React.CSSProperties = {
  fontSize: '10px',
  color: 'var(--color-text-muted)',
};

const addrTextStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text)',
  lineHeight: 1.6,
};

// Sidebar
const sidebarStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
};

const summaryCardStyles: React.CSSProperties = {
  padding: 'var(--space-5)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: 'var(--color-bg-subtle)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
  position: 'sticky',
  top: 'var(--space-4)',
};

const summaryTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-bold)',
  margin: 0,
};

const summaryRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 'var(--text-xs)',
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

const actionsCardStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
};

const primaryBtnStyles: React.CSSProperties = {
  width: '100%',
  padding: '10px 20px',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontWeight: 'var(--font-bold)',
  fontSize: 'var(--text-sm)',
  cursor: 'pointer',
  textDecoration: 'none',
};

const dangerBtnStyles: React.CSSProperties = {
  width: '100%',
  padding: '10px 20px',
  backgroundColor: 'transparent',
  color: 'var(--color-danger)',
  border: '1px solid var(--color-danger)',
  borderRadius: 'var(--radius-md)',
  fontWeight: 'var(--font-bold)',
  fontSize: 'var(--text-sm)',
  cursor: 'pointer',
};

const secondaryBtnStyles: React.CSSProperties = {
  width: '100%',
  padding: '10px 20px',
  backgroundColor: 'transparent',
  color: 'var(--color-text)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  fontWeight: 'var(--font-semibold)',
  fontSize: 'var(--text-sm)',
  textDecoration: 'none',
  display: 'block',
};
