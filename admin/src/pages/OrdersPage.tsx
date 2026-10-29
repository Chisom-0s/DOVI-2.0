import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import type {
  Order,
  OrderSummary,
  APIError,
  OrderShipment,
  ShipmentFulfillmentStatus,
} from '@/types';
import {
  syncDeliveryStoreFromServer,
  getOrderShipments,
  getAllStoredOrderShipments,
  saveOrderShipments,
  updateShipmentStatus,
  updateShipmentItemHubStatus,
  confirmManualDeliveryQuote,
  approvePartialSplitDelivery,
  deriveOverallOrderStatus,
  SHIPMENT_STATUS_LABELS,
  SHIPMENT_STATUS_ORDER,
  PARCEL_CLASSIFICATION_LABELS,
  calculateConsolidatedDelivery,
  buildOrderShipmentsFromCalculation,
} from '@/services/deliveryPricingService';
import { Skeleton } from '@/components/common/Skeleton';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';

export default function OrdersPage() {
  const { user } = useAdminAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected Order Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderShipments, setOrderShipments] = useState<OrderShipment[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isActionPending, setIsActionPending] = useState(false);

  // Per-shipment form drafts (transport arrangement, notes, tracking, manual quote fee)
  const [shipmentDrafts, setShipmentDrafts] = useState<
    Record<
      string,
      {
        status: ShipmentFulfillmentStatus;
        transport_arrangement: string;
        delivery_notes: string;
        tracking_reference: string;
        quote_fee: string;
        quote_notes: string;
      }
    >
  >({});

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const hydrateDraftsForShipments = (shipments: OrderShipment[]) => {
    const nextDrafts: Record<string, any> = {};
    for (const s of shipments) {
      nextDrafts[s.id] = {
        status: s.status,
        transport_arrangement: s.transport_arrangement || '',
        delivery_notes: s.delivery_notes || '',
        tracking_reference: s.tracking_reference || '',
        quote_fee: s.delivery_fee !== null && s.delivery_fee !== undefined ? String(s.delivery_fee) : '',
        quote_notes: s.delivery_notes || '',
      };
    }
    setShipmentDrafts(nextDrafts);
  };

  const fetchOrders = async (showSkeleton = true) => {
    if (showSkeleton) setIsLoading(true);
    setError(null);
    try {
      await syncDeliveryStoreFromServer();
      const res = await adminApi.listOrders({
        page,
        status: statusFilter || undefined,
        q: searchTerm || undefined,
      });

      const backendResults: any[] = res.results ? [...res.results] : [];
      const allShipmentMap = getAllStoredOrderShipments();

      // Enrich backend orders with shipment info and also surface any manual-quote / local orders
      const seenKeys = new Set<string>();
      const enrichedBackend = backendResults.map((ord: any) => {
        const ref = ord.reference_code || ord.reference || ord.id;
        seenKeys.add(String(ord.id));
        seenKeys.add(String(ref));
        const shipments = getOrderShipments(ord.id, ref);
        if (shipments.length > 0) {
          const overallStatus = deriveOverallOrderStatus(shipments);
          const anyPendingQuote = shipments.some(
            (s) => s.requires_manual_quote && s.manual_quote_status === 'PENDING_ADMIN_QUOTE'
          );
          const confirmedFee = shipments.reduce((sum, s) => sum + (s.delivery_fee ?? 0), 0);
          return {
            ...ord,
            status: anyPendingQuote ? 'AWAITING_DELIVERY_CONFIRMATION' : overallStatus || ord.status,
            shipment_count: shipments.length,
            requires_manual_quote: anyPendingQuote,
            delivery_fee: anyPendingQuote ? ord.delivery_fee : String(confirmedFee),
          };
        }
        return ord;
      });

      // Synthesize orders from shared shipment store that are not yet in backendResults
      const localOrders: any[] = [];
      for (const [key, shipments] of Object.entries(allShipmentMap)) {
        if (!Array.isArray(shipments) || shipments.length === 0) continue;
        const first = shipments[0];
        const ordId = first.order_id || key;
        const ordRef = first.order_reference || key;
        if (seenKeys.has(ordId) || seenKeys.has(ordRef)) continue;
        seenKeys.add(ordId);
        seenKeys.add(ordRef);

        const allItems = shipments.flatMap((s) => s.items || []);
        const subtotalNum = allItems.reduce(
          (sum, item) => sum + (Number(item.unit_price) || 0) * (Number(item.quantity) || 1),
          0
        );
        const anyPendingQuote = shipments.some(
          (s) => s.requires_manual_quote && s.manual_quote_status === 'PENDING_ADMIN_QUOTE'
        );
        const totalFee = shipments.reduce((sum, s) => sum + (s.delivery_fee ?? 0), 0);
        const overallStatus = anyPendingQuote
          ? 'AWAITING_DELIVERY_CONFIRMATION'
          : deriveOverallOrderStatus(shipments);

        localOrders.push({
          id: ordId,
          reference: ordRef,
          reference_code: ordRef,
          status: overallStatus,
          item_count: allItems.reduce((sum, item) => sum + (item.quantity || 1), 0),
          items: allItems.map((it) => ({
            id: it.id,
            product_id: it.product_id,
            product_name: it.product_name,
            variant_name: it.variant_name,
            quantity: it.quantity,
            unit_price: String(it.unit_price),
            line_total: String((Number(it.unit_price) || 0) * (Number(it.quantity) || 1)),
            product: {
              id: it.product_id,
              name: it.product_name,
              primary_image_url: it.image_url,
            },
          })),
          subtotal: String(subtotalNum),
          delivery_fee: anyPendingQuote ? '0' : String(totalFee),
          total: String(subtotalNum + totalFee),
          total_amount: String(subtotalNum + totalFee),
          shipping_address_line_1: first.destination_address,
          shipping_city: first.destination_city,
          shipping_state: first.destination_state,
          shipping_country: 'Nigeria',
          buyer_email: first.recipient_name ? `${first.recipient_name} (${first.recipient_phone || ''})` : 'Customer',
          shipment_count: shipments.length,
          requires_manual_quote: anyPendingQuote,
          created_at: first.created_at || new Date().toISOString(),
        });
      }

      let combined = [...localOrders, ...enrichedBackend];
      if (statusFilter) {
        combined = combined.filter((o) => o.status === statusFilter);
      }
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        combined = combined.filter(
          (o) =>
            String(o.reference_code || o.reference || o.id)
              .toLowerCase()
              .includes(q) ||
            String(o.buyer_email || '')
              .toLowerCase()
              .includes(q)
        );
      }

      setOrders(combined);
      setTotalPages(Math.ceil((res.count || combined.length) / 20) || 1);
    } catch (err: any) {
      setError(err);
      toast.error('Failed to load orders.');
    } finally {
      if (showSkeleton) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders(true);
  };

  const ensureOrderShipmentsInitialized = (orderObj: any): OrderShipment[] => {
    const orderId = orderObj.id || orderObj.reference_code || orderObj.reference;
    const orderRef = orderObj.reference || orderObj.reference_code || orderId;
    let existing = getOrderShipments(orderId, orderRef);
    if (existing.length > 0) {
      return existing;
    }

    // Automatically build consolidated Onitsha Hub shipment(s) for orders without stored shipments
    const destState =
      orderObj.shipping_state ||
      orderObj.delivery_address?.state ||
      orderObj.delivery_groups?.[0]?.delivery_state ||
      'Lagos';
    const destCity =
      orderObj.shipping_city ||
      orderObj.delivery_address?.city ||
      orderObj.delivery_groups?.[0]?.delivery_city ||
      'Lagos';
    const destAddr =
      orderObj.shipping_address_line_1 ||
      orderObj.delivery_address?.address_line_1 ||
      orderObj.delivery_groups?.[0]?.delivery_address ||
      `${destCity}, ${destState}`;

    const rawItems = Array.isArray(orderObj.items) ? orderObj.items : [];
    if (rawItems.length === 0) return [];

    const calcResult = calculateConsolidatedDelivery(
      rawItems.map((it: any) => ({
        product: {
          id: it.product_id || it.product?.id || it.id || 'prod-item',
          name: it.product_name || it.product?.name || 'Order Item',
          price: it.unit_price || it.price || '0',
          primary_image_url: it.product?.primary_image_url || it.image_url || '/logo.jpg?v=2',
          category_name: it.product?.category_name || '',
          delivery_classification: it.delivery_classification || it.product?.delivery_classification,
        },
        quantity: Number(it.quantity) || 1,
        unit_price: Number(it.unit_price || it.price || 0),
        variant_name: it.variant_sku || it.variant_name || (typeof it.variant === 'string' ? it.variant : ''),
      })),
      destState,
      destCity,
      'Onitsha'
    );

    const built = buildOrderShipmentsFromCalculation(
      orderId,
      orderRef,
      calcResult,
      destAddr,
      orderObj.delivery_address?.recipient_name || orderObj.buyer_email || 'Customer',
      orderObj.delivery_address?.phone_number || ''
    );
    saveOrderShipments(orderId, orderRef, built);
    return built;
  };

  const handleInspectOrder = async (summary: any) => {
    setIsDetailLoading(true);
    try {
      await syncDeliveryStoreFromServer();
      const orderId = summary.id || summary.reference_code || summary.reference;
      let detail: Order | null = null;
      try {
        detail = await adminApi.getOrder(orderId);
      } catch {
        if (summary.reference && summary.reference !== orderId) {
          try {
            detail = await adminApi.getOrder(summary.reference);
          } catch {}
        }
      }

      const resolvedOrder: Order =
        detail && detail.id && (detail.items?.length || !summary.items?.length)
          ? { ...summary, ...detail, items: detail.items?.length ? detail.items : summary.items || [] }
          : {
              id: summary.id || summary.reference || 'ord-inspect',
              reference: summary.reference || summary.reference_code || 'ORD-UNKNOWN',
              status: summary.status || 'ORDER_PLACED',
              items: summary.items || [],
              delivery_address: summary.delivery_address || null,
              delivery_method: summary.delivery_method || 'DELIVERY',
              delivery_groups: summary.delivery_groups || [],
              subtotal: summary.subtotal || summary.total || '0',
              delivery_fee: summary.delivery_fee || '0',
              total: summary.total || summary.total_amount || '0',
              payment_status: summary.payment_status || 'PAID',
              payment_method: summary.payment_method || 'Bank Transfer',
              tracking: summary.tracking || [],
              can_cancel: false,
              can_request_refund: false,
              can_confirm_receipt: false,
              can_review: false,
              created_at: summary.created_at || new Date().toISOString(),
              ...summary,
            };

      const shipments = ensureOrderShipmentsInitialized(resolvedOrder);
      setOrderShipments(shipments);
      hydrateDraftsForShipments(shipments);
      setSelectedOrder({
        ...resolvedOrder,
        shipments,
        shipment_count: shipments.length,
      });
    } catch {
      toast.error('Failed to load order details.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedOrder) return;

    // Enforce Section 6 Rule: Do not mark an order as DELIVERED until all required shipments have been delivered
    if (
      (newStatus === 'DELIVERED' || newStatus === 'COMPLETED' || newStatus === 'RECEIVED') &&
      orderShipments.length > 0
    ) {
      const undelivered = orderShipments.filter((s) => s.status !== 'DELIVERED');
      if (undelivered.length > 0) {
        toast.error(
          `Cannot mark order as ${newStatus}: ${undelivered.length} shipment(s) (${undelivered
            .map((s) => s.shipment_reference)
            .join(', ')}) have not yet been marked as DELIVERED.`
        );
        return;
      }
    }

    setIsActionPending(true);
    try {
      const orderId = selectedOrder.id || selectedOrder.reference;
      const updated = await adminApi.updateOrderStatus(orderId, newStatus);
      toast.success(`Order ${selectedOrder.reference || selectedOrder.id} status updated to ${newStatus}.`);
      setSelectedOrder((prev) => (prev ? { ...prev, status: updated.status || (newStatus as any) } : prev));
      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrder.id || o.reference === selectedOrder.reference
            ? { ...o, status: (updated.status || newStatus) as any }
            : o
        )
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to update order status.');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleToggleItemHubCheck = (
    shipmentId: string,
    itemId: string,
    field: 'hub_received' | 'quality_checked' | 'packaged',
    currentVal: boolean
  ) => {
    if (!selectedOrder) return;
    try {
      const orderKey = selectedOrder.id || selectedOrder.reference;
      const actor = {
        id: user?.id,
        email: user?.email || 'admin@dovi.com',
        name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Admin',
        role: user?.role || 'ADMIN',
      };
      updateShipmentItemHubStatus(
        orderKey,
        shipmentId,
        itemId,
        { [field]: !currentVal },
        actor
      );
      const updatedShipments = getOrderShipments(orderKey, selectedOrder.reference);
      setOrderShipments([...updatedShipments]);
      hydrateDraftsForShipments(updatedShipments);
      const overall = deriveOverallOrderStatus(updatedShipments);
      setSelectedOrder((prev) => (prev ? { ...prev, status: overall as any, shipments: updatedShipments } : prev));
      toast.success('Onitsha Hub item status updated.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update hub item check.');
    }
  };

  const handleUpdateShipment = (shipment: OrderShipment) => {
    if (!selectedOrder) return;
    const draft = shipmentDrafts[shipment.id];
    if (!draft) return;

    try {
      const orderKey = selectedOrder.id || selectedOrder.reference;
      const actor = {
        id: user?.id,
        email: user?.email || 'admin@dovi.com',
        name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Admin',
        role: user?.role || 'ADMIN',
      };
      const result = updateShipmentStatus(
        orderKey,
        shipment.id,
        draft.status,
        actor,
        {
          transport_arrangement: draft.transport_arrangement,
          delivery_notes: draft.delivery_notes,
          tracking_reference: draft.tracking_reference || undefined,
        }
      );
      const updatedShipments = result.allShipments;
      setOrderShipments([...updatedShipments]);
      hydrateDraftsForShipments(updatedShipments);
      const overall = result.overallOrderStatus;
      setSelectedOrder((prev) => (prev ? { ...prev, status: overall as any, shipments: updatedShipments } : prev));
      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrder.id || o.reference === selectedOrder.reference
            ? { ...o, status: overall as any }
            : o
        )
      );
      toast.success(
        `Shipment ${shipment.shipment_reference} updated to ${SHIPMENT_STATUS_LABELS[draft.status]}.`
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to update shipment status.');
    }
  };

  const handleConfirmManualQuote = (shipment: OrderShipment) => {
    if (!selectedOrder) return;
    const draft = shipmentDrafts[shipment.id];
    const feeNum = Number(draft?.quote_fee);
    if (isNaN(feeNum) || feeNum < 0 || draft?.quote_fee === '') {
      toast.error('Please enter a valid confirmed delivery fee (NGN).');
      return;
    }

    try {
      const orderKey = selectedOrder.id || selectedOrder.reference;
      const actor = {
        id: user?.id,
        email: user?.email || 'admin@dovi.com',
        name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Admin',
        role: user?.role || 'ADMIN',
      };
      const { shipments: updatedShipments, totalDeliveryFee: newTotalFee } = confirmManualDeliveryQuote(
        orderKey,
        [
          {
            shipmentId: shipment.id,
            confirmedDeliveryFee: feeNum,
            transportArrangement: draft.transport_arrangement || shipment.transport_arrangement,
            deliveryNotes: draft.quote_notes || 'Manual delivery quotation confirmed by Onitsha Logistics Desk.',
          },
        ],
        actor
      );
      setOrderShipments([...updatedShipments]);
      hydrateDraftsForShipments(updatedShipments);

      const subtotalNum = parseFloat(selectedOrder.subtotal || '0');
      setSelectedOrder((prev) =>
        prev
          ? {
              ...prev,
              delivery_fee: String(newTotalFee),
              total: String(subtotalNum + newTotalFee),
              status: 'DELIVERY_FEE_CONFIRMED' as any,
              shipments: updatedShipments,
            }
          : prev
      );
      toast.success(
        `Confirmed delivery fee of ${formatCurrency(String(feeNum))} for ${shipment.shipment_reference}. Customer has been notified to review & accept.`
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to confirm manual delivery quote.');
    }
  };

  const handleApproveSplitDelivery = (shipment: OrderShipment) => {
    if (!selectedOrder) return;
    try {
      const orderKey = selectedOrder.id || selectedOrder.reference;
      const actor = {
        id: user?.id,
        email: user?.email || 'admin@dovi.com',
        name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Admin',
        role: user?.role || 'ADMIN',
      };
      const updatedShipments = approvePartialSplitDelivery(
        orderKey,
        shipment.id,
        actor,
        0
      );
      setOrderShipments([...updatedShipments]);
      hydrateDraftsForShipments(updatedShipments);
      toast.success('Split delivery approved! Arrived items separated into an active shipment.');
    } catch (err: any) {
      toast.error(err.message || 'Could not split shipment.');
    }
  };

  const formatCurrency = (val: string | number | null | undefined) => {
    if (val === null || val === undefined || val === '') return 'Manual Quote Required';
    const num = typeof val === 'number' ? val : parseFloat(val);
    if (isNaN(num)) return 'Manual Quote Required';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(num);
  };

  if (isLoading) {
    return (
      <div style={containerStyles}>
        <h2 style={titleStyles}>Order Logs & Onitsha Hub Fulfillment</h2>
        <Skeleton width="100%" height="48px" borderRadius="8px" />
        <div style={{ marginTop: '24px' }}>
          <Skeleton width="100%" height="300px" borderRadius="12px" />
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={titleStyles}>Order Logs & Onitsha Hub Fulfillment</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
            Manage supplier sourcing, Onitsha Hub product receipt, quality inspection, consolidated packaging, and dispatch.
          </p>
        </div>
      </div>

      <ApiErrorMessage error={error} />

      {/* Filter / Search Bar */}
      <div style={filterBarStyles}>
        <form onSubmit={handleSearchSubmit} style={searchFormStyles}>
          <input
            type="text"
            placeholder="Search by DOV-ORD reference or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={searchInputStyles}
          />
          <button type="submit" style={searchBtnStyles}>Search</button>
        </form>

        <div style={filterWrapperStyles}>
          <label style={filterLabelStyles}>Fulfillment Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={selectStyles}
          >
            <option value="">All Orders</option>
            <option value="AWAITING_DELIVERY_CONFIRMATION">Awaiting Delivery Quote</option>
            <option value="DELIVERY_FEE_CONFIRMED">Delivery Fee Confirmed</option>
            <option value="ORDER_PLACED">Order Placed</option>
            <option value="SOURCING_PRODUCTS">Sourcing Products</option>
            <option value="AWAITING_PRODUCTS_AT_HUB">Awaiting Products at Onitsha Hub</option>
            <option value="PRODUCTS_RECEIVED">Products Received at Hub</option>
            <option value="QUALITY_CHECK">Quality Check</option>
            <option value="READY_FOR_PACKAGING">Ready for Packaging</option>
            <option value="PACKAGED">Packaged</option>
            <option value="READY_FOR_DISPATCH">Ready for Dispatch</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="PENDING_PAYMENT">Pending Payment</option>
            <option value="PAID">Paid</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      {orders.length === 0 ? (
        <EmptyState
          icon="🛒"
          title="No Orders Found"
          subtitle="Try adjusting your status filters or order reference search query."
        />
      ) : (
        <div style={tableCardStyles}>
          <div style={tableWrapperStyles}>
            <table style={tableStyles}>
              <thead>
                <tr style={tableHeaderRowStyles}>
                  <th style={tableHeaderCellStyles}>Reference</th>
                  <th style={tableHeaderCellStyles}>Date</th>
                  <th style={tableHeaderCellStyles}>Items & Shipments</th>
                  <th style={tableHeaderCellStyles}>Total Amount</th>
                  <th style={tableHeaderCellStyles}>Fulfillment Status</th>
                  <th style={{ ...tableHeaderCellStyles, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o: any) => {
                  const ref = o.reference_code || o.reference || o.id;
                  const itemCount = o.item_count ?? o.items?.length ?? 0;
                  const shipmentCount = o.shipment_count ?? 1;
                  const total = o.total_amount ?? o.total ?? '0';
                  return (
                    <tr key={o.id || ref} style={tableRowStyles}>
                      <td style={{ ...tableCellStyles, fontWeight: 700 }}>
                        <div>{ref}</div>
                        {o.requires_manual_quote && (
                          <span
                            style={{
                              display: 'inline-block',
                              marginTop: '4px',
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: '#fef2f2',
                              color: '#dc2626',
                              border: '1px solid #fecaca',
                            }}
                          >
                            Manual Delivery Quote Needed
                          </span>
                        )}
                      </td>
                      <td style={tableCellStyles}>
                        {o.created_at ? new Date(o.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td style={tableCellStyles}>
                        <div style={{ fontWeight: 600 }}>
                          {itemCount} item{itemCount !== 1 ? 's' : ''}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>
                          {shipmentCount} shipment{shipmentCount !== 1 ? 's' : ''} (Origin: Onitsha)
                        </div>
                      </td>
                      <td style={{ ...tableCellStyles, fontWeight: 700 }}>{formatCurrency(total)}</td>
                      <td style={tableCellStyles}>
                        <span style={statusBadgeStyles(o.status)}>
                          {SHIPMENT_STATUS_LABELS[o.status as ShipmentFulfillmentStatus] ||
                            (o.status || '').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ ...tableCellStyles, textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleInspectOrder(o)}
                          style={viewBtnStyles}
                        >
                          Manage Fulfillment
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={paginationStyles}>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                style={pageBtnStyles}
              >
                Previous
              </button>
              <span style={pageLabelStyles}>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                style={pageBtnStyles}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Inspect Order & Onitsha Hub Shipment Management Modal */}
      {selectedOrder && (
        <div style={modalBackdropStyles}>
          <div
            style={{
              ...modalContentStyles,
              maxWidth: '880px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={modalHeaderStyles}>
              <div>
                <h3 style={modalTitleStyles}>
                  Onitsha Hub Order & Shipment Fulfillment —{' '}
                  {(selectedOrder as any).reference_code || selectedOrder.reference}
                </h3>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                  Dispatch Origin: <strong>Onitsha Hub</strong> · Shipments:{' '}
                  <strong>{orderShipments.length || 1}</strong> · Overall Status:{' '}
                  <strong>
                    {SHIPMENT_STATUS_LABELS[selectedOrder.status as ShipmentFulfillmentStatus] ||
                      selectedOrder.status}
                  </strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                style={closeBtnStyles}
              >
                &times;
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
                marginBottom: '20px',
              }}
            >
              {/* Left Side: Summary */}
              <div style={modalSummaryStyles}>
                <div style={detailItemStyles}>
                  <span style={detailLabelStyles}>Order Date</span>
                  <span style={detailValueStyles}>
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </span>
                </div>
                <div style={detailItemStyles}>
                  <span style={detailLabelStyles}>Customer</span>
                  <span style={detailValueStyles}>
                    {(selectedOrder as any).buyer_email || 'Customer'}
                  </span>
                </div>
                <div style={detailItemStyles}>
                  <span style={detailLabelStyles}>Overall Fulfillment Status</span>
                  <span style={statusBadgeStyles(selectedOrder.status)}>
                    {SHIPMENT_STATUS_LABELS[selectedOrder.status as ShipmentFulfillmentStatus] ||
                      selectedOrder.status}
                  </span>
                </div>
                <div style={{ ...detailItemStyles, border: 'none' }}>
                  <span style={detailLabelStyles}>Product Subtotal</span>
                  <span style={detailValueStyles}>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                <div style={{ ...detailItemStyles, border: 'none' }}>
                  <span style={detailLabelStyles}>
                    Consolidated Delivery Fee ({orderShipments.length || 1} shipment
                    {orderShipments.length === 1 ? '' : 's'})
                  </span>
                  <span style={detailValueStyles}>
                    {orderShipments.some(
                      (s) => s.requires_manual_quote && s.manual_quote_status === 'PENDING_ADMIN_QUOTE'
                    )
                      ? 'Manual Quote Pending'
                      : formatCurrency(selectedOrder.delivery_fee)}
                  </span>
                </div>
                <div
                  style={{
                    ...detailItemStyles,
                    border: 'none',
                    borderTop: '1px solid #e5e7eb',
                    paddingTop: '8px',
                  }}
                >
                  <span
                    style={{
                      ...detailLabelStyles,
                      color: 'var(--color-primary)',
                      fontWeight: 700,
                    }}
                  >
                    Total Payable
                  </span>
                  <span
                    style={{
                      ...detailValueStyles,
                      color: 'var(--color-primary)',
                      fontSize: '15px',
                    }}
                  >
                    {formatCurrency((selectedOrder as any).total_amount || selectedOrder.total)}
                  </span>
                </div>
              </div>

              {/* Right Side: Shipping & Overall Order Control */}
              <div style={modalSummaryStyles}>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                  }}
                >
                  Customer Delivery Destination
                </div>
                <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.4, color: '#1f2937' }}>
                  {(selectedOrder as any).shipping_address_line_1 ||
                    (selectedOrder as any).delivery_address?.address_line_1 ||
                    orderShipments[0]?.destination_address ||
                    'Delivery Address'}
                  <br />
                  {(selectedOrder as any).shipping_city ||
                    (selectedOrder as any).delivery_address?.city ||
                    orderShipments[0]?.destination_city ||
                    'Lagos'}
                  ,{' '}
                  {(selectedOrder as any).shipping_state ||
                    (selectedOrder as any).delivery_address?.state ||
                    orderShipments[0]?.destination_state ||
                    'Lagos'}
                  <br />
                  {(selectedOrder as any).shipping_country ||
                    (selectedOrder as any).delivery_address?.country ||
                    'Nigeria'}
                </p>

                {/* Overall Order Status Override Control */}
                <div style={{ marginTop: '12px' }}>
                  <label style={modalLabelStyles}>
                    Overall Order Status (Requires all shipments DELIVERED before marking Delivered)
                  </label>
                  <select
                    disabled={isActionPending}
                    value={selectedOrder.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    style={{ ...selectStyles, width: '100%' }}
                  >
                    <option value="AWAITING_DELIVERY_CONFIRMATION">Awaiting Delivery Confirmation</option>
                    <option value="DELIVERY_FEE_CONFIRMED">Delivery Fee Confirmed</option>
                    <option value="ORDER_PLACED">Order Placed</option>
                    <option value="SOURCING_PRODUCTS">Sourcing Products</option>
                    <option value="AWAITING_PRODUCTS_AT_HUB">Awaiting Products at Hub</option>
                    <option value="PRODUCTS_RECEIVED">Products Received</option>
                    <option value="QUALITY_CHECK">Quality Check</option>
                    <option value="READY_FOR_PACKAGING">Ready for Packaging</option>
                    <option value="PACKAGED">Packaged</option>
                    <option value="READY_FOR_DISPATCH">Ready for Dispatch</option>
                    <option value="DISPATCHED">Dispatched</option>
                    <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ONITSHA HUB SHIPMENT GROUPS SECTION */}
            <div style={{ marginTop: '16px', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#111827' }}>
                    Onitsha Hub Consolidated Shipments ({orderShipments.length})
                  </h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                    Receive items from suppliers at the Onitsha Hub, inspect condition, consolidate & package, and update shipment status.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {orderShipments.map((shipment, idx) => {
                  const draft = shipmentDrafts[shipment.id] || {
                    status: shipment.status,
                    transport_arrangement: shipment.transport_arrangement,
                    delivery_notes: shipment.delivery_notes,
                    tracking_reference: shipment.tracking_reference || '',
                    quote_fee: shipment.delivery_fee !== null ? String(shipment.delivery_fee) : '',
                    quote_notes: shipment.delivery_notes || '',
                  };

                  const receivedCount = shipment.items.filter((i) => i.hub_received).length;
                  const totalItemsInShipment = shipment.items.length;
                  const hasSupplierDelay =
                    totalItemsInShipment > 1 &&
                    receivedCount > 0 &&
                    receivedCount < totalItemsInShipment;

                  return (
                    <div
                      key={shipment.id}
                      style={{
                        border: '1px solid #d1d5db',
                        borderRadius: '10px',
                        padding: '16px',
                        backgroundColor: '#f9fafb',
                      }}
                    >
                      {/* Shipment Header */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          flexWrap: 'wrap',
                          gap: '8px',
                          paddingBottom: '10px',
                          borderBottom: '1px solid #e5e7eb',
                          marginBottom: '12px',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>
                              Shipment #{idx + 1}: {shipment.shipment_reference}
                            </span>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '999px',
                                backgroundColor: '#ffedd5',
                                color: '#9a3412',
                              }}
                            >
                              {PARCEL_CLASSIFICATION_LABELS[shipment.shipment_classification]}
                            </span>
                            <span style={statusBadgeStyles(shipment.status)}>
                              {SHIPMENT_STATUS_LABELS[shipment.status]}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px' }}>
                            Route: <strong>{shipment.dispatch_origin}</strong> &rarr;{' '}
                            <strong>
                              {shipment.destination_city}, {shipment.destination_state}
                            </strong>{' '}
                            · Weight:{' '}
                            <strong>
                              {shipment.combined_weight_kg
                                ? `${shipment.combined_weight_kg} kg`
                                : 'Standard'}
                            </strong>
                            {shipment.combined_dimensions_cm && (
                              <>
                                {' '}
                                · Dimensions: <strong>{shipment.combined_dimensions_cm}</strong>
                              </>
                            )}
                          </div>
                          {shipment.separation_reason && (
                            <div
                              style={{
                                fontSize: '11px',
                                color: '#1e40af',
                                backgroundColor: '#eff6ff',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                marginTop: '6px',
                              }}
                            >
                              <strong>Consolidation / Grouping Note:</strong> {shipment.separation_reason}
                            </div>
                          )}
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>
                            Shipment Delivery Fee
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>
                            {shipment.delivery_fee !== null
                              ? formatCurrency(shipment.delivery_fee)
                              : 'Manual Quote Required'}
                          </div>
                        </div>
                      </div>

                      {/* Manual Quotation Confirmation Box (if required) */}
                      {(shipment.requires_manual_quote ||
                        shipment.manual_quote_status === 'PENDING_ADMIN_QUOTE') && (
                        <div
                          style={{
                            backgroundColor: '#fffbeb',
                            border: '1px solid #fde68a',
                            borderRadius: '8px',
                            padding: '12px',
                            marginBottom: '12px',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '12px',
                              fontWeight: 800,
                              color: '#92400e',
                              marginBottom: '6px',
                            }}
                          >
                            ⚠️ Manual Delivery Quotation Required (Customer Awaiting Confirmation)
                          </div>
                          <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#78350f' }}>
                            Enter the actual transport partner quotation from Onitsha to{' '}
                            {shipment.destination_city}, {shipment.destination_state}. Once confirmed,
                            the customer will be notified to review and accept the fee before payment/dispatch.
                          </p>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                              gap: '10px',
                              alignItems: 'end',
                            }}
                          >
                            <div>
                              <label style={{ ...modalLabelStyles, color: '#92400e' }}>
                                Confirmed Delivery Fee (₦)
                              </label>
                              <input
                                type="number"
                                min="0"
                                placeholder="e.g. 18500"
                                value={draft.quote_fee}
                                onChange={(e) =>
                                  setShipmentDrafts((prev) => ({
                                    ...prev,
                                    [shipment.id]: { ...draft, quote_fee: e.target.value },
                                  }))
                                }
                                style={{ ...searchInputStyles, width: '100%' }}
                              />
                            </div>
                            <div>
                              <label style={{ ...modalLabelStyles, color: '#92400e' }}>
                                Transport Arrangement
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Onitsha Bulky Haulage Partner"
                                value={draft.transport_arrangement}
                                onChange={(e) =>
                                  setShipmentDrafts((prev) => ({
                                    ...prev,
                                    [shipment.id]: {
                                      ...draft,
                                      transport_arrangement: e.target.value,
                                    },
                                  }))
                                }
                                style={{ ...searchInputStyles, width: '100%' }}
                              />
                            </div>
                            <div>
                              <label style={{ ...modalLabelStyles, color: '#92400e' }}>
                                Quotation Explanation / Notes
                              </label>
                              <input
                                type="text"
                                placeholder="Reason / carrier details for customer"
                                value={draft.quote_notes}
                                onChange={(e) =>
                                  setShipmentDrafts((prev) => ({
                                    ...prev,
                                    [shipment.id]: { ...draft, quote_notes: e.target.value },
                                  }))
                                }
                                style={{ ...searchInputStyles, width: '100%' }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleConfirmManualQuote(shipment)}
                              style={{
                                backgroundColor: '#d97706',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '9px 14px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Confirm Fee & Notify Customer
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Supplier Delay / Partial Consolidation Alert */}
                      {hasSupplierDelay && (
                        <div
                          style={{
                            backgroundColor: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            marginBottom: '12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '10px',
                          }}
                        >
                          <div style={{ fontSize: '12px', color: '#1e3a8a' }}>
                            <strong>Pending Consolidation at Onitsha Hub:</strong> {receivedCount} of{' '}
                            {totalItemsInShipment} products have arrived at the Onitsha Hub. Arrived
                            products are held pending remaining supplier deliveries so the order ships
                            together.
                          </div>
                          <button
                            type="button"
                            onClick={() => handleApproveSplitDelivery(shipment)}
                            style={{
                              backgroundColor: '#2563eb',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Approve Split Delivery for Arrived Items
                          </button>
                        </div>
                      )}

                      {/* Onitsha Hub Item-Level Checkboxes */}
                      <div style={{ marginBottom: '12px' }}>
                        <div
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#4b5563',
                            textTransform: 'uppercase',
                            marginBottom: '6px',
                          }}
                        >
                          Products in Shipment & Onitsha Hub Verification ({shipment.items.length})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {shipment.items.map((item) => (
                            <div
                              key={item.id}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '8px',
                                padding: '8px 10px',
                                backgroundColor: '#ffffff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                              }}
                            >
                              <div>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>
                                  {item.product_name}
                                </span>
                                {item.variant_name && (
                                  <span style={{ fontSize: '11px', color: '#6b7280', marginLeft: '6px' }}>
                                    ({item.variant_name})
                                  </span>
                                )}
                                <span
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: '#374151',
                                    marginLeft: '8px',
                                  }}
                                >
                                  × {item.quantity}
                                </span>
                                <span
                                  style={{
                                    fontSize: '10px',
                                    marginLeft: '8px',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    backgroundColor: '#f3f4f6',
                                    color: '#4b5563',
                                  }}
                                >
                                  {PARCEL_CLASSIFICATION_LABELS[item.delivery_classification]}
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                  <input
                                    type="checkbox"
                                    checked={Boolean(item.hub_received)}
                                    onChange={() =>
                                      handleToggleItemHubCheck(
                                        shipment.id,
                                        item.id,
                                        'hub_received',
                                        Boolean(item.hub_received)
                                      )
                                    }
                                  />
                                  <span>1. Received at Hub</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                  <input
                                    type="checkbox"
                                    checked={Boolean(item.quality_checked)}
                                    onChange={() =>
                                      handleToggleItemHubCheck(
                                        shipment.id,
                                        item.id,
                                        'quality_checked',
                                        Boolean(item.quality_checked)
                                      )
                                    }
                                  />
                                  <span>2. Quality Checked</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                  <input
                                    type="checkbox"
                                    checked={Boolean(item.packaged)}
                                    onChange={() =>
                                      handleToggleItemHubCheck(
                                        shipment.id,
                                        item.id,
                                        'packaged',
                                        Boolean(item.packaged)
                                      )
                                    }
                                  />
                                  <span>3. Packaged</span>
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Shipment Status & Transport Controls */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                          gap: '10px',
                          alignItems: 'end',
                          paddingTop: '8px',
                          borderTop: '1px dashed #e5e7eb',
                        }}
                      >
                        <div>
                          <label style={modalLabelStyles}>Shipment Fulfillment Status</label>
                          <select
                            value={draft.status}
                            onChange={(e) =>
                              setShipmentDrafts((prev) => ({
                                ...prev,
                                [shipment.id]: {
                                  ...draft,
                                  status: e.target.value as ShipmentFulfillmentStatus,
                                },
                              }))
                            }
                            style={{ ...selectStyles, width: '100%' }}
                          >
                            {SHIPMENT_STATUS_ORDER.map((st) => (
                              <option key={st} value={st}>
                                {SHIPMENT_STATUS_LABELS[st]}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={modalLabelStyles}>Transport Arrangement</label>
                          <input
                            type="text"
                            value={draft.transport_arrangement}
                            onChange={(e) =>
                              setShipmentDrafts((prev) => ({
                                ...prev,
                                [shipment.id]: { ...draft, transport_arrangement: e.target.value },
                              }))
                            }
                            placeholder="e.g. Consolidated Heavy Van"
                            style={{ ...searchInputStyles, width: '100%' }}
                          />
                        </div>

                        <div>
                          <label style={modalLabelStyles}>Waybill / Tracking Ref</label>
                          <input
                            type="text"
                            value={draft.tracking_reference}
                            onChange={(e) =>
                              setShipmentDrafts((prev) => ({
                                ...prev,
                                [shipment.id]: { ...draft, tracking_reference: e.target.value },
                              }))
                            }
                            placeholder="e.g. ONI-WB-9021"
                            style={{ ...searchInputStyles, width: '100%' }}
                          />
                        </div>

                        <div>
                          <label style={modalLabelStyles}>Hub / Dispatch Notes</label>
                          <input
                            type="text"
                            value={draft.delivery_notes}
                            onChange={(e) =>
                              setShipmentDrafts((prev) => ({
                                ...prev,
                                [shipment.id]: { ...draft, delivery_notes: e.target.value },
                              }))
                            }
                            placeholder="Packaging or dispatch notes"
                            style={{ ...searchInputStyles, width: '100%' }}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleUpdateShipment(shipment)}
                          style={{
                            backgroundColor: '#1f2937',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '9px 14px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Save Shipment Update
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Items Log list */}
            <div style={borderCoolStyles}>
              <div
                style={{
                  fontSize: '11px',
                  color: '#6b7280',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}
              >
                Order Line Items ({selectedOrder.items?.length || 0})
              </div>
              <div style={itemsListStyles}>
                {selectedOrder.items?.map((item: any) => {
                  const prodName = item.product_name || item.product?.name || 'Product';
                  const variantName =
                    item.variant_sku ||
                    item.variant?.name ||
                    (typeof item.variant === 'string' ? '' : '');
                  const price =
                    item.line_total ||
                    (parseFloat(item.unit_price || '0') * (item.quantity || 1)).toString();
                  const img = item.product?.primary_image_url || '/logo.jpg?v=2';
                  return (
                    <div key={item.id} style={itemRowStyles}>
                      <img
                        src={img}
                        alt={prodName}
                        style={itemImgStyles}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/logo.jpg?v=2';
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <span style={itemNameStyles}>{prodName}</span>
                        {variantName && <span style={itemVariantStyles}>{variantName}</span>}
                        <span style={itemQtyStyles}>Quantity: {item.quantity}</span>
                      </div>
                      <span style={itemPriceStyles}>{formatCurrency(price)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inspecting detail overlay */}
      {isDetailLoading && (
        <div style={modalBackdropStyles}>
          <div
            style={{
              ...modalContentStyles,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
            }}
          >
            <Skeleton width="40px" height="40px" borderRadius="50%" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>
              Loading Order & Onitsha Hub Shipments...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Badge status helper
const statusBadgeStyles = (status: string): React.CSSProperties => {
  let backgroundColor = '#e5e7eb';
  let color = '#4b5563';

  if (
    status === 'PAID' ||
    status === 'COMPLETED' ||
    status === 'DELIVERED' ||
    status === 'RECEIVED' ||
    status === 'DELIVERY_FEE_CONFIRMED'
  ) {
    backgroundColor = '#d1fae5';
    color = '#065f46';
  } else if (
    status === 'DISPATCHED' ||
    status === 'OUT_FOR_DELIVERY' ||
    status === 'READY_FOR_DISPATCH' ||
    status === 'PACKAGED'
  ) {
    backgroundColor = '#dbeafe';
    color = '#1e40af';
  } else if (
    status === 'PENDING_PAYMENT' ||
    status === 'PROCESSING' ||
    status === 'ORDER_PLACED' ||
    status === 'SOURCING_PRODUCTS' ||
    status === 'AWAITING_PRODUCTS_AT_HUB' ||
    status === 'PRODUCTS_RECEIVED' ||
    status === 'QUALITY_CHECK' ||
    status === 'READY_FOR_PACKAGING' ||
    status === 'AWAITING_DELIVERY_CONFIRMATION'
  ) {
    backgroundColor = '#fef3c7';
    color = '#92400e';
  } else if (status === 'CANCELLED' || status === 'REFUNDED') {
    backgroundColor = '#fee2e2';
    color = '#991b1b';
  }

  return {
    backgroundColor,
    color,
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
  };
};

// ----------------------------------------------------------
// Styling Tokens
// ----------------------------------------------------------
const containerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const titleStyles: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 800,
  color: '#1f2937',
  margin: 0,
};

const filterBarStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '16px',
};

const searchFormStyles: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  flex: 1,
  maxWidth: '440px',
};

const searchInputStyles: React.CSSProperties = {
  flex: 1,
  padding: '8px 14px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
  outline: 'none',
  backgroundColor: '#ffffff',
};

const searchBtnStyles: React.CSSProperties = {
  backgroundColor: '#1f2937',
  color: '#ffffff',
  padding: '8px 16px',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
  border: 'none',
};

const filterWrapperStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const filterLabelStyles: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#4b5563',
};

const selectStyles: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '13px',
  outline: 'none',
  backgroundColor: '#ffffff',
};

const tableCardStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
};

const tableWrapperStyles: React.CSSProperties = {
  overflowX: 'auto',
};

const tableStyles: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
};

const tableHeaderRowStyles: React.CSSProperties = {
  borderBottom: '2px solid #f3f4f6',
  backgroundColor: '#fafafa',
};

const tableHeaderCellStyles: React.CSSProperties = {
  padding: '12px var(--space-4)',
  fontSize: '11px',
  fontWeight: 700,
  color: '#6b7280',
  textTransform: 'uppercase',
};

const tableRowStyles: React.CSSProperties = {
  borderBottom: '1px solid #f3f4f6',
  fontSize: '13px',
};

const tableCellStyles: React.CSSProperties = {
  padding: '16px var(--space-4)',
  color: '#374151',
};

const viewBtnStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#ff7a00',
  border: '1px solid rgba(255,122,0,0.2)',
  padding: '4px 10px',
  borderRadius: '9999px',
  backgroundColor: 'transparent',
  cursor: 'pointer',
};

const paginationStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '16px',
  gap: '16px',
  borderTop: '1px solid #f3f4f6',
};

const pageBtnStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  border: '1px solid #d1d5db',
  backgroundColor: '#ffffff',
  padding: '6px 12px',
  borderRadius: '6px',
  cursor: 'pointer',
};

const pageLabelStyles: React.CSSProperties = {
  fontSize: '12px',
  color: '#4b5563',
};

const modalBackdropStyles: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 999,
  padding: '16px',
};

const modalContentStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '24px',
  maxWidth: '480px',
  width: '100%',
  boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
};

const modalHeaderStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid #e5e7eb',
  paddingBottom: '12px',
  marginBottom: '20px',
};

const modalTitleStyles: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  color: '#1f2937',
  margin: 0,
};

const closeBtnStyles: React.CSSProperties = {
  fontSize: '24px',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  color: '#9ca3af',
  lineHeight: 1,
};

const modalSummaryStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const detailItemStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '12px',
  borderBottom: '1px solid #f3f4f6',
  paddingBottom: '6px',
};

const detailLabelStyles: React.CSSProperties = {
  color: '#6b7280',
};

const detailValueStyles: React.CSSProperties = {
  fontWeight: 600,
  color: '#1f2937',
};

const modalLabelStyles: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 700,
  color: '#4b5563',
  marginBottom: '4px',
};

const borderCoolStyles: React.CSSProperties = {
  borderTop: '1px solid #e5e7eb',
  paddingTop: '16px',
  marginTop: '16px',
};

const itemsListStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  maxHeight: '180px',
  overflowY: 'auto',
};

const itemRowStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '6px 0',
  borderBottom: '1px solid #f9fafb',
};

const itemImgStyles: React.CSSProperties = {
  width: '40px',
  height: '40px',
  objectFit: 'cover',
  borderRadius: '4px',
  border: '1px solid #e5e7eb',
};

const itemNameStyles: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: '#1f2937',
};

const itemVariantStyles: React.CSSProperties = {
  display: 'block',
  fontSize: '10px',
  color: '#6b7280',
};

const itemQtyStyles: React.CSSProperties = {
  display: 'block',
  fontSize: '10px',
  color: '#9ca3af',
};

const itemPriceStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#1f2937',
};
