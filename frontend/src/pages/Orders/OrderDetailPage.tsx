import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ordersApi } from '@/api/orders';
import { deliveryApi } from '@/api/delivery';
import {
  SHIPMENT_STATUS_LABELS,
  SHIPMENT_STATUS_ORDER,
  PARCEL_CLASSIFICATION_LABELS,
} from '@/services/deliveryPricingService';
import type {
  Order,
  DeliveryGroup,
  DeliveryStatus,
  OrderShipment,
  ShipmentFulfillmentStatus,
} from '@/types';
import { Skeleton } from '@/components/common/Skeleton';

const TIMELINE_KEY_STEPS: ShipmentFulfillmentStatus[] = [
  'ORDER_PLACED',
  'SOURCING_PRODUCTS',
  'AWAITING_PRODUCTS_AT_HUB',
  'PRODUCTS_RECEIVED',
  'QUALITY_CHECK',
  'PACKAGED',
  'DISPATCHED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

export default function OrderDetailPage() {
  const { ref } = useParams<{ ref: string }>();
  const navigate = useNavigate();
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

  const handleRespondToManualQuote = async (shipmentId: string, accept: boolean) => {
    if (!order) return;
    setActionLoading(true);
    try {
      const updated = await ordersApi.respondToDeliveryQuote(
        order.id || order.reference,
        shipmentId,
        accept
      );
      setOrder(updated);
      if (accept) {
        toast.success(
          'Delivery quotation accepted! Your order is now confirmed for payment and Onitsha Hub fulfillment.'
        );
      } else {
        toast('Delivery quotation declined.', { icon: 'ℹ️' });
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to respond to delivery quotation.');
    } finally {
      setActionLoading(false);
    }
  };

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
        <Skeleton width="200px" height="28px" borderRadius="var(--radius-md)" />
        <div className="checkout-layout-grid">
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

  const shipments: OrderShipment[] = order.shipments || [];
  const hasOnitshaShipments = shipments.length > 0;
  const hasDeliveryGroups = order.delivery_groups && order.delivery_groups.length > 0;
  const quotedShipments = shipments.filter(
    (s) => s.manual_quote_status === 'QUOTED_AWAITING_CUSTOMER'
  );
  const pendingQuoteShipments = shipments.filter(
    (s) => s.requires_manual_quote && s.manual_quote_status === 'PENDING_ADMIN_QUOTE'
  );

  return (
    <div className="container" style={pageStyles}>
      <div style={headerRowStyles}>
        <div>
          <Link to="/dashboard/orders" style={backLinkStyles}>← My Orders</Link>
          <h1 style={titleStyles}>Order #{order.reference}</h1>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Dispatch Origin: <strong>Onitsha Hub</strong> · Shipments:{' '}
            <strong>
              {shipments.length || 1}{' '}
              {shipments.length <= 1 ? 'Consolidated Shipment' : 'Separate Shipments'}
            </strong>
          </div>
        </div>
        <span
          style={{
            backgroundColor: statusColor(order.status).bg,
            color: statusColor(order.status).text,
            fontSize: '11px',
            fontWeight: 'var(--font-bold)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            textTransform: 'uppercase',
          }}
        >
          {SHIPMENT_STATUS_LABELS[order.status as ShipmentFulfillmentStatus] ||
            order.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* MANUAL DELIVERY QUOTATION BANNERS (Section 8) */}
      {pendingQuoteShipments.length > 0 && (
        <div
          style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            color: '#92400e',
          }}
        >
          <strong style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>
            ⏳ Awaiting Delivery Fee Confirmation from DOVI Onitsha Hub
          </strong>
          <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5 }}>
            Your order includes a route or bulky item requiring a custom transport quotation from our Onitsha Hub logistics desk. As soon as the administrator confirms your exact delivery fee, you will be notified here to review and approve it before payment and dispatch proceed.
          </p>
        </div>
      )}

      {quotedShipments.map((qs) => (
        <div
          key={qs.id}
          style={{
            backgroundColor: '#eff6ff',
            border: '2px solid #3b82f6',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div>
            <span
              style={{
                display: 'inline-block',
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                padding: '2px 8px',
                borderRadius: '999px',
                marginBottom: '6px',
              }}
            >
              ACTION REQUIRED: DELIVERY QUOTATION READY
            </span>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1e3a8a' }}>
              Review & Confirm Your Delivery Quotation for {qs.shipment_reference}
            </h3>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#1e40af', lineHeight: 1.5 }}>
              Our Onitsha Hub logistics team has confirmed the transport arrangement ({qs.transport_arrangement}) to {qs.destination_city}, {qs.destination_state}.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '24px',
              flexWrap: 'wrap',
              padding: '12px 14px',
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #bfdbfe',
              fontSize: '13px',
            }}
          >
            <div>
              <span style={{ color: '#64748b' }}>Product Subtotal: </span>
              <strong>{formatCurrency(order.subtotal)}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Confirmed Delivery Fee: </span>
              <strong style={{ color: '#2563eb' }}>{formatCurrency(qs.delivery_fee)}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Updated Total Payable: </span>
              <strong style={{ color: 'var(--color-primary)', fontSize: '15px' }}>
                {formatCurrency(parseFloat(order.subtotal || '0') + (qs.delivery_fee ?? 0))}
              </strong>
            </div>
          </div>

          {qs.delivery_notes && (
            <div style={{ fontSize: '12px', color: '#334155' }}>
              <strong>Logistics Notes:</strong> {qs.delivery_notes}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleRespondToManualQuote(qs.id, true)}
              style={{
                ...primaryBtnStyles,
                backgroundColor: '#16a34a',
                padding: '10px 20px',
                fontSize: '13px',
              }}
            >
              {actionLoading
                ? 'Processing...'
                : `✓ Accept Delivery Fee (${formatCurrency(qs.delivery_fee)}) & Proceed`}
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleRespondToManualQuote(qs.id, false)}
              style={{
                ...dangerBtnStyles,
                padding: '10px 18px',
                fontSize: '13px',
              }}
            >
              Decline Quotation
            </button>
          </div>
        </div>
      ))}

      <div className="checkout-layout-grid">
        {/* Main Column */}
        <div style={mainColStyles}>
          {/* ONITSHA HUB CONSOLIDATED SHIPMENTS VIEW (Section 9) */}
          {hasOnitshaShipments ? (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              <div>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', margin: 0 }}>
                  {shipments.length === 1
                    ? 'Consolidated Shipment Progress (Onitsha Hub)'
                    : `Shipments Breakdown (${shipments.length} Shipments from Onitsha Hub)`}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  {shipments.length === 1
                    ? 'All products in your order are consolidated into a single shipment from our Onitsha Hub.'
                    : 'Your order requires separate transport arrangements. Track the status of each shipment below — your order is marked Delivered only when all shipments have arrived.'}
                </p>
              </div>

              {shipments.map((shipment, idx) => {
                const currentRank = SHIPMENT_STATUS_ORDER.indexOf(shipment.status);
                return (
                  <div key={shipment.id || idx} style={groupCardStyles}>
                    <div style={groupHeaderStyles}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
                            {shipments.length === 1
                              ? `Consolidated Shipment (${shipment.shipment_reference})`
                              : `Shipment #${idx + 1} of ${shipments.length} (${shipment.shipment_reference})`}
                          </strong>
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
                            {PARCEL_CLASSIFICATION_LABELS[shipment.shipment_classification]}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                          Origin: <strong>{shipment.dispatch_origin} Hub</strong> &rarr;{' '}
                          <strong>
                            {shipment.destination_city}, {shipment.destination_state}
                          </strong>{' '}
                          · Transport: <strong>{shipment.transport_arrangement}</strong>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: '11px',
                            fontWeight: 'var(--font-bold)',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: statusColor(shipment.status).bg,
                            color: statusColor(shipment.status).text,
                          }}
                        >
                          {SHIPMENT_STATUS_LABELS[shipment.status] || shipment.status}
                        </span>
                        <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '4px' }}>
                          Delivery Fee:{' '}
                          {shipment.requires_manual_quote && shipment.delivery_fee === null
                            ? 'Manual Quote Pending'
                            : formatCurrency(shipment.delivery_fee)}
                        </div>
                      </div>
                    </div>

                    {/* Visual Onitsha Hub Fulfillment Progress Timeline */}
                    <div
                      style={{
                        padding: '14px 16px',
                        borderBottom: '1px solid var(--color-border)',
                        backgroundColor: '#fcfcfd',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#475569',
                          textTransform: 'uppercase',
                          marginBottom: '10px',
                        }}
                      >
                        Onitsha Hub Fulfillment Progress
                      </div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(95px, 1fr))',
                          gap: '8px',
                        }}
                      >
                        {TIMELINE_KEY_STEPS.map((stepStatus, stepIdx) => {
                          const stepRank = SHIPMENT_STATUS_ORDER.indexOf(stepStatus);
                          const isCompleted = currentRank >= stepRank;
                          const isCurrent = shipment.status === stepStatus;
                          return (
                            <div
                              key={stepStatus}
                              style={{
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: `1px solid ${
                                  isCurrent
                                    ? 'var(--color-primary)'
                                    : isCompleted
                                    ? '#bbf7d0'
                                    : '#e2e8f0'
                                }`,
                                backgroundColor: isCurrent
                                  ? '#fff7ed'
                                  : isCompleted
                                  ? '#f0fdf4'
                                  : '#ffffff',
                                fontSize: '10px',
                                fontWeight: isCurrent || isCompleted ? 700 : 500,
                                color: isCurrent
                                  ? '#9a3412'
                                  : isCompleted
                                  ? '#166534'
                                  : '#94a3b8',
                              }}
                            >
                              <div>
                                {isCompleted ? '✓ ' : `${stepIdx + 1}. `}
                                {SHIPMENT_STATUS_LABELS[stepStatus]}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Shipment Items */}
                    <div
                      style={{
                        padding: 'var(--space-4)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--space-3)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--color-text-muted)',
                          textTransform: 'uppercase',
                        }}
                      >
                        Items Included in Shipment ({shipment.items.length})
                      </div>
                      {shipment.items.map((item) => (
                        <div key={item.id} style={itemRowStyles}>
                          <img
                            src={item.image_url || '/logo.jpg?v=2'}
                            alt={item.product_name}
                            style={itemImgStyles}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/logo.jpg?v=2';
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <Link to={`/products/${item.product_id}`} style={itemNameStyles}>
                              {item.product_name}
                            </Link>
                            {item.variant_name && <p style={itemSubStyles}>{item.variant_name}</p>}
                            <p style={itemSubStyles}>
                              Qty: {item.quantity} × {formatCurrency(item.unit_price)} ·{' '}
                              {PARCEL_CLASSIFICATION_LABELS[item.delivery_classification]}
                            </p>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                              <span
                                style={{
                                  fontSize: '10px',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: item.hub_received ? '#dcfce7' : '#f1f5f9',
                                  color: item.hub_received ? '#166534' : '#64748b',
                                }}
                              >
                                {item.hub_received ? '✓ At Onitsha Hub' : '• Sourcing / En Route to Hub'}
                              </span>
                              {item.quality_checked && (
                                <span
                                  style={{
                                    fontSize: '10px',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    backgroundColor: '#dcfce7',
                                    color: '#166534',
                                  }}
                                >
                                  ✓ Quality Inspected
                                </span>
                              )}
                              {item.packaged && (
                                <span
                                  style={{
                                    fontSize: '10px',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    backgroundColor: '#dcfce7',
                                    color: '#166534',
                                  }}
                                >
                                  ✓ Packaged
                                </span>
                              )}
                            </div>
                          </div>
                          <span style={itemPriceStyles}>
                            {formatCurrency(item.unit_price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Shipment Footer Details */}
                    <div
                      style={{
                        padding: 'var(--space-3) var(--space-4)',
                        background: 'var(--color-bg-subtle)',
                        borderTop: '1px dashed var(--color-border)',
                        fontSize: 'var(--text-xs)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      {shipment.separation_reason && (
                        <div>
                          <strong>Consolidation / Grouping Note:</strong> {shipment.separation_reason}
                        </div>
                      )}
                      {shipment.tracking_reference && (
                        <div style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                          Waybill / Tracking Reference: {shipment.tracking_reference}
                        </div>
                      )}
                      {shipment.delivery_notes && (
                        <div style={{ color: 'var(--color-text-muted)' }}>
                          Notes: {shipment.delivery_notes}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          ) : hasDeliveryGroups ? (
            /* Legacy Multi-Vendor Delivery Groups Fallback */
            <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', margin: 0 }}>
                Fulfillment & Delivery Groups
              </h2>

              {order.delivery_groups!.map((group: DeliveryGroup, idx: number) => (
                <div key={group.id || idx} style={groupCardStyles}>
                  <div style={groupHeaderStyles}>
                    <div>
                      <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)' }}>
                        GROUP #{idx + 1}: {group.vendor?.name || 'DOVI Onitsha Hub'}
                      </strong>
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

                  {group.status === 'DELIVERED' && (
                    <div style={{ padding: 'var(--space-3) var(--space-4)', borderTop: '1px dashed var(--color-border)' }}>
                      <button
                        onClick={() => handleConfirmGroupDelivery(group.id)}
                        disabled={actionLoading}
                        style={primaryBtnStyles}
                      >
                        {actionLoading ? 'Confirming...' : 'Confirm Delivery Receipt'}
                      </button>
                    </div>
                  )}
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

          {/* Delivery Destination Card */}
          {(order.delivery_address || shipments[0]) && (
            <section style={sectionStyles}>
              <h3 style={sectionTitleStyles}>Delivery Destination</h3>
              <p style={addrTextStyles}>
                {order.delivery_address?.full_name || shipments[0]?.recipient_name || 'Customer'}
                <br />
                {order.delivery_address?.phone || shipments[0]?.recipient_phone || ''}
                <br />
                {order.delivery_address?.address_line_1 || shipments[0]?.destination_address}
                {order.delivery_address?.address_line_2
                  ? `, ${order.delivery_address.address_line_2}`
                  : ''}
                <br />
                {order.delivery_address?.city || shipments[0]?.destination_city},{' '}
                {order.delivery_address?.state || shipments[0]?.destination_state}
              </p>
            </section>
          )}
        </div>

        {/* Summary Sidebar */}
        <div style={sidebarStyles}>
          <div style={summaryCardStyles}>
            <h3 style={summaryTitleStyles}>Order & Delivery Summary</h3>

            <div style={summaryRowStyles}>
              <span>Product Subtotal</span>
              <span style={summaryValStyles}>{formatCurrency(order.subtotal)}</span>
            </div>

            <div style={summaryRowStyles}>
              <span>Shipment Count</span>
              <span style={summaryValStyles}>
                {shipments.length || 1} {shipments.length <= 1 ? 'Shipment' : 'Shipments'}
              </span>
            </div>

            {shipments.length > 1 &&
              shipments.map((s, idx) => (
                <div key={s.id} style={{ ...summaryRowStyles, color: 'var(--color-text-muted)' }}>
                  <span>Shipment #{idx + 1} Delivery:</span>
                  <span>
                    {s.requires_manual_quote && s.delivery_fee === null
                      ? 'Manual Quote'
                      : formatCurrency(s.delivery_fee)}
                  </span>
                </div>
              ))}

            <div style={summaryRowStyles}>
              <span>Total Delivery Fee</span>
              <span style={summaryValStyles}>
                {pendingQuoteShipments.length > 0
                  ? 'Pending Confirmation'
                  : formatCurrency(order.delivery_fee)}
              </span>
            </div>

            <hr style={dividerStyles} />

            <div style={{ ...summaryRowStyles, fontWeight: 'var(--font-bold)' }}>
              <span>Total Payable</span>
              <span style={{ color: 'var(--color-primary)', fontSize: 'var(--text-base)' }}>
                {pendingQuoteShipments.length > 0
                  ? `${formatCurrency(order.subtotal)} + Quote`
                  : formatCurrency(order.total)}
              </span>
            </div>

            <div style={summaryRowStyles}>
              <span>Fulfillment Status</span>
              <span style={summaryValStyles}>
                {SHIPMENT_STATUS_LABELS[order.status as ShipmentFulfillmentStatus] ||
                  order.status}
              </span>
            </div>

            <div style={summaryRowStyles}>
              <span>Payment Status</span>
              <span style={summaryValStyles}>{order.payment_status}</span>
            </div>

            <div style={summaryRowStyles}>
              <span>Placed on</span>
              <span style={summaryValStyles}>
                {new Date(order.created_at).toLocaleDateString('en-NG', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Overall Actions */}
          <div style={actionsCardStyles}>
            {String(order.status) === 'DELIVERY_FEE_CONFIRMED' && (
              <button
                type="button"
                onClick={() => navigate('/checkout')}
                style={primaryBtnStyles}
              >
                Proceed to Payment
              </button>
            )}

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
    case 'DELIVERY_FEE_CONFIRMED':
      return { bg: 'rgba(46, 213, 115, 0.12)', text: 'var(--color-success)' };
    case 'CANCELLED':
    case 'REFUND_REQUESTED':
    case 'REFUNDED':
      return { bg: 'rgba(231, 76, 60, 0.12)', text: 'var(--color-danger)' };
    case 'PENDING_PAYMENT':
    case 'PROCESSING':
    case 'REFUND_REVIEW':
    case 'AWAITING_DELIVERY_CONFIRMATION':
    case 'SOURCING_PRODUCTS':
    case 'AWAITING_PRODUCTS_AT_HUB':
      return { bg: 'rgba(255, 165, 2, 0.12)', text: 'var(--color-warning)' };
    case 'SHIPPED':
    case 'IN_TRANSIT':
    case 'DISPATCHED':
    case 'OUT_FOR_DELIVERY':
    case 'PACKAGED':
    case 'READY_FOR_DISPATCH':
      return { bg: 'rgba(255, 122, 0, 0.12)', text: 'var(--color-primary)' };
    default:
      return { bg: 'var(--color-bg-subtle)', text: 'var(--color-text-muted)' };
  }
}

function deliveryStatusColor(status: DeliveryStatus | string) {
  switch (status) {
    case 'READY_FOR_PICKUP':
    case 'READY_FOR_DELIVERY':
    case 'IN_TRANSIT':
      return { bg: 'rgba(255, 122, 0, 0.12)', text: 'var(--color-primary)' };
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
  marginBottom: 0,
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
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: '8px',
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
