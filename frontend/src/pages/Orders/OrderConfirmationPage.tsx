import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ordersApi } from '@/api/orders';
import {
  SHIPMENT_STATUS_LABELS,
  PARCEL_CLASSIFICATION_LABELS,
} from '@/services/deliveryPricingService';
import { getProductImageUrl, getProductFallbackImage } from '@/utils/image';
import type { Order, ShipmentFulfillmentStatus } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';

// ----------------------------------------------------------
// OrderConfirmationPage — /orders/:ref
// Fetches the order from API by reference and displays consolidated shipment summary.
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

  const formatCurrency = (val: string | number | null | undefined) => {
    if (val === null || val === undefined || val === '') return 'Manual Quote Pending';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return 'Manual Quote Pending';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(num);
  };

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

  const shipments = order.shipments || [];
  const isAwaitingManualQuote =
    String(order.status) === 'AWAITING_DELIVERY_CONFIRMATION' ||
    order.requires_manual_quote ||
    shipments.some((s) => s.requires_manual_quote && s.manual_quote_status === 'PENDING_ADMIN_QUOTE');

  return (
    <div className="container" style={pageStyles}>
      <div style={centerStyles}>
        <div style={isAwaitingManualQuote ? iconCircleStyles : successCircleStyles}>
          {isAwaitingManualQuote ? '⏳' : '✓'}
        </div>

        <h2 style={headingStyles}>
          {isAwaitingManualQuote
            ? 'Order Received — Awaiting Delivery Confirmation'
            : 'Order Confirmed!'}
        </h2>
        <p style={subTextStyles}>
          {isAwaitingManualQuote ? (
            <>
              Your order <strong>#{order.reference}</strong> has been received at our Onitsha Hub. Our logistics desk is calculating your manual delivery quotation and will notify you to review & accept before payment.
            </>
          ) : (
            <>
              Your order <strong>#{order.reference}</strong> has been placed and is being prepared for consolidated dispatch from our <strong>Onitsha Hub</strong>.
            </>
          )}
        </p>

        {/* Order Summary Card */}
        <div style={cardStyles}>
          <div style={cardRowStyles}>
            <span style={cardLabelStyles}>Order Reference</span>
            <span style={cardValueStyles}>{order.reference}</span>
          </div>
          <div style={cardRowStyles}>
            <span style={cardLabelStyles}>Fulfillment Status</span>
            <span
              className="status-badge"
              style={{
                backgroundColor: statusColor(order.status).bg,
                color: statusColor(order.status).text,
                padding: '2px 8px',
                borderRadius: '999px',
                fontWeight: 700,
              }}
            >
              {SHIPMENT_STATUS_LABELS[order.status as ShipmentFulfillmentStatus] ||
                order.status.replace(/_/g, ' ')}
            </span>
          </div>
          <div style={cardRowStyles}>
            <span style={cardLabelStyles}>Dispatch Origin</span>
            <span style={cardValueStyles}>Onitsha Hub</span>
          </div>
          <div style={cardRowStyles}>
            <span style={cardLabelStyles}>Shipments</span>
            <span style={cardValueStyles}>
              {shipments.length || 1}{' '}
              {(shipments.length || 1) === 1 ? 'Consolidated Shipment' : 'Separate Shipments'}
            </span>
          </div>

          <hr style={dividerStyles} />

          <div style={cardRowStyles}>
            <span style={cardLabelStyles}>Product Subtotal</span>
            <span style={cardValueStyles}>{formatCurrency(order.subtotal)}</span>
          </div>
          <div style={cardRowStyles}>
            <span style={cardLabelStyles}>Consolidated Delivery Fee</span>
            <span style={cardValueStyles}>
              {isAwaitingManualQuote
                ? 'Manual Quote Pending'
                : formatCurrency(order.delivery_fee)}
            </span>
          </div>
          <div style={{ ...cardRowStyles, fontWeight: 'var(--font-bold)' }}>
            <span>Total Payable</span>
            <span style={{ color: 'var(--color-primary)', fontSize: 'var(--text-base)' }}>
              {isAwaitingManualQuote
                ? `${formatCurrency(order.subtotal)} + Delivery Quote`
                : formatCurrency(order.total)}
            </span>
          </div>
        </div>

        {/* Shipment Summary Cards if available */}
        {shipments.length > 0 && (
          <div style={itemsCardStyles}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textAlign: 'left', textTransform: 'uppercase' }}>
              Consolidated Shipment Breakdown ({shipments.length})
            </div>
            {shipments.map((s, idx) => (
              <div
                key={s.id}
                style={{
                  textAlign: 'left',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--color-bg-subtle)',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span>
                    Shipment #{idx + 1}: {PARCEL_CLASSIFICATION_LABELS[s.shipment_classification]}
                  </span>
                  <span>
                    {s.requires_manual_quote && s.delivery_fee === null
                      ? 'Manual Quote'
                      : formatCurrency(s.delivery_fee)}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  {s.transport_arrangement} · {s.items.length} item(s)
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Items List */}
        <div style={itemsCardStyles}>
          {order.items.map((item) => (
            <div key={item.id} style={itemRowStyles}>
              <img
                src={getProductImageUrl(item.product)}
                alt={item.product.name}
                style={itemImgStyles}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getProductFallbackImage(item.product);
                }}
              />
              <div style={{ flex: 1, textAlign: 'left' }}>
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
            Track Order & Shipments
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
    case 'AWAITING_DELIVERY_CONFIRMATION':
      return { bg: 'rgba(255, 165, 2, 0.12)', text: 'var(--color-warning)' };
    default:
      return { bg: 'rgba(255, 122, 0, 0.12)', text: 'var(--color-primary)' };
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
  maxWidth: '520px',
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
  lineHeight: 1.5,
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
  flexWrap: 'wrap',
  justifyContent: 'center',
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
