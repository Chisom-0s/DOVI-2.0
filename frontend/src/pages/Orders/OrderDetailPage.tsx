import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ordersApi } from '@/api/orders';
import { getProductImageUrl, getProductFallbackImage } from '@/utils/image';
import { deliveryApi } from '@/api/delivery';
import type { Order, DeliveryGroup, DeliveryStatus, OrderTracking } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';

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

  const handleConfirmGroupDelivery = async (groupId: string) => {
    setActionLoading(true);
    try {
      await deliveryApi.confirmDelivery(groupId);
      toast.success('Delivery confirmed for group!');
      fetchOrder();
    } catch {
      toast.error('Failed to confirm delivery.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (val: string | number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(
      typeof val === 'string' ? parseFloat(val) : val
    );

  if (isLoading) {
    return (
      <div className="container" style={pageStyles}>
        <Skeleton width="200px" height="28px" borderRadius="var(--radius-md)" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-6)' }}>
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

  const hasDeliveryGroups = order.delivery_groups && order.delivery_groups.length > 0;

  return (
    <div className="container" style={pageStyles}>
      <div style={headerRowStyles}>
        <div>
          <Link to="/dashboard/orders" style={backLinkStyles}>← My Orders</Link>
          <h1 style={titleStyles}>Order #{order.reference}</h1>
        </div>
        <span
          style={{
            backgroundColor: statusColor(order.status).bg,
            color: statusColor(order.status).text,
            fontSize: '11px',
            fontWeight: 'var(--font-bold)',
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            textTransform: 'uppercase',
          }}
        >
          {order.status.replace(/_/g, ' ')}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-6)' }}>
        {/* Main Column */}
        <div style={mainColStyles}>
          {/* MULTI-VENDOR DELIVERY GROUPS */}
          {hasDeliveryGroups ? (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', margin: 0 }}>
                Vendor Fulfillment & Delivery Groups
              </h2>

              {order.delivery_groups!.map((group: DeliveryGroup, idx: number) => (
                <div key={group.id || idx} style={groupCardStyles}>
                  <div style={groupHeaderStyles}>
                    <div>
                      <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)' }}>
                        STORE #{idx + 1}: {group.vendor?.name || 'Vendor Store'}
                      </strong>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        Method: <strong>{group.method === 'PICKUP' ? '📍 Store Pick Up' : '🚚 Vendor Delivery'}</strong>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 'var(--font-bold)',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: deliveryStatusColor(group.status).bg,
                        color: deliveryStatusColor(group.status).text,
                      }}
                    >
                      {group.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Group Items */}
                  <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {group.items.map((item) => (
                      <div key={item.id} style={itemRowStyles}>
                        <img
                          src={item.product.primary_image_url || '/logo.jpg?v=2'}
                          alt={item.product.name}
                          style={itemImgStyles}
                          onError={(e) => { (e.target as HTMLImageElement).src = '/logo.jpg?v=2'; }}
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
                  </div>

                  {/* Location Info & Instructions */}
                  <div style={{ padding: 'var(--space-4)', background: 'var(--color-bg-subtle)', borderTop: '1px dashed var(--color-border)', fontSize: 'var(--text-xs)' }}>
                    {group.method === 'PICKUP' ? (
                      <div>
                        <strong style={{ color: 'var(--color-text)' }}>📍 Store Pickup Address Snapshot:</strong>
                        <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)' }}>
                          {group.pickup_address || group.vendor.name}<br />
                          {group.pickup_city ? `${group.pickup_city}, ${group.pickup_state}` : 'Contact vendor for pickup hours'}
                        </p>
                        {group.status === 'READY_FOR_PICKUP' && (
                          <div style={{ marginTop: 'var(--space-2)', padding: 'var(--space-2)', background: 'rgba(46, 213, 115, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--color-success)', fontWeight: 'var(--font-medium)' }}>
                            ✅ Your order is ready for pickup! Please bring your order reference #{order.reference}.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <strong style={{ color: 'var(--color-text)' }}>🚚 Shipping Address:</strong>
                        <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)' }}>
                          {group.recipient_name || order.delivery_address?.full_name}<br />
                          {group.delivery_address || order.delivery_address?.address_line_1}<br />
                          {group.delivery_city || order.delivery_address?.city}, {group.delivery_state || order.delivery_address?.state}
                        </p>
                        {group.tracking_reference && (
                          <div style={{ marginTop: 'var(--space-2)', color: 'var(--color-primary)', fontWeight: 'var(--font-bold)' }}>
                            Tracking Reference: {group.tracking_reference}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Group Action */}
                    {group.status === 'DELIVERED' && (
                      <button
                        onClick={() => handleConfirmGroupDelivery(group.id)}
                        disabled={actionLoading}
                        style={{ ...primaryBtnStyles, marginTop: 'var(--space-3)' }}
                      >
                        {actionLoading ? 'Confirming...' : 'Confirm Delivery Receipt'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </section>
          ) : (
            /* Legacy Order Items View */
            <section style={sectionStyles}>
              <h3 style={sectionTitleStyles}>Order Items</h3>
              {order.items.map((item) => (
                <div key={item.id} style={itemRowStyles}>
                  <img
                    src={item.product.primary_image_url || '/logo.jpg?v=2'}
                    alt={item.product.name}
                    style={itemImgStyles}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/logo.jpg?v=2'; }}
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
          )}

          {/* Legacy Delivery Address Fallback if no delivery groups */}
          {!hasDeliveryGroups && order.delivery_address && (
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
          )}
        </div>

        {/* Summary Sidebar */}
        <div style={sidebarStyles}>
          <div style={summaryCardStyles}>
            <h3 style={summaryTitleStyles}>Order Summary</h3>

            <div style={summaryRowStyles}>
              <span>Subtotal</span>
              <span style={summaryValStyles}>{formatCurrency(order.subtotal)}</span>
            </div>
            <div style={summaryRowStyles}>
              <span>Delivery Fee</span>
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
              <span style={summaryValStyles}>{order.payment_method || 'Standard'}</span>
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

          {/* Overall Actions */}
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

function deliveryStatusColor(status: DeliveryStatus | string) {
  switch (status) {
    case 'READY_FOR_PICKUP':
    case 'READY_FOR_DELIVERY':
    case 'IN_TRANSIT':
      return { bg: 'rgba(103, 58, 183, 0.12)', text: 'var(--color-primary)' };
    case 'PICKED_UP':
    case 'DELIVERED':
    case 'COMPLETED':
      return { bg: 'rgba(46, 213, 115, 0.12)', text: 'var(--color-success)' };
    case 'CANCELLED':
    case 'FAILED':
      return { bg: 'rgba(231, 76, 60, 0.12)', text: 'var(--color-danger)' };
    default:
      return { bg: 'var(--color-bg-subtle)', text: 'var(--color-text-muted)' };
  }
}

// Styles
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
  background: '#ffffff',
  padding: 'var(--space-5)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
};

const sectionTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-bold)',
  margin: '0 0 var(--space-4)',
};

const groupCardStyles: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
  overflow: 'hidden',
};

const groupHeaderStyles: React.CSSProperties = {
  padding: 'var(--space-4)',
  background: 'var(--color-bg-subtle)',
  borderBottom: '1px solid var(--color-border)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const itemRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--space-3)',
  alignItems: 'center',
};

const itemImgStyles: React.CSSProperties = {
  width: '50px',
  height: '50px',
  objectFit: 'cover',
  borderRadius: 'var(--radius-md)',
};

const itemNameStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--color-text)',
  textDecoration: 'none',
};

const itemSubStyles: React.CSSProperties = {
  margin: '2px 0 0',
  fontSize: '11px',
  color: 'var(--color-text-muted)',
};

const itemPriceStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-bold)',
};

const addrTextStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
  lineHeight: 1.6,
};

const sidebarStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
};

const summaryCardStyles: React.CSSProperties = {
  background: '#ffffff',
  padding: 'var(--space-5)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
};

const summaryTitleStyles: React.CSSProperties = {
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-bold)',
  margin: 0,
};

const summaryRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 'var(--text-xs)',
};

const summaryValStyles: React.CSSProperties = {
  fontWeight: 'var(--font-semibold)',
};

const dividerStyles: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid var(--color-border)',
  margin: '4px 0',
};

const actionsCardStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
};

const primaryBtnStyles: React.CSSProperties = {
  padding: '10px 16px',
  backgroundColor: 'var(--color-primary)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontWeight: 'var(--font-bold)',
  fontSize: 'var(--text-xs)',
  cursor: 'pointer',
  textDecoration: 'none',
};

const secondaryBtnStyles: React.CSSProperties = {
  padding: '10px 16px',
  backgroundColor: 'transparent',
  color: 'var(--color-text)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  fontWeight: 'var(--font-medium)',
  fontSize: 'var(--text-xs)',
  cursor: 'pointer',
  textDecoration: 'none',
};

const dangerBtnStyles: React.CSSProperties = {
  padding: '10px 16px',
  backgroundColor: 'rgba(231, 76, 60, 0.1)',
  color: 'var(--color-danger)',
  border: '1px solid var(--color-danger)',
  borderRadius: 'var(--radius-md)',
  fontWeight: 'var(--font-bold)',
  fontSize: 'var(--text-xs)',
  cursor: 'pointer',
};
