import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin';
import { adminCache } from '@/services/adminCache';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import type {
  Order,
  OrderSummary,
  APIError,
  OrderShipment,
  ShipmentFulfillmentStatus,
} from '@/types';
import { getPaymentByOrderRef } from '@/services/orderPaymentSync';
import {
  syncDeliveryStoreFromServer,
  getOrderShipments,
  getAllStoredOrderShipments,
  saveOrderShipments,
  updateShipmentStatus,
  ACTIVE_FULFILLMENT_STATUSES,
  confirmManualDeliveryQuote,
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
  const [orders, setOrders] = useState<OrderSummary[]>(() => {
    const cached = adminCache.get<any>('orders:list:1::');
    return cached?.data?.results || [];
  });
  const [isLoading, setIsLoading] = useState(() => !adminCache.get('orders:list:1::'));
  const [error, setError] = useState<APIError | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected Order Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderShipments, setOrderShipments] = useState<OrderShipment[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isActionPending, setIsActionPending] = useState(false);

  // Payment verification modal & receipt zoom preview state
  const [zoomedReceiptUrl, setZoomedReceiptUrl] = useState<string | null>(null);
  const [showRejectPaymentModal, setShowRejectPaymentModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('Payment not received in DOVI bank account');
  const [customRejectionReason, setCustomRejectionReason] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [fulfillmentNotes, setFulfillmentNotes] = useState('');

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
    const cacheKey = `orders:list:${page}:${statusFilter || ''}:${searchTerm || ''}`;
    const hasCache = Boolean(adminCache.get(cacheKey));
    if (showSkeleton && !hasCache && orders.length === 0) setIsLoading(true);
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

    // Automatically build consolidated Fulfillment shipment(s) for orders without stored shipments
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
      ''
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

      const targetRef = summary.reference || summary.reference_code || orderId;
      let paymentEvidence =
        (detail as any)?.payment_evidence ||
        summary.payment_evidence ||
        getPaymentByOrderRef(targetRef) ||
        getPaymentByOrderRef(orderId);

      if (!paymentEvidence || !paymentEvidence.sender_bank || !paymentEvidence.payment_proof_url) {
        try {
          const remotePayment = await adminApi.getPayment(targetRef);
          if (remotePayment && (remotePayment.sender_bank || remotePayment.amount || remotePayment.payment_proof_url)) {
            paymentEvidence = remotePayment;
          }
        } catch {}
      }

      const resolvedPaymentStatus =
        paymentEvidence?.status === 'VERIFIED'
          ? 'PAID'
          : paymentEvidence?.status ||
            detail?.payment_status ||
            summary.payment_status ||
            'PENDING_PAYMENT';

      const resolvedOrder: Order =
        detail && detail.id && (detail.items?.length || !summary.items?.length)
          ? {
              ...summary,
              ...detail,
              items: detail.items?.length ? detail.items : summary.items || [],
              payment_status: resolvedPaymentStatus,
              payment_evidence: paymentEvidence || null,
            }
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
              payment_status: resolvedPaymentStatus,
              payment_evidence: paymentEvidence || null,
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
      setFulfillmentNotes(
        (resolvedOrder as any)?.fulfillment_notes ||
        (resolvedOrder as any)?.admin_notes ||
        ''
      );
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

  const handleApproveOrderPayment = async () => {
    if (!selectedOrder) return;
    const ref = (selectedOrder as any).reference_code || selectedOrder.reference || selectedOrder.id;
    if (
      !window.confirm(
        `Approve bank transfer payment for Order #${ref}? This will mark payment as PAID and advance order fulfillment to PROCESSING.`
      )
    ) {
      return;
    }
    setIsActionPending(true);
    try {
      await adminApi.verifyPayment(ref, { notes: paymentNotes || 'Verified by Admin in Order Hub' });
      toast.success(`Payment for Order #${ref} approved! Status updated to Paid and Processing.`);
      const updatedOrder = await adminApi.getOrder(ref);
      setSelectedOrder(updatedOrder);
      await fetchOrders(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve payment.');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleRejectOrderPayment = async () => {
    if (!selectedOrder) return;
    const ref = (selectedOrder as any).reference_code || selectedOrder.reference || selectedOrder.id;
    const reason = rejectionReason === 'Other' ? customRejectionReason.trim() : rejectionReason;
    if (!reason) {
      toast.error('Please specify a rejection reason.');
      return;
    }
    setIsActionPending(true);
    try {
      await adminApi.rejectPayment(ref, { rejection_reason: reason });
      toast.success(`Payment rejected for Order #${ref}. Customer has been notified.`);
      setShowRejectPaymentModal(false);
      const updatedOrder = await adminApi.getOrder(ref);
      setSelectedOrder(updatedOrder);
      await fetchOrders(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject payment.');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedOrder) return;

    // Separation of Payment Status and Order Status
    // Rule: An order cannot transition to READY_FOR_DISPATCH, DISPATCHED, OUT_FOR_DELIVERY or DELIVERED unless payment status is PAID
    const pStatus = ((selectedOrder as any).payment_status || '').toUpperCase();
    const isPaid = pStatus === 'PAID' || pStatus === 'VERIFIED';
    if (
      ['READY_FOR_DISPATCH', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(newStatus) &&
      !isPaid
    ) {
      toast.error(
        `Cannot advance order to ${SHIPMENT_STATUS_LABELS[newStatus as ShipmentFulfillmentStatus] || newStatus}: Customer payment is currently ${pStatus || 'PENDING_PAYMENT'}. Payment must be verified before proceeding.`
      );
      return;
    }

    // Rule: Do not mark an order as DELIVERED until all required shipments have been delivered
    if (newStatus === 'DELIVERED' && orderShipments.length > 0) {
      const undelivered = orderShipments.filter((s) => s.status !== 'DELIVERED');
      if (undelivered.length > 0) {
        toast.error(
          `Cannot mark order as Delivered: ${undelivered.length} shipment(s) have not yet been marked as Delivered.`
        );
        return;
      }
    }

    setIsActionPending(true);
    try {
      const orderId = selectedOrder.id || selectedOrder.reference;
      const updated = await adminApi.updateOrderStatus(orderId, newStatus, fulfillmentNotes);
      toast.success(`Order status updated to ${SHIPMENT_STATUS_LABELS[newStatus as ShipmentFulfillmentStatus] || newStatus}.`);

      // Two-way synchronization for single-shipment orders
      if (orderShipments.length === 1 && ACTIVE_FULFILLMENT_STATUSES.includes(newStatus as ShipmentFulfillmentStatus)) {
        const actor = {
          id: user?.id,
          email: user?.email || 'admin@dovi.com',
          name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Admin',
          role: user?.role || 'ADMIN',
        };
        const orderKey = selectedOrder.id || selectedOrder.reference;
        updateShipmentStatus(orderKey, orderShipments[0].id, newStatus as ShipmentFulfillmentStatus, actor);
        const updatedShipments = getOrderShipments(orderKey, selectedOrder.reference);
        setOrderShipments(updatedShipments);
        hydrateDraftsForShipments(updatedShipments);
      }

      setSelectedOrder((prev) => (prev ? { ...prev, status: (updated.status || newStatus) as any, fulfillment_notes: fulfillmentNotes } : prev));
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

  const handleSaveFulfillmentNotes = async () => {
    if (!selectedOrder) return;
    setIsActionPending(true);
    try {
      const orderId = selectedOrder.id || selectedOrder.reference;
      await adminApi.updateOrderStatus(orderId, selectedOrder.status, fulfillmentNotes);
      setSelectedOrder((prev) => (prev ? { ...prev, fulfillment_notes: fulfillmentNotes } as any : prev));
      toast.success('Fulfillment notes saved.');
    } catch {
      toast.error('Failed to save fulfillment notes.');
    } finally {
      setIsActionPending(false);
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

      const orderId = selectedOrder.id || selectedOrder.reference;
      adminApi.updateOrderStatus(orderId, overall, fulfillmentNotes).catch(() => {});

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
            deliveryNotes: draft.quote_notes || 'Delivery fee confirmed by administrator.',
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
        <h2 style={titleStyles}>Order Logs & Direct Delivery Fulfillment</h2>
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
          <h2 style={titleStyles}>Order Logs & Direct Delivery Fulfillment</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
            Manage customer orders, direct destination delivery arrangement, supplier sourcing, quality inspection, and dispatch.
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
            <option value="">All Fulfillment Statuses</option>
            <option value="ORDER_PLACED">Order Placed</option>
            <option value="PROCESSING">Processing</option>
            <option value="READY_FOR_DISPATCH">Ready for Dispatch</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
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
                  <th style={tableHeaderCellStyles}>Customer</th>
                  <th style={tableHeaderCellStyles}>Destination</th>
                  <th style={tableHeaderCellStyles}>Products</th>
                  <th style={tableHeaderCellStyles}>Subtotal</th>
                  <th style={tableHeaderCellStyles}>Delivery Fee</th>
                  <th style={tableHeaderCellStyles}>Total Payable</th>
                  <th style={tableHeaderCellStyles}>Payment Status</th>
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
                        <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 400 }}>
                          {o.created_at ? new Date(o.created_at).toLocaleDateString() : 'N/A'}
                        </div>
                        {o.requires_manual_quote && (
                          <span
                            style={{
                              display: 'inline-block',
                              marginTop: '4px',
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: '#fffbeb',
                              color: '#b45309',
                              border: '1px solid #fde68a',
                            }}
                          >
                            💬 WhatsApp / Quote Needed
                          </span>
                        )}
                      </td>
                      <td style={tableCellStyles}>
                        <div style={{ fontWeight: 600, fontSize: '12px' }}>
                          {o.buyer_name || o.shipping_full_name || (o.buyer_email ? o.buyer_email.split(' ')[0] : 'Customer')}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>
                          {o.buyer_email || o.buyer_phone || ''}
                        </div>
                      </td>
                      <td style={tableCellStyles}>
                        <div style={{ fontWeight: 600, fontSize: '12px' }}>
                          {o.shipping_city || o.delivery_address?.city || 'Town N/A'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>
                          {o.shipping_state || o.delivery_address?.state || 'State N/A'}
                        </div>
                      </td>
                      <td style={tableCellStyles}>
                        <div style={{ fontWeight: 600, fontSize: '12px' }}>
                          {itemCount} item{itemCount !== 1 ? 's' : ''} ({shipmentCount} parcel{shipmentCount !== 1 ? 's' : ''})
                        </div>
                      </td>
                      <td style={tableCellStyles}>
                        {formatCurrency(o.subtotal || total)}
                      </td>
                      <td style={{ ...tableCellStyles, fontWeight: 600, color: o.delivery_fee && o.delivery_fee !== '0' ? '#047857' : '#d97706' }}>
                        {o.requires_manual_quote ? 'Pending Quote' : formatCurrency(o.delivery_fee || '0')}
                      </td>
                      <td style={{ ...tableCellStyles, fontWeight: 800, color: '#111827' }}>
                        {formatCurrency(total)}
                      </td>
                      <td style={tableCellStyles}>
                        <span style={paymentBadgeStyles(o.payment_status)}>
                          {(o.payment_status || 'PENDING_PAYMENT').replace(/_/g, ' ')}
                        </span>
                      </td>
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
                          {o.requires_manual_quote ? 'Record Fee / Manage' : 'Manage Order'}
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

      {/* Inspect Order & Fulfillment Shipment Management Modal */}
      {selectedOrder && (
        <div style={modalBackdropStyles}>
          <div
            style={{
              ...modalContentStyles,
              maxWidth: '920px',
              maxHeight: '92vh',
              overflowY: 'auto',
              backgroundColor: '#f8fafc',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                ...modalHeaderStyles,
                backgroundColor: '#ffffff',
                padding: '16px 20px',
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid #e2e8f0',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                    Order #{(selectedOrder as any).reference_code || selectedOrder.reference || selectedOrder.id}
                  </h3>
                  <span style={statusBadgeStyles(selectedOrder.status)}>
                    {SHIPMENT_STATUS_LABELS[selectedOrder.status as ShipmentFulfillmentStatus] || selectedOrder.status}
                  </span>
                  <span style={paymentBadgeStyles((selectedOrder as any).payment_status)}>
                    {((selectedOrder as any).payment_status || 'PENDING_PAYMENT').replace(/_/g, ' ')}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Customer: <strong>{(selectedOrder as any).buyer_email || 'Customer'}</strong> · Placed:{' '}
                  <strong>{new Date(selectedOrder.created_at).toLocaleString()}</strong> · Shipments:{' '}
                  <strong>{orderShipments.length || 1}</strong>
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

            {/* ============================================================ */}
            {/* SECTION A: PAYMENT INFORMATION                               */}
            {/* ============================================================ */}
            {(() => {
              const targetRef = (selectedOrder as any).reference_code || selectedOrder.reference || selectedOrder.id;
              const payment =
                (selectedOrder as any).payment_evidence ||
                getPaymentByOrderRef(targetRef) ||
                getPaymentByOrderRef(selectedOrder.id);
              const senderBank = payment?.sender_bank || (selectedOrder as any).sender_bank || 'Not provided';
              const senderAccountName = payment?.sender_account_name || (selectedOrder as any).sender_account_name || 'Not provided';
              const transactionRef = payment?.transaction_reference || (selectedOrder as any).transaction_reference || 'N/A';
              const declaredAmount = payment?.amount || (selectedOrder as any).payment_amount;
              const receiptProofUrl = payment?.payment_proof_url || (selectedOrder as any).payment_proof_url;
              const orderTotal = (selectedOrder as any).total_amount || selectedOrder.total || '0';
              const pStatus = ((selectedOrder as any).payment_status || payment?.status || 'PENDING_PAYMENT').toUpperCase();
              const isPaid = pStatus === 'PAID' || pStatus === 'VERIFIED';
              const isRejected = pStatus === 'REJECTED';
              const isPendingVerification = pStatus === 'PENDING_VERIFICATION';

              return (
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '20px',
                    marginBottom: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '14px',
                      paddingBottom: '12px',
                      borderBottom: '1px solid #f1f5f9',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                        💳 Section A: Payment Information
                      </h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                        Order payment totals, customer payment method, transaction reference, and verification controls.
                      </p>
                    </div>
                    <span style={paymentBadgeStyles(pStatus)}>
                      {pStatus.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Payment Details Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '12px',
                      backgroundColor: '#f8fafc',
                      padding: '14px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                      marginBottom: '14px',
                    }}
                  >
                    <div>
                      <div style={{ color: '#64748b', marginBottom: '2px' }}>Total Order Amount</div>
                      <strong style={{ fontSize: '15px', color: 'var(--color-primary)' }}>
                        {formatCurrency(orderTotal)}
                      </strong>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', marginBottom: '2px' }}>Product Subtotal</div>
                      <strong style={{ fontSize: '13px', color: '#1e293b' }}>
                        {formatCurrency(selectedOrder.subtotal)}
                      </strong>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', marginBottom: '2px' }}>Delivery Fee</div>
                      <strong style={{ fontSize: '13px', color: '#1e293b' }}>
                        {formatCurrency(selectedOrder.delivery_fee)}
                      </strong>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', marginBottom: '2px' }}>Payment Method</div>
                      <strong style={{ fontSize: '13px', color: '#1e293b' }}>
                        {(selectedOrder as any).payment_method || 'Bank Transfer'}
                      </strong>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', marginBottom: '2px' }}>Declared Payment Amount</div>
                      <strong
                        style={{
                          fontSize: '13px',
                          color:
                            payment?.amount && Number(payment.amount) >= Number(orderTotal)
                              ? '#16a34a'
                              : payment?.amount
                              ? '#d97706'
                              : '#64748b',
                        }}
                      >
                        {declaredAmount ? formatCurrency(declaredAmount) : 'Not Submitted'}
                      </strong>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', marginBottom: '2px' }}>Sender Bank</div>
                      <strong style={{ color: '#1e293b' }}>{senderBank}</strong>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', marginBottom: '2px' }}>Sender Account Name</div>
                      <strong style={{ color: '#1e293b' }}>{senderAccountName}</strong>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', marginBottom: '2px' }}>Transaction Reference / Narration</div>
                      <span style={{ fontFamily: 'monospace', color: '#1e293b', fontWeight: 600 }}>
                        {transactionRef}
                      </span>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', marginBottom: '2px' }}>Submission Timestamp</div>
                      <span style={{ color: '#1e293b' }}>
                        {payment?.created_at ? new Date(payment.created_at).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', marginBottom: '2px' }}>Verification Timestamp</div>
                      <span style={{ color: '#1e293b' }}>
                        {payment?.verified_at ? new Date(payment.verified_at).toLocaleString() : (isPaid ? 'Verified' : 'Pending Verification')}
                      </span>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', marginBottom: '2px' }}>Verified By</div>
                      <strong style={{ color: '#1e293b' }}>
                        {payment?.verified_by || (isPaid ? 'Administrator' : 'Not yet verified')}
                      </strong>
                    </div>
                  </div>

                  {/* Status Badges & Alerts */}
                  {isPaid && (
                    <div
                      style={{
                        backgroundColor: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#065f46',
                        marginBottom: '14px',
                      }}
                    >
                      <strong>✓ Payment Confirmed & Verified</strong>
                      {payment?.verified_by && ` by ${payment.verified_by}`}
                      {payment?.verified_at && ` on ${new Date(payment.verified_at).toLocaleString()}`}.
                      {payment?.notes && <div style={{ marginTop: '4px' }}>Notes: {payment.notes}</div>}
                    </div>
                  )}

                  {isRejected && (
                    <div
                      style={{
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#991b1b',
                        marginBottom: '14px',
                      }}
                    >
                      <strong>✕ Payment Verification Unsuccessful / Rejected:</strong>{' '}
                      {payment?.rejection_reason || 'Declined by Administrator'}
                      {payment?.verified_at && ` (${new Date(payment.verified_at).toLocaleString()})`}.
                      <div style={{ marginTop: '4px', fontSize: '11px', color: '#b91c1c' }}>
                        The customer has been notified and can resubmit their payment proof from their order tracking page.
                      </div>
                    </div>
                  )}

                  {/* Receipt Image Preview */}
                  {receiptProofUrl ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '12px 14px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        marginBottom: '14px',
                      }}
                    >
                      <div
                        style={{
                          width: '70px',
                          height: '70px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          border: '1px solid #cbd5e1',
                          cursor: 'pointer',
                          backgroundColor: '#f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                        onClick={() => setZoomedReceiptUrl(receiptProofUrl!)}
                      >
                        <img
                          src={receiptProofUrl}
                          alt="Receipt proof"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                          Customer Transfer Receipt / Teller Proof
                        </div>
                        <p style={{ margin: '2px 0 8px 0', fontSize: '12px', color: '#64748b' }}>
                          Click to inspect the high-resolution receipt image and verify transaction authenticity.
                        </p>
                        <button
                          type="button"
                          onClick={() => setZoomedReceiptUrl(receiptProofUrl!)}
                          style={{
                            padding: '5px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            backgroundColor: '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          🔍 Preview & Zoom Receipt
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '10px 14px',
                        backgroundColor: '#fffbeb',
                        border: '1px solid #fde68a',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#92400e',
                        marginBottom: '14px',
                      }}
                    >
                      {isPendingVerification
                        ? 'Customer submitted transfer reference details without image attachment.'
                        : 'No bank transfer receipt has been uploaded yet for this order.'}
                    </div>
                  )}

                  {/* Payment Verification Action Buttons */}
                  {!isPaid && (
                    <div>
                      <div style={{ width: '100%', marginBottom: '10px' }}>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#475569',
                            marginBottom: '4px',
                          }}
                        >
                          Admin Verification Notes (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Bank credit confirmed via Zenith App narration ORD-12345"
                          value={paymentNotes}
                          onChange={(e) => setPaymentNotes(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '7px 10px',
                            fontSize: '12px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#ffffff',
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                          type="button"
                          disabled={isActionPending}
                          onClick={handleApproveOrderPayment}
                          style={{
                            padding: '9px 20px',
                            backgroundColor: '#16a34a',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '13px',
                            cursor: 'pointer',
                          }}
                        >
                          {isActionPending ? 'Processing...' : '✓ Approve & Confirm Payment'}
                        </button>
                        <button
                          type="button"
                          disabled={isActionPending}
                          onClick={() => {
                            setRejectionReason('Payment not received in DOVI bank account');
                            setCustomRejectionReason('');
                            setShowRejectPaymentModal(true);
                          }}
                          style={{
                            padding: '9px 18px',
                            backgroundColor: '#ffffff',
                            color: '#dc2626',
                            border: '1px solid #dc2626',
                            borderRadius: '6px',
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: 'pointer',
                          }}
                        >
                          ✕ Reject Payment
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ============================================================ */}
            {/* SECTION B: ORDER FULFILLMENT                                 */}
            {/* ============================================================ */}
            {(() => {
              const FULFILLMENT_STEPS: ShipmentFulfillmentStatus[] = [
                'ORDER_PLACED',
                'PROCESSING',
                'READY_FOR_DISPATCH',
                'DISPATCHED',
                'OUT_FOR_DELIVERY',
                'DELIVERED',
              ];
              const isCancelled = selectedOrder.status === 'CANCELLED';
              const currentStepIndex = FULFILLMENT_STEPS.indexOf(selectedOrder.status as ShipmentFulfillmentStatus);

              return (
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '20px',
                    marginBottom: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '14px',
                      paddingBottom: '12px',
                      borderBottom: '1px solid #f1f5f9',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                        📦 Section B: Order Fulfillment
                      </h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                        Simplified fulfillment lifecycle: Order Placed &rarr; Processing &rarr; Ready for Dispatch &rarr; Dispatched &rarr; Out for Delivery &rarr; Delivered.
                      </p>
                    </div>
                    <span style={statusBadgeStyles(selectedOrder.status)}>
                      {SHIPMENT_STATUS_LABELS[selectedOrder.status as ShipmentFulfillmentStatus] || selectedOrder.status}
                    </span>
                  </div>

                  {/* 6-Step Visual Progress Bar or Cancelled Banner */}
                  {isCancelled ? (
                    <div
                      style={{
                        padding: '12px 16px',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        color: '#991b1b',
                        marginBottom: '16px',
                      }}
                    >
                      <strong style={{ display: 'block', fontSize: '13px', marginBottom: '2px' }}>
                        ✕ Order Fulfillment Cancelled
                      </strong>
                      <span style={{ fontSize: '12px', color: '#b91c1c' }}>
                        This order has been cancelled and is no longer moving through the fulfillment lifecycle.
                      </span>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: '8px',
                        marginBottom: '16px',
                      }}
                    >
                      {FULFILLMENT_STEPS.map((step, idx) => {
                        const isCompleted = currentStepIndex >= idx;
                        const isCurrent = selectedOrder.status === step;
                        return (
                          <div
                            key={step}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '8px',
                              border: `1px solid ${isCurrent ? '#2563eb' : isCompleted ? '#86efac' : '#e2e8f0'}`,
                              backgroundColor: isCurrent ? '#eff6ff' : isCompleted ? '#f0fdf4' : '#f8fafc',
                              textAlign: 'center',
                              fontSize: '11px',
                              fontWeight: isCurrent ? 800 : isCompleted ? 700 : 500,
                              color: isCurrent ? '#1d4ed8' : isCompleted ? '#15803d' : '#64748b',
                            }}
                          >
                            <div style={{ fontSize: '10px', color: isCurrent ? '#2563eb' : isCompleted ? '#16a34a' : '#94a3b8', marginBottom: '2px' }}>
                              {isCompleted ? '✓ Step ' + (idx + 1) : 'Step ' + (idx + 1)}
                            </div>
                            <div>{SHIPMENT_STATUS_LABELS[step]}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Fulfillment Controls & Internal Notes */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                      gap: '14px',
                      alignItems: 'end',
                    }}
                  >
                    <div>
                      <label style={modalLabelStyles}>
                        Advance Fulfillment Status
                      </label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select
                          disabled={isActionPending}
                          value={selectedOrder.status}
                          onChange={(e) => handleStatusChange(e.target.value)}
                          style={{ ...selectStyles, flex: 1 }}
                        >
                          <option value="ORDER_PLACED">1. Order Placed</option>
                          <option value="PROCESSING">2. Processing</option>
                          <option value="READY_FOR_DISPATCH">3. Ready for Dispatch</option>
                          <option value="DISPATCHED">4. Dispatched</option>
                          <option value="OUT_FOR_DELIVERY">5. Out for Delivery</option>
                          <option value="DELIVERED">6. Delivered</option>
                          <option value="CANCELLED">✕ Cancelled</option>
                        </select>
                        {selectedOrder.status !== 'DELIVERED' && selectedOrder.status !== 'CANCELLED' && (
                          <button
                            type="button"
                            disabled={isActionPending}
                            onClick={() => handleStatusChange('DELIVERED')}
                            style={{
                              padding: '8px 14px',
                              backgroundColor: '#16a34a',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                            title="Quickly advance status to Delivered"
                          >
                            ✓ Mark Delivered
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label style={modalLabelStyles}>
                        Fulfillment Notes (Internal)
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder="e.g. Sourced from supplier X, direct driver Y assigned"
                          value={fulfillmentNotes}
                          onChange={(e) => setFulfillmentNotes(e.target.value)}
                          style={{ ...searchInputStyles, flex: 1 }}
                        />
                        <button
                          type="button"
                          disabled={isActionPending}
                          onClick={handleSaveFulfillmentNotes}
                          style={{
                            padding: '8px 14px',
                            backgroundColor: '#1e293b',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Save Notes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ============================================================ */}
            {/* SECTION C: DELIVERY INFORMATION                              */}
            {/* ============================================================ */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '20px',
                marginBottom: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '14px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid #f1f5f9',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                    🚚 Section C: Delivery Information
                  </h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                    Customer delivery destination, transport carrier arrangements, waybill references and shipment statuses.
                  </p>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Total Shipments: <strong>{orderShipments.length || 1}</strong>
                </div>
              </div>

              {/* Destination Address & Recipient Card */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '12px',
                  backgroundColor: '#f8fafc',
                  padding: '14px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <div style={{ color: '#64748b', marginBottom: '2px' }}>Recipient Name</div>
                  <strong style={{ color: '#0f172a' }}>
                    {(selectedOrder as any).shipping_recipient_name ||
                      orderShipments[0]?.recipient_name ||
                      (selectedOrder as any).buyer_email ||
                      'Customer'}
                  </strong>
                </div>
                <div>
                  <div style={{ color: '#64748b', marginBottom: '2px' }}>Contact Phone</div>
                  <strong style={{ color: '#0f172a' }}>
                    {(selectedOrder as any).shipping_recipient_phone ||
                      orderShipments[0]?.recipient_phone ||
                      'Not provided'}
                  </strong>
                </div>
                <div>
                  <div style={{ color: '#64748b', marginBottom: '2px' }}>Destination Address</div>
                  <strong style={{ color: '#0f172a' }}>
                    {(selectedOrder as any).shipping_address_line_1 ||
                      (selectedOrder as any).delivery_address?.address_line_1 ||
                      orderShipments[0]?.destination_address ||
                      'Delivery Address'}
                  </strong>
                  <div style={{ color: '#64748b' }}>
                    {(selectedOrder as any).shipping_city ||
                      (selectedOrder as any).delivery_address?.city ||
                      orderShipments[0]?.destination_city ||
                      'Lagos'}
                    ,{' '}
                    {(selectedOrder as any).shipping_state ||
                      (selectedOrder as any).delivery_address?.state ||
                      orderShipments[0]?.destination_state ||
                      'Lagos'}
                    , Nigeria
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b', marginBottom: '2px' }}>Delivery Fee & Method</div>
                  <strong style={{ color: '#0f172a' }}>
                    {formatCurrency(selectedOrder.delivery_fee)}
                  </strong>
                  <div style={{ color: '#64748b' }}>
                    {selectedOrder.delivery_method || 'Direct Destination Delivery'}
                  </div>
                </div>
              </div>

              {/* Shipments List */}
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

                  return (
                    <div
                      key={shipment.id}
                      style={{
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '16px',
                        backgroundColor: '#ffffff',
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
                          borderBottom: '1px solid #f1f5f9',
                          marginBottom: '12px',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
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
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                            Destination: <strong>{shipment.destination_city}, {shipment.destination_state}</strong> · Weight:{' '}
                            <strong>
                              {shipment.combined_weight_kg ? `${shipment.combined_weight_kg} kg` : 'Standard'}
                            </strong>
                            {shipment.combined_dimensions_cm && (
                              <> · Dimensions: <strong>{shipment.combined_dimensions_cm}</strong></>
                            )}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Shipment Fee</div>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                            {shipment.delivery_fee !== null ? formatCurrency(shipment.delivery_fee) : 'Manual Quote Needed'}
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
                            ⚠️ Custom Delivery Quotation Required
                          </div>
                          <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#78350f' }}>
                            Enter the confirmed delivery fee to {shipment.destination_city}, {shipment.destination_state}.
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
                                placeholder="e.g. Direct Courier Partner"
                                value={draft.transport_arrangement}
                                onChange={(e) =>
                                  setShipmentDrafts((prev) => ({
                                    ...prev,
                                    [shipment.id]: { ...draft, transport_arrangement: e.target.value },
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
                                borderRadius: '6px',
                                padding: '9px 14px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Confirm Delivery Fee
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Associated Items in this Shipment (Clean list, no hub checkboxes) */}
                      <div style={{ marginBottom: '14px' }}>
                        <div
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#475569',
                            textTransform: 'uppercase',
                            marginBottom: '6px',
                          }}
                        >
                          Associated Items in this Shipment ({shipment.items.length})
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
                                padding: '8px 12px',
                                backgroundColor: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                              }}
                            >
                              <div>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                                  {item.product_name}
                                </span>
                                {item.variant_name && (
                                  <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '6px' }}>
                                    ({item.variant_name})
                                  </span>
                                )}
                                <span
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: '#334155',
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
                                    backgroundColor: '#e2e8f0',
                                    color: '#475569',
                                  }}
                                >
                                  {PARCEL_CLASSIFICATION_LABELS[item.delivery_classification]}
                                </span>
                              </div>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                                {formatCurrency((Number(item.unit_price) || 0) * (Number(item.quantity) || 1))}
                              </span>
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
                          paddingTop: '10px',
                          borderTop: '1px dashed #e2e8f0',
                        }}
                      >
                        <div>
                          <label style={modalLabelStyles}>Shipment Status</label>
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
                          <label style={modalLabelStyles}>Delivery Provider / Transport</label>
                          <input
                            type="text"
                            value={draft.transport_arrangement}
                            onChange={(e) =>
                              setShipmentDrafts((prev) => ({
                                ...prev,
                                [shipment.id]: { ...draft, transport_arrangement: e.target.value },
                              }))
                            }
                            placeholder="e.g. Direct Courier / Haulage Partner"
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
                            placeholder="e.g. TRK-90218"
                            style={{ ...searchInputStyles, width: '100%' }}
                          />
                        </div>

                        <div>
                          <label style={modalLabelStyles}>Delivery Notes</label>
                          <input
                            type="text"
                            value={draft.delivery_notes}
                            onChange={(e) =>
                              setShipmentDrafts((prev) => ({
                                ...prev,
                                [shipment.id]: { ...draft, delivery_notes: e.target.value },
                              }))
                            }
                            placeholder="Instructions for driver or customer"
                            style={{ ...searchInputStyles, width: '100%' }}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleUpdateShipment(shipment)}
                          style={{
                            backgroundColor: '#0f172a',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
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
              Loading Order & Delivery Shipments...
            </span>
          </div>
        </div>
      )}
      {/* Receipt Image Zoom Modal */}
      {zoomedReceiptUrl && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={() => setZoomedReceiptUrl(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '92vw',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={zoomedReceiptUrl}
              alt="Payment receipt proof"
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              }}
            />
            <div style={{ marginTop: '14px', display: 'flex', gap: '10px' }}>
              <a
                href={zoomedReceiptUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '13px',
                  textDecoration: 'none',
                }}
              >
                Open Original in New Tab
              </a>
              <button
                type="button"
                onClick={() => setZoomedReceiptUrl(null)}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#ffffff',
                  color: '#111827',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Payment Reason Modal */}
      {showRejectPaymentModal && (
        <div style={modalBackdropStyles}>
          <div style={{ ...modalContentStyles, maxWidth: '480px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 800, color: '#991b1b' }}>
              Reject Bank Transfer Payment Proof
            </h3>
            <p style={{ fontSize: '13px', color: '#4b5563', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              Select or provide a clear reason for rejecting this payment. The customer will be informed immediately and will be prompted to resubmit their transfer details.
            </p>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                Rejection Reason
              </label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '13px',
                }}
              >
                <option value="Payment not received in DOVI bank account">Payment not received in DOVI bank account</option>
                <option value="Amount paid does not match order total">Amount paid does not match order total</option>
                <option value="Invalid or illegible payment receipt image">Invalid or illegible payment receipt image</option>
                <option value="Transaction reference cannot be verified">Transaction reference cannot be verified</option>
                <option value="Incorrect account credited">Incorrect account credited</option>
                <option value="Other">Other (specify custom reason below)</option>
              </select>
            </div>
            {rejectionReason === 'Other' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  Custom Explanation
                </label>
                <textarea
                  value={customRejectionReason}
                  onChange={(e) => setCustomRejectionReason(e.target.value)}
                  rows={3}
                  placeholder="Explain why the bank transfer proof was declined..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '13px',
                    resize: 'vertical',
                  }}
                />
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowRejectPaymentModal(false)}
                disabled={isActionPending}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  background: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectOrderPayment}
                disabled={isActionPending}
                style={{
                  padding: '8px 18px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                {isActionPending ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Payment badge helper
const paymentBadgeStyles = (status?: string): React.CSSProperties => {
  const s = (status || 'PENDING_PAYMENT').toUpperCase();
  if (s === 'PAID' || s === 'VERIFIED' || s === 'SUCCESS' || s === 'SUCCESSFUL') {
    return {
      display: 'inline-block',
      padding: '3px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: 700,
      backgroundColor: '#ecfdf5',
      color: '#065f46',
      border: '1px solid #a7f3d0',
    };
  }
  if (s === 'PENDING_VERIFICATION') {
    return {
      display: 'inline-block',
      padding: '3px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: 700,
      backgroundColor: '#eff6ff',
      color: '#1e40af',
      border: '1px solid #bfdbfe',
    };
  }
  if (s === 'REJECTED' || s === 'FAILED') {
    return {
      display: 'inline-block',
      padding: '3px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: 700,
      backgroundColor: '#fef2f2',
      color: '#991b1b',
      border: '1px solid #fecaca',
    };
  }
  return {
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 700,
    backgroundColor: '#fffbeb',
    color: '#92400e',
    border: '1px solid #fde68a',
  };
};

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



const closeBtnStyles: React.CSSProperties = {
  fontSize: '24px',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  color: '#9ca3af',
  lineHeight: 1,
};









const modalLabelStyles: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 700,
  color: '#4b5563',
  marginBottom: '4px',
};
















