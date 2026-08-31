import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin';
import type { Order, OrderSummary, APIError } from '@/types';
import { Skeleton } from '@/components/common/Skeleton';
import { ApiErrorMessage } from '@/components/common/ApiErrorMessage';
import { EmptyState } from '@/components/common/EmptyState';

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<APIError | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected Order Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isActionPending, setIsActionPending] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = async (showSkeleton = true) => {
    if (showSkeleton) setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.listOrders({
        page,
        status: statusFilter || undefined,
        q: searchTerm || undefined,
      });
      setOrders(res.results || []);
      setTotalPages(Math.ceil(res.count / 20) || 1);
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

  const handleInspectOrder = async (summary: OrderSummary) => {
    setIsDetailLoading(true);
    try {
      const orderId = summary.id || summary.reference;
      const detail = await adminApi.getOrder(orderId);
      setSelectedOrder(detail);
    } catch {
      toast.error('Failed to load order details.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedOrder) return;
    setIsActionPending(true);
    try {
      const orderId = selectedOrder.id || selectedOrder.reference;
      const updated = await adminApi.updateOrderStatus(orderId, newStatus);
      toast.success(`Order ${selectedOrder.reference || selectedOrder.id} status updated to ${newStatus}.`);
      setSelectedOrder(updated);
      setOrders(prev => prev.map(o => (o.id === updated.id || o.reference === updated.reference) ? { ...o, status: updated.status } : o));
    } catch (err: any) {
      toast.error(err.message || 'Failed to update order status.');
    } finally {
      setIsActionPending(false);
    }
  };

  const formatCurrency = (val: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(parseFloat(val || '0'));
  };

  if (isLoading) {
    return (
      <div style={containerStyles}>
        <h2 style={titleStyles}>Order Logs</h2>
        <Skeleton width="100%" height="48px" borderRadius="8px" />
        <div style={{ marginTop: '24px' }}>
          <Skeleton width="100%" height="300px" borderRadius="12px" />
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      <h2 style={titleStyles}>Order Logs</h2>

      <ApiErrorMessage error={error} />

      {/* Filter / Search Bar */}
      <div style={filterBarStyles}>
        <form onSubmit={handleSearchSubmit} style={searchFormStyles}>
          <input
            type="text"
            placeholder="Search by DOV-ORD reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={searchInputStyles}
          />
          <button type="submit" style={searchBtnStyles}>Search</button>
        </form>

        <div style={filterWrapperStyles}>
          <label style={filterLabelStyles}>Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={selectStyles}
          >
            <option value="">All Orders</option>
            <option value="PENDING_PAYMENT">Pending Payment</option>
            <option value="PAID">Paid</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="RECEIVED">Received</option>
            <option value="COMPLETED">Completed</option>
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
                  <th style={tableHeaderCellStyles}>Item Count</th>
                  <th style={tableHeaderCellStyles}>Total Amount</th>
                  <th style={tableHeaderCellStyles}>Status</th>
                  <th style={{ ...tableHeaderCellStyles, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.reference} style={tableRowStyles}>
                    <td style={{ ...tableCellStyles, fontWeight: 700 }}>{o.reference}</td>
                    <td style={tableCellStyles}>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td style={tableCellStyles}>{o.item_count} items</td>
                    <td style={{ ...tableCellStyles, fontWeight: 700 }}>{formatCurrency(o.total)}</td>
                    <td style={tableCellStyles}>
                      <span style={statusBadgeStyles(o.status)}>{o.status.replace('_', ' ')}</span>
                    </td>
                    <td style={{ ...tableCellStyles, textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleInspectOrder(o)}
                        style={viewBtnStyles}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={paginationStyles}>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                style={pageBtnStyles}
              >
                Previous
              </button>
              <span style={pageLabelStyles}>Page {page} of {totalPages}</span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                style={pageBtnStyles}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Inspect Order Detail Modal */}
      {selectedOrder && (
        <div style={modalBackdropStyles}>
          <div style={{ ...modalContentStyles, maxWidth: '640px' }}>
            <div style={modalHeaderStyles}>
              <h3 style={modalTitleStyles}>Order Management Panel — {selectedOrder.reference}</h3>
              <button type="button" onClick={() => setSelectedOrder(null)} style={closeBtnStyles}>&times;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              {/* Left Side: Summary */}
              <div style={modalSummaryStyles}>
                <div style={detailItemStyles}>
                  <span style={detailLabelStyles}>Order Date</span>
                  <span style={detailValueStyles}>{new Date(selectedOrder.created_at).toLocaleString()}</span>
                </div>
                <div style={detailItemStyles}>
                  <span style={detailLabelStyles}>Payment Method</span>
                  <span style={detailValueStyles}>{selectedOrder.payment_method || 'N/A'}</span>
                </div>
                <div style={detailItemStyles}>
                  <span style={detailLabelStyles}>Payment Status</span>
                  <span style={detailValueStyles}>{selectedOrder.payment_status}</span>
                </div>
                <div style={detailItemStyles}>
                  <span style={detailLabelStyles}>Shipping Method</span>
                  <span style={detailValueStyles}>{selectedOrder.delivery_method}</span>
                </div>
                <div style={{ ...detailItemStyles, border: 'none' }}>
                  <span style={detailLabelStyles}>Order Subtotal</span>
                  <span style={detailValueStyles}>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                <div style={{ ...detailItemStyles, border: 'none' }}>
                  <span style={detailLabelStyles}>Delivery Fee</span>
                  <span style={detailValueStyles}>{formatCurrency(selectedOrder.delivery_fee)}</span>
                </div>
                <div style={{ ...detailItemStyles, border: 'none', borderTop: '1px solid #e5e7eb', paddingTop: '8px' }}>
                  <span style={{ ...detailLabelStyles, color: 'var(--color-primary)', fontWeight: 700 }}>Total Charge</span>
                  <span style={{ ...detailValueStyles, color: 'var(--color-primary)', fontSize: '15px' }}>
                    {formatCurrency(selectedOrder.total)}
                  </span>
                </div>
              </div>

              {/* Right Side: Shipping & Config */}
              <div style={modalSummaryStyles}>
                <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Shipping Address
                </div>
                <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.4, color: '#1f2937' }}>
                  <strong>{selectedOrder.delivery_address.full_name}</strong><br />
                  {selectedOrder.delivery_address.address_line_1}<br />
                  {selectedOrder.delivery_address.address_line_2 && <>{selectedOrder.delivery_address.address_line_2}<br /></>}
                  {selectedOrder.delivery_address.city}, {selectedOrder.delivery_address.state}<br />
                  {selectedOrder.delivery_address.country}
                </p>

                {/* Status Transition Control */}
                <div style={{ marginTop: '16px' }}>
                  <label style={modalLabelStyles}>Update Order Status</label>
                  <select
                    disabled={isActionPending}
                    value={selectedOrder.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    style={{ ...selectStyles, width: '100%' }}
                  >
                    <option value="PENDING_PAYMENT">Pending Payment</option>
                    <option value="PAID">Paid</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="IN_TRANSIT">In Transit</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="RECEIVED">Received</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Items Log list */}
            <div style={borderCoolStyles}>
              <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                Items Purchased ({selectedOrder.items.length})
              </div>
              <div style={itemsListStyles}>
                {selectedOrder.items.map((item) => (
                  <div key={item.id} style={itemRowStyles}>
                    <img
                      src={item.product.primary_image_url || '/logo.jpg?v=2'}
                      alt={item.product.name}
                      style={itemImgStyles}
                      onError={e => { (e.target as HTMLImageElement).src = '/logo.jpg?v=2'; }}
                    />
                    <div style={{ flex: 1 }}>
                      <span style={itemNameStyles}>{item.product.name}</span>
                      {item.variant && <span style={itemVariantStyles}>{item.variant.name}</span>}
                      <span style={itemQtyStyles}>Quantity: {item.quantity}</span>
                    </div>
                    <span style={itemPriceStyles}>{formatCurrency(item.line_total)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inspecting detail overlay */}
      {isDetailLoading && (
        <div style={modalBackdropStyles}>
          <div style={{ ...modalContentStyles, display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
            <Skeleton width="40px" height="40px" borderRadius="50%" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>Loading Order details...</span>
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

  if (status === 'PAID' || status === 'COMPLETED' || status === 'DELIVERED' || status === 'RECEIVED') {
    backgroundColor = '#d1fae5';
    color = '#065f46';
  } else if (status === 'PENDING_PAYMENT' || status === 'PROCESSING') {
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
  fontSize: '12px',
  fontWeight: 600,
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
